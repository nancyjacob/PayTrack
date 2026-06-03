"use client";

import { usePermissions, type Resource, type Action } from "@/hooks/usePermissions";

interface PermissionGateProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the current user has the required permission.
 * Shows fallback (default: nothing) otherwise.
 */
export function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!can(resource, action)) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Full-page access-denied screen shown when navigating to a restricted route.
 */
export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          You don&apos;t have permission to view this section. Contact a Super
          Admin to request access.
        </p>
      </div>
    </div>
  );
}
