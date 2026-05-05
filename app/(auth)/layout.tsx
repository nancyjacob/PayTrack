import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoFull } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-4">
      {/* Back to home */}
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft size={15} />
        Home
      </Link>

      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo centred above the card */}
        <div className="flex justify-center">
          <Link href="/">
            <LogoFull markSize={32} textClassName="text-foreground" />
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
