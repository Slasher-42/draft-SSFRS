"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { authService } from "@/lib/authService";

export default function WorkerDashboard() {
  const [session, setSession] = useState<{
    fullName: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName, email: s.email, role: s.role });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>
          Welcome back, {session?.fullName || "Worker"}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Manage your account and profile from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Account Info
          </h5>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {session?.fullName || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {session?.email || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                Worker
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border p-6 space-y-4"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Quick Actions
          </h5>
          <div className="space-y-2">
            <Link
              href="/dashboard/worker/profile"
              className="flex items-center gap-3 rounded-lg p-3 transition"
              style={{
                backgroundColor: "var(--color-neutral-50)",
                color: "var(--color-foreground)",
              }}
            >
              <User className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-medium">View &amp; Edit My Profile</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
