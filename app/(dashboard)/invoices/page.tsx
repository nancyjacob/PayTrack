"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { useState, useMemo } from "react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

export default function InvoicesPage() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const invoices = useQuery(api.invoices.listInvoices, {
    status: status || undefined,
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    type Inv = (typeof invoices)[number];
    return invoices.filter(
      (inv: Inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.client?.name.toLowerCase().includes(q) ||
        inv.client?.email.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold">Invoices</h1>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus size={16} />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 border-b border-border">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                status === value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search invoices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <InvoiceTable
        invoices={filtered}
        loading={invoices === undefined}
      />
    </div>
  );
}
