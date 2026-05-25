"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ParsedItem = { description: string; quantity: number; unitPrice: number };

type ParsedInvoice = {
  items: ParsedItem[];
  notes: string;
  daysUntilDue: number;
};

type Props = {
  onApply: (data: ParsedInvoice) => void;
};

const EXAMPLES = [
  "Create an invoice for website design services worth ₦250,000 with 50% upfront payment",
  "Invoice for 3 months of social media management at ₦45,000 per month",
  "Bill for logo design ₦80,000 and brand guide ₦30,000, due in 7 days",
];

export function AIInvoiceDialog({ onApply }: Props) {
  const parseInvoice = useAction(api.ai.parseInvoiceFromText);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error("Describe what you want to invoice"); return; }
    setLoading(true);
    try {
      const result = await parseInvoice({ prompt });
      onApply(result as ParsedInvoice);
      setOpen(false);
      setPrompt("");
      toast.success("Invoice fields populated from your description");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Sparkles size={14} className="text-primary" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            AI Invoice Generator
          </DialogTitle>
          <DialogDescription>
            Describe what you want to invoice for in plain language and let AI fill in the details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create an invoice for website design services worth ₦250,000 with a 50% upfront payment."
            rows={4}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Examples</p>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />Generating…</>
              ) : (
                <><Sparkles size={14} className="mr-2" />Generate Invoice</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
