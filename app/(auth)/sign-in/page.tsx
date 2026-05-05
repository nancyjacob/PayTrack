"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const otpEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const otpCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

type PasswordValues = z.infer<typeof passwordSchema>;
type OtpEmailValues = z.infer<typeof otpEmailSchema>;
type OtpCodeValues = z.infer<typeof otpCodeSchema>;

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [otpEmail, setOtpEmail] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [showPassword, setShowPassword] = useState(false);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  const otpEmailForm = useForm<OtpEmailValues>({
    resolver: zodResolver(otpEmailSchema),
    defaultValues: { email: "" },
  });

  const otpCodeForm = useForm<OtpCodeValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: "" },
  });

  async function handlePasswordSignIn(values: PasswordValues) {
    try {
      await signIn("password", {
        email: values.email,
        password: values.password,
        flow: "signIn",
      });
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  }

  async function handleOtpSend(values: OtpEmailValues) {
    try {
      await signIn("email", { email: values.email });
      setOtpEmail(values.email);
      setOtpStep("code");
      toast.success("Check your email for a 6-digit code");
    } catch {
      toast.error("Failed to send code. Check your email address.");
    }
  }

  async function handleOtpVerify(values: OtpCodeValues) {
    try {
      await signIn("email", { email: otpEmail, code: values.code });
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid or expired code");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your PayTrack account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="password" className="flex-1">
              Password
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex-1">
              Magic Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordSignIn)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
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
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting
                    ? "Signing in…"
                    : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="otp">
            {otpStep === "email" ? (
              <Form {...otpEmailForm}>
                <form
                  onSubmit={otpEmailForm.handleSubmit(handleOtpSend)}
                  className="space-y-4"
                >
                  <FormField
                    control={otpEmailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={otpEmailForm.formState.isSubmitting}
                  >
                    {otpEmailForm.formState.isSubmitting
                      ? "Sending…"
                      : "Send Code"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...otpCodeForm}>
                <form
                  onSubmit={otpCodeForm.handleSubmit(handleOtpVerify)}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to{" "}
                    <strong>{otpEmail}</strong>
                  </p>
                  <FormField
                    control={otpCodeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={otpCodeForm.formState.isSubmitting}
                  >
                    {otpCodeForm.formState.isSubmitting
                      ? "Verifying…"
                      : "Verify Code"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setOtpStep("email");
                      otpCodeForm.reset();
                    }}
                  >
                    ← Back
                  </Button>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>

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
