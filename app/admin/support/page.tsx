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
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Clock, AlertCircle, UserCheck } from "lucide-react";

type Ticket = {
  _id: Id<"supportTickets">;
  _creationTime: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  assignedTo?: Id<"users">;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  createdAt: number;
};

type Admin = {
  _id: Id<"userProfiles">;
  userId: Id<"users">;
  ownerName: string;
  email: string;
  adminRole: string | null;
};

function statusConfig(status: string) {
  const map: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
    open: { label: "Open", icon: AlertCircle, variant: "default" },
    in_progress: { label: "In Progress", icon: Clock, variant: "secondary" },
    resolved: { label: "Resolved", icon: CheckCircle2, variant: "outline" },
  };
  return map[status] ?? { label: status, icon: MessageSquare, variant: "outline" };
}

export default function AdminSupportPage() {
  const tickets = useQuery(api.admin.listAllTickets) as Ticket[] | null | undefined;
  const admins = useQuery(api.admin.listAdmins) as Admin[] | null | undefined;
  const updateStatus = useMutation(api.admin.updateTicketStatus);
  const assignTicket = useMutation(api.admin.assignTicket);

  async function handleStatusChange(
    ticketId: Id<"supportTickets">,
    newStatus: "open" | "in_progress" | "resolved"
  ) {
    try {
      await updateStatus({ ticketId, status: newStatus });
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleAssign(ticketId: Id<"supportTickets">, userId: string) {
    try {
      await assignTicket({
        ticketId,
        assignedTo: userId ? (userId as Id<"users">) : null,
      });
      toast.success(userId ? "Ticket assigned" : "Assignment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    }
  }

  const openCount = tickets?.filter((t) => t.status === "open").length ?? 0;
  const inProgressCount = tickets?.filter((t) => t.status === "in_progress").length ?? 0;
  const resolvedCount = tickets?.filter((t) => t.status === "resolved").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage user support requests</p>
      </div>

      {tickets && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3">
              <AlertCircle size={18} className="text-primary" />
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <Clock size={18} className="text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!tickets ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No support tickets yet</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const cfg = statusConfig(ticket.status);
              const StatusIcon = cfg.icon;
              return (
                <div key={ticket._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                        <Badge variant={cfg.variant} className="shrink-0 gap-1">
                          <StatusIcon size={10} />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.name} · {ticket.email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(ticket.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 whitespace-pre-wrap">
                    {ticket.message}
                  </p>

                  {/* Assignment row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <UserCheck size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Assign to:</span>
                    <select
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      value={ticket.assignedTo ?? ""}
                      onChange={(e) => handleAssign(ticket._id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {admins?.map((admin) => (
                        <option key={admin.userId} value={admin.userId}>
                          {admin.ownerName}
                        </option>
                      ))}
                    </select>
                    {ticket.assigneeName && (
                      <span className="text-xs text-muted-foreground">
                        ({ticket.assigneeName})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground mr-1">Update status:</p>
                    {(["open", "in_progress", "resolved"] as const).map((s) => (
                      <Button
                        key={s}
                        variant={ticket.status === s ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          ticket.status !== s && handleStatusChange(ticket._id, s)
                        }
                        disabled={ticket.status === s}
                      >
                        {s === "open"
                          ? "Open"
                          : s === "in_progress"
                            ? "In Progress"
                            : "Resolved"}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs ml-auto"
                      onClick={() =>
                        window.open(
                          `mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`
                        )
                      }
                    >
                      Reply via Email
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
