"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNaira } from "@/lib/utils";
import { type Id } from "@/convex/_generated/dataModel";

type AdminInvoice = {
  _id: Id<"invoices">;
  invoiceNumber: string;
  businessName: string;
  clientName: string;
  total: number;
  status: string;
  createdAt: number;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  sent: "secondary",
  draft: "outline",
  overdue: "destructive",
};

export default function AdminInvoicesPage() {
  const invoices = useQuery(api.admin.listAllInvoices) as AdminInvoice[] | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All invoices across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>All Invoices</span>
            {invoices && <span className="text-sm font-normal text-muted-foreground">{invoices.length} total</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!invoices ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.businessName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.clientName}</TableCell>
                    <TableCell className="font-medium">{formatNaira(inv.total)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "outline"}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
