import {
  BREVO_API_KEY,
  BREVO_API_URL,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
} from '../constants'

export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is missing. Add it to .env.')
  }

  if (!BREVO_SENDER_EMAIL) {
    throw new Error('BREVO_SENDER_EMAIL is missing. Add a verified sender email to .env.')
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject: 'Reset your Stackd password',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 25px;">
          <h2 style="margin-bottom: 10px;">Reset your password</h2>
          <p>You requested a password reset for your Stackd account. Click the button below to set a new password. <strong>This link expires in 15 minutes.</strong></p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:10px 25px;background:#dd7700;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;">Reset Password</a>
          <p style="color:#aaaaaa;font-size:12px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
        </div>
      `,
    }),
  })

  const rawBody = await response.text()

  if (!response.ok) {
    throw new Error(`Brevo email send failed (${response.status}): ${rawBody}`)
  }
}
