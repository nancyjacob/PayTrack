"use client";

import { useQuery, useMutation } from "convex/react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Profile = NonNullable<ReturnType<typeof useQuery<typeof api.users.getMyProfile>>>;

function SettingsForm({ profile }: { profile: Profile }) {
  const updateProfile = useMutation(api.users.createOrUpdateProfile);

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [bankName, setBankName] = useState(profile.bankName ?? "");
  const [bankAccount, setBankAccount] = useState(profile.bankAccount ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        businessName,
        ownerName,
        phone: phone || undefined,
        address: address || undefined,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const invoicesLeft = Math.max(0, 5 - profile.invoiceCount);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>
            This information appears on your invoices and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Agency"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your Name</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Victoria Island, Lagos"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banking Details</CardTitle>
          <CardDescription>
            Displayed on PDF invoices for bank transfer payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Access Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Account Number</Label>
            <Input
              id="bankAccount"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="0123456789"
              maxLength={10}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save Changes"}
      </Button>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan</CardTitle>
            <Badge variant={profile.plan === "pro" ? "default" : "secondary"}>
              {profile.plan === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.plan === "free" ? (
            <>
              <p className="text-sm text-muted-foreground">
                You have used <strong>{profile.invoiceCount}</strong> of{" "}
                <strong>5</strong> free invoices.{" "}
                {invoicesLeft > 0
                  ? `${invoicesLeft} remaining.`
                  : "You have reached the free limit."}
              </p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-sm">
                  Upgrade to Pro — ₦8,000/month
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Unlimited invoices</li>
                  <li>✓ WhatsApp payment reminders</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button className="mt-2" size="sm" disabled>
                  Upgrade — Coming Soon
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are on the Pro plan. Unlimited invoices and all features
              enabled.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

export default function SettingsPage() {
  const profile = useQuery(api.users.getMyProfile);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your business profile and account
        </p>
      </div>

      {profile === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : profile === null ? (
        <SettingsForm
          profile={{
            _id: "" as Profile["_id"],
            _creationTime: 0,
            userId: "" as Profile["userId"],
            businessName: "",
            ownerName: "",
            email: "",
            plan: "free",
            invoiceCount: 0,
          }}
        />
      ) : (
        <SettingsForm key={profile._id} profile={profile} />
      )}
    </div>
  );
}
