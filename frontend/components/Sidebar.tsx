
"use client";

import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/authService";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  role: string;
  fullName: string;
  email: string;
  navItems: NavItem[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN":         return { bg: "rgba(248,81,73,0.15)",  text: "#f85149" };
    case "PROVIDER":      return { bg: "rgba(47,129,247,0.15)", text: "#58a6ff" };
    case "WORKER":        return { bg: "rgba(63,185,80,0.15)",  text: "#3fb950" };
    case "EVALUATOR":     return { bg: "rgba(210,153,34,0.15)", text: "#d29922" };
    case "REFUND_OFFICE": return { bg: "rgba(88,166,255,0.15)", text: "#79c0ff" };
    default:              return { bg: "rgba(255,255,255,0.08)", text: "#8b949e" };
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":         return "Administrator";
    case "PROVIDER":      return "Project Provider";
    case "WORKER":        return "Worker";
    case "EVALUATOR":     return "Evaluator";
    case "REFUND_OFFICE": return "Refund Office";
    default:              return role;
  }
}

export default function Sidebar({
  role,
  fullName,
  email,
  navItems,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const roleStyle = getRoleColor(role);

  return (
    <div
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-faint)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex",
          alignItems: "center",
          gap: "11px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
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
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "-0.2px",
              color: "var(--text-primary)",
            }}
          >
            RefundSmart
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Platform
          </div>
        </div>
      </div>

      {/* ── Navigation buttons ── */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            pathname.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                border: isActive
                  ? "1px solid var(--accent-border)"
                  : "1px solid transparent",
                background: isActive ? "var(--accent-muted)" : "transparent",
                color: isActive
                  ? "var(--accent)"
                  : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                transition: "all 0.12s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-elevated)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  opacity: isActive ? 1 : 0.65,
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "20px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div
        style={{ borderTop: "1px solid var(--border-faint)", padding: "14px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: roleStyle.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
              color: roleStyle.text,
              flexShrink: 0,
            }}
          >
            {getInitials(fullName)}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {email}
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            background: roleStyle.bg,
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 600,
            color: roleStyle.text,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {getRoleLabel(role)}
        </div>

        {/* Sign out button */}
        <button
          onClick={() => authService.logout()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "7px",
            border: "1px solid var(--border-faint)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--danger-muted)";
            e.currentTarget.style.color = "var(--danger)";
            e.currentTarget.style.borderColor = "rgba(248,81,73,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border-faint)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M2 2.75C2 1.784 2.784 1 3.75 1h4.5a.75.75 0 0 1 0 1.5h-4.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h4.5a.75.75 0 0 1 0 1.5h-4.5A1.75 1.75 0 0 1 2 13.25V2.75zm10.44 4.5-1.97-1.97a.75.75 0 0 0-1.06 1.06L10.69 7.5H6.75a.75.75 0 0 0 0 1.5h3.94l-1.28 1.28a.75.75 0 1 0 1.06 1.06l1.97-1.97a.75.75 0 0 0 0-1.06z"
            />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}