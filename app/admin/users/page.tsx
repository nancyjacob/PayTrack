"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Phone, AtSign, Building2, Trash2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type AdminRole = "super_admin" | "admin" | "support";

type UserProfile = {
  _id: Id<"userProfiles">;
  _creationTime: number;
  businessName: string;
  ownerName: string;
  email: string;
  plan: "free" | "pro";
  invoiceCount: number;
  isAdmin?: boolean;
  adminRole?: AdminRole;
};

// ── Permissions summary used in MyProfileCard ──────────────────────────────

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

// ── My Profile Card ────────────────────────────────────────────────────────

function MyProfileCard() {
  const profile = useQuery(api.users.getMyProfile);
  const myPerms = useQuery(api.permissions.getMyPermissions);

  if (!profile || !myPerms) return null;

  const perms = myPerms.permissions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">My Profile</CardTitle>
        <CardDescription>
          Your account information and access summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 shrink-0">
              <Building2 size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium truncate">{profile.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 shrink-0">
              <AtSign size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 shrink-0">
              <Phone size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{profile.phone ?? "—"}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-3">My Access Permissions</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground">
                    Module
                  </th>
                  {PERM_ACTIONS.map((a) => (
                    <th
                      key={a}
                      className="text-center py-1.5 px-3 font-medium text-muted-foreground capitalize w-16"
                    >
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map(({ id, label }) => {
                  const actions = perms[id] ?? [];
                  const hasAny = actions.length > 0;
                  return (
                    <tr
                      key={id}
                      className={`border-b last:border-0 ${!hasAny ? "opacity-40" : ""}`}
                    >
                      <td className="py-1.5 pr-4 text-sm">{label}</td>
                      {PERM_ACTIONS.map((action) => (
                        <td key={action} className="text-center py-1.5 px-3">
                          {actions.includes(action) ? (
                            <span className="text-green-500 font-bold">✓</span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Contact a Super Admin to request additional permissions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Platform Users Table ───────────────────────────────────────────────────

function PlatformUsersTable() {
  const allUsers = useQuery(api.admin.listAllUsers) as
    | UserProfile[]
    | null
    | undefined;
  const togglePlan = useMutation(api.admin.toggleUserPlan);
  const deleteUser = useMutation(api.admin.deleteUser);
  const { can, isSuperAdmin } = usePermissions();

  const canEdit = isSuperAdmin || can("users", "edit");
  const canDelete = isSuperAdmin || can("users", "delete");

  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"userProfiles">; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const users = useMemo(
    () => allUsers?.filter((u) => !u.isAdmin && !u.adminRole) ?? [],
    [allUsers]
  );

  async function handleTogglePlan(
    profileId: Id<"userProfiles">,
    current: "free" | "pro"
  ) {
    try {
      await togglePlan({ profileId, plan: current === "pro" ? "free" : "pro" });
      toast.success(`Plan updated to ${current === "pro" ? "Free" : "Pro"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser({ profileId: deleteTarget.id });
      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: "businessName",
        header: ({ column }) => (
          <SortableHeader column={column}>Business</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.businessName}</span>
        ),
      },
      {
        accessorKey: "ownerName",
        header: ({ column }) => (
          <SortableHeader column={column}>Owner</SortableHeader>
        ),
        cell: ({ row }) => <span>{row.original.ownerName}</span>,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "invoiceCount",
        header: ({ column }) => (
          <SortableHeader column={column}>Invoices</SortableHeader>
        ),
        cell: ({ row }) => row.original.invoiceCount,
        size: 90,
      },
      {
        accessorKey: "plan",
        header: ({ column }) => (
          <SortableHeader column={column}>Plan</SortableHeader>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.plan === "pro" ? "default" : "secondary"}
          >
            {row.original.plan === "pro" ? "Pro" : "Free"}
          </Badge>
        ),
        size: 80,
      },
      {
        accessorKey: "_creationTime",
        header: ({ column }) => (
          <SortableHeader column={column}>Joined</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original._creationTime).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            })}
          </span>
        ),
        size: 110,
      },
      ...(canEdit || canDelete
        ? [
            {
              id: "actions",
              header: () => null,
              cell: ({ row }: { row: { original: UserProfile } }) => {
                const user = row.original;
                return (
                  <div className="flex items-center gap-1 justify-end">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePlan(user._id, user.plan)}
                        className="h-7 text-xs"
                      >
                        {user.plan === "pro" ? "Downgrade" : "Upgrade"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteTarget({ id: user._id, name: user.ownerName || user.businessName })
                        }
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={12} />
                        Delete
                      </Button>
                    )}
                  </div>
                );
              },
              size: 160,
              enableSorting: false,
              enableGlobalFilter: false,
            } as ColumnDef<UserProfile>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canDelete]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        loading={allUsers === undefined}
        searchPlaceholder="Search by business, owner, or email…"
        emptyMessage="No users found."
        defaultPageSize={20}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete user account?"
        description={`This will permanently remove ${deleteTarget?.name}'s account, invoices, clients, and all associated data. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </>
  );
}

// ── Page entry point ───────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { isSuperAdmin, isLoading, can } = usePermissions();

  if (isLoading) return null;

  const canView = isSuperAdmin || can("users", "view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {canView
            ? "All registered platform users."
            : "Your account information and access summary."}
        </p>
      </div>

      {canView ? <PlatformUsersTable /> : <MyProfileCard />}
    </div>
  );
}
