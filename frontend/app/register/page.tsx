"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
  phone: z.string().min(7, "Phone number is required"),
  role: z.enum(["PROVIDER", "WORKER"], {
    error: "Please select a role",
  }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.register(data);
      toast.success("Account created. Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
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
          <div className="mb-8 text-center">
            <h2 className="mb-1" style={{ color: "var(--color-primary-800)" }}>
              SSFRS
            </h2>
            <p
              style={{
                color: "var(--color-muted-foreground)",
                fontSize: "0.875rem",
              }}
            >
              Create your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--color-neutral-400)" }}
                />
                <input
                  type="text"
                  {...register("fullName")}
                  placeholder="John Doe"
                  className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                  style={{
                    borderColor: errors.fullName
                      ? "#ef4444"
                      : "var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
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
                    borderColor: errors.email
                      ? "#ef4444"
                      : "var(--color-border)",
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

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--color-neutral-400)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-lg border px-3 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 transition"
                  style={{
                    borderColor: errors.password
                      ? "#ef4444"
                      : "var(--color-border)",
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--color-neutral-400)" }}
                />
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                  style={{
                    borderColor: errors.phone
                      ? "#ef4444"
                      : "var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
              {errors.phone && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                I am a
              </label>
              <div className="flex gap-3">
                {(["PROVIDER", "WORKER"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue("role", role)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      backgroundColor:
                        selectedRole === role
                          ? "var(--color-primary)"
                          : "var(--color-background)",
                      color:
                        selectedRole === role
                          ? "#ffffff"
                          : "var(--color-neutral-600)",
                      borderColor:
                        selectedRole === role
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                    }}
                  >
                    {role === "PROVIDER" ? "Project Provider" : "Worker"}
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  {errors.role.message}
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
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}