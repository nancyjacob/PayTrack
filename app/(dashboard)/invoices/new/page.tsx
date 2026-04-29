import { InvoiceBuilder } from "@/components/invoice/InvoiceBuilder";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-semibold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details below to create an invoice
          </p>
        </div>
      </div>

      <InvoiceBuilder mode="create" />
    </div>
  );
}
