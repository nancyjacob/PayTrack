"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Crown, Shield, Headphones, RotateCcw, Save } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type RoleKey = "super_admin" | "admin" | "support";
type ActionKey = "view" | "create" | "edit" | "delete";

const RESOURCES: { id: string; label: string }[] = [
  { id: "overview",  label: "Overview Dashboard" },
  { id: "analytics", label: "Analytics" },
  { id: "users",     label: "Users" },
  { id: "invoices",  label: "Invoices" },
  { id: "support",   label: "Support Tickets" },
  { id: "roles",     label: "Roles & Permissions" },
  { id: "settings",  label: "System Configuration" },
];

const ACTIONS: ActionKey[] = ["view", "create", "edit", "delete"];

const ACTION_LABELS: Record<ActionKey, string> = {
  view:   "View",
  create: "Create",
  edit:   "Edit",
  delete: "Delete",
};

const ROLE_META: Record<
  RoleKey,
  { label: string; icon: React.ElementType; description: string }
> = {
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    description: "Full unrestricted access. Permissions cannot be modified.",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    description: "Configurable access across most modules.",
  },
  support: {
    label: "Support",
    icon: Headphones,
    description: "Limited access focused on support ticket management.",
  },
};

// ── Toggle logic ───────────────────────────────────────────────────────────

function applyToggle(
  set: Set<string>,
  action: ActionKey,
  checked: boolean
): Set<string> {
  const next = new Set(set);
  if (checked) {
    next.add(action);
    if (action !== "view") next.add("view");
  } else {
    next.delete(action);
    if (action === "view") {
      next.delete("create");
      next.delete("edit");
      next.delete("delete");
    }
  }
  return next;
}

// ── Role Permission Card ───────────────────────────────────────────────────

function RolePermissionCard({
  role,
  permissions,
  readOnly,
}: {
  role: RoleKey;
  permissions: Record<string, string[]>;
  readOnly: boolean;
}) {
  const updatePermissions = useMutation(api.permissions.updateRolePermissions);
  const resetToDefaults   = useMutation(api.permissions.resetRoleToDefaults);

  const [draft, setDraft]         = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const initial: Record<string, Set<string>> = {};
    for (const { id } of RESOURCES) {
      initial[id] = new Set(permissions[id] ?? []);
    }
    setDraft(initial);
    setDirty(false);
  }, [permissions]);

  function toggle(resource: string, action: ActionKey) {
    if (readOnly) return;
    setDraft((prev) => {
      const current = prev[resource] ?? new Set<string>();
      const checked = current.has(action);
      return {
        ...prev,
        [resource]: applyToggle(new Set(current), action, !checked),
      };
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const { id: resource } of RESOURCES) {
        await updatePermissions({
          role,
          resource,
          actions: Array.from(draft[resource] ?? []),
        });
      }
      toast.success(`${ROLE_META[role].label} permissions saved`);
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function executeReset() {
    setResetting(true);
    try {
      await resetToDefaults({ role });
      toast.success("Reset to defaults");
      setShowReset(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  const meta = ROLE_META[role];
  const Icon = meta.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {meta.label}
                {readOnly && (
                  <Badge variant="default" className="text-[10px] h-4 px-1.5">
                    Fixed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {meta.description}
              </CardDescription>
            </div>
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground shrink-0"
              onClick={() => setShowReset(true)}
            >
              <RotateCcw size={12} />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-0">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_repeat(4,_44px)] gap-x-1 pb-2 border-b mb-1">
          <span className="text-xs font-medium text-muted-foreground">Module</span>
          {ACTIONS.map((a) => (
            <span
              key={a}
              className="text-xs font-medium text-muted-foreground text-center"
            >
              {ACTION_LABELS[a]}
            </span>
          ))}
        </div>

        {/* Permission rows */}
        {RESOURCES.map(({ id, label }) => {
          const current = draft[id] ?? new Set(permissions[id] ?? []);
          return (
            <div
              key={id}
              className="grid grid-cols-[1fr_repeat(4,_44px)] gap-x-1 py-2 border-b last:border-0 items-center"
            >
              <span className="text-sm">{label}</span>
              {ACTIONS.map((action) => {
                const checked = current.has(action);
                const needsView = action !== "view" && !current.has("view");
                return (
                  <div key={action} className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id, action)}
                      disabled={readOnly || needsView}
                      title={needsView ? `Enable "View" first` : undefined}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {!readOnly && (
          <div className="pt-4">
            <Button
              size="sm"
              className="gap-2"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={showReset}
        onOpenChange={setShowReset}
        title={`Reset ${ROLE_META[role].label} permissions?`}
        description="All permission toggles for this role will be restored to their default values. Any unsaved changes will also be discarded."
        confirmLabel="Reset to Defaults"
        variant="destructive"
        onConfirm={executeReset}
        loading={resetting}
      />
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { can, isLoading, isSuperAdmin } = usePermissions();
  const initPerms = useMutation(api.permissions.initDefaultPermissions);
  const allPerms  = useQuery(api.permissions.getAllRolePermissions);

  useEffect(() => {
    initPerms();
  }, [initPerms]);

  if (isLoading) return null;
  if (!can("roles", "view")) return <AccessDenied />;

  const roles: RoleKey[] = ["super_admin", "admin", "support"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Permissions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure what each role can view, create, edit, and delete across
          every module. Enable <strong>View</strong> before enabling Create,
          Edit, or Delete. Super Admin permissions are fixed.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
        {roles.map((role) => (
          <RolePermissionCard
            key={role}
            role={role}
            permissions={allPerms?.[role] ?? {}}
            readOnly={role === "super_admin" || !isSuperAdmin}
          />
        ))}
      </div>
    </div>
  );
}
