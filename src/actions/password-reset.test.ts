import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestPasswordReset, resetPassword } from "@/actions/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  isWithinPasswordResetCooldown,
  resetUserPassword,
  revokePasswordResetTokens,
} from "@/lib/password-reset";
/** Only what the action selects — see the note in `src/lib/tokens.test.ts`. */
const { user } = vi.hoisted(() => ({
  user: {
    findUnique:
      vi.fn<(args: unknown) => Promise<{ name: string | null; password: string | null } | null>>(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user } }));

vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: vi.fn() }));

vi.mock("@/lib/password-reset", () => ({
  createPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
  isWithinPasswordResetCooldown: vi.fn(),
  resetUserPassword: vi.fn(),
  revokePasswordResetTokens: vi.fn(),
}));

// The real one works by throwing, which would look like a crash here. Every
// test that expects it asserts on the call instead.
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const findUser = user.findUnique;
const sendEmail = vi.mocked(sendPasswordResetEmail);
const createToken = vi.mocked(createPasswordResetToken);
const consumeToken = vi.mocked(consumePasswordResetToken);
const inCooldown = vi.mocked(isWithinPasswordResetCooldown);
const writePassword = vi.mocked(resetUserPassword);
const revokeTokens = vi.mocked(revokePasswordResetTokens);

const EMAIL = "dev@example.com";
const PASSWORD = "correct horse battery";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // `reset`, not `clear`: a one-off `mockRejectedValue` has to go with the test
  // that set it, or the next one inherits the outage.
  vi.resetAllMocks();
});

describe("requestPasswordReset", () => {
  beforeEach(() => {
    inCooldown.mockResolvedValue(false);
    createToken.mockResolvedValue("raw-token");
  });

  it("emails a link to an account with a password", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });

    await expect(requestPasswordReset({}, formData({ email: EMAIL }))).resolves.toEqual({
      sent: true,
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: EMAIL,
      name: "Dev",
      token: "raw-token",
    });
  });

  it("lower-cases the address before looking it up", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });

    await requestPasswordReset({}, formData({ email: "Dev@Example.COM" }));

    expect(findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: EMAIL } })
    );
  });

  it("rejects a malformed address without touching the database", async () => {
    const state = await requestPasswordReset({}, formData({ email: "not-an-email" }));

    expect(state.sent).toBeUndefined();
    expect(state.fieldErrors?.email).toBeDefined();
    expect(findUser).not.toHaveBeenCalled();
  });

  // The three cases below must be indistinguishable from a real send, or the
  // form answers "does this address have an account here?"
  it("says the same thing for an address with no account", async () => {
    findUser.mockResolvedValue(null);

    await expect(requestPasswordReset({}, formData({ email: EMAIL }))).resolves.toEqual({
      sent: true,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("says the same thing for an OAuth-only account", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: null });

    await expect(requestPasswordReset({}, formData({ email: EMAIL }))).resolves.toEqual({
      sent: true,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("says the same thing while the cooldown is running", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });
    inCooldown.mockResolvedValue(true);

    await expect(requestPasswordReset({}, formData({ email: EMAIL }))).resolves.toEqual({
      sent: true,
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
  });

  it("reports a failed send rather than claiming success", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });
    sendEmail.mockRejectedValue(new Error("Resend is down"));

    const state = await requestPasswordReset({}, formData({ email: EMAIL }));

    expect(state.sent).toBeUndefined();
    expect(state.error).toBeDefined();
  });

  it("throws away the token of a failed send, so the retry is not throttled", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });
    sendEmail.mockRejectedValue(new Error("Resend is down"));

    await requestPasswordReset({}, formData({ email: EMAIL }));

    expect(revokeTokens).toHaveBeenCalledWith(EMAIL);
  });

  it("keeps the token of a delivered email", async () => {
    findUser.mockResolvedValue({ name: "Dev", password: "hash" });

    await requestPasswordReset({}, formData({ email: EMAIL }));

    expect(revokeTokens).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  const valid = {
    token: "raw-token",
    password: PASSWORD,
    confirmPassword: PASSWORD,
  };

  beforeEach(() => {
    consumeToken.mockResolvedValue({ ok: true, email: EMAIL });
    writePassword.mockResolvedValue(true);
  });

  it("stores a hash of the new password, never the password", async () => {
    await resetPassword({}, formData(valid));

    const [email, hashed] = writePassword.mock.calls[0];

    expect(email).toBe(EMAIL);
    expect(hashed).not.toBe(PASSWORD);
    await expect(compare(PASSWORD, hashed)).resolves.toBe(true);
  });

  it("lands on the sign-in page with the success banner", async () => {
    await resetPassword({}, formData(valid));

    expect(redirect).toHaveBeenCalledWith("/sign-in?reset=success");
  });

  it("consumes the token before writing anything", async () => {
    await resetPassword({}, formData(valid));

    expect(consumeToken.mock.invocationCallOrder[0]).toBeLessThan(
      writePassword.mock.invocationCallOrder[0]
    );
  });

  it("rejects a password shorter than the policy allows", async () => {
    const state = await resetPassword({}, formData({ ...valid, password: "short", confirmPassword: "short" }));

    expect(state?.fieldErrors?.password).toBeDefined();
    expect(consumeToken).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation", async () => {
    const state = await resetPassword(
      {},
      formData({ ...valid, confirmPassword: "something else" })
    );

    expect(state?.fieldErrors?.confirmPassword).toBeDefined();
    expect(consumeToken).not.toHaveBeenCalled();
  });

  it("rejects a submit with no token", async () => {
    const state = await resetPassword({}, formData({ ...valid, token: "" }));

    expect(state?.fieldErrors?.token).toBeDefined();
  });

  it("marks an expired link dead, and says so", async () => {
    consumeToken.mockResolvedValue({ ok: false, reason: "expired" });

    const state = await resetPassword({}, formData(valid));

    expect(state?.linkDead).toBe(true);
    expect(state?.error).toContain("expired");
    expect(writePassword).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("marks a spent or forged link dead", async () => {
    consumeToken.mockResolvedValue({ ok: false, reason: "invalid" });

    const state = await resetPassword({}, formData(valid));

    expect(state?.linkDead).toBe(true);
    expect(writePassword).not.toHaveBeenCalled();
  });

  it("marks the link dead when the account is gone", async () => {
    writePassword.mockResolvedValue(false);

    const state = await resetPassword({}, formData(valid));

    expect(state?.linkDead).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("reports a database failure without redirecting", async () => {
    writePassword.mockRejectedValue(new Error("connection lost"));

    const state = await resetPassword({}, formData(valid));

    expect(state?.error).toBeDefined();
    expect(state?.linkDead).toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
