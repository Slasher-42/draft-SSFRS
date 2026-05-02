"use client";

import { motion } from "framer-motion";
import { Users, FolderOpen, AlertCircle, Receipt } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const stats = [
  {
    label: "Total Users",
    value: "—",
    sub: "Registered accounts",
    icon: <Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
  },
  {
    label: "Total Projects",
    value: "—",
    sub: "All posted projects",
    icon: <FolderOpen className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
  },
  {
    label: "Total Claims",
    value: "—",
    sub: "Pending review",
    icon: <AlertCircle className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
  },
  {
    label: "Refunds Processed",
    value: "—",
    sub: "This month",
    icon: <Receipt className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
  },
];

export default function AdminOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Admin Overview</h3>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            System-wide summary and controls.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h5
              className="font-semibold mb-1"
              style={{ color: "var(--color-foreground)" }}
            >
              Recent Activity
            </h5>
            <p
              className="text-xs mb-6"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              System events across all services
            </p>
            <div
              className="text-sm text-center py-8"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Coming in Service 7 — Audit Logs
            </div>
          </div>

          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h5
              className="font-semibold mb-1"
              style={{ color: "var(--color-foreground)" }}
            >
              Claim Pipeline
            </h5>
            <p
              className="text-xs mb-6"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Status breakdown across all claims
            </p>
            <div
              className="text-sm text-center py-8"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Coming in Service 4 — Evaluation
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}