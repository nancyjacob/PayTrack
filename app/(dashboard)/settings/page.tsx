"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRef, useState } from "react";
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
import { Upload, X } from "lucide-react";

type BrandFont = "Helvetica" | "Times-Roman" | "Courier";

type Profile = NonNullable<ReturnType<typeof useQuery<typeof api.users.getMyProfile>>>;

const FONT_OPTIONS: { value: BrandFont; label: string; css: string }[] = [
  { value: "Helvetica", label: "Sans", css: "sans-serif" },
  { value: "Times-Roman", label: "Serif", css: "serif" },
  { value: "Courier", label: "Mono", css: "monospace" },
];

function BrandPreview({
  businessName,
  color,
  font,
  footer,
  logoUrl,
}: {
  businessName: string;
  color: string;
  font: BrandFont;
  footer: string;
  logoUrl: string | null | undefined;
}) {
  const cssFont = FONT_OPTIONS.find((f) => f.value === font)?.css ?? "sans-serif";

  return (
    <div
      className="rounded-lg border bg-white p-5 text-[11px] shadow-sm select-none"
      style={{ fontFamily: cssFont }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              className="mb-1.5 h-10 w-10 object-contain"
            />
          )}
          <div className="font-bold text-sm" style={{ color }}>
            {businessName || "Your Business"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">123 Victoria Island, Lagos</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-base text-gray-700">INVOICE</div>
          <div className="text-gray-400 text-[10px]">INV-2025-001</div>
        </div>
      </div>

      {/* Divider in brand color */}
      <div className="h-px mb-3" style={{ backgroundColor: color }} />

      {/* Sample rows */}
      <div className="flex justify-between text-gray-500 mb-1">
        <span>Website Redesign</span>
        <span>₦150,000</span>
      </div>
      <div className="flex justify-between text-gray-500 mb-3">
        <span>SEO Audit</span>
        <span>₦50,000</span>
      </div>

      {/* Total */}
      <div
        className="flex justify-between font-bold border-t-2 pt-2"
        style={{ borderColor: color, color }}
      >
        <span>Total Due</span>
        <span>₦200,000</span>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-100 pt-2 text-center text-gray-400 text-[9px]">
        {footer || "Generated with PayTrack • Thank you for your business"}
      </div>
    </div>
  );
}

function SettingsForm({ profile }: { profile: Profile }) {
  const updateProfile = useMutation(api.users.createOrUpdateProfile);
  const generateLogoUploadUrl = useMutation(api.users.generateLogoUploadUrl);
  const saveLogo = useMutation(api.users.saveLogo);
  const logoUrl = useQuery(api.users.getLogoUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [bankName, setBankName] = useState(profile.bankName ?? "");
  const [bankAccount, setBankAccount] = useState(profile.bankAccount ?? "");
  const [brandColor, setBrandColor] = useState(profile.brandColor ?? "#4f46e5");
  const [brandFont, setBrandFont] = useState<BrandFont>(profile.brandFont ?? "Helvetica");
  const [invoiceFooter, setInvoiceFooter] = useState(profile.invoiceFooter ?? "");
  const [loading, setLoading] = useState(false);

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      e.target.value = "";
      return;
    }
    try {
      setLogoUploading(true);
      const uploadUrl = await generateLogoUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await saveLogo({ storageId });
      toast.success("Logo uploaded");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveLogo() {
    try {
      await saveLogo({ storageId: null });
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    }
  }

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
        brandColor,
        brandFont,
        invoiceFooter: invoiceFooter || undefined,
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

      {/* ── Branding Card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Brand & Invoice Style</CardTitle>
          <CardDescription>
            Customize how your invoices look to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Controls */}
            <div className="space-y-5">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="logo preview"
                      className="h-16 w-16 rounded-md border object-contain bg-muted p-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive gap-1.5"
                      onClick={handleRemoveLogo}
                    >
                      <X size={14} />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload size={14} />
                    {logoUploading ? "Uploading…" : "Upload Logo"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG · Max 2MB</p>
              </div>

              {/* Brand color */}
              <div className="space-y-2">
                <Label htmlFor="brandColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="brandColor"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded-md border border-input p-0.5"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#4f46e5"
                    className="w-32 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Font */}
              <div className="space-y-2">
                <Label>Invoice Font</Label>
                <div className="flex gap-2">
                  {FONT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={brandFont === opt.value ? "default" : "outline"}
                      size="sm"
                      style={{ fontFamily: opt.css }}
                      onClick={() => setBrandFont(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Footer text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="invoiceFooter">Footer Text</Label>
                  <span className="text-xs text-muted-foreground">
                    {invoiceFooter.length}/160
                  </span>
                </div>
                <Textarea
                  id="invoiceFooter"
                  value={invoiceFooter}
                  onChange={(e) =>
                    setInvoiceFooter(e.target.value.slice(0, 160))
                  }
                  placeholder="Generated with PayTrack • Thank you for your business"
                  rows={2}
                />
              </div>
            </div>

            {/* Live preview */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Preview
              </p>
              <BrandPreview
                businessName={businessName}
                color={brandColor}
                font={brandFont}
                footer={invoiceFooter}
                logoUrl={logoUrl}
              />
            </div>
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
              You are on the Pro plan. Unlimited invoices and all features enabled.
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
