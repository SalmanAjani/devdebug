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

/** Origin the emailed links point at. Set per environment, no fallback. */
function appUrl(): string {
  const url = process.env.AUTH_URL;

  if (!url) {
    throw new Error("AUTH_URL is not set");
  }

  return url.replace(/\/+$/, "");
}

/** The name is user-supplied and lands inside the markup below. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greetingFor(name: string | null): string {
  return name ? `Hi ${name},` : "Hi,";
}

interface ActionEmail {
  heading: string;
  greeting: string;
  /** One sentence above the button. */
  body: string;
  buttonLabel: string;
  url: string;
  /** Expiry and "ignore this" copy under the button. */
  footer: string;
}

/** Inline styles only — email clients drop stylesheets, and Tailwind never runs here. */
function actionEmailHtml({
  heading,
  greeting,
  body,
  buttonLabel,
  url,
  footer,
}: ActionEmail): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#09090b;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#fafafa;">${heading}</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#a1a1aa;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#a1a1aa;">
      ${body}
    </p>
    <a href="${url}" style="display:inline-block;background:#fafafa;color:#09090b;font-size:14px;font-weight:500;text-decoration:none;padding:10px 20px;border-radius:8px;">
      ${buttonLabel}
    </a>
    <p style="margin:24px 0 0;font-size:12px;line-height:20px;color:#71717a;">
      ${footer}
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#52525b;word-break:break-all;">
      ${url}
    </p>
  </div>
</div>`.trim();
}

/**
 * Hands the message to Resend.
 *
 * Throws on failure — Resend reports errors in the response body rather than by
 * rejecting, so the caller would otherwise never hear about a bounce. Callers
 * decide whether that failure should be fatal.
 */
async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  const { error } = await resend().emails.send({ from: FROM, to, subject, html, text });

  if (error) {
    throw new Error(`Resend rejected the ${subject} email: ${error.message}`);
  }
}

interface TokenEmailParams {
  to: string;
  /** Used for the greeting. Null for accounts created without one. */
  name: string | null;
  /** Raw token — the hashed copy is what the database holds. */
  token: string;
}

/** Sends the verification link. */
export async function sendVerificationEmail({
  to,
  name,
  token,
}: TokenEmailParams): Promise<void> {
  const url = `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = greetingFor(name);
  const body = "Confirm this address to finish setting up your DevDebug account.";
  const footer =
    "This link expires in 24 hours and can only be used once. If you did not create a DevDebug account, you can ignore this email.";

  await send(
    to,
    "Verify your DevDebug email",
    actionEmailHtml({
      heading: "Verify your email",
      greeting: escapeHtml(greeting),
      body,
      buttonLabel: "Verify email",
      url,
      footer,
    }),
    `${greeting}\n\n${body}\n\n${url}\n\n${footer}`
  );
}

/**
 * Sends the password reset link.
 *
 * The copy has to work for someone who did not ask for it: this email is the
 * only warning an account owner gets that a stranger typed their address into
 * the form, so it says plainly that ignoring it leaves the password alone.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: TokenEmailParams): Promise<void> {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = greetingFor(name);
  const body = "Use the link below to choose a new password for your DevDebug account.";
  const footer =
    "This link expires in 1 hour and can only be used once. If you did not ask to reset your password, you can ignore this email — your password will not change.";

  await send(
    to,
    "Reset your DevDebug password",
    actionEmailHtml({
      heading: "Reset your password",
      greeting: escapeHtml(greeting),
      body,
      buttonLabel: "Reset password",
      url,
      footer,
    }),
    `${greeting}\n\n${body}\n\n${url}\n\n${footer}`
  );
}
