import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// All money is stored in kobo (NGN × 100). Display helpers divide by 100.
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export function getStatusConfig(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; className: string }> = {
    draft: {
      label: "Draft",
      className: "bg-muted text-muted-foreground",
    },
    sent: {
      label: "Sent",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    paid: {
      label: "Paid",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    overdue: {
      label: "Overdue",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  return map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}
