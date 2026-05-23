"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Star, Briefcase, Search, Mail, Loader2,
  Award, Percent, Clock, CheckCircle2, UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, type ProjectResponse, type RankedWorkerResponse } from "@/lib/projectService";
import { userService } from "@/lib/userService";

const STRONG_MATCH = 60;   // shown as "Best Match"
const MIN_MATCH    = 40;   // shown as "Potential" (lower tier)

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:      { bg: "#22c55e20", text: "#22c55e", label: "Open" },
  ASSIGNED:  { bg: "#3b82f620", text: "#3b82f6", label: "Assigned" },
  COMPLETED: { bg: "#8b5cf620", text: "#8b5cf6", label: "Completed" },
  FAILED:    { bg: "#ef444420", text: "#ef4444", label: "Failed" },
};

interface WorkerWithProject extends RankedWorkerResponse {
  projectTitle: string;
  projectId: string;
  projectStatus: string;
  projectCategory: string | null;
  projectCategoryDisplay: string | null;
  isAssignedWorker: boolean;
  profileImageUrl?: string | null;
}

export default function ProviderAlumniPage() {
  const [projects, setProjects]   = useState<ProjectResponse[]>([]);
  const [workers, setWorkers]     = useState<WorkerWithProject[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    projectService.getMyProjects()
      .then(async (myProjects) => {
        setProjects(myProjects);
        const results: WorkerWithProject[] = [];
        const seen = new Set<string>();

        await Promise.allSettled(
          myProjects.map(async (p) => {
            try {
              const candidates = await projectService.getCandidates(p.id);
              for (const c of candidates) {
                if (c.rankScore >= MIN_MATCH && !seen.has(c.workerId)) {
                  seen.add(c.workerId);
                  results.push({
                    ...c,
                    projectTitle: p.title,
                    projectId: p.id,
                    projectStatus: p.status,
                    projectCategory: p.category ?? null,
                    projectCategoryDisplay: p.categoryDisplayName ?? null,
                    isAssignedWorker: p.assignedWorkerId === c.workerId,
                  });
                }
              }
            } catch { /* project may have no candidates yet */ }
          })
        );

        const sorted = results.sort((a, b) => b.rankScore - a.rankScore);
        setWorkers(sorted);

        sorted.forEach((w) => {
          userService.getUser(w.workerId)
            .then((u) => {
              if (u.profileImageUrl) {
                setWorkers((prev) =>
                  prev.map((x) =>
                    x.workerId === w.workerId
                      ? { ...x, profileImageUrl: u.profileImageUrl }
                      : x
                  )
                );
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => toast.error("Failed to load matching workers."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workers.filter((w) =>
    w.workerName.toLowerCase().includes(search.toLowerCase()) ||
    w.specialization.toLowerCase().includes(search.toLowerCase()) ||
    w.workerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const bestMatches = filtered.filter((w) => w.rankScore >= STRONG_MATCH);
  const potential   = filtered.filter((w) => w.rankScore >= MIN_MATCH && w.rankScore < STRONG_MATCH);

  const openProjects     = projects.filter((p) => p.status === "OPEN").length;
  const assignedProjects = projects.filter((p) => p.status === "ASSIGNED").length;

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (id: string) => {
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const matchColor = (score: number) =>
    score >= 60 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  const ratingColor = (score: number) =>
    score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Matching Workers</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Workers AI-matched to your projects — strong matches ({STRONG_MATCH}%+) and
          potential candidates ({MIN_MATCH}–{STRONG_MATCH - 1}%).
        </p>
      </div>

      {/* Project status summary */}
      {!loading && projects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {openProjects > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
              <Clock className="h-3.5 w-3.5" />
              {openProjects} open project{openProjects !== 1 ? "s" : ""} waiting for worker CVs
            </span>
          )}
          {assignedProjects > 0 && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {assignedProjects} project{assignedProjects !== 1 ? "s" : ""} assigned
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--color-muted-foreground)" }} />
        <input
          type="text"
          placeholder="Search by name, specialization, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>

      ) : projects.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="No projects posted yet"
          description="Post a project first to see workers who match your field."
        />

      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title={search ? "No workers match your search." : "No matching workers found yet."}
          description={
            search
              ? "Try a different name, email, or specialization."
              : openProjects > 0
                ? `You have ${openProjects} open project${openProjects !== 1 ? "s" : ""}. Workers will appear here once they submit CVs that match your required skills and the AI rates them.`
                : "Workers will appear here once the AI rates their CVs against your project requirements."
          }
        />

      ) : (
        <div className="space-y-8">

          {/* Best matches */}
          {bestMatches.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-muted-foreground)" }}>
                Strong matches · {STRONG_MATCH}%+ · {bestMatches.length} worker{bestMatches.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bestMatches.map((w, i) => (
                  <WorkerCard key={w.workerId} worker={w} rank={i} initials={initials}
                    avatarColor={avatarColor} matchColor={matchColor} ratingColor={ratingColor} />
                ))}
              </div>
            </section>
          )}

          {/* Potential candidates */}
          {potential.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-muted-foreground)" }}>
                Potential candidates · {MIN_MATCH}–{STRONG_MATCH - 1}% · {potential.length} worker{potential.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {potential.map((w, i) => (
                  <WorkerCard key={w.workerId} worker={w} rank={-1} initials={initials}
                    avatarColor={avatarColor} matchColor={matchColor} ratingColor={ratingColor} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Worker card ──────────────────────────────────────────────────────────── */

function WorkerCard({
  worker: w, rank, initials, avatarColor, matchColor, ratingColor,
}: {
  worker: WorkerWithProject;
  rank: number;
  initials: (n: string) => string;
  avatarColor: (id: string) => string;
  matchColor: (s: number) => string;
  ratingColor: (s: number) => string;
}) {
  const isBest  = rank === 0;
  const mColor  = matchColor(w.rankScore);
  const rColor  = ratingColor(w.ratingScore);
  const status  = STATUS_STYLE[w.projectStatus] ?? STATUS_STYLE.OPEN;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.max(rank, 0) * 0.05 }}
      className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: isBest ? "#22c55e" : "var(--color-border)",
      }}
    >
      {/* BEST MATCH ribbon */}
      {isBest && (
        <div className="absolute top-0 right-0 px-2.5 py-1 text-xs font-bold"
          style={{ backgroundColor: "#22c55e", color: "white", borderBottomLeftRadius: "8px" }}>
          BEST MATCH
        </div>
      )}

      {/* Assigned badge */}
      {w.isAssignedWorker && (
        <div className="absolute top-0 left-0 px-2.5 py-1 text-xs font-bold flex items-center gap-1"
          style={{ backgroundColor: "#3b82f6", color: "white", borderBottomRightRadius: "8px" }}>
          <UserCheck className="h-3 w-3" /> Assigned
        </div>
      )}

      {/* Avatar + name */}
      <div className={`flex items-center gap-3 ${w.isAssignedWorker ? "mt-4" : ""}`}>
        <div
          className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ backgroundColor: avatarColor(w.workerId) }}
        >
          {w.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
          ) : (
            initials(w.workerName)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
            {w.workerName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
            {w.workerEmail}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" style={{ color: mColor }} />
            <span className="font-bold text-sm" style={{ color: mColor }}>
              {w.rankScore.toFixed(0)}%
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>match</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
          <span style={{ color: "var(--color-foreground)" }}>{w.specialization}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Award className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
          <span style={{ color: "var(--color-foreground)" }}>
            {w.yearsOfExperience} yr{w.yearsOfExperience !== 1 ? "s" : ""} experience
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
          <span className="truncate" style={{ color: "var(--color-muted-foreground)" }}>
            {w.workerEmail}
          </span>
        </div>
      </div>

      {/* AI rating bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
            <Star className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
            AI Rating
          </span>
          <span style={{ color: rColor }}>{w.ratingScore.toFixed(1)} / 10</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
          <div className="h-1.5 rounded-full"
            style={{ width: `${Math.min(100, (w.ratingScore / 10) * 100)}%`, backgroundColor: rColor }} />
        </div>
      </div>

      {/* Project footer with status + category badges */}
      <div className="pt-1 border-t space-y-1.5" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
          {w.projectTitle}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {w.projectCategoryDisplay && (
            <span className="rounded-full px-2 py-0.5 font-medium text-xs"
              style={{ backgroundColor: "var(--color-primary-50, #f0f4ff)", color: "var(--color-primary)" }}>
              {w.projectCategoryDisplay}
            </span>
          )}
          <span className="rounded-full px-2 py-0.5 font-medium text-xs"
            style={{ backgroundColor: status.bg, color: status.text }}>
            {status.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────────── */

function EmptyState({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border p-12 text-center"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center"
        style={{ color: "var(--color-neutral-300)" }}>
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{title}</p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: "var(--color-muted-foreground)" }}>
        {description}
      </p>
    </div>
  );
}
