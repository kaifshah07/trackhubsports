'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Trophy,
  RotateCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<
    'login' | 'register' | 'verify-otp' | 'forgot' | 'verify-reset-otp' | 'reset-password'
  >('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    phone: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timers for OTP expiry (300 seconds = 5 mins) and resend cooldown (60s)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Handle countdowns for resend cooldown and OTP expiry
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((mode === 'verify-otp' || mode === 'verify-reset-otp') && otpExpirySeconds > 0) {
      timer = setTimeout(() => setOtpExpirySeconds(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [mode, otpExpirySeconds]);

  // Reset notifications when mode changes
  const switchMode = (newMode: typeof mode) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormData(prev => ({ ...prev, otp: '', newPassword: '', confirmNewPassword: '' }));
    setMode(newMode);
  };

  const navigateByRole = (role?: string) => {
    if (role === 'SUPER_ADMIN') {
      router.push('/superadmin');
    } else if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/shop');
    }
  };

  // Google Identity Services Setup
  useEffect(() => {
    const handleGoogleCredentialResponse = async (response: any) => {
      if (!response?.credential) {
        setErrorMessage("Google sign-in did not return a valid credential token.");
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const res = await fetch(`${cleanApiUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential })
        });

        let data: any;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          data = {
            success: false,
            error: res.status === 404
              ? "Google authentication endpoint was not found on the backend service (HTTP 404). Please ensure the backend is deployed with the latest code."
              : `Server returned HTTP ${res.status}: ${rawText.slice(0, 100) || 'Unexpected response'}`
          };
        }
        if (data.success && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('customerToken', data.token);
          localStorage.setItem('customerUser', JSON.stringify(data.user));
          setSuccessMessage("Signed in successfully with Google! Redirecting...");
          setTimeout(() => navigateByRole(data.user?.role), 800);
        } else {
          setErrorMessage(data.error || "Google authentication failed. Please try again.");
        }
      } catch (err) {
        setErrorMessage("Network error: Unable to connect to Google authentication service.");
      } finally {
        setLoading(false);
      }
    };

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if ((window as any).google?.accounts?.id) {
        initializeGoogleSignIn();
        return;
      }

      const existingScript = document.getElementById('google-jssdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initializeGoogleSignIn();
        document.body.appendChild(script);
      }
    };

    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      if (!googleClientId) {
        // If client ID is not configured yet, don't crash
        return;
      }

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      if (googleButtonRef.current) {
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          width: 380
        });
      }
    };

    loadGoogleScript();
  }, [apiUrl, googleClientId]);

  // Re-render Google button if mode changes back to login or register
  useEffect(() => {
    if ((mode === 'login' || mode === 'register') && googleClientId && (window as any).google?.accounts?.id && googleButtonRef.current) {
      (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'center',
        width: 380
      });
    }
  }, [mode, googleClientId]);

  // Resend OTP for Registration Verification
  const handleResendRegistrationOtp = async () => {
    if (!formData.email) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    if (resendCooldown > 0) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("A new verification code has been dispatched to your email.");
        setResendCooldown(60);
        setOtpExpirySeconds(300);
      } else {
        setErrorMessage(data.error || "Failed to resend verification code.");
      }
    } catch (err) {
      setErrorMessage("Network error: Could not connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP for Forgot Password
  const handleResendForgotOtp = async () => {
    if (!formData.email) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (resendCooldown > 0) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("If your account exists, a new reset code has been sent.");
        setResendCooldown(60);
        setOtpExpirySeconds(300);
      } else {
        setErrorMessage(data.error || "Failed to resend reset code.");
      }
    } catch (err) {
      setErrorMessage("Network error: Could not reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // 1. REGISTER
      if (mode === 'register') {
        if (formData.password.length < 6) {
          setErrorMessage("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage("Passwords do not match!");
          setLoading(false);
          return;
        }

        const fullName = `${formData.name} ${formData.surname}`.trim();
        const res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            fullName,
            phone: formData.phone
          })
        });
        const data = await res.json();

        if (data.success) {
          setSuccessMessage(data.message || "A 6-digit verification code has been dispatched to your email.");
          setResendCooldown(60);
          setOtpExpirySeconds(300);
          setMode('verify-otp');
        } else {
          setErrorMessage(data.error || 'Registration failed.');
        }
      }

      // 2. VERIFY REGISTRATION OTP
      else if (mode === 'verify-otp') {
        if (!formData.otp.trim()) {
          setErrorMessage("Please enter the 6-digit verification code.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            otp: formData.otp.trim()
          })
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('customerToken', data.token);
          localStorage.setItem('customerUser', JSON.stringify(data.user));
          setSuccessMessage("Account verified successfully! Welcome to Track Hub Sports.");
          setTimeout(() => navigateByRole(data.user?.role), 800);
        } else {
          setErrorMessage(data.error || 'Invalid or expired verification code.');
        }
      }

      // 3. LOGIN
      else if (mode === 'login') {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          })
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('customerToken', data.token);
          localStorage.setItem('customerUser', JSON.stringify(data.user));
          setSuccessMessage("Signed in successfully! Redirecting...");
          setTimeout(() => navigateByRole(data.user?.role), 600);
        } else if (data.requiresVerification) {
          setErrorMessage(data.error || "Your account requires verification before signing in.");
          setResendCooldown(60);
          setOtpExpirySeconds(300);
          setMode('verify-otp');
        } else {
          setErrorMessage(data.error || 'Invalid email or password.');
        }
      }

      // 4. FORGOT PASSWORD - STEP 1 (REQUEST OTP)
      else if (mode === 'forgot') {
        const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
        });
        const data = await res.json();

        // Always transition to verification step with generic confirmation (no account enumeration)
        setSuccessMessage(data.message || "If an account is associated with that email, a password reset code has been sent.");
        setResendCooldown(60);
        setOtpExpirySeconds(300);
        setMode('verify-reset-otp');
      }

      // 5. FORGOT PASSWORD - STEP 2 (VERIFY RESET OTP)
      else if (mode === 'verify-reset-otp') {
        if (!formData.otp.trim()) {
          setErrorMessage("Please enter the 6-digit reset code.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/api/auth/verify-reset-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            otp: formData.otp.trim()
          })
        });
        const data = await res.json();

        if (data.success && data.resetToken) {
          setResetToken(data.resetToken);
          setSuccessMessage("Code verified successfully! Please set your new password.");
          setMode('reset-password');
        } else {
          setErrorMessage(data.error || 'Invalid or expired verification code.');
        }
      }

      // 6. FORGOT PASSWORD - STEP 3 (SET NEW PASSWORD)
      else if (mode === 'reset-password') {
        if (!resetToken) {
          setErrorMessage("Reset session expired. Please request a new verification code.");
          setMode('forgot');
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          setErrorMessage("New password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
          setErrorMessage("Passwords do not match!");
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetToken,
            newPassword: formData.newPassword
          })
        });
        const data = await res.json();

        if (data.success) {
          setSuccessMessage("Password has been reset successfully! Please sign in with your new password.");
          setResetToken(null);
          setTimeout(() => switchMode('login'), 1200);
        } else {
          setErrorMessage(data.error || 'Failed to reset password.');
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setErrorMessage("Network error: Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 pb-24 md:pb-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-gray-100">

        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 items-center justify-center text-gray-900 shadow-md mb-1">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {mode === 'login' && 'Sign In to Track Hub'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'verify-otp' && 'Verify Your Email'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'verify-reset-otp' && 'Enter Reset Code'}
            {mode === 'reset-password' && 'Set New Password'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {mode === 'login' && 'Enter your credentials to access your sports orders'}
            {mode === 'register' && 'Join India’s premier sports merchandise platform'}
            {mode === 'verify-otp' && 'Enter the 6-digit verification code sent to your email'}
            {mode === 'forgot' && 'Enter your email address to receive a secure reset code'}
            {mode === 'verify-reset-otp' && 'Enter the 6-digit code sent to your registered email'}
            {mode === 'reset-password' && 'Choose a strong new password for your account'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Email Context Info for OTP Verification */}
        {(mode === 'verify-otp' || mode === 'verify-reset-otp') && formData.email && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
            <p className="text-[11px] text-slate-500 font-medium">Code dispatched to</p>
            <p className="text-xs font-black text-slate-900 font-mono tracking-wide break-all">{formData.email}</p>
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Valid for: {formatTimer(otpExpirySeconds)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Surname"
                    required
                    value={formData.surname}
                    onChange={e => setFormData({...formData, surname: e.target.value})}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {(mode === 'verify-otp' || mode === 'verify-reset-otp') && (
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Code"
                required
                value={formData.otp}
                onChange={e => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none shadow-xs text-center"
              />
            </div>
          )}

          {mode === 'reset-password' && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  placeholder="New Password (min 6 characters)"
                  required
                  value={formData.newPassword}
                  onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={formData.confirmNewPassword}
                  onChange={e => setFormData({...formData, confirmNewPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Register & Send Code' :
              mode === 'verify-otp' ? 'Verify & Complete Signup' :
              mode === 'forgot' ? 'Send Reset Code' :
              mode === 'verify-reset-otp' ? 'Verify Reset Code' :
              'Update Password'
            )} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* OTP Resend Options */}
        {mode === 'verify-otp' && (
          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={handleResendRegistrationOtp}
              className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {mode === 'verify-reset-otp' && (
          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={handleResendForgotOtp}
              className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Back navigation buttons for forgot password steps */}
        {(mode === 'forgot' || mode === 'reset-password') && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        )}

        {/* Google Authentication Section (Available on Login & Register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-center text-gray-400 uppercase font-extrabold tracking-wider">
              Or continue with
            </p>

            <div className="flex flex-col items-center justify-center min-h-[44px]">
              {googleClientId ? (
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("Google Sign-In is awaiting configuration of NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
                  }}
                  className="w-full py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="text-center text-xs text-gray-500 font-medium pt-1">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => switchMode('register')} className="text-blue-600 font-bold hover:underline cursor-pointer">Register Now</button></>
          ) : mode === 'register' ? (
            <>Already have an account? <button onClick={() => switchMode('login')} className="text-blue-600 font-bold hover:underline cursor-pointer">Sign In</button></>
          ) : null}
        </div>
      </div>
    </div>
  );
}
