import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getEntryDetail, touchEntryViewedAt } from "@/lib/db/entries";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Full detail for one entry, for the drawer.
 *
 * A route handler rather than a server component: the drawer fetches on click
 * without a navigation, so the detail has to be reachable over HTTP.
 *
 * The session is checked here instead of leaning on `requireUserId`, which
 * redirects — a fetch from the drawer wants a 401 it can render, not a 307 to
 * the sign-in HTML. Ownership is still enforced inside the query.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entry = await getEntryDetail(id);

  // Someone else's entry is missing, not forbidden — a 403 would confirm the id exists.
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Opening the drawer is what "viewed" means. Awaited so the write is done
  // before the response — a serverless invocation can be frozen the moment it
  // returns, which would drop a floating promise.
  await touchEntryViewedAt(entry.id);

  return NextResponse.json(entry);
}
