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
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoFull } from "@/components/logo";

/* ─── Browser-chrome product frame shown at bottom of hero ─── */
function ProductFrame() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
      {/* Purple glow sitting behind the frame */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-56 w-3/4 rounded-full opacity-50 blur-3xl"
        style={{ background: "oklch(0.491 0.27 292.581)" }}
      />

      {/* Browser chrome */}
      <div
        className="relative overflow-hidden rounded-t-2xl border border-white/10 shadow-2xl"
        style={{ background: "oklch(0.13 0.04 290)" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center gap-3 border-b border-white/10 px-4 py-3"
          style={{ background: "oklch(0.11 0.03 290)" }}
        >
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-white/15" />
            <div className="size-2.5 rounded-full bg-white/15" />
            <div className="size-2.5 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/30">
            <span
              className="size-1.5 rounded-full"
              style={{ background: "oklch(0.606 0.25 292.717)" }}
            />
            paytrack.app/dashboard
          </div>
          <div className="w-16" />
        </div>

        {/* App content — DashboardPreview already dark-themed */}
        <div className="p-5">
          <DashboardPreview />
        </div>
      </div>
    </div>
  );
}

/* ─── Invoice mockup card ─── */
function InvoiceMockup() {
  return (
    <div className="relative w-full max-w-[340px]">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <LogoFull markSize={22} textClassName="text-primary" />
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-200">
            Pending
          </span>
        </div>

        {/* Client info */}
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Invoice #PT-0042
          </p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            Acme Corp Ltd
          </p>
          <p className="text-xs text-gray-400">Due: 15 Jun 2025</p>
        </div>

        {/* Line items */}
        <div className="space-y-2 px-5 py-4">
          {[
            { name: "Web Design Package", amount: "₦150,000" },
            { name: "Logo & Brand Identity", amount: "₦50,000" },
            { name: "SEO Setup", amount: "₦30,000" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-500">{item.name}</span>
              <span className="font-medium tabular-nums text-gray-800">
                {item.amount}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="font-heading text-lg font-bold text-primary">
              ₦230,000
            </span>
          </div>
        </div>

        {/* Pay button */}
        <div className="px-5 pb-5">
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white">
            <CreditCard size={14} />
            Pay Now via Paystack
          </div>
        </div>
      </div>

      {/* Floating chip — payment confirmed */}
      <div className="absolute -bottom-4 -left-8 flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-lg">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={13} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">
            Payment received!
          </p>
          <p className="text-[11px] text-gray-400">₦230,000 · just now</p>
        </div>
      </div>

      {/* Floating chip — WhatsApp reminder */}
      <div className="absolute -right-8 -top-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-500">
          <MessageCircle size={12} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Reminder sent</p>
          <p className="text-[11px] text-gray-400">via WhatsApp</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Revenue bar chart (used in dark dashboard section) ─── */
function RevenueChart() {
  const bars = [40, 65, 50, 80, 60, 95, 75, 110, 90, 130, 100, 150];
  const max = Math.max(...bars);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Total Revenue</p>
          <p className="font-heading text-xl font-bold text-white">
            ₦2,340,000
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-green-400/15 px-3 py-1 text-xs font-semibold text-green-400">
          <TrendingUp size={11} />
          +24%
        </div>
      </div>
      <svg viewBox="0 0 240 80" className="w-full" preserveAspectRatio="none">
        {bars.map((h, i) => {
          const barH = (h / max) * 64;
          return (
            <rect
              key={i}
              x={i * 20 + 2}
              y={80 - barH}
              width={14}
              height={barH}
              rx={3}
              fill={
                i === bars.length - 1
                  ? "oklch(0.606 0.25 292.717)"
                  : "oklch(0.606 0.25 292.717 / 0.28)"
              }
            />
          );
        })}
      </svg>
      <div className="mt-3 flex justify-between text-[11px] text-white/35">
        <span>Jan</span>
        <span>Apr</span>
        <span>Aug</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

/* ─── Dashboard UI preview (dark section) ─── */
function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Paid", value: "₦1.2M", color: "text-green-400", ring: "ring-green-400/20 bg-green-400/8" },
          { label: "Outstanding", value: "₦480K", color: "text-amber-400", ring: "ring-amber-400/20 bg-amber-400/8" },
          { label: "Overdue", value: "₦120K", color: "text-red-400", ring: "ring-red-400/20 bg-red-400/8" },
        ].map(({ label, value, color, ring }) => (
          <div key={label} className={`rounded-xl p-3 text-center ring-1 ${ring}`}>
            <p className={`font-heading text-sm font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[11px] text-white/45">{label}</p>
          </div>
        ))}
      </div>

      <RevenueChart />

      <div className="rounded-xl border border-white/8 bg-white/5 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
          Recent invoices
        </p>
        <div className="space-y-3">
          {[
            { client: "Zenith Bank Ltd", amount: "₦480,000", status: "Paid", sc: "text-green-400 bg-green-400/10" },
            { client: "Konga Online Shop", amount: "₦230,000", status: "Pending", sc: "text-amber-400 bg-amber-400/10" },
            { client: "Flutterwave Inc.", amount: "₦150,000", status: "Overdue", sc: "text-red-400 bg-red-400/10" },
          ].map(({ client, amount, status, sc }) => (
            <div key={client} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                  {client[0]}
                </div>
                <p className="text-xs font-medium text-white/75">{client}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-white/60">
                  {amount}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sc}`}>
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
    <div className="min-h-screen bg-white text-foreground antialiased">

      {/* ── Nav — white, sits on the light hero ─── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <LogoFull markSize={28} textClassName="text-foreground" />
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" className="ml-1 rounded-full" asChild>
              <Link href="#pricing">Get started free</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero — original lavender gradient, tight vertical rhythm ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(168deg, oklch(0.99 0.005 290) 0%, oklch(0.97 0.015 292) 55%, oklch(0.95 0.025 294) 100%)",
        }}
      >
        {/* Dot texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.491 0.27 292.581 / 0.06) 1.5px, transparent 1.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Copy block — tight top padding so everything sits above the fold */}
        <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-8 text-center sm:px-6 sm:pt-10">
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
            <Zap size={10} className="shrink-0" />
            Built for Nigerian freelancers &amp; SMEs
          </div>

          {/* Headline — two clean lines */}
          <h1 className="font-heading text-[36px] font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[52px]">
            Get Paid Faster
            <br />
            <span className="whitespace-nowrap text-primary">Smart Tracking. Zero Hassle.</span>
          </h1>

          {/* Sub-headline — two lines, tight */}
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-500 sm:text-[17px]">
            Send branded invoices, collect payments via Paystack,
            <br className="hidden sm:block" />
            and automate WhatsApp reminders — all in one place.
          </p>

          {/* CTAs — pill-shaped */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-gray-300/70 bg-white/60 text-gray-700 backdrop-blur-sm hover:bg-white/90 sm:w-auto"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              size="lg"
              className="w-full rounded-full shadow-md shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto sm:min-w-44"
              asChild
            >
              <Link href="#pricing">Get started free</Link>
            </Button>
          </div>

          {/* Trust micro-copy */}
          <p className="mt-4 text-xs text-gray-400">
            Free for up to 5 invoices · No credit card required
          </p>
        </div>

        {/* Product frame — clipped so only top portion shows, fitting the viewport */}
        <div className="relative mx-auto max-w-4xl overflow-hidden px-4 sm:px-6" style={{ maxHeight: "260px" }}>
          <ProductFrame />
        </div>

        {/* Fade bottom edge into the white stats strip */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10"
          style={{ background: "linear-gradient(to bottom, transparent, white 90%)" }}
        />
      </section>

      {/* ── Stats strip ─────────────────────────────────── */}
      <div className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-gray-100 px-4 py-8 sm:px-6">
          {[
            { icon: FileText, value: "10,000+", label: "Invoices sent" },
            { icon: TrendingUp, value: "₦2.4B+", label: "Payments processed" },
            { icon: Users, value: "2,000+", label: "Businesses on PayTrack" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-4 text-center">
              <Icon size={16} className="mb-1.5 text-primary" />
              <p className="font-heading text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product showcase ─────────────────────────────── */}
      {/*
        This is the invoice mockup's home. Editorial split-layout:
        UI on the left, copy on the right. White background, no texture,
        no overlays — the card does the visual work.
      */}
      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Mockup in a neutral container with room for the floating chips */}
            <div className="flex items-center justify-center rounded-3xl bg-gray-50 px-16 py-20 ring-1 ring-gray-900/5">
              <InvoiceMockup />
            </div>

            {/* Copy */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                Invoicing
              </p>
              <h2 className="font-heading mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-gray-900">
                Send a professional invoice in under 60 seconds.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-gray-500">
                Add your client once and PayTrack remembers them. Itemise your
                services, set a due date, and hit send — a PDF and a Paystack
                pay link go out immediately.
              </p>

              <ul className="mt-9 space-y-5">
                {[
                  {
                    icon: FileText,
                    title: "Branded PDF invoice",
                    desc: "Your business name and itemised services, formatted and ready to download.",
                  },
                  {
                    icon: CreditCard,
                    title: "Instant payment link",
                    desc: "Clients pay by card, bank transfer, or USSD — no account needed on their end.",
                  },
                  {
                    icon: MessageCircle,
                    title: "Automatic WhatsApp reminders",
                    desc: "Polite nudges go out before and after the due date so you don't have to chase.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-4">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    Create your first invoice{" "}
                    <ArrowRight size={15} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              Everything you need to get paid
            </h2>
            <p className="mt-3 text-gray-500">
              One tool that handles the full payment cycle — from invoice to
              bank account.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Professional Invoices",
                desc: "Branded PDFs with line items, your business name, and a secure pay link — generated instantly.",
                iconBg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
              {
                icon: CreditCard,
                title: "Paystack Payments",
                desc: "Card, bank transfer, or USSD. Clients pay in one click and you're notified the moment funds land.",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp Reminders",
                desc: "Automated nudges sent directly to your client's WhatsApp — before and after the due date.",
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                icon: BarChart2,
                title: "Revenue Dashboard",
                desc: "Paid, outstanding, and overdue — tracked in real time with charts that update as money moves.",
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
              },
            ].map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className={`inline-flex size-10 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview (dark) ─────────────────────── */}
      <section
        className="py-24 lg:py-32"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.12 0.04 288) 0%, oklch(0.16 0.07 294) 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                Analytics
              </p>
              <h2 className="font-heading mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-white">
                Your entire business,
                <br />
                one screen.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/55">
                See exactly where your money is — paid, outstanding, and overdue
                — with real-time charts and an invoice table that never needs
                refreshing.
              </p>
              <ul className="mt-8 space-y-3.5 text-sm">
                {[
                  "Revenue trend chart with monthly breakdown",
                  "Instant status updates when clients pay",
                  "One-click PDF download for any invoice",
                  "Client history and total spend at a glance",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle size={15} className="mt-0.5 shrink-0 text-primary" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-10 bg-white text-gray-900 hover:bg-white/90"
                asChild
              >
                <Link href="/sign-up">
                  Try it free <ArrowRight size={15} className="ml-1.5" />
                </Link>
              </Button>
            </div>

            {/* Dashboard graphic */}
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              How it works
            </h2>
            <p className="mt-3 text-gray-500">From zero to paid in three steps.</p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-0">
            {[
              {
                icon: Users,
                step: "01",
                title: "Add your client",
                desc: "Enter a name, email, and phone number once. PayTrack remembers them for every future invoice.",
              },
              {
                icon: FileText,
                step: "02",
                title: "Create an invoice",
                desc: "Add line items, set a due date, and hit send. A branded PDF and pay link go out instantly.",
              },
              {
                icon: CreditCard,
                step: "03",
                title: "Collect payment",
                desc: "Your client pays via Paystack. You're notified the moment it lands and the invoice marks itself paid.",
              },
            ].map(({ icon: Icon, step, title, desc }, i) => (
              <>
                <div
                  key={title}
                  className="flex flex-1 flex-col items-center px-6 text-center"
                >
                  {/* Step circle */}
                  <div className="relative mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
                    <Icon size={22} className="text-primary" />
                    <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-300">
                    {step}
                  </p>
                  <h3 className="font-heading mb-2 font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>

                {/* Connector — perfectly centred on icon (mt = half of icon height 56px / 2 = 28px) */}
                {i < 2 && (
                  <div
                    className="hidden shrink-0 items-start sm:flex"
                    style={{ marginTop: "28px" }}
                  >
                    <div className="w-8 border-t border-dashed border-gray-300" />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-gray-500">Start free. Upgrade when you grow.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free tier */}
            <div className="flex flex-col rounded-2xl bg-white p-8 ring-1 ring-gray-200">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                Free
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-heading text-2xl font-black tracking-tight text-gray-900">
                  ₦0
                </span>
                <span className="mb-1.5 text-sm text-gray-400">/ forever</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {[
                  "Up to 5 invoices",
                  "PDF invoice generation",
                  "Paystack payment links",
                  "Client management",
                  "Basic dashboard",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-gray-600">
                    <CheckCircle size={14} className="shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full" asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            {/* Pro tier */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary bg-white p-8 shadow-lg shadow-primary/10">
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
              <p className="font-heading mt-2 text-4xl font-bold text-gray-950">₦5,000</p>
              <p className="mt-1 text-sm text-muted-foreground">per month</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {[
                  "Unlimited invoices",
                  "WhatsApp payment reminders",
                  "Email notifications via Resend",
                  "Revenue analytics & charts",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-900">
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

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section
        className="py-28"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.18 0.08 295) 0%, oklch(0.26 0.14 292) 50%, oklch(0.19 0.09 287) 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Clock size={26} className="text-white" />
          </div>
          <h2 className="font-heading text-3xl font-black tracking-tight text-white">
            Ready to get paid faster?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-white/55">
            Join thousands of Nigerian freelancers and businesses already using
            PayTrack to manage invoices and get paid on time.
          </p>
          <Button
            size="lg"
            className="mt-10 bg-white px-8 font-semibold text-primary shadow-xl transition-transform hover:scale-[1.02] hover:bg-white/95 active:scale-[0.99]"
            asChild
          >
            <Link href="/sign-up">
              Create your free account{" "}
              <ArrowRight size={16} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: "oklch(0.10 0.03 290)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <LogoFull markSize={28} textClassName="text-white" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
                Invoice, collect, and track payments — built for Nigerian
                freelancers and small businesses.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Features", href: "#" },
                  { label: "Pricing", href: "#" },
                  { label: "How it works", href: "#" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
                Account
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Sign in", href: "/sign-in" },
                  { label: "Sign up free", href: "/sign-up" },
                  { label: "Reset password", href: "/sign-in" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Cookie Policy", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 py-6 text-xs text-white/25 sm:flex-row">
            <p>© {new Date().getFullYear()} PayTrack. Built for Nigerian businesses.</p>
            <p>Made with in Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
