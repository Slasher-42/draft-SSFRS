"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/authService";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res.requiresOtp) {
        setPendingEmail(data.email);
        setStep("otp");
        toast.info("A verification code has been sent to your email.");
      } else {
        authService.saveSession(res);
        toast.success("Welcome back, " + res.fullName);
        router.push(authService.getDashboardPath(res.role));
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid email or password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setLoading(true);
    try {
      const res = await authService.verifyOtp(pendingEmail, data.otp);
      authService.saveSession(res);
      toast.success("Welcome back, " + res.fullName);
      router.push(authService.getDashboardPath(res.role));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid or expired code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-xl border p-8"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <AnimatePresence mode="wait">
            {step === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <h2 className="mb-1" style={{ color: "var(--color-primary-800)" }}>
                    SSFRS
                  </h2>
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "var(--color-neutral-400)" }}
                      />
                      <input
                        type="email"
                        {...loginForm.register("email")}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                        style={{
                          borderColor: loginForm.formState.errors.email ? "#ef4444" : "var(--color-border)",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-foreground)",
                        }}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                        Password
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-xs"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "var(--color-neutral-400)" }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...loginForm.register("password")}
                        placeholder="••••••••"
                        className="w-full rounded-lg border px-3 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 transition"
                        style={{
                          borderColor: loginForm.formState.errors.password ? "#ef4444" : "var(--color-border)",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-foreground)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--color-neutral-400)" }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="font-medium" style={{ color: "var(--color-primary)" }}>
                    Register
                  </a>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--color-primary-50, #eff6ff)" }}>
                    <ShieldCheck className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <h2 className="mb-1 text-xl font-semibold" style={{ color: "var(--color-primary-800)" }}>
                    Verify your identity
                  </h2>
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>
                    We sent a 6-digit code to
                  </p>
                  <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {pendingEmail}
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      {...otpForm.register("otp")}
                      placeholder="123456"
                      className="w-full rounded-lg border px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: otpForm.formState.errors.otp ? "#ef4444" : "var(--color-border)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-foreground)",
                      }}
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Wrong account?{" "}
                  <button
                    type="button"
                    onClick={() => setStep("login")}
                    className="font-medium"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Go back
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
