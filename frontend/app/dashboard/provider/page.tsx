"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, AlertCircle, ClipboardList, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { authService } from "@/lib/authService";

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export default function ProviderDashboard() {
  const [session, setSession] = useState<{ fullName: string } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName });
  }, []);

  const stats: StatCard[] = [
    {
      label: "Total Projects Posted",
      value: 0,
      icon: <FolderOpen className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
    {
      label: "Active Assignments",
      value: 0,
      icon: <ClipboardList className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
    {
      label: "Claims Filed",
      value: 0,
      icon: <AlertCircle className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
    {
      label: "Refunds Received",
      value: 0,
      icon: <DollarSign className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>
            Welcome back, {session?.fullName || "Provider"}
          </h3>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Here is an overview of your projects and claims.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
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
                    {stat.label}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-neutral-100)" }}
                >
                  {stat.icon}
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
              className="font-semibold mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              Recent Projects
            </h5>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen
                className="h-10 w-10 mb-3"
                style={{ color: "var(--color-neutral-300)" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                No projects yet
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Post your first project to get started.
              </p>
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
              className="font-semibold mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              Recent Claims
            </h5>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle
                className="h-10 w-10 mb-3"
                style={{ color: "var(--color-neutral-300)" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                No claims filed
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Claims you file will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}