"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate, AccessDenied } from "@/components/admin/PermissionGate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Globe,
  CreditCard,
  Settings,
  RotateCcw,
  Save,
  Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

type SystemSetting = {
  _id: string;
  key: string;
  value: string;
  label: string;
  description?: string;
  category: string;
  inputType: "text" | "number" | "select" | "toggle";
  options?: string[];
  updatedAt: number;
};

// ── Setting Field ─────────────────────────────────────────────────────────

function SettingField({
  setting,
  value,
  onChange,
  readOnly,
}: {
  setting: SystemSetting;
  value: string;
  onChange: (val: string) => void;
  readOnly: boolean;
}) {
  if (setting.inputType === "select" && setting.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {setting.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (setting.inputType === "toggle") {
    const checked = value === "true";
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={readOnly}
          onClick={() => onChange(checked ? "false" : "true")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-muted-foreground">
          {checked ? "Enabled" : "Disabled"}
        </span>
      </div>
    );
  }

  return (
    <Input
      type={setting.inputType === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={readOnly}
      className="max-w-sm"
    />
  );
}

// ── Settings Category Section ──────────────────────────────────────────────

function SettingsSection({
  settings,
  category,
  title,
  description,
  icon: Icon,
  canEdit,
}: {
  settings: SystemSetting[];
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  canEdit: boolean;
}) {
  const updateSetting = useMutation(api.settings.updateSetting);

  // Local draft keyed by setting key
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Sync draft from server
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const s of settings) init[s.key] = s.value;
    setDraft(init);
    setDirty(new Set());
  }, [settings]);

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const key of dirty) {
        await updateSetting({ key, value: draft[key] });
      }
      toast.success(`${title} settings saved`);
      setDirty(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const filteredSettings = settings.filter((s) => s.category === category);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {filteredSettings.map((setting, i) => (
          <div key={setting.key}>
            {i > 0 && <Separator className="mb-5" />}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{setting.label}</Label>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                  {setting.key}
                </Badge>
                {dirty.has(setting.key) && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    unsaved
                  </Badge>
                )}
              </div>

              {setting.description && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info size={11} className="shrink-0 mt-0.5" />
                  {setting.description}
                </p>
              )}

              <SettingField
                setting={setting}
                value={draft[setting.key] ?? setting.value}
                onChange={(val) => handleChange(setting.key, val)}
                readOnly={!canEdit}
              />

              <p className="text-[11px] text-muted-foreground/60">
                Last updated:{" "}
                {new Date(setting.updatedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {canEdit && dirty.size > 0 && (
          <div className="pt-2 border-t">
            <Button size="sm" className="gap-2" disabled={saving} onClick={handleSave}>
              <Save size={13} />
              {saving ? "Saving…" : `Save ${dirty.size} change${dirty.size > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { can, isSuperAdmin, isLoading } = usePermissions();
  const allSettings = useQuery(api.settings.getAllSettings);
  const initSettings = useMutation(api.settings.initSystemSettings);
  const resetAll = useMutation(api.settings.resetAllSettings);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  if (isLoading) return null;
  if (!can("settings", "view")) return <AccessDenied />;

  const canEdit = isSuperAdmin || can("settings", "edit");

  const flatSettings = Object.values(allSettings ?? {}).flat() as SystemSetting[];

  const categories = [
    {
      id: "regional",
      label: "Regional",
      title: "Regional Settings",
      description: "Country, currency, timezone and date formatting preferences.",
      icon: Globe,
    },
    {
      id: "billing",
      label: "Billing",
      title: "Billing Configuration",
      description: "Platform fees, free slot allowances, and billing thresholds.",
      icon: CreditCard,
    },
    {
      id: "platform",
      label: "Platform",
      title: "Platform Settings",
      description: "App name, support email, invoice defaults, and notifications.",
      icon: Settings,
    },
  ];

  async function handleResetAll() {
    if (
      !confirm(
        "Reset ALL system settings to factory defaults? This cannot be undone."
      )
    )
      return;
    try {
      await resetAll();
      toast.success("All settings reset to defaults");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            System Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage platform-level settings, regional preferences, and billing
            configuration.
          </p>
        </div>

        <PermissionGate resource="settings" action="delete">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
            onClick={handleResetAll}
          >
            <RotateCcw size={13} />
            Reset All to Defaults
          </Button>
        </PermissionGate>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info size={14} className="shrink-0" />
          You have read-only access to system settings. Contact a Super Admin to
          make changes.
        </div>
      )}

      <Tabs defaultValue="regional">
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
              <cat.icon size={13} />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <SettingsSection
              settings={flatSettings}
              category={cat.id}
              title={cat.title}
              description={cat.description}
              icon={cat.icon}
              canEdit={canEdit}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
