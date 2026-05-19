"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Calendar, DollarSign, Star,
  ChevronDown, ChevronUp, UserCheck, Loader2, CheckCircle,
  Clock, Images, Mail, Award,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, RankedWorkerResponse } from "@/lib/projectService";
import { userService } from "@/lib/userService";

interface CandidateWithPhoto extends RankedWorkerResponse {
  profileImageUrl?: string | null;
}

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function Countdown({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline);
  const color = days <= 3 ? "#ef4444" : days <= 7 ? "#f59e0b" : "#22c55e";
  return (
    <span className="flex items-center gap-1 font-medium" style={{ color }}>
      <Clock className="h-3.5 w-3.5" />
      {days === 0 ? "Due today" : `${days}d left`}
    </span>
  );
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const avatarColor = (id: string) => {
  const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
  return colors[h];
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, CandidateWithPhoto[]>>({});
  const [candidateLoading, setCandidateLoading] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    projectService.getAllProjects()
      .then((data) => setProjects(data))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || "Failed to load projects.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadCandidates = async (projectId: string) => {
    if (expandedId === projectId) { setExpandedId(null); return; }
    setCandidateLoading(projectId);
    try {
      const ranked = await projectService.getCandidates(projectId);
      const withPhotos: CandidateWithPhoto[] = ranked.map((w) => ({ ...w, profileImageUrl: null }));
      setCandidates((prev) => ({ ...prev, [projectId]: withPhotos }));
      setExpandedId(projectId);

      /* Fetch profile pictures in background */
      withPhotos.forEach((w) => {
        userService.getUser(w.workerId)
          .then((u) => {
            if (u.profileImageUrl) {
              setCandidates((prev) => ({
                ...prev,
                [projectId]: (prev[projectId] ?? []).map((c) =>
                  c.workerId === w.workerId ? { ...c, profileImageUrl: u.profileImageUrl } : c
                ),
              }));
            }
          })
          .catch(() => { /* no profile pic — ok */ });
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to load AI-ranked candidates.";
      toast.error(msg);
    } finally {
      setCandidateLoading(null);
    }
  };

  const handleAssign = async (projectId: string, workerId: string, workerName: string) => {
    setAssigning(`${projectId}-${workerId}`);
    try {
      const updated = await projectService.assignWorker(projectId, workerId);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      setExpandedId(null);
      toast.success(`Assigned ${workerName} to the project.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Assignment failed.";
      toast.error(msg);
    } finally {
      setAssigning(null);
    }
  };

  const openProjects = projects.filter((p) => p.status === "OPEN");
  const assignedProjects = projects.filter((p) => p.status === "ASSIGNED");
  const otherProjects = projects.filter((p) => p.status === "COMPLETED" || p.status === "FAILED");

  return (
    <div className="space-y-8">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Projects</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Manage all projects — assign workers, track deadlines, and monitor progress.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open", count: openProjects.length, color: "#22c55e" },
          { label: "Assigned", count: assignedProjects.length, color: "#3b82f6" },
          { label: "Completed", count: projects.filter((p) => p.status === "COMPLETED").length, color: "#8b5cf6" },
          { label: "Failed", count: projects.filter((p) => p.status === "FAILED").length, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : (
        <>
          {/* ── Open projects (need assignment) ── */}
          {openProjects.length > 0 && (
            <section className="space-y-4">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Open — awaiting assignment ({openProjects.length})
              </p>
              {openProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  expanded={expandedId === p.id}
                  candidateList={candidates[p.id]}
                  candidateLoading={candidateLoading === p.id}
                  assigning={assigning}
                  onToggleCandidates={() => loadCandidates(p.id)}
                  onAssign={handleAssign}
                />
              ))}
            </section>
          )}

          {openProjects.length === 0 && (
            <div className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <CheckCircle className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                No open projects awaiting assignment.
              </p>
            </div>
          )}

          {/* ── Assigned projects ── */}
          {assignedProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Assigned & in progress ({assignedProjects.length})
              </p>
              {assignedProjects.map((p) => (
                <AssignedProjectRow key={p.id} project={p} />
              ))}
            </section>
          )}

          {/* ── Completed / Failed ── */}
          {otherProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Completed / Failed ({otherProjects.length})
              </p>
              {otherProjects.map((p) => (
                <div key={p.id}
                  className="flex items-center justify-between rounded-xl border px-5 py-3"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{p.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{p.requiredSkills}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: statusColor[p.status] + "20", color: statusColor[p.status] }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ── Assigned project row with worker & countdown ── */
function AssignedProjectRow({ project }: { project: ProjectResponse }) {
  const days = daysUntil(project.deadline);
  const dayColor = days <= 3 ? "#ef4444" : days <= 7 ? "#f59e0b" : "#22c55e";
  const thumb = project.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-stretch">
        {/* Thumbnail */}
        {thumb && (
          <div className="w-20 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.imageUrl} alt={thumb.description} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>{project.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                {project.requiredSkills}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
              {project.status}
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString()}
            </span>
            <span style={{ color: dayColor }} className="flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3" />
              {days === 0 ? "Due today!" : `${days} day${days !== 1 ? "s" : ""} left`}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {Number(project.budget).toLocaleString()}
            </span>
            {project.images?.length > 0 && (
              <span className="flex items-center gap-1">
                <Images className="h-3 w-3" />
                {project.images.length}
              </span>
            )}
          </div>

          {project.assignedWorkerId && (
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Worker ID: <span className="font-mono">{project.assignedWorkerId.slice(0, 8)}…</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Open project card with expandable candidate grid ── */
function ProjectCard({
  project, index, expanded, candidateList, candidateLoading,
  assigning, onToggleCandidates, onAssign,
}: {
  project: ProjectResponse;
  index: number;
  expanded: boolean;
  candidateList?: CandidateWithPhoto[];
  candidateLoading: boolean;
  assigning: string | null;
  onToggleCandidates: () => void;
  onAssign: (projectId: string, workerId: string, workerName: string) => void;
}) {
  const thumb = project.images?.[0];
  const days = daysUntil(project.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      {/* Banner image */}
      {thumb && (
        <div className="h-32 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb.imageUrl} alt={thumb.description} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
          <p className="absolute bottom-2 left-4 text-white text-sm font-semibold drop-shadow">{project.title}</p>
          {project.images?.length > 1 && (
            <span className="absolute bottom-2 right-4 text-xs text-white/80 flex items-center gap-0.5">
              <Images className="h-3 w-3" />+{project.images.length - 1}
            </span>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {!thumb && (
              <h5 className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>{project.title}</h5>
            )}
            <p className="text-xs truncate mb-2" style={{ color: "var(--color-muted-foreground)" }}>
              {project.requiredSkills}
            </p>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(project.deadline).toLocaleDateString()}
              </span>
              <Countdown deadline={project.deadline} />
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {Number(project.budget).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {project.scopeOfWork.slice(0, 40)}{project.scopeOfWork.length > 40 ? "…" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
              {project.status}
            </span>
            <button onClick={onToggleCandidates} disabled={candidateLoading}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {candidateLoading ? <Loader2 className="h-4 w-4 animate-spin" />
                : expanded ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />}
              {expanded ? "Hide" : "AI Candidates"}
            </button>
          </div>
        </div>
      </div>

      {/* Candidates grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="p-4" style={{ backgroundColor: "var(--color-neutral-50)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--color-muted-foreground)" }}>
                AI-RANKED CANDIDATES — {candidateList?.length ?? 0} worker{candidateList?.length !== 1 ? "s" : ""}
              </p>

              {!candidateList || candidateList.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                  No workers have submitted CVs yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {candidateList.map((w, rank) => {
                    const ratingPct = Math.min(100, (w.ratingScore / 10) * 100);
                    const ratingColor = w.ratingScore >= 7 ? "#22c55e" : w.ratingScore >= 4 ? "#f59e0b" : "#ef4444";
                    const medalColors = ["#f59e0b", "#94a3b8", "#b45309"];

                    return (
                      <div key={w.workerId}
                        className="rounded-xl border p-4 space-y-3 relative overflow-hidden"
                        style={{
                          backgroundColor: "var(--color-card)",
                          borderColor: rank === 0 ? "#f59e0b60" : "var(--color-border)",
                        }}>
                        {/* Rank badge */}
                        <div className="absolute top-0 right-0 h-7 w-7 flex items-center justify-center rounded-bl-xl text-white text-xs font-bold"
                          style={{ backgroundColor: medalColors[rank] ?? "var(--color-neutral-400)" }}>
                          {rank + 1}
                        </div>

                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 pr-6">
                          <div className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColor(w.workerId) }}>
                            {w.profileImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
                            ) : (
                              initials(w.workerName)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                              {w.workerName}
                            </p>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
                              <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
                                {w.workerEmail}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-1 text-xs">
                          <p className="truncate" style={{ color: "var(--color-muted-foreground)" }}>
                            {w.specialization}
                          </p>
                          <p style={{ color: "var(--color-muted-foreground)" }}>
                            {w.yearsOfExperience} yrs exp
                          </p>
                        </div>

                        {/* Ratings */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                              <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                              AI Rating
                            </span>
                            <span style={{ color: ratingColor }}>{w.ratingScore.toFixed(1)}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${ratingPct}%`, backgroundColor: ratingColor }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                            <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                              {w.rankScore.toFixed(0)}% match
                            </span>
                          </div>
                          <button
                            onClick={() => onAssign(project.id, w.workerId, w.workerName)}
                            disabled={assigning === `${project.id}-${w.workerId}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                            style={{ backgroundColor: "#22c55e" }}>
                            {assigning === `${project.id}-${w.workerId}`
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <UserCheck className="h-3.5 w-3.5" />}
                            Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
