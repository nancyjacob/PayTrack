"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Crown, Shield, Headphones, User } from "lucide-react";

type UserProfile = {
  _id: Id<"userProfiles">;
  _creationTime: number;
  businessName: string;
  ownerName: string;
  email: string;
  plan: "free" | "pro";
  invoiceCount: number;
  isAdmin?: boolean;
  adminRole?: "super_admin" | "admin" | "support";
};

function AdminRoleBadge({ isAdmin, adminRole }: { isAdmin?: boolean; adminRole?: string }) {
  if (adminRole === "super_admin" || (isAdmin && !adminRole))
    return (
      <Badge variant="default" className="gap-1 text-[10px]">
        <Crown size={9} />
        Super Admin
      </Badge>
    );
  if (adminRole === "admin")
    return (
      <Badge variant="secondary" className="gap-1 text-[10px]">
        <Shield size={9} />
        Admin
      </Badge>
    );
  if (adminRole === "support")
    return (
      <Badge variant="outline" className="gap-1 text-[10px]">
        <Headphones size={9} />
        Support
      </Badge>
    );
  return null;
}

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listAllUsers) as UserProfile[] | null | undefined;
  const togglePlan = useMutation(api.admin.toggleUserPlan);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All registered users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>All Users</span>
            {users && (
              <span className="text-sm font-normal text-muted-foreground">
                {users.length} total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!users ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.businessName}
                        <AdminRoleBadge
                          isAdmin={user.isAdmin}
                          adminRole={user.adminRole}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{user.ownerName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.invoiceCount}</TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                        {user.plan === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user._creationTime).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePlan(user._id, user.plan)}
                        className="h-7 text-xs"
                      >
                        <User size={12} className="mr-1.5" />
                        {user.plan === "pro" ? "Downgrade" : "Upgrade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
