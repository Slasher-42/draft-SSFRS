"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--color-neutral-50)" }}>
        <div className="rounded-xl border p-8 w-full max-w-md text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Invalid or missing reset token.{" "}
            <a href="/forgot-password" style={{ color: "var(--color-primary)" }}>
              Request a new link
            </a>
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      setDone(true);
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
          {done ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-primary-50, #eff6ff)" }}>
                <CheckCircle className="h-7 w-7" style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-primary-800)" }}>
                Password updated
              </h2>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Your password has been reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--color-primary-800)" }}>
                  Set new password
                </h2>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: "var(--color-neutral-400)" }}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("newPassword")}
                      placeholder="••••••••"
                      className="w-full rounded-lg border px-3 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: errors.newPassword ? "#ef4444" : "var(--color-border)",
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
                  {errors.newPassword && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: "var(--color-neutral-400)" }}
                    />
                    <input
                      type={showConfirm ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full rounded-lg border px-3 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 transition"
                      style={{
                        borderColor: errors.confirmPassword ? "#ef4444" : "var(--color-border)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-foreground)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--color-neutral-400)" }}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>
                      {errors.confirmPassword.message}
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
                      Updating…
                    </span>
                  ) : (
                    "Reset Password"
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
