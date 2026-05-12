"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Calendar, DollarSign, Star, ChevronDown, ChevronUp,
  UserCheck, Loader2, CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, RankedWorkerResponse } from "@/lib/projectService";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, RankedWorkerResponse[]>>({});
  const [candidateLoading, setCandidateLoading] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    projectService.getMyProjects()
      .then(() => {
        // Admin sees all open projects — using /my won't work; we need admin endpoint
        // For now this uses the same endpoint; expand with admin-specific endpoint as needed
      })
      .catch(() => {});

    // Load OPEN projects via admin — fetch all projects
    fetch("http://localhost:8082/api/projects/my", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then((data: ProjectResponse[]) => {
        // Admin sees all — filter to OPEN and ASSIGNED for management
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load projects."))
      .finally(() => setLoading(false));
  };

  const loadCandidates = async (projectId: string) => {
    if (candidates[projectId]) {
      setExpandedId(expandedId === projectId ? null : projectId);
      return;
    }
    setCandidateLoading(projectId);
    try {
      const ranked = await projectService.getCandidates(projectId);
      setCandidates((prev) => ({ ...prev, [projectId]: ranked }));
      setExpandedId(projectId);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to load AI-ranked candidates."
      );
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
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Assignment failed."
      );
    } finally {
      setAssigning(null);
    }
  };

  const statusColor: Record<string, string> = {
    OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
  };

  const openProjects = projects.filter((p) => p.status === "OPEN");

  return (
    <div className="space-y-6">
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
      ) : openProjects.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <CheckCircle className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No open projects awaiting assignment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {openProjects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

              {/* Project header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                        {p.title}
                      </h5>
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: statusColor[p.status] + "20", color: statusColor[p.status] }}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs truncate mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                      {p.requiredSkills}
                    </p>
                    <div className="flex gap-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.deadline).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {Number(p.budget).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => loadCandidates(p.id)}
                    disabled={candidateLoading === p.id}
                    className="flex-shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {candidateLoading === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : expandedId === p.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {expandedId === p.id ? "Hide Candidates" : "AI Candidates"}
                  </button>
                </div>
              </div>

              {/* AI-ranked candidates */}
              <AnimatePresence>
                {expandedId === p.id && candidates[p.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="p-4 space-y-2" style={{ backgroundColor: "var(--color-neutral-50)" }}>
                      <p className="text-xs font-medium mb-3"
                        style={{ color: "var(--color-muted-foreground)" }}>
                        AI-RANKED CANDIDATES — {candidates[p.id].length} worker{candidates[p.id].length !== 1 ? "s" : ""}
                      </p>

                      {candidates[p.id].length === 0 ? (
                        <p className="text-sm py-4 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                          No workers have submitted CVs yet.
                        </p>
                      ) : (
                        candidates[p.id].map((w, rank) => (
                          <div key={w.workerId}
                            className="flex items-center gap-3 rounded-xl border p-3 bg-white"
                            style={{ borderColor: "var(--color-border)" }}>
                            {/* Rank badge */}
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                              style={{
                                backgroundColor: rank === 0 ? "#f59e0b" : rank === 1 ? "#94a3b8" : rank === 2 ? "#b45309" : "var(--color-neutral-400)",
                              }}
                            >
                              {rank + 1}
                            </div>

                            {/* Worker info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                                {w.workerName}
                              </p>
                              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                {w.specialization} · {w.yearsOfExperience} yrs exp
                              </p>
                            </div>

                            {/* Scores */}
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

                            {/* Assign button */}
                            <button
                              onClick={() => handleAssign(p.id, w.workerId, w.workerName)}
                              disabled={assigning === `${p.id}-${w.workerId}`}
                              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                              style={{ backgroundColor: "#22c55e" }}
                            >
                              {assigning === `${p.id}-${w.workerId}` ? (
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
          ))}
        </div>
      )}
    </div>
  );
}
