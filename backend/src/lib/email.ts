import axios from 'axios';

interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail({ toEmail, toName, subject, htmlContent }: EmailPayload) {
  try {
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
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Brevo Email Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}