import nodemailer from 'nodemailer';

/**
 * Secure mail relay for Render (Gmail SMTP is often blocked from Render).
 * POST JSON: { to, subject, text, secret }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const secret = process.env.MAIL_HOOK_SECRET || '';
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!secret || body.secret !== secret) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const to = String(body.to || '').trim();
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '');
  if (!to || !subject || !text) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const user = (process.env.EMAIL_HOST_USER || '').trim();
  const pass = (process.env.EMAIL_HOST_PASSWORD || '').replace(/\s/g, '').trim();
  const from = (process.env.DEFAULT_FROM_EMAIL || user || '').trim();
  if (!user || !pass) {
    return res.status(500).json({ ok: false, error: 'mail_not_configured' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, text });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-mail failed', err?.message || err);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
}
