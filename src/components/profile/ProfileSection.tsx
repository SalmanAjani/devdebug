import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  description: string;
  /** `destructive` tints the border so the delete block reads as different. */
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

/** One titled card on the profile page. */
export function ProfileSection({
  title,
  description,
  variant = "default",
  children,
}: ProfileSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5",
        variant === "destructive" ? "border-destructive/30" : "border-border"
      )}
    >
      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            "text-sm font-medium",
            variant === "destructive" && "text-destructive"
          )}
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {children}
    </section>
  );
}
