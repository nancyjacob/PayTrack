"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KPICards } from "@/components/dashboard/KPICards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const profile = useQuery(api.users.getMyProfile);
  const recentInvoices = useQuery(api.invoices.listInvoices, {});

  const lastName5 = recentInvoices?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            {profile?.businessName ? `${profile.businessName}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile
              ? `${profile.plan === "free" ? `Free plan · ${profile.invoiceCount}/5 invoices used` : "Pro plan"}`
              : "Overview of your invoicing activity"}
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus size={16} />
            New Invoice
          </Link>
        </Button>
      </div>

      <KPICards />
      <RevenueChart />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Invoices</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">View all</Link>
          </Button>
        </div>
        <InvoiceTable
          invoices={lastName5}
          loading={recentInvoices === undefined}
        />
      </div>
    </div>
  );
}
