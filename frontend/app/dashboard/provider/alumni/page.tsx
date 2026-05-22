"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Star, Briefcase, Search, Mail, Loader2, Award, Percent } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, type ProjectResponse, type RankedWorkerResponse } from "@/lib/projectService";
import { userService } from "@/lib/userService";

const MATCH_THRESHOLD = 60;

interface WorkerWithProject extends RankedWorkerResponse {
  projectTitle: string;
  projectId: string;
  profileImageUrl?: string | null;
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
        const results: WorkerWithProject[] = [];
        const seen = new Set<string>();
        await Promise.allSettled(
          myProjects.map(async (p) => {
            try {
              const candidates = await projectService.getCandidates(p.id);
              for (const c of candidates) {
                if (c.rankScore >= MATCH_THRESHOLD && !seen.has(c.workerId)) {
                  seen.add(c.workerId);
                  results.push({ ...c, projectTitle: p.title, projectId: p.id });
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
                  prev.map((x) => x.workerId === w.workerId ? { ...x, profileImageUrl: u.profileImageUrl } : x)
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

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (id: string) => {
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const matchColor = (score: number) =>
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  const ratingColor = (score: number) =>
    score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Matching Workers</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Workers in your project field with at least {MATCH_THRESHOLD}% AI match score.
        </p>
      </div>

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
            Post a project first to see workers who match your field.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <GraduationCap className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {search ? "No workers match your search." : `No workers with ${MATCH_THRESHOLD}%+ match found yet.`}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers appear here once they are rated by AI and match your project field.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-muted-foreground)" }}>
            {filtered.length} worker{filtered.length !== 1 ? "s" : ""} · {MATCH_THRESHOLD}%+ match
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((w, i) => {
              const isTopMatch = i === 0;
              const mColor = matchColor(w.rankScore);
              const rColor = ratingColor(w.ratingScore);
              return (
                <motion.div key={w.workerId}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-5 space-y-4 relative overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: isTopMatch ? "#22c55e" : "var(--color-border)",
                  }}>

                  {isTopMatch && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#22c55e", color: "white", borderBottomLeftRadius: "8px" }}>
                      BEST MATCH
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                      style={{ backgroundColor: avatarColor(w.workerId) }}>
                      {w.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
                      ) : (
                        initials(w.workerName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</p>
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
                      <span className="truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</span>
                    </div>
                  </div>

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

                  <div className="flex items-center justify-between pt-1 border-t text-xs"
                    style={{ borderColor: "var(--color-border)" }}>
                    <span style={{ color: "var(--color-muted-foreground)" }}>Matched from: {w.projectTitle}</span>
                    <div className="h-2 w-16 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                      <div className="h-2 rounded-full" style={{ width: `${w.rankScore}%`, backgroundColor: mColor }} />
                    </div>
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
