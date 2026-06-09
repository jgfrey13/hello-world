import { env } from './env';

interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Pluggable mailer. The default "console" driver logs the email (including any
// verification/reset link) to the server console — ideal for local development.
// Swap in an SMTP/provider transport for production by extending `send()`.
async function send(msg: MailMessage): Promise<void> {
  if (env.mailDriver === 'console') {
    console.log('\n' + '='.repeat(70));
    console.log(`📧  EMAIL (dev console transport)`);
    console.log(`From:    ${env.mailFrom}`);
    console.log(`To:      ${msg.to}`);
    console.log(`Subject: ${msg.subject}`);
    console.log('-'.repeat(70));
    console.log(msg.text);
    console.log('='.repeat(70) + '\n');
    return;
  }
  // Production transports (SMTP, SES, Resend, etc.) would be wired here.
  throw new Error(`Unsupported MAIL_DRIVER: ${env.mailDriver}`);
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await send({
    to,
    subject: 'Verify your email address',
    text: `Welcome to the Home Improvement Marketplace!\n\nVerify your email by visiting:\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Welcome!</p><p><a href="${link}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await send({
    to,
    subject: 'Reset your password',
    text: `We received a request to reset your password.\n\nReset it by visiting:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
  });
}
