// Badge hien thi status (active/inactive...).
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "px-2.5 py-0.5 font-semibold",
        tone[status] ?? "bg-surface-muted text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}
