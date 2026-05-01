
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import api from "@/lib/api";

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

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "EVALUATOR" as "EVALUATOR" | "REFUND_OFFICE",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/admin/users", form);
      setSuccess(
        `Account created for ${form.fullName}. Credentials sent to ${form.email}.`
      );
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "EVALUATOR",
        phone: "",
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Create Account"
        subtitle="Manually create Evaluator or Refund Office accounts"
        actions={
          <button
            onClick={() => router.push("/dashboard/admin/users")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 13px",
              borderRadius: "7px",
              border: "1px solid var(--border-light)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ← Back to Users
          </button>
        }
      />

      <div style={{ padding: "32px 28px", flex: 1 }}>
        <div style={{ maxWidth: "520px" }}>

          {/* Info banner */}
          <div
            style={{
              background: "var(--accent-muted)",
              border: "1px solid var(--accent-border)",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "var(--info)",
              marginBottom: "28px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ marginTop: "1px", flexShrink: 0 }}
            >
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
            <span>
              Evaluator and Refund Office accounts cannot self-register.
              Only the Admin can create them here. The temporary password
              will be sent to their email.
            </span>
          </div>

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
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Account Role</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {(["EVALUATOR", "REFUND_OFFICE"] as const).map((r) => (
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
                    {r === "EVALUATOR" ? "Evaluator" : "Refund Office"}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + Phone row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  placeholder="Jane Smith"
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
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
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
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                placeholder="staff@platform.com"
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

            <div style={{ marginBottom: "28px" }}>
              <label style={labelStyle}>Temporary Password</label>
              <input
                type="password"
                required
                value={form.password}
                placeholder="Set a temporary password"
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

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "rgba(47,129,247,0.5)"
                  : "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Creating…" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
      <style>{`input::placeholder { color: var(--text-muted); }`}</style>
    </>
  );
}