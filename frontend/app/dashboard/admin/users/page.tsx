
"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import api from "@/lib/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  locked: boolean;
  createdAt: string;
}

const ROLE_OPTIONS = [
  "ALL", "ADMIN", "PROVIDER", "WORKER", "EVALUATOR", "REFUND_OFFICE",
];

const roleBadge: Record<string, { bg: string; color: string; label: string }> = {
  ADMIN:         { bg: "rgba(248,81,73,0.12)",  color: "#f85149", label: "Admin"        },
  PROVIDER:      { bg: "rgba(47,129,247,0.12)", color: "#58a6ff", label: "Provider"     },
  WORKER:        { bg: "rgba(63,185,80,0.12)",  color: "#3fb950", label: "Worker"       },
  EVALUATOR:     { bg: "rgba(210,153,34,0.12)", color: "#d29922", label: "Evaluator"    },
  REFUND_OFFICE: { bg: "rgba(88,166,255,0.12)", color: "#79c0ff", label: "Refund Office"},
};

function RoleBadge({ role }: { role: string }) {
  const s = roleBadge[role] || {
    bg: "rgba(255,255,255,0.08)",
    color: "#8b949e",
    label: role,
  };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "20px",
      }}
    >
      {s.label}
    </span>
  );
}

function StatusDot({ active, locked }: { active: boolean; locked: boolean }) {
  const color = locked
    ? "var(--danger)"
    : active
    ? "var(--success)"
    : "var(--warn)";
  const label = locked ? "Locked" : active ? "Active" : "Inactive";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const applyFilters = useCallback(
    (list: User[], q: string, role: string) => {
      let r = list;
      if (role !== "ALL") r = r.filter((u) => u.role === role);
      if (q.trim()) {
        const lq = q.toLowerCase();
        r = r.filter(
          (u) =>
            u.fullName.toLowerCase().includes(lq) ||
            u.email.toLowerCase().includes(lq) ||
            u.phone?.toLowerCase().includes(lq)
        );
      }
      setFiltered(r);
    },
    []
  );

  async function fetchUsers() {
    try {
      const res = await api.get<User[]>("/api/admin/users");
      setUsers(res.data);
      applyFilters(res.data, search, roleFilter);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line

  useEffect(() => {
    applyFilters(users, search, roleFilter);
  }, [search, roleFilter, users, applyFilters]);

  async function toggleActive(user: User) {
    setActionLoading(user.id);
    try {
      const endpoint = user.active
        ? `/api/admin/users/${user.id}/deactivate`
        : `/api/admin/users/${user.id}/activate`;
      await api.patch(endpoint);
      showToast(
        `${user.fullName} ${user.active ? "deactivated" : "activated"}`
      );
      fetchUsers();
    } catch {
      showToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(user: User) {
    if (
      !confirm(
        `Permanently delete ${user.fullName}? This cannot be undone.`
      )
    )
      return;
    setActionLoading(user.id);
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      showToast(`${user.fullName} deleted`);
      fetchUsers();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <Header
        title="User Management"
        subtitle="View, search, filter and manage all platform accounts"
        actions={
          <a
            href="/dashboard/admin/users/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--accent)",
              color: "#fff",
              padding: "7px 14px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            Create Account
          </a>
        }
      />

      <div style={{ padding: "24px 28px", flex: 1 }}>
        {/* Toast notification */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 999,
              background:
                toast.type === "success"
                  ? "var(--success-muted)"
                  : "var(--danger-muted)",
              border: `1px solid ${
                toast.type === "success"
                  ? "rgba(63,185,80,0.3)"
                  : "rgba(248,81,73,0.3)"
              }`,
              color:
                toast.type === "success"
                  ? "var(--success)"
                  : "var(--danger)",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* ── Search and filter bar ── */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search input */}
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: "220px",
              maxWidth: "360px",
            }}
          >
            <svg
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                borderRadius: "7px",
                padding: "8px 12px 8px 32px",
                fontSize: "13px",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* Role filter buttons */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  border:
                    roleFilter === r
                      ? "1px solid var(--accent-border)"
                      : "1px solid var(--border-light)",
                  background:
                    roleFilter === r
                      ? "var(--accent-muted)"
                      : "var(--bg-surface)",
                  color:
                    roleFilter === r
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.12s",
                }}
              >
                {r === "ALL" ? "All Roles" : roleBadge[r]?.label || r}
              </button>
            ))}
          </div>

          <div
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </div>
        </div>

        {/* ── Users table ── */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-faint)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Table column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 120px",
              padding: "10px 20px",
              borderBottom: "1px solid var(--border-faint)",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}
          >
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {/* Table rows */}
          {loading ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              No users found
            </div>
          ) : (
            filtered.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 120px",
                  padding: "12px 20px",
                  alignItems: "center",
                  borderBottom:
                    i < filtered.length - 1
                      ? "1px solid var(--border-faint)"
                      : "none",
                  transition: "background 0.1s",
                  opacity: actionLoading === user.id ? 0.5 : 1,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Name + avatar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background:
                        roleBadge[user.role]?.bg ||
                        "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 600,
                      color:
                        roleBadge[user.role]?.color ||
                        "var(--text-secondary)",
                      flexShrink: 0,
                    }}
                  >
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {user.fullName}
                  </span>
                </div>

                {/* Email */}
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: "12px",
                  }}
                >
                  {user.email}
                </span>

                {/* Role badge */}
                <span>
                  <RoleBadge role={user.role} />
                </span>

                {/* Status */}
                <span>
                  <StatusDot active={user.active} locked={user.locked} />
                </span>

                {/* Date joined */}
                <span
                  style={{ fontSize: "12px", color: "var(--text-muted)" }}
                >
                  {new Date(user.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => toggleActive(user)}
                    disabled={actionLoading === user.id}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-light)",
                      background: "transparent",
                      cursor: "pointer",
                      color: user.active
                        ? "var(--warn)"
                        : "var(--success)",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      transition: "all 0.12s",
                    }}
                  >
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={actionLoading === user.id}
                    style={{
                      padding: "5px 7px",
                      borderRadius: "6px",
                      border: "1px solid rgba(248,81,73,0.2)",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--danger)",
                      transition: "all 0.12s",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`input::placeholder { color: var(--text-muted); }`}</style>
    </>
  );
}