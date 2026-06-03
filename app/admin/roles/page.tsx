"use client";

import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Shield,
  Headphones,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

// ── Role definitions ───────────────────────────────────────────────────────

type Capability = { label: string; allowed: boolean };

type RoleDef = {
  key: string;
  label: string;
  icon: React.ElementType;
  badgeVariant: "default" | "secondary" | "outline";
  description: string;
  capabilities: Capability[];
};

const ROLES: RoleDef[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    icon: Crown,
    badgeVariant: "default",
    description:
      "Highest level of access. Super Admins have unrestricted control over every module, can manage other admins, configure system settings, and edit role permissions.",
    capabilities: [
      { label: "Full access to all modules", allowed: true },
      { label: "Manage admin accounts & invitations", allowed: true },
      { label: "Configure role permissions", allowed: true },
      { label: "Manage system settings", allowed: true },
      { label: "View analytics & reports", allowed: true },
      { label: "Delete users & data", allowed: true },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: Shield,
    badgeVariant: "secondary",
    description:
      "General administrator with configurable access to most modules. Admins can manage users, invoices, and support tickets based on their assigned permissions, but cannot configure roles or system settings by default.",
    capabilities: [
      { label: "View overview & analytics", allowed: true },
      { label: "Manage users & invoices", allowed: true },
      { label: "Handle support tickets", allowed: true },
      { label: "Manage admin accounts", allowed: false },
      { label: "Configure role permissions", allowed: false },
      { label: "Manage system settings", allowed: false },
    ],
  },
  {
    key: "support",
    label: "Support",
    icon: Headphones,
    badgeVariant: "outline",
    description:
      "Limited access role focused on customer support. Support agents can view and manage support tickets and view invoices, but have no access to user management or system configuration.",
    capabilities: [
      { label: "View overview dashboard", allowed: true },
      { label: "Manage support tickets", allowed: true },
      { label: "View invoices", allowed: true },
      { label: "Manage users", allowed: false },
      { label: "View analytics", allowed: false },
      { label: "Configure settings or roles", allowed: false },
    ],
  },
];

// ── Role Card ──────────────────────────────────────────────────────────────

function RoleCard({ role }: { role: RoleDef }) {
  const Icon = role.icon;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Icon size={18} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {role.label}
              <Badge variant={role.badgeVariant} className="text-[10px] h-4 px-1.5">
                {role.key === "super_admin" ? "Fixed" : "Configurable"}
              </Badge>
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {role.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Key Capabilities
        </p>
        <ul className="space-y-2">
          {role.capabilities.map((cap) => (
            <li key={cap.label} className="flex items-center gap-2.5 text-sm">
              {cap.allowed ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check size={11} strokeWidth={2.5} />
                </span>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
                  <X size={11} strokeWidth={2.5} />
                </span>
              )}
              <span className={cap.allowed ? "" : "text-muted-foreground"}>
                {cap.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { can, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!can("roles", "view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            The three built-in roles and their default access levels. Fine-tune
            exactly what each role can do in the Permissions page.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Link href="/admin/permissions">
            Manage Permissions
            <ArrowRight size={14} />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
        {ROLES.map((role) => (
          <RoleCard key={role.key} role={role} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Admin and Support permissions can be adjusted in{" "}
        <Link href="/admin/permissions" className="underline hover:text-foreground">
          Permissions
        </Link>
        . Super Admin permissions are always fixed and cannot be changed.
      </p>
    </div>
  );
}
