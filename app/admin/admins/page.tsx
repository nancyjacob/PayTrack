"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  Crown,
  Shield,
  Headphones,
  UserMinus,
  UserCog,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type AdminRole = "super_admin" | "admin" | "support";

type ActiveAdmin = {
  kind: "active";
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminRole;
  isAdmin: boolean;
  profileId: Id<"userProfiles">;
};

type PendingAdmin = {
  kind: "pending";
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: AdminRole;
  invitationId: Id<"adminInvitations">;
  expiresAt: number;
  createdAt: number;
};

type AdminEntry = ActiveAdmin | PendingAdmin;

// ── Helpers ────────────────────────────────────────────────────────────────

const ROLE_META: Record<
  AdminRole,
  {
    label: string;
    icon: React.ElementType;
    variant: "default" | "secondary" | "outline";
  }
> = {
  super_admin: { label: "Super Admin", icon: Crown, variant: "default" },
  admin: { label: "Admin", icon: Shield, variant: "secondary" },
  support: { label: "Support", icon: Headphones, variant: "outline" },
};

const RESOURCES = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "users", label: "Users" },
  { id: "invoices", label: "Invoices" },
  { id: "support", label: "Support Tickets" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "settings", label: "System Configuration" },
];

const PERM_ACTIONS = ["view", "create", "edit", "delete"] as const;

function RoleBadge({
  role,
  isLegacy = false,
}: {
  role: AdminRole | null;
  isLegacy?: boolean;
}) {
  const r = role ?? (isLegacy ? "super_admin" : null);
  if (!r) return null;
  const { label, icon: Icon, variant } = ROLE_META[r];
  return (
    <Badge variant={variant} className="gap-1 text-xs">
      <Icon size={10} />
      {label}
    </Badge>
  );
}

// ── Section divider ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ── Create Admin Modal ─────────────────────────────────────────────────────

function CreateAdminModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inviteAdmin = useAction(api.admin.inviteAdmin);
  const allPerms    = useQuery(api.permissions.getAllRolePermissions);

  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [role,       setRole]       = useState<AdminRole>("admin");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName(""); setEmail(""); setPhone(""); setRole("admin"); setSubmitting(false);
  }
  function handleClose() { reset(); onClose(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inviteAdmin({
        email: email.trim().toLowerCase(),
        name:  name.trim()  || undefined,
        phone: phone.trim() || undefined,
        role,
      });
      toast.success(`Invitation sent to ${email}`);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin");
      setSubmitting(false);
    }
  }

  const meta     = ROLE_META[role];
  const RoleIcon = meta.icon;
  const rolePerms = allPerms?.[role] ?? {};

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={18} />
            Create New Admin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">

          {/* ── Section 1: Admin Details ── */}
          <SectionLabel>Admin Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-name">Full Name</Label>
              <Input
                id="a-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
              <p className="text-xs text-muted-foreground">Pre-fills profile on signup.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-phone">Phone Number</Label>
              <Input
                id="a-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 801 234 5678"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              An invitation link will be sent to this address.
            </p>
          </div>

          {/* ── Section 2: Role ── */}
          <SectionLabel>Role</SectionLabel>
          <div className="space-y-3">
            <select
              id="a-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="admin">Admin</option>
              <option value="support">Support Agent</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-1.5 shrink-0 mt-0.5">
                <RoleIcon size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-0.5">{meta.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {role === "super_admin"
                    ? "Full unrestricted access to all modules and system settings. Cannot be limited."
                    : role === "admin"
                      ? "Configurable access across most modules. Cannot manage roles or system settings by default."
                      : "Limited access focused on support ticket management and invoice viewing."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 3: Permissions Preview ── */}
          <SectionLabel>Permissions Preview</SectionLabel>
          {role === "super_admin" ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Full Access — all modules unlocked</p>
              <p className="text-xs leading-relaxed">
                Super Admins have unrestricted view, create, edit, and delete
                access across every section. These permissions cannot be
                restricted.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(4,_40px)] bg-muted/40 border-b px-3 py-2 gap-x-1">
                <span className="text-xs font-semibold text-muted-foreground">Module</span>
                {PERM_ACTIONS.map((a) => (
                  <span key={a} className="text-xs font-semibold text-muted-foreground text-center capitalize">
                    {a}
                  </span>
                ))}
              </div>
              {/* Data rows */}
              {RESOURCES.map(({ id, label }) => {
                const perms = rolePerms[id] ?? [];
                return (
                  <div
                    key={id}
                    className="grid grid-cols-[1fr_repeat(4,_40px)] gap-x-1 px-3 py-2 border-b last:border-0 items-center"
                  >
                    <span className="text-sm">{label}</span>
                    {PERM_ACTIONS.map((action) => (
                      <div key={action} className="flex justify-center">
                        {perms.includes(action) ? (
                          <span className="text-primary font-bold text-sm">✓</span>
                        ) : (
                          <span className="text-muted-foreground/30 text-sm">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground -mt-1">
            Fine-tune permissions for each role in{" "}
            <a href="/admin/permissions" className="underline hover:text-foreground">
              Admin → Permissions
            </a>
            .
          </p>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              <UserPlus size={14} />
              {submitting ? "Sending invitation…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Admin Management View ──────────────────────────────────────────────────

function AdminManagementView() {
  const entries = useQuery(api.admin.listAllAdminEntries);
  const revokeInv = useMutation(api.admin.revokeAdminInvitation);
  const updateRole = useMutation(api.admin.updateAdminRole);
  const revokeAdmin = useMutation(api.admin.revokeAdmin);
  const { isSuperAdmin, can } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"userProfiles"> | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>("admin");

  const [revokeTarget, setRevokeTarget] = useState<{ profileId: Id<"userProfiles">; name: string } | null>(null);
  const [cancelInviteTarget, setCancelInviteTarget] = useState<Id<"adminInvitations"> | null>(null);
  const [saveRoleTarget, setSaveRoleTarget] = useState<Id<"userProfiles"> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canCreate = isSuperAdmin || can("users", "create");
  const canEdit = isSuperAdmin || can("users", "edit");
  const canDelete = isSuperAdmin || can("users", "delete");

  const activeAdmins: AdminEntry[] = (entries?.admins ?? []) as ActiveAdmin[];
  const pendingAdmins: AdminEntry[] = (entries?.invitations ?? []) as PendingAdmin[];
  const allEntries: AdminEntry[] = [...activeAdmins, ...pendingAdmins];

  async function executeUpdateRole() {
    if (!saveRoleTarget) return;
    setActionLoading(true);
    try {
      await updateRole({ profileId: saveRoleTarget, role: newRole });
      toast.success("Role updated");
      setEditingId(null);
      setSaveRoleTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function executeRevoke() {
    if (!revokeTarget) return;
    setActionLoading(true);
    try {
      await revokeAdmin({ profileId: revokeTarget.profileId });
      toast.success("Admin access revoked");
      setRevokeTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function executeCancelInvite() {
    if (!cancelInviteTarget) return;
    setActionLoading(true);
    try {
      await revokeInv({ invitationId: cancelInviteTarget });
      toast.success("Invitation cancelled");
      setCancelInviteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<AdminEntry>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name ?? row.email,
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.name ?? (
              <span className="text-muted-foreground italic text-sm">
                Not set
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        id: "phone",
        accessorFn: (row) => row.phone ?? "",
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">
            Phone
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.phone ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <SortableHeader column={column}>Role</SortableHeader>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          if (entry.kind === "active" && editingId === entry.profileId) {
            return (
              <div className="flex items-center gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support Agent</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSaveRoleTarget(entry.profileId)}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            );
          }
          return (
            <RoleBadge
              role={entry.role}
              isLegacy={
                entry.kind === "active" && entry.isAdmin && !entry.role
              }
            />
          );
        },
      },
      {
        id: "status",
        accessorFn: (row) => row.kind,
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) =>
          row.original.kind === "pending" ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock size={10} />
              Pending
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 text-xs text-green-600 border-green-200 bg-green-50"
            >
              <CheckCircle2 size={10} />
              Active
            </Badge>
          ),
        size: 100,
      },
      ...(canEdit || canDelete
        ? [
            {
              id: "actions",
              header: () => null,
              cell: ({ row }: { row: { original: AdminEntry } }) => {
                const entry = row.original;
                if (entry.kind === "active") {
                  return (
                    <div className="flex items-center gap-1 justify-end">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setEditingId(entry.profileId);
                            setNewRole(entry.role ?? "admin");
                          }}
                        >
                          <UserCog size={12} />
                          Role
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget({ profileId: entry.profileId, name: entry.name })}
                        >
                          <UserMinus size={12} />
                          Revoke
                        </Button>
                      )}
                    </div>
                  );
                }
                return canDelete ? (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => setCancelInviteTarget(entry.invitationId)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null;
              },
              size: 160,
              enableSorting: false,
              enableGlobalFilter: false,
            } as ColumnDef<AdminEntry>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canDelete, editingId, newRole]
  );

  const saveRoleEntry = saveRoleTarget
    ? (allEntries.find((e) => e.kind === "active" && e.profileId === saveRoleTarget) as ActiveAdmin | undefined)
    : undefined;

  return (
    <div className="space-y-6">
      <CreateAdminModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={saveRoleTarget !== null}
        onOpenChange={(v) => !v && setSaveRoleTarget(null)}
        title="Update admin role?"
        description={`Change ${saveRoleEntry?.name ?? "this admin"}'s role to ${newRole === "super_admin" ? "Super Admin" : newRole === "admin" ? "Admin" : "Support Agent"}?`}
        confirmLabel="Save"
        variant="default"
        onConfirm={executeUpdateRole}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(v) => !v && setRevokeTarget(null)}
        title="Revoke admin access?"
        description={`${revokeTarget?.name} will lose all admin privileges and be converted to a regular user.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={executeRevoke}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={cancelInviteTarget !== null}
        onOpenChange={(v) => !v && setCancelInviteTarget(null)}
        title="Cancel invitation?"
        description="This invitation link will be invalidated. The recipient will no longer be able to use it to join as an admin."
        confirmLabel="Cancel Invitation"
        variant="destructive"
        onConfirm={executeCancelInvite}
        loading={actionLoading}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Admins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage administrator accounts and role assignments.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2 shrink-0"
          >
            <UserPlus size={15} />
            Create New Admin
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={allEntries}
        loading={entries === undefined}
        searchPlaceholder="Search by name, email, or role…"
        emptyMessage="No admins found."
        defaultPageSize={20}
      />
    </div>
  );
}

// ── Page entry point ───────────────────────────────────────────────────────

export default function AdminAdminsPage() {
  const { isSuperAdmin, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!isSuperAdmin) return <AccessDenied />;
  return <AdminManagementView />;
}
