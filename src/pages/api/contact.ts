import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    const headers = { 'Content-Type': 'application/json' };

    let name: string, email: string, message: string;
    try {
        const body = await request.json();
        name    = (body.name    ?? '').toString().trim();
        email   = (body.email   ?? '').toString().trim();
        message = (body.message ?? '').toString().trim();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400, headers });
    }

    if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: 'All fields are required.' }), { status: 422, headers });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 422, headers });
    }

    // Guardar en Supabase
    const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);

    if (dbError) {
        console.error('[contact] Supabase insert error:', dbError);
        return new Response(JSON.stringify({ error: 'Could not save message.' }), { status: 500, headers });
    }

    // Enviar email via Resend
    const apiKey  = import.meta.env.RESEND_API_KEY;
    const toEmail = import.meta.env.CONTACT_TO_EMAIL ?? 'adriantasayco99@gmail.com';
    const fromEmail = import.meta.env.CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev';

    if (!apiKey) {
        console.warn('[contact] RESEND_API_KEY not set — skipping email.');
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    const resend = new Resend(apiKey);
    const { error: emailError } = await resend.emails.send({
        from: `echo-whoami portfolio <${fromEmail}>`,
        to:   toEmail,
        reply_to: email,
        subject: `New message from ${name} — echo-whoami`,
        html: emailHtml(name, email, message),
    });

    if (emailError) {
        console.error('[contact] Resend error:', emailError);
        // El mensaje ya se guardó en DB, no fallamos al usuario
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

function emailHtml(name: string, email: string, message: string): string {
    const escaped = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:2.5rem 1rem;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111;border:1px solid #222;border-radius:2px;">

        <!-- Header -->
        <tr>
          <td style="padding:1.5rem 2rem;border-bottom:1px solid #222;">
            <p style="margin:0;color:#555;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">
              echo-whoami — new contact message
            </p>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:1.75rem 2rem 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6;">
              <tr style="border-bottom:1px solid #1e1e1e;">
                <td style="color:#555;padding:0.6rem 0;width:72px;vertical-align:top;">name</td>
                <td style="color:#e0e0e0;padding:0.6rem 0;">${escaped(name)}</td>
              </tr>
              <tr style="border-bottom:1px solid #1e1e1e;">
                <td style="color:#555;padding:0.6rem 0;vertical-align:top;">email</td>
                <td style="padding:0.6rem 0;">
                  <a href="mailto:${escaped(email)}" style="color:#8b0000;text-decoration:none;">${escaped(email)}</a>
                </td>
              </tr>
              <tr>
                <td style="color:#555;padding:0.75rem 0;vertical-align:top;">message</td>
                <td style="color:#e0e0e0;padding:0.75rem 0;white-space:pre-wrap;">${escaped(message)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:1.25rem 2rem 1.75rem;border-top:1px solid #1a1a1a;margin-top:0.5rem;">
            <p style="margin:0;color:#333;font-size:11px;letter-spacing:0.08em;">
              sent via portfolio contact form · archadrian.tech
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
