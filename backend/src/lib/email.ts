import axios from 'axios';

interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail({ toEmail, toName, subject, htmlContent }: EmailPayload) {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
      console.warn("[Brevo Email] BREVO_API_KEY or SENDER_EMAIL not configured in environment.");
      return { success: false, error: "Email service not configured in environment." };
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: "Track Hub Sports", email: process.env.SENDER_EMAIL },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[Brevo Email] Successfully dispatched "${subject}" to ${toEmail}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data || error.message;
    console.error(`[Brevo Email Error] Failed to send "${subject}" to ${toEmail}:`, errorMsg);
    return { success: false, error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) };
  }
}
