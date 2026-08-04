import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  /** Display name. Drives the initials and the image's alt text. */
  name: string;
  /** GitHub's avatar url, or null for email/password accounts. */
  image?: string | null;
  /**
   * Precomputed initials. `getCurrentUser` already derives these, so passing
   * them through avoids doing the same work twice on every render.
   */
  initials?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * The user's picture, falling back to their initials.
 *
 * `AvatarImage` only reveals itself once the image actually loads, so the
 * fallback also covers a dead GitHub url rather than leaving a blank circle.
 */
export function UserAvatar({
  name,
  image,
  initials,
  size = "default",
  className,
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback>{initials ?? toInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
