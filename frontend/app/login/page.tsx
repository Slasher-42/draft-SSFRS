
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      authService.saveSession(data);
      router.push(authService.getDashboardRoute(data.role));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Invalid credentials. Please try again.";
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
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
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
      {/* Soft glow behind card */}
      <div
        style={{
          position: "absolute",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(ellipse, rgba(47,129,247,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          margin: "0 16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "40px",
          animation: "fadeUp 0.35s ease both",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
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
              style={{
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.2px",
              }}
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
          Sign in to your account
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "28px",
          }}
        >
          Enter your credentials to access your dashboard
        </p>

        {/* Error message */}
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "6px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
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
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "6px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
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
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-light)")
              }
            />
          </div>

          {/* Submit */}
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Register link */}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          New provider or worker?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Create an account
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