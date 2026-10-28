import crypto from 'crypto';

export interface StoredOtpData {
  hash: string;
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  metadata?: {
    newEmail?: string;
    [key: string]: any;
  };
}

export function generateSecureOtp(): string {
  // Generates a cryptographically secure 6-digit OTP (100000 - 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(email: string, otp: string, purpose: string): string {
  // Use dedicated OTP_PEPPER if configured; otherwise gracefully fall back to JWT_SECRET.
  // Fails safely if neither secret is configured in the environment.
  const secret = process.env.OTP_PEPPER || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Critical security configuration missing: Neither OTP_PEPPER nor JWT_SECRET is configured in environment.");
  }
  const normalized = `${email.trim().toLowerCase()}:${otp.trim()}:${purpose.trim()}`;
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

export function createOtpEntry(
  email: string,
  otp: string,
  purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  metadata?: any
): { serialized: string; expiresAt: Date } {
  const hash = hashOtp(email, otp, purpose);
  const data: StoredOtpData = {
    hash,
    purpose,
    attempts: 0,
    maxAttempts: 5,
    createdAt: Date.now(),
    metadata
  };
  // 5 minutes expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  return {
    serialized: JSON.stringify(data),
    expiresAt
  };
}

export function verifyStoredOtp(
  storedRaw: string | null | undefined,
  expiresAt: Date | null | undefined,
  inputOtp: string,
  email: string,
  expectedPurpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
): {
  valid: boolean;
  error?: string;
  updatedRaw?: string | null;
  metadata?: any;
} {
  if (!storedRaw || !expiresAt) {
    return { valid: false, error: "No active verification code found. Please request a new code." };
  }

  if (new Date(expiresAt).getTime() < Date.now()) {
    return { valid: false, error: "Verification code has expired. Please request a new code." };
  }

  const cleanInput = String(inputOtp || '').trim();
  if (!cleanInput || cleanInput.length !== 6) {
    return { valid: false, error: "Please enter a valid 6-digit verification code." };
  }

  let parsed: StoredOtpData | null = null;
  try {
    if (storedRaw.startsWith('{')) {
      parsed = JSON.parse(storedRaw);
    }
  } catch {
    parsed = null;
  }

  // Graceful fallback for legacy plaintext OTPs during migration
  if (!parsed) {
    if (storedRaw === cleanInput) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid verification code." };
  }

  // Enforce purpose separation
  if (parsed.purpose !== expectedPurpose) {
    return { valid: false, error: "This verification code cannot be used for this action." };
  }

  // Enforce attempt limits
  if (parsed.attempts >= parsed.maxAttempts) {
    return {
      valid: false,
      error: "Too many incorrect attempts. This code has been invalidated for security. Please request a new code.",
      updatedRaw: null
    };
  }

  const expectedHash = hashOtp(email, cleanInput, expectedPurpose);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const storedBuf = Buffer.from(parsed.hash, 'hex');

  const isMatch = expectedBuf.length === storedBuf.length && crypto.timingSafeEqual(expectedBuf, storedBuf);

  if (!isMatch) {
    parsed.attempts += 1;
    const remaining = parsed.maxAttempts - parsed.attempts;
    if (remaining <= 0) {
      return {
        valid: false,
        error: "Too many incorrect attempts. This code has been invalidated. Please request a new code.",
        updatedRaw: null
      };
    }
    return {
      valid: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      updatedRaw: JSON.stringify(parsed)
    };
  }

  return {
    valid: true,
    metadata: parsed.metadata
  };
}

export function checkResendCooldown(
  storedRaw: string | null | undefined,
  cooldownSeconds = 60
): { canResend: boolean; waitSeconds?: number } {
  if (!storedRaw) return { canResend: true };
  try {
    if (storedRaw.startsWith('{')) {
      const parsed: StoredOtpData = JSON.parse(storedRaw);
      const elapsed = (Date.now() - parsed.createdAt) / 1000;
      if (elapsed < cooldownSeconds) {
        return { canResend: false, waitSeconds: Math.ceil(cooldownSeconds - elapsed) };
      }
    }
  } catch {}
  return { canResend: true };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMinutes = 15
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMinutes * 60 * 1000 });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}
