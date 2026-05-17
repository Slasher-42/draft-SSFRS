"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Calendar, DollarSign, Star,
  ChevronDown, ChevronUp, UserCheck, Loader2, CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, RankedWorkerResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, RankedWorkerResponse[]>>({});
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
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setCandidateLoading(projectId);
    try {
      const ranked = await projectService.getCandidates(projectId);
      setCandidates((prev) => ({ ...prev, [projectId]: ranked }));
      setExpandedId(projectId);
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
  const otherProjects = projects.filter((p) => p.status !== "OPEN");

  return (
    <div className="space-y-8">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Project Assignment</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Review AI-ranked candidates and assign the best worker to each open project.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : (
        <>
          {/* ── Open projects ── */}
          <section className="space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-muted-foreground)" }}>
              Open — awaiting assignment ({openProjects.length})
            </p>

            {openProjects.length === 0 ? (
              <div className="rounded-xl border p-10 text-center"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <CheckCircle className="mx-auto mb-3 h-10 w-10"
                  style={{ color: "var(--color-neutral-300)" }} />
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  No open projects right now.
                </p>
              </div>
            ) : (
              openProjects.map((p, i) => (
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
                  statusColor={statusColor}
                />
              ))
            )}
          </section>

          {/* ── Other projects (assigned / completed / failed) ── */}
          {otherProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Other projects ({otherProjects.length})
              </p>
              {otherProjects.map((p) => (
                <div key={p.id}
                  className="flex items-center justify-between rounded-xl border px-5 py-3"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {p.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      {p.requiredSkills}
                    </p>
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

/* ── Project card with expandable candidate list ── */
function ProjectCard({
  project, index, expanded, candidateList, candidateLoading,
  assigning, onToggleCandidates, onAssign, statusColor,
}: {
  project: ProjectResponse;
  index: number;
  expanded: boolean;
  candidateList?: RankedWorkerResponse[];
  candidateLoading: boolean;
  assigning: string | null;
  onToggleCandidates: () => void;
  onAssign: (projectId: string, workerId: string, workerName: string) => void;
  statusColor: Record<string, string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                {project.title}
              </h5>
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
                {project.status}
              </span>
            </div>
            <p className="text-xs truncate mb-2" style={{ color: "var(--color-muted-foreground)" }}>
              {project.requiredSkills}
            </p>
            <div className="flex gap-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(project.deadline).toLocaleDateString()}
              </span>
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

          <button
            onClick={onToggleCandidates}
            disabled={candidateLoading}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {candidateLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expanded ? "Hide" : "AI Candidates"}
          </button>
        </div>
      </div>

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
            <div className="p-4 space-y-2" style={{ backgroundColor: "var(--color-neutral-50)" }}>
              <p className="text-xs font-medium mb-3" style={{ color: "var(--color-muted-foreground)" }}>
                AI-RANKED CANDIDATES — {candidateList?.length ?? 0} worker{candidateList?.length !== 1 ? "s" : ""}
              </p>

              {!candidateList || candidateList.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                  No workers have submitted CVs yet.
                </p>
              ) : (
                candidateList.map((w, rank) => (
                  <div key={w.workerId}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{
                        backgroundColor:
                          rank === 0 ? "#f59e0b"
                          : rank === 1 ? "#94a3b8"
                          : rank === 2 ? "#b45309"
                          : "var(--color-neutral-400)",
                      }}
                    >
                      {rank + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                        {w.workerName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        {w.specialization} · {w.yearsOfExperience} yrs exp
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 mr-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                          {w.ratingScore.toFixed(1)} AI
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        {w.rankScore.toFixed(0)}% match
                      </span>
                    </div>

                    <button
                      onClick={() => onAssign(project.id, w.workerId, w.workerName)}
                      disabled={assigning === `${project.id}-${w.workerId}`}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                      style={{ backgroundColor: "#22c55e" }}
                    >
                      {assigning === `${project.id}-${w.workerId}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
