"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { type Id } from "@/convex/_generated/dataModel";

type SupportTicket = {
  _id: Id<"supportTickets">;
  subject: string;
  message: string;
  status: string;
  createdAt: number;
};

const SUBJECTS = [
  "Invoice issue",
  "Payment problem",
  "Account access",
  "Billing question",
  "Feature request",
  "Other",
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    open: { label: "Open", variant: "default" },
    in_progress: { label: "In Progress", variant: "secondary" },
    resolved: { label: "Resolved", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function SupportPage() {
  const profile = useQuery(api.users.getMyProfile);
  const myTickets = useQuery(api.support.listMyTickets) as SupportTicket[] | undefined;
  const submitTicket = useMutation(api.support.submitSupportTicket);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from profile
  const prefillName = profile?.ownerName ?? "";
  const prefillEmail = profile?.email ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please enter your message"); return; }
    setLoading(true);
    try {
      await submitTicket({
        name: name || prefillName,
        email: email || prefillEmail,
        subject: subject || "General inquiry",
        message,
      });
      setSubmitted(true);
      toast.success("Support request submitted — we'll get back to you soon!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Support</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Have a question or issue? We&apos;re here to help.
        </p>
      </div>

      {submitted ? (
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={40} className="text-green-500" />
            <h2 className="text-lg font-semibold">Message received!</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your support request has been sent. We typically respond within 24 hours.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setMessage(""); setSubject(""); }}>
              Send another message
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={18} />
              Contact Support
            </CardTitle>
            <CardDescription>
              Describe your issue and our team will respond via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name || prefillName}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={prefillName || "Your name"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || prefillEmail}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={prefillEmail || "you@example.com"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        subject === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message</Label>
                  <span className="text-xs text-muted-foreground">{message.length}/1000</span>
                </div>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder="Describe your issue in detail — include any relevant invoice numbers or error messages."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <><Loader2 size={14} className="mr-2 animate-spin" />Sending…</> : "Send Support Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Previous tickets */}
      {myTickets && myTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} />
              Previous Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTickets.map((ticket) => (
              <div key={ticket._id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {statusBadge(ticket.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Response time</p>
              <p>Within 24 hours on business days</p>
            </div>
            <div className="border-l border-border" />
            <div>
              <p className="font-medium text-foreground">Email us directly</p>
              <p>support@paytrack.app</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
