"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Crown, Shield, Headphones, UserMinus, UserCog, Mail, Send } from "lucide-react";

type AdminRole = "super_admin" | "admin" | "support";

function roleBadge(role: AdminRole | null, isLegacy: boolean) {
  if (isLegacy && !role) return <Badge variant="default" className="gap-1"><Crown size={10} />Super Admin</Badge>;
  if (role === "super_admin") return <Badge variant="default" className="gap-1"><Crown size={10} />Super Admin</Badge>;
  if (role === "admin") return <Badge variant="secondary" className="gap-1"><Shield size={10} />Admin</Badge>;
  if (role === "support") return <Badge variant="outline" className="gap-1"><Headphones size={10} />Support</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}

function roleLabel(role: AdminRole): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Support Agent";
}

export default function AdminAdminsPage() {
  const myRole = useQuery(api.admin.getMyAdminRole);
  const admins = useQuery(api.admin.listAdmins);
  const invitations = useQuery(
    api.admin.listPendingInvitations,
    myRole?.isSuperAdmin ? {} : "skip"
  );
  const inviteAdmin = useAction(api.admin.inviteAdmin);
  const revokeInvitation = useMutation(api.admin.revokeAdminInvitation);
  const updateRole = useMutation(api.admin.updateAdminRole);
  const revokeAdmin = useMutation(api.admin.revokeAdmin);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
  const [inviting, setInviting] = useState(false);
  const [editingRole, setEditingRole] = useState<Id<"userProfiles"> | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>("admin");

  const isSuperAdmin = myRole?.isSuperAdmin ?? false;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteAdmin({ email: inviteEmail.trim().toLowerCase(), role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvite(id: Id<"adminInvitations">) {
    try {
      await revokeInvitation({ invitationId: id });
      toast.success("Invitation revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    }
  }

  async function handleUpdateRole(profileId: Id<"userProfiles">) {
    try {
      await updateRole({ profileId, role: newRole });
      toast.success("Role updated");
      setEditingRole(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRevoke(profileId: Id<"userProfiles">, name: string) {
    if (!confirm(`Remove admin access for ${name}?`)) return;
    try {
      await revokeAdmin({ profileId });
      toast.success("Admin access revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Admin Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage admin users and role assignments
        </p>
      </div>

      {/* Invite Admin — Super Admin only */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send size={16} />
              Invite New Admin
            </CardTitle>
            <CardDescription>
              Send an invitation email with a secure link. The recipient must have
              a PayTrack account with the same email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteRole">Role</Label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support Agent</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={inviting} className="gap-2">
                <Mail size={14} />
                {inviting ? "Sending…" : "Send Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Current Admins</span>
            {admins && (
              <span className="text-sm font-normal text-muted-foreground">
                {admins.length} total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!admins ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No admins found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isSuperAdmin && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">{admin.ownerName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {admin.email}
                    </TableCell>
                    <TableCell>
                      {editingRole === admin._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as AdminRole)}
                            className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="admin">Admin</option>
                            <option value="support">Support Agent</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleUpdateRole(admin._id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setEditingRole(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        roleBadge(admin.adminRole as AdminRole | null, admin.isAdmin)
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setEditingRole(admin._id);
                              setNewRole(
                                (admin.adminRole as AdminRole | null) ?? "admin"
                              );
                            }}
                          >
                            <UserCog size={12} />
                            Change Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => handleRevoke(admin._id, admin.ownerName)}
                          >
                            <UserMinus size={12} />
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations — Super Admin only */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invitations</CardTitle>
            <CardDescription>
              Invitations expire after 7 days if not accepted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!invitations ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No pending invitations
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        {roleBadge(inv.role as AdminRole, false)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(inv.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(inv.expiresAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() =>
                            handleRevokeInvite(inv._id as Id<"adminInvitations">)
                          }
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
