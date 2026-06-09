"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { CUSTOMER_SESSION_KEY } from "@/components/AuthGuard";
import { setPortalSession, clearPortalSession } from "@/lib/portal-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const currentProfile = useQuery(api.users.getMyProfile);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSignIn(values: FormValues) {
    // Determine whether this is a user-switch or a same-user re-authentication.
    // Only sign out + wipe the OTHER portal's flag when switching users,
    // so an active admin session is preserved when the same user authenticates.
    const currentEmail = currentProfile?.email?.toLowerCase();
    const newEmail = values.email.toLowerCase();
    const isSwitchingUsers =
      isAuthenticated && !!currentEmail && currentEmail !== newEmail;

    clearPortalSession();
    localStorage.removeItem(CUSTOMER_SESSION_KEY);

    if (isSwitchingUsers) {
      // User switch: must terminate the existing session and clear all portal flags.
      localStorage.removeItem("adminSession");
      await signOut();
    }

    try {
      await signIn("password", {
        email: values.email,
        password: values.password,
        flow: "signIn",
      });
      setPortalSession("user");
      localStorage.setItem(CUSTOMER_SESSION_KEY, "1");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[sign-in]", err);
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg.includes("Invalid") || msg.includes("credentials") || msg.includes("password")
        ? "Invalid email or password"
        : msg);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your PayTrack account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
