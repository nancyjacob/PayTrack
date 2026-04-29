import { Badge } from "@/components/ui/badge";
import { getStatusConfig, type InvoiceStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, className } = getStatusConfig(status);
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium text-xs px-2 py-0.5", className)}
    >
      {label}
    </Badge>
  );
}
