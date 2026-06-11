"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Client = {
  _id: Id<"clients">;
  name: string;
  email?: string;
  phone?: string;
  createdAt: number;
};

export default function ClientsPage() {
  const clients = useQuery(api.clients.listClients) as Client[] | undefined;
  const createClient = useMutation(api.clients.createClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"clients">; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email && !phone) {
      toast.error("Please provide at least an email or phone number.");
      return;
    }
    setSubmitting(true);
    try {
      await createClient({
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
      toast.success("Client added");
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setSubmitting(false);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient({ clientId: deleteTarget.id });
      toast.success("Client deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{row.original.email ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: () => <span className="text-xs font-medium text-muted-foreground">Phone</span>,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.phone ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Added</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/clients/${client._id}`}>
                  <Eye size={15} />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget({ id: client._id, name: client.name })}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          );
        },
        size: 80,
        enableSorting: false,
        enableGlobalFilter: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold">Clients</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Ltd"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Provide at least an email or phone number.
              </p>
              <div className="space-y-2">
                <Label htmlFor="c-email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-address">Address (optional)</Label>
                <Input
                  id="c-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Lagos"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding…" : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={clients ?? []}
        loading={clients === undefined}
        searchPlaceholder="Search clients…"
        emptyMessage="No clients yet. Add your first client to get started."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete client?"
        description={`"${deleteTarget?.name}" and all their data will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </div>
  );
}
