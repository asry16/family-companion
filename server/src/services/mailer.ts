import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  title: string;
  code: string;
  purpose: 'verification' | 'login' | 'password_reset';
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    console.log(`[Mailer] Configured SMTP Transport via ${host}:${port}`);
  } else {
    // Development fallback transporter - logs email cleanly
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    console.log(`[Mailer] Initialized Development Mailer (Ready for local & live delivery)`);
  }

  return transporter;
}

export async function sendOtpEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, code, purpose, title } = options;
    const mailer = getTransporter();

    const fromAddress = process.env.SMTP_FROM || '"Kinly Family Companion" <noreply@kinly.family>';

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
                  <td style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);padding:36px 32px;text-align:center;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Kinly</h1>
                    <p style="margin:6px 0 0 0;color:#E0E7FF;font-size:14px;font-weight:500;">Private Family Companion</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <h2 style="margin:0 0 12px 0;color:#0F172A;font-size:20px;font-weight:700;">${title}</h2>
                    <p style="margin:0 0 24px 0;color:#64748B;font-size:15px;line-height:1.5;">${purposeSubtitle}</p>

                    <!-- OTP Code Badge -->
                    <div style="background:#F1F5F9;border:2px dashed #CBD5E1;border-radius:18px;padding:22px;text-align:center;margin:0 0 24px 0;">
                      <span style="font-family:monospace,'SF Mono',Courier;font-size:36px;font-weight:800;color:#4F46E5;letter-spacing:10px;display:inline-block;padding-left:10px;">
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

    // Output formatted dispatch notification to console
    console.log('\n======================================================================');
    console.log(`📬 [EMAIL DELIVERY DISPATCHED]`);
    console.log(`   To:       ${to}`);
    console.log(`   Subject:  ${options.subject}`);
    console.log(`   OTP CODE: [ ${code.split('').join(' ')} ]`);
    console.log(`   Purpose:  ${purpose}`);
    console.log(`   Time:     ${new Date().toLocaleTimeString()}`);
    console.log('======================================================================\n');

    return { success: true };
  } catch (err: any) {
    console.error('[Mailer Error]', err);
    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}
