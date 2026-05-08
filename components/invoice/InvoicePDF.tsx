"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const staticStyles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  logoMark: {
    width: 56,
    height: 56,
    objectFit: "contain",
    marginBottom: 6,
  },
  invoiceTitle: { fontSize: 24, textAlign: "right" },
  invoiceNumber: { color: "#6b7280", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 24 },
  label: { color: "#6b7280", marginBottom: 4, fontSize: 9, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
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

function boldOf(font: string) {
  if (font === "Times-Roman") return "Times-Bold";
  if (font === "Courier") return "Courier-Bold";
  return "Helvetica-Bold";
}

function fmt(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    kobo / 100
  );
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
  brandColor?: string;
  brandFont?: "Helvetica" | "Times-Roman" | "Courier";
  invoiceFooter?: string;
  logoUrl?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  client?: { name: string; email: string; address?: string } | null;
  profile?: {
    businessName: string;
    ownerName: string;
    address?: string;
    bankName?: string;
    bankAccount?: string;
  } | null;
};

function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const color = invoice.brandColor ?? "#4f46e5";
  const font = invoice.brandFont ?? "Helvetica";
  const bold = boldOf(font);
  const footerText =
    invoice.invoiceFooter ?? "Generated with PayTrack • Thank you for your business";

  return (
    <Document>
      <Page size="A4" style={[staticStyles.page, { fontFamily: font }]}>
        {/* Header */}
        <View style={staticStyles.header}>
          <View>
            {invoice.logoUrl ? (
              <Image src={invoice.logoUrl} style={staticStyles.logoMark} />
            ) : null}
            <Text style={{ fontSize: 20, fontFamily: bold, color }}>
              {invoice.profile?.businessName ?? "Business"}
            </Text>
            {invoice.profile?.address && (
              <Text style={{ color: "#6b7280", marginTop: 4, fontSize: 9 }}>
                {invoice.profile.address}
              </Text>
            )}
          </View>
          <View>
            <Text style={[staticStyles.invoiceTitle, { fontFamily: bold }]}>
              INVOICE
            </Text>
            <Text style={staticStyles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To / Dates */}
        <View style={staticStyles.row}>
          <View style={staticStyles.section}>
            <Text style={staticStyles.label}>Bill To</Text>
            <Text style={{ fontFamily: bold }}>{invoice.client?.name ?? "—"}</Text>
            <Text style={{ marginTop: 2 }}>{invoice.client?.email}</Text>
            {invoice.client?.address && (
              <Text style={{ marginTop: 2, color: "#6b7280" }}>
                {invoice.client.address}
              </Text>
            )}
          </View>
          <View style={[staticStyles.section, { textAlign: "right" }]}>
            <Text style={staticStyles.label}>Issue Date</Text>
            <Text style={{ fontFamily: bold }}>{fmtDate(invoice.issueDate)}</Text>
            <Text style={[staticStyles.label, { marginTop: 12 }]}>Due Date</Text>
            <Text style={{ fontFamily: bold, color: "#ef4444" }}>
              {fmtDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#f3f4f6",
            padding: "8 12",
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          {(
            [
              ["Description", staticStyles.colDesc],
              ["Qty", staticStyles.colQty],
              ["Unit Price", staticStyles.colPrice],
              ["Total", staticStyles.colTotal],
            ] as const
          ).map(([label, colStyle]) => (
            <Text
              key={label}
              style={[colStyle, { fontFamily: bold, fontSize: 9 }]}
            >
              {label}
            </Text>
          ))}
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={staticStyles.tableRow}>
            <Text style={staticStyles.colDesc}>{item.description}</Text>
            <Text style={staticStyles.colQty}>{item.quantity}</Text>
            <Text style={staticStyles.colPrice}>{fmt(item.unitPrice)}</Text>
            <Text style={staticStyles.colTotal}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={staticStyles.totalsRow}>
          <View style={staticStyles.totalsTable}>
            <View style={staticStyles.totalLine}>
              <Text style={{ color: "#6b7280" }}>Subtotal</Text>
              <Text>{fmt(invoice.subtotal)}</Text>
            </View>
            <View style={staticStyles.totalLine}>
              <Text style={{ color: "#6b7280" }}>Tax ({invoice.taxRate}%)</Text>
              <Text>{fmt(invoice.tax)}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
                borderTopWidth: 2,
                borderTopColor: color,
                marginTop: 4,
                fontFamily: bold,
                fontSize: 12,
              }}
            >
              <Text>Total Due</Text>
              <Text style={{ color }}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Bank details */}
        {(invoice.profile?.bankName || invoice.profile?.bankAccount) && (
          <View
            style={{
              marginTop: 32,
              padding: 12,
              backgroundColor: "#f9fafb",
              borderRadius: 4,
            }}
          >
            <Text style={[staticStyles.label, { marginBottom: 8 }]}>
              Payment Details
            </Text>
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
            <Text style={staticStyles.label}>Notes</Text>
            <Text style={{ color: "#374151" }}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={staticStyles.footer}>{footerText}</Text>
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
