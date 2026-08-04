import { Resend } from "resend";

/**
 * Resend's shared sending domain. It needs no DNS setup, but it only delivers
 * to the address that owns the Resend account — swap it for a verified domain
 * before anyone else can register.
 */
const FROM = "DevDebug <onboarding@resend.dev>";

let client: Resend | undefined;

/** Lazy so importing this module does not throw when the key is absent. */
function resend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  return (client ??= new Resend(apiKey));
}

/** Origin the verification link points at. Set per environment, no fallback. */
function appUrl(): string {
  const url = process.env.AUTH_URL;

  if (!url) {
    throw new Error("AUTH_URL is not set");
  }

  return url.replace(/\/+$/, "");
}

interface VerificationEmailParams {
  to: string;
  /** Used for the greeting. Null for accounts created without one. */
  name: string | null;
  /** Raw token from `createVerificationToken`. */
  token: string;
}

/** The name is user-supplied and lands inside the markup below. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline styles only — email clients drop stylesheets, and Tailwind never runs here. */
function verificationEmailHtml(greeting: string, verifyUrl: string): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#09090b;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#fafafa;">Verify your email</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#a1a1aa;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#a1a1aa;">
      Confirm this address to finish setting up your DevDebug account.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;background:#fafafa;color:#09090b;font-size:14px;font-weight:500;text-decoration:none;padding:10px 20px;border-radius:8px;">
      Verify email
    </a>
    <p style="margin:24px 0 0;font-size:12px;line-height:20px;color:#71717a;">
      This link expires in 24 hours and can only be used once. If you did not
      create a DevDebug account, you can ignore this email.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#52525b;word-break:break-all;">
      ${verifyUrl}
    </p>
  </div>
</div>`.trim();
}

/**
 * Sends the verification link.
 *
 * Throws on failure — Resend reports errors in the response body rather than by
 * rejecting, so the caller would otherwise never hear about a bounce. Callers
 * decide whether that failure should be fatal.
 */
export async function sendVerificationEmail({
  to,
  name,
  token,
}: VerificationEmailParams): Promise<void> {
  const verifyUrl = `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Hi ${name},` : "Hi,";

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "Verify your DevDebug email",
    html: verificationEmailHtml(escapeHtml(greeting), verifyUrl),
    text: `${greeting}

Confirm this address to finish setting up your DevDebug account:

${verifyUrl}

This link expires in 24 hours and can only be used once. If you did not create a DevDebug account, you can ignore this email.`,
  });

  if (error) {
    throw new Error(`Resend rejected the verification email: ${error.message}`);
  }
}
