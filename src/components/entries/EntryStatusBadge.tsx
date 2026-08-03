import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from "@/lib/constants/entry";
import type { EntryStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface EntryStatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function EntryStatusBadge({ status, className }: EntryStatusBadgeProps) {
  const { label, icon: Icon, className: statusClass } = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(statusClass, className)}>
      <Icon />
      {label}
    </Badge>
  );
}
