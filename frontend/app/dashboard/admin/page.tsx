"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Lock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface User {
  id: string;
  active: boolean;
  locked: boolean;
}

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<User[]>("/api/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const total = users.length;
  const active = users.filter((u) => u.active && !u.locked).length;
  const locked = users.filter((u) => u.locked).length;

  const stats = [
    {
      label: "Total Users",
      value: loading ? "—" : total,
      sub: "Registered accounts",
      icon: <Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
    {
      label: "Active Users",
      value: loading ? "—" : active,
      sub: "Can currently log in",
      icon: <UserCheck className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
    {
      label: "Locked Accounts",
      value: loading ? "—" : locked,
      sub: "Failed login lockout",
      icon: <Lock className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Admin Overview</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          User management summary and quick actions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border p-5"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {s.label}
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                  {s.sub}
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-neutral-100)" }}
              >
                {s.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <h5 className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          Quick Actions
        </h5>
        <p className="text-xs mb-4" style={{ color: "var(--color-muted-foreground)" }}>
          Manage platform accounts
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/users"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            View All Users
          </Link>
          <Link
            href="/dashboard/admin/users/create"
            className="px-4 py-2 rounded-lg text-sm font-medium border transition"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
              backgroundColor: "transparent",
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
