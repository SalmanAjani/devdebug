import { compare, hash } from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, deleteAccount } from "@/actions/profile";
import { signOut } from "@/auth";
import { deleteUserAccount, updateUserPassword } from "@/lib/account";
import { requireUserId } from "@/lib/db/user";

/** Only what the action selects — see the note in `src/lib/tokens.test.ts`. */
const { user } = vi.hoisted(() => ({
  user: {
    findUnique:
      vi.fn<(args: unknown) => Promise<{ email: string; password?: string | null } | null>>(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user } }));

vi.mock("@/lib/account", () => ({
  updateUserPassword: vi.fn(),
  deleteUserAccount: vi.fn(),
}));

vi.mock("@/lib/db/user", () => ({ requireUserId: vi.fn() }));

// The real one ends in a redirect, which would look like a crash here. Every
// test that expects it asserts on the call instead.
vi.mock("@/auth", () => ({ signOut: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const findUser = user.findUnique;
const writePassword = vi.mocked(updateUserPassword);
const deleteUser = vi.mocked(deleteUserAccount);
const userId = vi.mocked(requireUserId);
const endSession = vi.mocked(signOut);

const USER_ID = "user_1";
const EMAIL = "dev@example.com";
const CURRENT = "correct horse battery";
const NEXT = "staple battery horse";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  userId.mockResolvedValue(USER_ID);
});

afterEach(() => {
  vi.restoreAllMocks();
  // `reset`, not `clear`: a one-off `mockRejectedValue` has to go with the test
  // that set it, or the next one inherits the outage.
  vi.resetAllMocks();
});

describe("changePassword", () => {
  /** Cheap cost factor — these hashes only have to verify, not resist anything. */
  const hashOf = (plaintext: string) => hash(plaintext, 4);

  const valid = {
    currentPassword: CURRENT,
    password: NEXT,
    confirmPassword: NEXT,
  };

  beforeEach(async () => {
    findUser.mockResolvedValue({ email: EMAIL, password: await hashOf(CURRENT) });
    writePassword.mockResolvedValue(true);
  });

  it("stores a hash of the new password, never the password", async () => {
    await expect(changePassword({}, formData(valid))).resolves.toEqual({ success: true });

    const [, , hashed] = writePassword.mock.calls[0];

    expect(hashed).not.toBe(NEXT);
    await expect(compare(NEXT, hashed)).resolves.toBe(true);
  });

  it("only ever touches the session user's own row", async () => {
    await changePassword({}, formData(valid));

    expect(findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USER_ID } })
    );
    expect(writePassword).toHaveBeenCalledWith(USER_ID, EMAIL, expect.any(String));
  });

  it("rejects a wrong current password without writing anything", async () => {
    const state = await changePassword(
      {},
      formData({ ...valid, currentPassword: "not it" })
    );

    expect(state.fieldErrors?.currentPassword).toBeDefined();
    expect(state.success).toBeUndefined();
    expect(writePassword).not.toHaveBeenCalled();
  });

  it("refuses an account that signs in with GitHub", async () => {
    findUser.mockResolvedValue({ email: EMAIL, password: null });

    const state = await changePassword({}, formData(valid));

    expect(state.error).toBeDefined();
    expect(writePassword).not.toHaveBeenCalled();
  });

  it("rejects a new password shorter than the policy allows", async () => {
    const state = await changePassword(
      {},
      formData({ ...valid, password: "short", confirmPassword: "short" })
    );

    expect(state.fieldErrors?.password).toBeDefined();
    expect(findUser).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation", async () => {
    const state = await changePassword(
      {},
      formData({ ...valid, confirmPassword: "something else" })
    );

    expect(state.fieldErrors?.confirmPassword).toBeDefined();
    expect(findUser).not.toHaveBeenCalled();
  });

  it("rejects a blank current password", async () => {
    const state = await changePassword({}, formData({ ...valid, currentPassword: "" }));

    expect(state.fieldErrors?.currentPassword).toBeDefined();
    expect(findUser).not.toHaveBeenCalled();
  });

  it("reports a failure rather than claiming success when the row is gone", async () => {
    writePassword.mockResolvedValue(false);

    const state = await changePassword({}, formData(valid));

    expect(state.error).toBeDefined();
    expect(state.success).toBeUndefined();
  });

  it("reports a database failure", async () => {
    writePassword.mockRejectedValue(new Error("connection lost"));

    const state = await changePassword({}, formData(valid));

    expect(state.error).toBeDefined();
    expect(state.success).toBeUndefined();
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    findUser.mockResolvedValue({ email: EMAIL });
  });

  it("deletes the session user's account and signs them out", async () => {
    await deleteAccount({}, new FormData());

    expect(deleteUser).toHaveBeenCalledWith(USER_ID, EMAIL);
    expect(endSession).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });

  it("deletes before signing out, so a failure leaves the session intact", async () => {
    await deleteAccount({}, new FormData());

    expect(deleteUser.mock.invocationCallOrder[0]).toBeLessThan(
      endSession.mock.invocationCallOrder[0]
    );
  });

  it("reports a failure and keeps the user signed in", async () => {
    deleteUser.mockRejectedValue(new Error("connection lost"));

    const state = await deleteAccount({}, new FormData());

    expect(state.error).toBeDefined();
    expect(endSession).not.toHaveBeenCalled();
  });

  it("signs out anyway when the account is already gone", async () => {
    findUser.mockResolvedValue(null);

    await deleteAccount({}, new FormData());

    expect(deleteUser).not.toHaveBeenCalled();
    expect(endSession).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });
});
