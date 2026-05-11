"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, DollarSign, Star, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, RankedWorkerResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [candidates, setCandidates] = useState<RankedWorkerResponse[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    projectService.getProject(id)
      .then(setProject)
      .catch(() => toast.error("Project not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const loadCandidates = async () => {
    if (showCandidates) { setShowCandidates(false); return; }
    try {
      const data = await projectService.getCandidates(id);
      setCandidates(data);
      setShowCandidates(true);
    } catch {
      toast.error("Failed to load candidates.");
    }
  };

  const handleAssign = async (workerId: string) => {
    setActionLoading(true);
    try {
      const updated = await projectService.assignWorker(id, workerId);
      setProject(updated);
      setShowCandidates(false);
      toast.success("Worker assigned successfully!");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to assign.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (action: "complete" | "fail") => {
    setActionLoading(true);
    try {
      const updated = action === "complete"
        ? await projectService.markCompleted(id)
        : await projectService.markFailed(id);
      setProject(updated);
      toast.success(action === "complete" ? "Project marked as completed!" : "Project marked as failed.");
      if (action === "fail") router.push(`/dashboard/provider/claims?projectId=${id}`);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );

  if (!project) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/provider/projects"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="flex items-start justify-between">
          <h3 style={{ color: "var(--color-primary-800)" }}>{project.title}</h3>
          <span className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
            {project.status}
          </span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>SCOPE OF WORK</p>
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{project.scopeOfWork}</p>
        </div>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>REQUIRED SKILLS</p>
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{project.requiredSkills}</p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
            <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
              {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
            <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
              {Number(project.budget).toLocaleString()}
            </span>
          </div>
        </div>
        {project.assignedWorkerId && (
          <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
            <User className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
            <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
              Assigned Worker ID: <span className="font-mono text-xs">{project.assignedWorkerId}</span>
            </span>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {project.status === "OPEN" && (
          <button onClick={loadCandidates}
            className="rounded-lg px-4 py-2 text-sm font-medium border transition"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "var(--color-card)" }}>
            {showCandidates ? "Hide Candidates" : "View Ranked Candidates"}
          </button>
        )}
        {project.status === "ASSIGNED" && (
          <>
            <button onClick={() => handleStatusChange("complete")} disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "#22c55e" }}>
              <CheckCircle className="h-4 w-4" /> Mark Completed
            </button>
            <button onClick={() => handleStatusChange("fail")} disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "#ef4444" }}>
              <XCircle className="h-4 w-4" /> Mark Failed
            </button>
          </>
        )}
        {project.status === "FAILED" && (
          <Link href={`/dashboard/provider/claims/new?projectId=${id}`}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "#ef4444" }}>
            File a Claim
          </Link>
        )}
      </div>

      {/* Ranked Candidates */}
      {showCandidates && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-4 space-y-3"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Ranked Candidates ({candidates.length})
          </h5>
          {candidates.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              No workers have submitted CVs yet.
            </p>
          ) : (
            candidates.map((w, i) => (
              <div key={w.workerId}
                className="flex items-center gap-4 rounded-lg border p-3"
                style={{ borderColor: "var(--color-border)" }}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? "#f59e0b" : "var(--color-neutral-400)" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    {w.specialization} · {w.yearsOfExperience} yrs exp
                  </p>
                </div>
                <div className="flex items-center gap-1 mr-3">
                  <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                    {w.rankScore.toFixed(1)}
                  </span>
                </div>
                <button onClick={() => handleAssign(w.workerId)} disabled={actionLoading}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  Assign
                </button>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
