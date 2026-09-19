import nodemailer, { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  title: string;
  code: string;
  purpose: 'verification' | 'login' | 'password_reset';
}

export interface MailerResult {
  success: boolean;
  delivered: boolean;
  error?: string;
}

let transporter: Transporter | null = null;
let isLive = false;

export function isConfiguredForLiveDelivery(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const service = process.env.EMAIL_SERVICE;
  return Boolean((host && user && pass) || (service && user && pass) || (user && pass && user.includes('@gmail.com')));
}

function getTransporter(): { mailer: Transporter; isLiveDelivery: boolean } {
  if (transporter) return { mailer: transporter, isLiveDelivery: isLive };

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const service = process.env.EMAIL_SERVICE || (user && user.includes('@gmail.com') ? 'gmail' : undefined);

  if (service && user && pass) {
    // 1. Gmail or preset service (Simplest 1-minute configuration)
    transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
    isLive = true;
    console.log(`\n======================================================`);
    console.log(`🚀 [Mailer] LIVE DELIVERY ACTIVE via Service: ${service}`);
    console.log(`   Account: ${user}`);
    console.log(`   Real emails will be delivered to recipient inboxes!`);
    console.log(`======================================================\n`);
  } else if (host && user && pass) {
    // 2. Custom SMTP server
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    isLive = true;
    console.log(`\n======================================================`);
    console.log(`🚀 [Mailer] LIVE DELIVERY ACTIVE via SMTP: ${host}:${port}`);
    console.log(`   Account: ${user}`);
    console.log(`======================================================\n`);
  } else {
    // 3. Fallback development transport (prints to terminal)
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    isLive = false;
    console.log(`\n======================================================================`);
    console.log(`⚠️  [Mailer] LOCAL SIMULATION MODE (No SMTP credentials configured)`);
    console.log(`   To send REAL emails directly to user inboxes:`);
    console.log(`   1. Open server/.env`);
    console.log(`   2. Set EMAIL_SERVICE=gmail`);
    console.log(`   3. Set EMAIL_USER=your-email@gmail.com`);
    console.log(`   4. Set EMAIL_PASS=your-google-app-password (16 characters)`);
    console.log(`======================================================================\n`);
  }

  return { mailer: transporter, isLiveDelivery: isLive };
}

export async function sendOtpEmail(options: EmailOptions): Promise<MailerResult> {
  try {
    const { to, code, purpose, title } = options;
    const { mailer, isLiveDelivery } = getTransporter();

    const fromAddress =
      process.env.SMTP_FROM ||
      (process.env.EMAIL_USER ? `"Kinly Family" <${process.env.EMAIL_USER}>` : '"Kinly Family Companion" <noreply@kinly.family>');

    const purposeSubtitle =
      purpose === 'verification'
        ? 'Verify your email address to secure your family vault.'
        : purpose === 'login'
        ? 'Use this one-time password to instantly sign into your family space.'
        : 'Use this code to securely reset your password.';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 12px 36px rgba(15,23,42,0.06);overflow:hidden;">
                <!-- Header Gradient -->
                <tr>
                  <td style="background:linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);padding:36px 32px;text-align:center;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Kinly</h1>
                    <p style="margin:6px 0 0 0;color:#DBEAFE;font-size:14px;font-weight:500;">Private Family Companion</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <h2 style="margin:0 0 12px 0;color:#0F172A;font-size:20px;font-weight:700;">${title}</h2>
                    <p style="margin:0 0 24px 0;color:#64748B;font-size:15px;line-height:1.5;">${purposeSubtitle}</p>

                    <!-- OTP Code Badge -->
                    <div style="background:#EFF6FF;border:2px dashed #93C5FD;border-radius:18px;padding:22px;text-align:center;margin:0 0 24px 0;">
                      <span style="font-family:monospace,'SF Mono',Courier;font-size:36px;font-weight:800;color:#1D4ED8;letter-spacing:10px;display:inline-block;padding-left:10px;">
                        ${code}
                      </span>
                    </div>

                    <p style="margin:0 0 16px 0;color:#475569;font-size:13px;line-height:1.5;text-align:center;">
                      ⏱️ This one-time code expires in <strong>10 minutes</strong>. If you did not request this code, please safely ignore this email.
                    </p>

                    <hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0 20px 0;">

                    <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">
                      Protected by Kinly Zero-Trust Family Encryption • Secured with End-to-End Privacy
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send Mail
    await mailer.sendMail({
      from: fromAddress,
      to,
      subject: options.subject,
      html: htmlContent,
      text: `${title}\n\n${purposeSubtitle}\n\nYour One-Time Code: ${code}\n\nThis code expires in 10 minutes.`,
    });

    if (isLiveDelivery) {
      console.log('\n======================================================================');
      console.log(`✅ [LIVE EMAIL DELIVERED OVER INTERNET]`);
      console.log(`   To:       ${to}`);
      console.log(`   Subject:  ${options.subject}`);
      console.log(`   OTP CODE: [ ${code.split('').join(' ')} ]`);
      console.log(`   Time:     ${new Date().toLocaleTimeString()}`);
      console.log('======================================================================\n');
    } else {
      console.log('\n======================================================================');
      console.log(`📬 [SIMULATED EMAIL (Configure server/.env for Live Inbox Delivery)]`);
      console.log(`   To:       ${to}`);
      console.log(`   Subject:  ${options.subject}`);
      console.log(`   OTP CODE: [ ${code.split('').join(' ')} ]`);
      console.log(`   Time:     ${new Date().toLocaleTimeString()}`);
      console.log('======================================================================\n');
    }

    return { success: true, delivered: isLiveDelivery };
  } catch (err: any) {
    console.error('❌ [Mailer Delivery Error]:', err?.message || err);
    return { success: false, delivered: false, error: err?.message || 'Failed to dispatch email' };
  }
}
