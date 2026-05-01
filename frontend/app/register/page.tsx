
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/authService";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-light)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: "6px",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "PROVIDER" as "PROVIDER" | "WORKER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      setSuccess(
        "Account created successfully! Redirecting to login…"
      );
      setTimeout(() => router.push("/login"), 1800);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        position: "relative",
        overflowX: "hidden",
        padding: "24px 16px",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(47,129,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(47,129,247,0.04) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "28px 32px",
          animation: "fadeUp 0.35s ease both",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              background: "var(--accent)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.5px",
              flexShrink: 0,
            }}
          >
            RS
          </div>
          <div>
            <div
              style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.2px" }}
            >
              RefundSmart
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Platform
            </div>
          </div>
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.4px",
            marginBottom: "6px",
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "20px",
          }}
        >
          Available for Project Providers and Workers only
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "var(--danger-muted)",
              border: "1px solid rgba(248,81,73,0.25)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "var(--danger)",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            style={{
              background: "var(--success-muted)",
              border: "1px solid rgba(63,185,80,0.25)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "var(--success)",
              marginBottom: "20px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>I am a</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              {(["PROVIDER", "WORKER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleChange("role", r)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border:
                      form.role === r
                        ? "1px solid var(--accent-border)"
                        : "1px solid var(--border-light)",
                    background:
                      form.role === r
                        ? "var(--accent-muted)"
                        : "var(--bg-elevated)",
                    color:
                      form.role === r
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: form.role === r ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {r === "PROVIDER" ? "Project Provider" : "Worker"}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              required
              value={form.fullName}
              placeholder="John Doe"
              onChange={(e) => handleChange("fullName", e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              placeholder="you@company.com"
              onChange={(e) => handleChange("email", e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              required
              value={form.phone}
              placeholder="+250 700 000 000"
              onChange={(e) => handleChange("phone", e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              required
              value={form.password}
              placeholder="Min. 6 characters"
              onChange={(e) => handleChange("password", e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              placeholder="Repeat your password"
              onChange={(e) =>
                handleChange("confirmPassword", e.target.value)
              }
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "rgba(47,129,247,0.6)"
                : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "11px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              fontFamily: "inherit",
              letterSpacing: "0.1px",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.background =
                  "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.background =
                  "var(--accent)";
            }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}