import Link from "next/link";
import {
  FileText,
  CreditCard,
  MessageCircle,
  BarChart2,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoFull } from "@/components/logo";

/* ─── Dot-grid overlay used in multiple sections ─── */
function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(0.491 0.27 292.581 / 0.18) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

/* ─── Subtle grid-lines overlay ─── */
function GridLines({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(oklch(0.491 0.27 292.581 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(0.491 0.27 292.581 / 0.06) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

/* ─── Mock invoice card shown in hero ─── */
function InvoiceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:mx-0">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-3xl opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.491 0.27 292.581), transparent 70%)",
        }}
      />

      {/* Card */}
      <div className="rounded-2xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <LogoFull markSize={24} textClassName="text-primary" />
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Pending
          </span>
        </div>
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400">Invoice #PT-0042</p>
          <p className="mt-0.5 text-base font-semibold text-gray-900">Acme Corp Ltd</p>
          <p className="text-xs text-gray-400">Due: 15 Jun 2025</p>
        </div>
        <div className="space-y-2 px-5 py-4">
          {[
            { name: "Web Design Package", amount: "₦150,000" },
            { name: "Logo & Brand Identity", amount: "₦50,000" },
            { name: "SEO Setup", amount: "₦30,000" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{item.name}</span>
              <span className="font-medium text-gray-800">{item.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="font-heading text-lg font-bold text-primary">₦230,000</span>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white">
            <CreditCard size={14} />
            Pay Now via Paystack
          </div>
        </div>
      </div>

      {/* Floating: payment received */}
      <div className="absolute -bottom-5 -left-6 flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={15} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Payment received!</p>
          <p className="text-xs text-gray-400">₦230,000 · just now</p>
        </div>
      </div>

      {/* Floating: WhatsApp reminder */}
      <div className="absolute -right-5 -top-5 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-xl">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-500">
          <MessageCircle size={12} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Reminder sent</p>
          <p className="text-xs text-gray-400">via WhatsApp</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Revenue SVG bar chart ─── */
function RevenueChartGraphic() {
  const bars = [40, 65, 50, 80, 60, 95, 75, 110, 90, 130, 100, 150];
  const max = Math.max(...bars);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Total Revenue</p>
          <p className="font-heading text-xl font-bold text-white">₦2,340,000</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-green-400/20 px-2.5 py-1 text-xs font-semibold text-green-400">
          <TrendingUp size={11} />
          +24%
        </div>
      </div>
      <svg viewBox="0 0 240 80" className="w-full" preserveAspectRatio="none">
        {bars.map((h, i) => {
          const barH = (h / max) * 64;
          const x = i * 20 + 2;
          return (
            <rect
              key={i}
              x={x}
              y={80 - barH}
              width={14}
              height={barH}
              rx={3}
              fill={
                i === bars.length - 1
                  ? "oklch(0.606 0.25 292.717)"
                  : "oklch(0.606 0.25 292.717 / 0.3)"
              }
            />
          );
        })}
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <span>Jan</span>
        <span>Apr</span>
        <span>Aug</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

/* ─── Dark-theme dashboard preview ─── */
function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Paid", value: "₦1.2M", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
          { label: "Outstanding", value: "₦480K", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
          { label: "Overdue", value: "₦120K", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border ${bg} p-3 text-center`}>
            <p className={`font-heading text-sm font-bold ${color}`}>{value}</p>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>
      <RevenueChartGraphic />
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Recent invoices
        </p>
        <div className="space-y-2.5">
          {[
            { client: "Zenith Bank Ltd", amount: "₦480,000", status: "Paid", sc: "text-green-400 bg-green-400/10" },
            { client: "Konga Online Shop", amount: "₦230,000", status: "Pending", sc: "text-amber-400 bg-amber-400/10" },
            { client: "Flutterwave Inc.", amount: "₦150,000", status: "Overdue", sc: "text-red-400 bg-red-400/10" },
          ].map(({ client, amount, status, sc }) => (
            <div key={client} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/30 text-xs font-bold text-primary-foreground">
                  {client[0]}
                </div>
                <p className="text-xs font-medium text-white/80">{client}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/70">{amount}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <LogoFull markSize={32} textClassName="text-foreground" />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get started free</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════
          HERO  —  lavender gradient + dot grid
      ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.96 0.03 290) 0%, oklch(0.92 0.055 292) 50%, oklch(0.88 0.07 295) 100%)",
        }}
      >
        <DotGrid className="-z-0 opacity-60" />

        {/* Large radial glow centre */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-25 blur-3xl"
          style={{ background: "oklch(0.491 0.27 292.581)" }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          {/* Copy */}
          <div>
            <Badge className="mb-5 gap-1.5 border border-primary/20 bg-white/60 px-3 py-1 text-xs text-primary backdrop-blur-sm">
              <Zap size={11} />
              Built for Nigerian freelancers &amp; SMEs
            </Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]">
              Send invoices.{" "}
              <span className="text-primary">Get paid in Naira.</span>
              <br />
              Stop chasing clients.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Create professional invoices in seconds, collect payment via
              Paystack, and send automatic WhatsApp reminders — all from one
              dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="min-w-44 shadow-lg shadow-primary/30" asChild>
                <Link href="/sign-up">
                  Start for free <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-44 border-white/60 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                asChild
              >
                <Link href="/sign-in">Sign in to dashboard</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Free forever for up to 5 invoices · No credit card required
            </p>
          </div>

          {/* Invoice mockup */}
          <div className="flex justify-center lg:justify-end">
            <InvoiceMockup />
          </div>
        </div>

        {/* Bottom fade into white */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: "linear-gradient(to bottom, transparent, white)",
          }}
        />
      </section>

      {/* ════════════════════════════════════════
          STATS STRIP  —  clean white
      ════════════════════════════════════════ */}
      <div className="border-y border-border/60 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border/60 px-4 py-8 sm:px-6">
          {[
            { icon: FileText, value: "10,000+", label: "Invoices sent" },
            { icon: TrendingUp, value: "₦2.4B+", label: "Payments processed" },
            { icon: Users, value: "2,000+", label: "Businesses on PayTrack" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-4 text-center">
              <Icon size={18} className="mb-1 text-primary" />
              <p className="font-heading text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURES  —  white + subtle grid lines
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-20">
        <GridLines />
        {/* Faint top gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.97 0.01 290 / 0.6) 0%, transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">
              Everything you need to get paid
            </h2>
            <p className="mt-3 text-muted-foreground">One tool, zero spreadsheets.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Professional Invoices",
                desc: "Generate branded PDF invoices with your business name and itemised line items in seconds.",
                gradient: "from-violet-500/10 to-purple-500/5",
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
              },
              {
                icon: CreditCard,
                title: "Paystack Payments",
                desc: "One-click pay link in every invoice. Card, bank transfer, or USSD — you get credited instantly.",
                gradient: "from-blue-500/10 to-cyan-500/5",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp Reminders",
                desc: "Automated nudges delivered to your client's WhatsApp. No more awkward follow-up calls.",
                gradient: "from-green-500/10 to-emerald-500/5",
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
              },
              {
                icon: BarChart2,
                title: "Revenue Dashboard",
                desc: "Track outstanding, paid, and overdue invoices at a glance with charts that update in real time.",
                gradient: "from-orange-500/10 to-amber-500/5",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
              },
            ].map(({ icon: Icon, title, desc, gradient, iconBg, iconColor }) => (
              <div
                key={title}
                className={`rounded-xl border border-border bg-gradient-to-br ${gradient} p-6 shadow-sm`}
              >
                <div className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <h3 className="font-heading mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          DASHBOARD PREVIEW  —  DARK section
      ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.04 290) 0%, oklch(0.17 0.06 295) 50%, oklch(0.13 0.04 290) 100%)",
        }}
      >
        {/* Dot grid on dark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.491 0.27 292.581 / 0.25) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.541 0.281 293.009)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.606 0.25 292.717)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy — light text on dark */}
            <div>
              <Badge className="mb-4 border-white/10 bg-white/10 text-xs text-white/80">
                Live dashboard
              </Badge>
              <h2 className="font-heading text-3xl font-bold text-white">
                Your entire business,
                <br />
                one screen.
              </h2>
              <p className="mt-4 text-white/60">
                See exactly where your money is — paid, outstanding, and overdue
                — with real-time charts and an invoice table that never needs
                refreshing.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Revenue trend chart with monthly breakdown",
                  "Instant status updates when clients pay",
                  "One-click PDF download for any invoice",
                  "Client history and total spend at a glance",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle size={15} className="mt-0.5 shrink-0 text-primary" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/sign-up">
                  Try it free <ArrowRight size={15} className="ml-1" />
                </Link>
              </Button>
            </div>

            {/* Dashboard graphic */}
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS  —  light lavender tint
      ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.97 0.015 290) 0%, oklch(0.99 0.005 290) 100%)",
        }}
      >
        <GridLines className="opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-muted-foreground">From zero to paid in three steps.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Add your client",
                desc: "Enter the client's name, email, and phone number once. PayTrack saves them for every future invoice.",
              },
              {
                icon: FileText,
                title: "Create an invoice",
                desc: "Add line items, set a due date, and hit send. A branded PDF and a secure pay link are generated instantly.",
              },
              {
                icon: CreditCard,
                title: "Collect payment",
                desc: "Your client pays via Paystack. You're notified immediately and the invoice is marked paid in your dashboard.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative flex flex-col items-start">
                {i < 2 && (
                  <div className="absolute left-[calc(50%+2rem)] top-6 hidden h-0.5 w-[calc(100%-4rem)] bg-border sm:block" />
                )}
                <div className="relative mb-4 flex size-12 items-center justify-center rounded-2xl border-2 border-primary/20 bg-white shadow-sm">
                  <Icon size={20} className="text-primary" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-heading mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PRICING  —  white with faint gradient
      ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          background:
            "linear-gradient(180deg, white 0%, oklch(0.96 0.025 290) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.491 0.27 292.581 / 0.08) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you grow.</p>
          </div>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
              <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Free
              </p>
              <p className="font-heading mt-2 text-4xl font-bold">₦0</p>
              <p className="mt-1 text-sm text-muted-foreground">Forever</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Up to 5 invoices",
                  "PDF invoice generation",
                  "Paystack payment links",
                  "Client management",
                  "Basic dashboard",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle size={15} className="shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant="outline" asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-white p-8 shadow-lg shadow-primary/10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  background:
                    "radial-gradient(ellipse at 80% 0%, oklch(0.491 0.27 292.581), transparent 60%)",
                }}
              />
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs">
                Most popular
              </Badge>
              <p className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Pro
              </p>
              <p className="font-heading mt-2 text-4xl font-bold">₦5,000</p>
              <p className="mt-1 text-sm text-muted-foreground">per month</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Unlimited invoices",
                  "WhatsApp payment reminders",
                  "Email notifications via Resend",
                  "Revenue analytics & charts",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle size={15} className="shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link href="/sign-up">Start free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA  —  vivid deep-purple gradient
      ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-28"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.08 295) 0%, oklch(0.28 0.15 292) 40%, oklch(0.20 0.10 285) 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(1 0 0 / 0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/4 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "oklch(0.541 0.281 293.009)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.432 0.232 292.759)" }}
        />

        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <Clock size={28} className="text-white" />
            </div>
          </div>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Ready to get paid faster?
          </h2>
          <p className="mt-4 text-white/60">
            Join thousands of Nigerian freelancers and small businesses already
            using PayTrack to manage their invoices and get paid on time.
          </p>
          <Button
            size="lg"
            className="mt-8 min-w-48 bg-white font-semibold text-primary shadow-xl hover:bg-white/90"
            asChild
          >
            <Link href="/sign-up">
              Create your free account <ArrowRight size={16} className="ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER  —  dark (continues from CTA)
      ════════════════════════════════════════ */}
      <footer
        style={{
          background: "oklch(0.12 0.03 290)",
        }}
        className="py-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm sm:flex-row sm:px-6">
          <LogoFull markSize={28} textClassName="text-white" />
          <p className="text-white/40">
            © {new Date().getFullYear()} PayTrack. Built for Nigerian businesses.
          </p>
          <div className="flex gap-4 text-white/50">
            <Link href="/sign-in" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/sign-up" className="transition-colors hover:text-white">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
