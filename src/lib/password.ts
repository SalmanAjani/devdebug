import { hash } from "bcryptjs";

/**
 * Cost factor for every password this app writes.
 *
 * It lives here rather than beside each call site because registration and the
 * password reset both write hashes and the number is a security parameter —
 * two copies of it drift. (A hash written at one cost still verifies at
 * another, so the seed script keeping its own copy is harmless.)
 */
const SALT_ROUNDS = 12;

export function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, SALT_ROUNDS);
}
