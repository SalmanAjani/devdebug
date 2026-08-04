import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { sendVerificationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/verification";

/** Cost 12 — the same factor the seed script uses. */
const SALT_ROUNDS = 12;

const EMAIL_TAKEN = "An account with that email already exists";

interface RegisteredUser {
  id: string;
  name: string | null;
  email: string;
}

type RegisterResponse =
  | { success: true; data: RegisteredUser }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function failure(error: string, status: number, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json<RegisterResponse>({ success: false, error, fieldErrors }, { status });
}

/**
 * Registers an email/password user.
 *
 * A route handler rather than a Server Action on purpose: this is the endpoint
 * a future mobile or CLI client would call, and it needs real status codes.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return failure("Request body must be valid JSON", 400);
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return failure(parsed.error.issues[0].message, 400, fieldErrors);
  }

  const { name, email, password } = parsed.data;

  // Cheap pre-check for the common case. The unique index is what actually
  // guarantees it — two requests can both pass this line.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return failure(EMAIL_TAKEN, 409);
  }

  const verificationEnabled = isEmailVerificationEnabled();

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hash(password, SALT_ROUNDS),
        // Stamped up front while verification is off, rather than left null:
        // these accounts have to keep working if the flag is switched back on,
        // and nothing will ever arrive to clear a null for them.
        emailVerified: verificationEnabled ? null : new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    // Deliberately outside the failure path above: the account exists either
    // way, and a Resend outage should not turn a successful signup into a 500.
    // The user can pull a fresh link from the sign-in page.
    if (verificationEnabled) {
      try {
        const token = await createVerificationToken(user.email);
        await sendVerificationEmail({ to: user.email, name: user.name, token });
      } catch (error) {
        console.error("Verification email failed for", user.email, error);
      }
    }

    return NextResponse.json<RegisterResponse>({ success: true, data: user }, { status: 201 });
  } catch (error) {
    // P2002 = unique constraint violation, i.e. the race the pre-check misses.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return failure(EMAIL_TAKEN, 409);
    }

    console.error("Registration failed:", error);
    return failure("Could not create the account. Please try again.", 500);
  }
}
