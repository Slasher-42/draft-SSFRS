"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Something went wrong. Please try again.";
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-primary-50, #eff6ff)" }}>
                <CheckCircle className="h-7 w-7" style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-primary-800)" }}>
                Check your email
              </h2>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                We sent a password reset link to
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                {submittedEmail}
              </p>
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                The link expires in 30 minutes. Check your spam folder if you don&apos;t see it.
              </p>
              <a
                href="/login"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm mb-6"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </a>
                <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--color-primary-800)" }}>
                  Forgot password?
                </h2>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      {...register("email")}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: errors.email ? "#ef4444" : "var(--color-border)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-foreground)",
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>
                      {errors.email.message}
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
                      Sending…
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
