"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { authService } from "@/lib/authService";
import { userService, type UserProfile, type WorkerProfile } from "@/lib/userService";
import { workerCvService, type WorkerCvResponse } from "@/lib/workerCvService";

interface CompletionItem {
  label: string;
  done: boolean;
  weight: number;
  href: string;
}

function calcCompletion(
  user: UserProfile | null,
  profile: WorkerProfile | null,
  cv: WorkerCvResponse | null,
): { pct: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: "Full name provided", done: !!user?.fullName?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Phone number added", done: !!user?.phone?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Professional title set", done: !!profile?.professionalTitle?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Country & city filled", done: !!(profile?.country?.trim() && profile?.city?.trim()), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Field of expertise selected", done: !!profile?.specialization?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "LinkedIn profile linked", done: !!(profile as (WorkerProfile & { linkedinUrl?: string }) | null)?.linkedinUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "GitHub profile linked", done: !!(profile as (WorkerProfile & { githubUrl?: string }) | null)?.githubUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "CV / specialization submitted", done: !!(cv?.specialization?.trim() && cv?.yearsOfExperience !== undefined), weight: 15, href: "/dashboard/worker/cv" },
    { label: "CV file uploaded", done: !!cv?.cvFileUrl, weight: 15, href: "/dashboard/worker/cv" },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  return { pct: Math.round((done / total) * 100), items };
}

export default function WorkerDashboard() {
  const [session, setSession] = useState<{ userId: string; fullName: string; email: string; role: string } | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [cv, setCv] = useState<WorkerCvResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = authService.getSession();
    if (!s) { setLoading(false); return; }
    setSession({ userId: s.userId, fullName: s.fullName, email: s.email, role: s.role });

    Promise.allSettled([
      userService.getUser(s.userId),
      userService.getIdentityProfile(s.role, s.userId),
      workerCvService.getMyCv(),
    ]).then(([u, p, c]) => {
      if (u.status === "fulfilled") setUser(u.value as UserProfile);
      if (p.status === "fulfilled") setProfile(p.value as WorkerProfile);
      if (c.status === "fulfilled") setCv(c.value as WorkerCvResponse);
    }).finally(() => setLoading(false));
  }, []);

  const { pct, items } = calcCompletion(user, profile, cv);
  const canBeRated = pct >= 80;

  const barColor = pct < 50 ? "#ef4444" : pct < 80 ? "#f59e0b" : "#22c55e";

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>
          Welcome back, {session?.fullName || "Worker"}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Manage your profile, CV, and interview from here.
        </p>
      </div>

      {/* Profile Completion Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
              Profile Completion
            </h5>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {canBeRated
                ? "You meet the minimum threshold to be rated by AI."
                : `Reach 80% to unlock AI rating and interview. (${80 - pct}% remaining)`}
            </p>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: barColor }}
          >
            {loading ? "—" : `${pct}%`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full mb-5" style={{ backgroundColor: "var(--color-border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? "0%" : `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-2.5 rounded-full"
            style={{ backgroundColor: barColor }}
          />
        </div>

        {/* Status badge */}
        {!loading && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-sm"
            style={{
              backgroundColor: canBeRated ? "#22c55e15" : "#f59e0b15",
              border: `1px solid ${canBeRated ? "#22c55e40" : "#f59e0b40"}`,
              color: canBeRated ? "#22c55e" : "#f59e0b",
            }}
          >
            {canBeRated ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {canBeRated
              ? "AI rating & interview are available to you."
              : "Complete your profile to unlock AI rating and the interview feature."}
          </div>
        )}

        {/* Checklist */}
        {!loading && (
          <div className="space-y-1.5">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition"
                style={{
                  backgroundColor: item.done ? "#22c55e10" : "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-neutral-50)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = item.done ? "#22c55e10" : "transparent"; }}
              >
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center border"
                  style={{
                    borderColor: item.done ? "#22c55e" : "var(--color-border)",
                    backgroundColor: item.done ? "#22c55e" : "transparent",
                  }}
                >
                  {item.done && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span className="flex-1 text-sm" style={{ color: item.done ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                  {item.label}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  +{item.weight}%
                </span>
                {!item.done && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />}
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Account Info + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
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
          transition={{ delay: 0.1 }}
          className="rounded-xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Quick Actions
          </h5>
          <div className="space-y-2">
            <Link
              href="/dashboard/worker/profile"
              className="flex items-center gap-3 rounded-lg p-3 transition"
              style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-foreground)" }}
            >
              <User className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-medium">View &amp; Edit My Profile</span>
            </Link>
            <Link
              href="/dashboard/worker/cv"
              className="flex items-center gap-3 rounded-lg p-3 transition"
              style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-foreground)" }}
            >
              <Shield className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-medium">Manage My CV</span>
            </Link>
            {canBeRated && (
              <Link
                href="/dashboard/worker/interview"
                className="flex items-center gap-3 rounded-lg p-3 transition"
                style={{ backgroundColor: "#7c3aed15", color: "var(--color-foreground)" }}
              >
                <Shield className="h-4 w-4" style={{ color: "#7c3aed" }} />
                <span className="text-sm font-medium text-[#7c3aed]">Start AI Interview</span>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
