"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { formatNaira, formatDate } from "@/lib/utils";
import { Plus, Trash2, CalendarIcon, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in Naira (not kobo) for user input
};

export type InvoiceBuilderInitialValues = {
  invoiceId: Id<"invoices">;
  clientId: Id<"clients">;
  issueDate: number;
  dueDate: number;
  items: { description: string; quantity: number; unitPrice: number }[]; // unitPrice in Naira
  taxRate: number;
  notes: string;
  status: "draft" | "sent" | "overdue" | "paid";
};

const DEFAULT_TAX_RATE = 7.5;

function newLineItem(): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function toLineItems(
  items: InvoiceBuilderInitialValues["items"]
): LineItem[] {
  return items.map((item) => ({
    id: Math.random().toString(36).slice(2),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice, // already in Naira (caller converts from kobo)
  }));
}

type Props =
  | { mode: "create" }
  | { mode: "edit"; initial: InvoiceBuilderInitialValues };

export function InvoiceBuilder(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;

  const createInvoice = useMutation(api.invoices.createInvoice);
  const updateInvoice = useMutation(api.invoices.updateInvoice);
  const sendInvoice = useMutation(api.invoices.sendInvoice);
  const createClient = useMutation(api.clients.createClient);
  const clients = useQuery(api.clients.listClients);

  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(
    initial?.clientId ?? null
  );
  const [clientOpen, setClientOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const [issueDate, setIssueDate] = useState<Date>(
    initial ? new Date(initial.issueDate) : new Date()
  );
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (initial) return new Date(initial.dueDate);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const [items, setItems] = useState<LineItem[]>(
    initial ? toLineItems(initial.items) : [newLineItem()]
  );
  const [taxRate, setTaxRate] = useState(initial?.taxRate ?? DEFAULT_TAX_RATE);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState<"draft" | "send" | null>(null);

  // New client form
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const selectedClient = clients?.find(
    (c: { _id: Id<"clients">; name: string; email: string }) =>
      c._id === selectedClientId
  );

  const subtotalNaira = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxNaira = subtotalNaira * (taxRate / 100);
  const totalNaira = subtotalNaira + taxNaira;

  function updateItem(
    id: string,
    field: keyof Omit<LineItem, "id">,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleAddNewClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const id = await createClient({
        name: newClientName,
        email: newClientEmail,
        phone: newClientPhone || undefined,
      });
      setSelectedClientId(id);
      setNewClientOpen(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      toast.success("Client added");
    } catch {
      toast.error("Failed to add client");
    }
  }

  async function handleSubmit(andSend: boolean) {
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.description)) {
      toast.error("Add at least one item with a description");
      return;
    }

    const mappedItems = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Math.round(item.unitPrice * 100), // Naira → kobo
    }));

    setLoading(andSend ? "send" : "draft");
    try {
      if (isEdit && initial) {
        await updateInvoice({
          invoiceId: initial.invoiceId,
          clientId: selectedClientId,
          issueDate: issueDate.getTime(),
          dueDate: dueDate.getTime(),
          items: mappedItems,
          taxRate,
          notes: notes || undefined,
        });
        toast.success("Invoice updated");
        router.push(`/invoices/${initial.invoiceId}`);
      } else {
        const invoiceId = await createInvoice({
          clientId: selectedClientId,
          issueDate: issueDate.getTime(),
          dueDate: dueDate.getTime(),
          items: mappedItems,
          taxRate,
          notes: notes || undefined,
        });

        if (andSend) {
          await sendInvoice({ invoiceId });
          toast.success("Invoice created and sent to client!");
        } else {
          toast.success("Invoice saved as draft");
        }
        router.push(`/invoices/${invoiceId}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save invoice"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Client selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                {selectedClient ? selectedClient.name : "Select a client…"}
                <ChevronDown size={14} className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-100 p-0">
              <Command>
                <CommandInput placeholder="Search clients…" />
                <CommandList>
                  <CommandEmpty>No clients found.</CommandEmpty>
                  <CommandGroup>
                    {clients?.map(
                      (client: {
                        _id: Id<"clients">;
                        name: string;
                        email: string;
                      }) => (
                        <CommandItem
                          key={client._id}
                          value={client.name}
                          onSelect={() => {
                            setSelectedClientId(client._id);
                            setClientOpen(false);
                          }}
                        >
                          <Check
                            size={14}
                            className={cn(
                              "mr-2",
                              selectedClientId === client._id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </CommandItem>
                      )
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="border-t p-2">
                <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Plus size={14} className="mr-2" />
                      Add new client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleAddNewClient}
                      className="space-y-4 pt-2"
                    >
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="Acme Ltd"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="billing@acme.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone (optional)</Label>
                        <Input
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="08012345678"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Client
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>

          {selectedClient && (
            <p className="text-sm text-muted-foreground">
              {selectedClient.email}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon
                    size={14}
                    className="mr-2 text-muted-foreground"
                  />
                  {formatDate(issueDate.getTime())}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={issueDate}
                  onSelect={(d) => {
                    if (d) {
                      setIssueDate(d);
                      setIssueDateOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon
                    size={14}
                    className="mr-2 text-muted-foreground"
                  />
                  {formatDate(dueDate.getTime())}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    if (d) {
                      setDueDate(d);
                      setDueDateOpen(false);
                    }
                  }}
                  disabled={(d) => d < issueDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price (₦)</span>
            <span className="col-span-1 text-right">Total</span>
            <span className="col-span-1" />
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input
                  placeholder="Service description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "quantity",
                      Math.max(1, Number(e.target.value))
                    )
                  }
                  className="text-center"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice || ""}
                  onChange={(e) =>
                    updateItem(item.id, "unitPrice", Number(e.target.value))
                  }
                  className="text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-1 text-right text-sm font-medium">
                {formatNaira(item.quantity * item.unitPrice * 100)}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setItems((prev) => [...prev, newLineItem()])}
          >
            <Plus size={14} className="mr-1.5" />
            Add Line Item
          </Button>

          <Separator className="my-4" />

          <div className="space-y-2 ml-auto w-64">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNaira(subtotalNaira * 100)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tax</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="h-7 w-16 text-center text-xs"
                />
                <span className="text-muted-foreground text-xs">%</span>
              </div>
              <span>{formatNaira(taxNaira * 100)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">
                {formatNaira(totalNaira * 100)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes / Payment Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Payment due within 14 days. Thank you for your business."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        {isEdit ? (
          <Button disabled={!!loading} onClick={() => handleSubmit(false)}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              disabled={!!loading}
              onClick={() => handleSubmit(false)}
            >
              {loading === "draft" ? "Saving…" : "Save Draft"}
            </Button>
            <Button disabled={!!loading} onClick={() => handleSubmit(true)}>
              {loading === "send" ? "Sending…" : "Save & Send"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
