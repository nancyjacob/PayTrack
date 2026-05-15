"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useQuery(api.clients.getClientById, {
    clientId: id as Id<"clients">,
  });
  const invoices = useQuery(api.invoices.listInvoices, {
    clientId: id as Id<"clients">,
  });

  if (client === undefined) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (client === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground">Client not found</p>
        <Button asChild className="mt-4">
          <Link href="/clients">Back to clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/invoices/new">New Invoice</Link>
        </Button>
      </div>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
        {/* Contact details — narrow left column */}
        <div className="rounded-lg border bg-card p-6 space-y-4 lg:col-span-1">
          <h2 className="font-semibold">Contact Details</h2>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-muted-foreground shrink-0" />
              <a
                href={`mailto:${client.email}`}
                className="text-primary hover:underline break-all"
              >
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-muted-foreground shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={15} className="text-muted-foreground shrink-0" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoices — wide right column, heading lives inside the table card */}
        <div className="lg:col-span-3">
          <InvoiceTable
            invoices={invoices ?? []}
            loading={invoices === undefined}
            header={<h2 className="font-semibold">Invoices</h2>}
          />
        </div>
      </div>
    </div>
  );
}
