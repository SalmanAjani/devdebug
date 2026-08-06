import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { getCollectionCount } from "@/lib/db/collections";
import { getEntryCount } from "@/lib/db/entries";
import { getProfile } from "@/lib/db/user";

export const metadata: Metadata = {
  title: "Profile · DevDebug",
};

// Reads the session, so it can never be prerendered.
export const dynamic = "force-dynamic";

/** "6 August 2026" — locale-independent so server and client agree. */
const JOINED_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function ProfilePage() {
  const [user, entries, collections] = await Promise.all([
    getProfile(),
    getEntryCount(),
    getCollectionCount(),
  ]);

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
          Your account details and usage.
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
          <span className="mt-1 text-xs text-muted-foreground">
            Joined{" "}
            <time dateTime={user.createdAt.toISOString()}>
              {JOINED_FORMAT.format(user.createdAt)}
            </time>
          </span>
        </div>
      </section>

      <ProfileStats entries={entries} collections={collections} />

      {/* Hidden for GitHub-only accounts: there is no password to change. */}
      {user.hasPassword && (
        <ProfileSection
          title="Password"
          description="Change the password you use to sign in."
        >
          <div>
            <ChangePasswordDialog />
          </div>
        </ProfileSection>
      )}

      <ProfileSection
        title="Sign out"
        description="End this session and return to the sign-in page."
      >
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="lg">
            Sign out
          </Button>
        </form>
      </ProfileSection>

      <ProfileSection
        title="Delete account"
        description="Permanently deletes your account and everything in it. This cannot be undone."
        variant="destructive"
      >
        <div>
          <DeleteAccountDialog />
        </div>
      </ProfileSection>
    </div>
  );
}
