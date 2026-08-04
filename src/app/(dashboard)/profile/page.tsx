import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = {
  title: "Profile · DevDebug",
};

// Reads the session, so it can never be prerendered.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  // The proxy covers this route, so a null user means the token outlived the
  // row it points at — treat it as signed out.
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details.
        </p>
      </header>

      <section className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <UserAvatar
          name={user.name}
          image={user.image}
          initials={user.initials}
          size="lg"
        />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {user.email}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Sign out</h2>
          <p className="text-sm text-muted-foreground">
            End this session and return to the sign-in page.
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="destructive" size="lg">
            Sign out
          </Button>
        </form>
      </section>
    </div>
  );
}
