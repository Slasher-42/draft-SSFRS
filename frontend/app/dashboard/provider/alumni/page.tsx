"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Star, Briefcase, Search, Mail, Loader2, Award } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, type ProjectResponse, type RankedWorkerResponse } from "@/lib/projectService";

interface WorkerWithProject extends RankedWorkerResponse {
  projectTitle: string;
  projectId: string;
}

export default function ProviderAlumniPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [workers, setWorkers] = useState<WorkerWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    projectService.getMyProjects()
      .then(async (myProjects) => {
        setProjects(myProjects);
        /* Load candidates for each OPEN/ASSIGNED project */
        const results: WorkerWithProject[] = [];
        const seen = new Set<string>();
        await Promise.allSettled(
          myProjects.map(async (p) => {
            try {
              const candidates = await projectService.getCandidates(p.id);
              for (const c of candidates) {
                if (!seen.has(c.workerId)) {
                  seen.add(c.workerId);
                  results.push({ ...c, projectTitle: p.title, projectId: p.id });
                }
              }
            } catch { /* project may have no candidates */ }
          })
        );
        setWorkers(results.sort((a, b) => b.ratingScore - a.ratingScore));
      })
      .catch(() => toast.error("Failed to load alumni."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workers.filter((w) =>
    w.workerName.toLowerCase().includes(search.toLowerCase()) ||
    w.specialization.toLowerCase().includes(search.toLowerCase()) ||
    w.workerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (id: string) => {
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const ratingBar = (score: number) => {
    const pct = Math.min(100, (score / 10) * 100);
    const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
    return { pct, color };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>View Alumni</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          AI-ranked workers that could be a fit for your projects based on skills and experience.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <input type="text" placeholder="Search by name, specialization, or email…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <GraduationCap className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No projects posted yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Post a project to see AI-ranked alumni workers.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <GraduationCap className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {search ? "No workers match your search." : "No workers available yet."}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers appear here once they submit their CVs and are rated by AI.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-muted-foreground)" }}>
            {filtered.length} probable worker{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((w, i) => {
              const { pct, color } = ratingBar(w.ratingScore);
              const isTopMatch = i === 0;
              return (
                <motion.div key={w.workerId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
                  style={{ backgroundColor: "var(--color-card)", borderColor: isTopMatch ? "#f59e0b" : "var(--color-border)" }}>
                  {isTopMatch && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#f59e0b", color: "white", borderBottomLeftRadius: "8px" }}>
                      TOP MATCH
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                      style={{ backgroundColor: avatarColor(w.workerId) }}>
                      {initials(w.workerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="h-4 w-4" style={{ color: "#f59e0b" }} />
                      <span className="font-bold text-sm" style={{ color: "var(--color-foreground)" }}>
                        {w.ratingScore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
                      <span style={{ color: "var(--color-foreground)" }}>{w.specialization}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
                      <span style={{ color: "var(--color-foreground)" }}>
                        {w.yearsOfExperience} year{w.yearsOfExperience !== 1 ? "s" : ""} of experience
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
                      <span className="truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</span>
                    </div>
                  </div>

                  {/* AI Rating bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--color-muted-foreground)" }}>AI Rating</span>
                      <span style={{ color }}>{w.ratingScore.toFixed(1)} / 10</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>

                  {/* Match score */}
                  <div className="flex items-center justify-between pt-1 border-t text-xs"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
                    <span>Project: {w.projectTitle}</span>
                    <span className="font-medium" style={{ color: "var(--color-primary)" }}>
                      {w.rankScore.toFixed(0)}% match
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
