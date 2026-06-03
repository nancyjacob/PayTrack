"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Resource =
  | "overview"
  | "analytics"
  | "users"
  | "invoices"
  | "support"
  | "roles"
  | "settings";

export type Action = "view" | "create" | "edit" | "delete";

export function usePermissions() {
  const data = useQuery(api.permissions.getMyPermissions);

  const isLoading = data === undefined;
  const isSuperAdmin = data?.isSuperAdmin ?? false;

  function can(resource: Resource, action: Action): boolean {
    if (isLoading) return false;
    if (!data) return false;
    if (isSuperAdmin) return true;
    const actions = data.permissions[resource] ?? [];
    return actions.includes(action);
  }

  function canViewAny(resources: Resource[]): boolean {
    return resources.some((r) => can(r, "view"));
  }

  return {
    can,
    canViewAny,
    isLoading,
    isSuperAdmin,
    role: data?.role ?? null,
    permissions: data?.permissions ?? {},
  };
}
