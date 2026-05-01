
"use client";

import Header from "@/components/Header";

const stats = [
  { label: "Total Users",        value: "—", sub: "Registered accounts",  color: "var(--accent)"  },
  { label: "Active Projects",    value: "—", sub: "Currently assigned",   color: "var(--success)" },
  { label: "Open Claims",        value: "—", sub: "Pending review",       color: "var(--warn)"    },
  { label: "Refunds Processed",  value: "—", sub: "This month",           color: "var(--info)"    },
];

export default function AdminOverviewPage() {
  return (
    <>
      <Header
        title="Admin Overview"
        subtitle="System-wide summary and controls"
      />
      <div style={{ padding: "28px", flex: 1 }}>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-faint)",
                borderRadius: "10px",
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Coloured top bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: "2px",
                  background: s.color,
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Placeholder sections for future services ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-faint)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
              Recent Activity
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              System events across all services
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Coming in Service 7 — Audit Logs
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-faint)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
              Claim Pipeline
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Status breakdown across all claims
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              Coming in Service 4 — Evaluation
            </div>
          </div>
        </div>
      </div>
    </>
  );
}