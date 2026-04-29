"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoice/InvoiceBuilder";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.getInvoiceById, {
    invoiceId: id as Id<"invoices">,
  });

  if (invoice === undefined) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (invoice === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button asChild className="mt-4">
          <Link href="/invoices">Back to invoices</Link>
        </Button>
      </div>
    );
  }

  if (invoice.status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground">Paid invoices cannot be edited</p>
        <Button asChild className="mt-4">
          <Link href={`/invoices/${id}`}>View invoice</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/invoices/${id}`}>
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            Edit {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Editing a {invoice.status} invoice
          </p>
        </div>
      </div>

      <InvoiceBuilder
        mode="edit"
        initial={{
          invoiceId: invoice._id,
          clientId: invoice.clientId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          items: invoice.items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100, // kobo → Naira for display
          })),
          taxRate: invoice.taxRate,
          notes: invoice.notes ?? "",
          status: invoice.status as "draft" | "sent" | "overdue" | "paid",
        }}
      />
    </div>
  );
}
