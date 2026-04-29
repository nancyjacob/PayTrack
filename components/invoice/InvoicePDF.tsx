"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  businessName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#4f46e5" },
  invoiceTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", textAlign: "right" },
  invoiceNumber: { color: "#6b7280", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 24 },
  label: { color: "#6b7280", marginBottom: 4, fontSize: 9, textTransform: "uppercase" },
  value: { fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "8 12",
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 12",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsTable: { width: 200 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#4f46e5",
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    color: "#6b7280",
    fontSize: 9,
    textAlign: "center",
  },
});

function fmt(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(kobo / 100);
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type InvoiceData = {
  invoiceNumber: string;
  status: string;
  issueDate: number;
  dueDate: number;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  client?: {
    name: string;
    email: string;
    address?: string;
  } | null;
  profile?: {
    businessName: string;
    ownerName: string;
    address?: string;
    bankName?: string;
    bankAccount?: string;
  } | null;
};

function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>
              {invoice.profile?.businessName ?? "Business"}
            </Text>
            {invoice.profile?.address && (
              <Text style={{ color: "#6b7280", marginTop: 4, fontSize: 9 }}>
                {invoice.profile.address}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To / Dates */}
        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{invoice.client?.name ?? "—"}</Text>
            <Text style={{ marginTop: 2 }}>{invoice.client?.email}</Text>
            {invoice.client?.address && (
              <Text style={{ marginTop: 2, color: "#6b7280" }}>
                {invoice.client.address}
              </Text>
            )}
          </View>
          <View style={[styles.section, { textAlign: "right" }]}>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{fmtDate(invoice.issueDate)}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>Due Date</Text>
            <Text style={[styles.value, { color: "#ef4444" }]}>
              {fmtDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
            Description
          </Text>
          <Text style={[styles.colQty, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
            Qty
          </Text>
          <Text style={[styles.colPrice, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
            Unit Price
          </Text>
          <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
            Total
          </Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{fmt(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsRow}>
          <View style={styles.totalsTable}>
            <View style={styles.totalLine}>
              <Text style={{ color: "#6b7280" }}>Subtotal</Text>
              <Text>{fmt(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={{ color: "#6b7280" }}>Tax ({invoice.taxRate}%)</Text>
              <Text>{fmt(invoice.tax)}</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text>Total Due</Text>
              <Text style={{ color: "#4f46e5" }}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Bank details */}
        {(invoice.profile?.bankName || invoice.profile?.bankAccount) && (
          <View style={{ marginTop: 32, padding: 12, backgroundColor: "#f9fafb", borderRadius: 4 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Payment Details</Text>
            {invoice.profile.bankName && (
              <Text>Bank: {invoice.profile.bankName}</Text>
            )}
            {invoice.profile.bankAccount && (
              <Text>Account Number: {invoice.profile.bankAccount}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Notes</Text>
            <Text style={{ color: "#374151" }}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Generated with PayTrack • Thank you for your business
        </Text>
      </Page>
    </Document>
  );
}

export function InvoicePDFDownload({ invoice }: { invoice: InvoiceData }) {
  return (
    <PDFDownloadLink
      document={<InvoiceDocument invoice={invoice} />}
      fileName={`${invoice.invoiceNumber}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          <Download size={15} className="mr-2" />
          {loading ? "Generating…" : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
