import axios from 'axios';

interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail({ toEmail, toName, subject, htmlContent }: EmailPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
      console.warn("[Brevo Email] BREVO_API_KEY or SENDER_EMAIL is not configured.");
      return { success: false, error: "Email service is temporarily unavailable." };
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: "Track Hub Sports", email: process.env.SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || "Valued Customer" }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      }
    );
    console.log(`[Brevo Email] Successfully dispatched email "${subject}" to recipient.`);
    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data || error.message;
    console.error(`[Brevo Email Error] Failed to dispatch email "${subject}":`, typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    return { success: false, error: "We were unable to deliver the email at this time. Please try again shortly." };
  }
}

export async function sendRegistrationOtpEmail(toEmail: string, toName: string, otpCode: string) {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #fbbf24; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 1px; text-transform: uppercase;">TRACK HUB SPORTS</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">India's Premier Sports Merchandise Platform</p>
      </div>
      <div style="background-color: #1e293b; padding: 28px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 8px;">Verify Your Email Address</h2>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 24px;">Hello ${toName || 'Athlete'}, welcome to Track Hub Sports. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #0f172a; border: 2px dashed #fbbf24; border-radius: 8px; padding: 16px; margin: 0 auto 24px auto; display: inline-block;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code will expire in <strong>5 minutes</strong>. If you did not create an account, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Track Hub Sports. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendBrevoEmail({
    toEmail,
    toName,
    subject: "Verify Your Email — Track Hub Sports",
    htmlContent
  });
}

export async function sendPasswordResetOtpEmail(toEmail: string, toName: string, otpCode: string) {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #fbbf24; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 1px; text-transform: uppercase;">TRACK HUB SPORTS</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Security & Account Services</p>
      </div>
      <div style="background-color: #1e293b; padding: 28px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 24px;">Hello ${toName || 'Valued Customer'}, we received a request to reset your Track Hub Sports account password. Enter the code below to proceed:</p>
        <div style="background-color: #0f172a; border: 2px dashed #f59e0b; border-radius: 8px; padding: 16px; margin: 0 auto 24px auto; display: inline-block;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code expires in <strong>5 minutes</strong>. If you did not request a password reset, please change your credentials immediately or contact support.</p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Track Hub Sports. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendBrevoEmail({
    toEmail,
    toName,
    subject: "Password Reset Verification Code — Track Hub Sports",
    htmlContent
  });
}

export async function sendEmailChangeOtpEmail(toEmail: string, toName: string, otpCode: string) {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #fbbf24; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 1px; text-transform: uppercase;">TRACK HUB SPORTS</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Account Security</p>
      </div>
      <div style="background-color: #1e293b; padding: 28px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 8px;">Confirm New Email Address</h2>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 24px;">Hello ${toName || 'Valued Customer'}, enter this code to verify your new email address for Track Hub Sports:</p>
        <div style="background-color: #0f172a; border: 2px dashed #fbbf24; border-radius: 8px; padding: 16px; margin: 0 auto 24px auto; display: inline-block;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code expires in <strong>5 minutes</strong>. If you did not initiate this change, please contact support immediately.</p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Track Hub Sports. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendBrevoEmail({
    toEmail,
    toName,
    subject: "Verify Your New Email Address — Track Hub Sports",
    htmlContent
  });
}
