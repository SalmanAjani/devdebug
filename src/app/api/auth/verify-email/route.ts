import { NextResponse } from "next/server";

import { consumeVerificationToken, markEmailVerified } from "@/lib/verification";

/**
 * Redeems the link from the verification email.
 *
 * A route handler rather than a page: clicking the link is a mutation, and
 * server components should not be the thing performing one. Every outcome ends
 * on the sign-in page, which renders the matching banner from `?verify=`.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  const land = (outcome: string) =>
    NextResponse.redirect(new URL(`/sign-in?verify=${outcome}`, request.url));

  // A truncated link — some mail clients wrap long urls — looks the same as a
  // forged one from here.
  if (!token) return land("invalid");

  const result = await consumeVerificationToken(token);

  if (!result.ok) return land(result.reason);

  // Token was valid but nothing was left to verify: the account was deleted, or
  // it is already verified and this is a replayed link.
  if (!(await markEmailVerified(result.email))) return land("invalid");

  return land("success");
}
