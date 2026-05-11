"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Calendar, DollarSign } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function WorkerProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getAssignedProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>My Assigned Projects</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Projects you have been assigned to deliver.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <Briefcase className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No projects assigned yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Submit your CV to get matched with projects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{p.title}</h5>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: statusColor[p.status] + "20", color: statusColor[p.status] }}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm mb-3" style={{ color: "var(--color-muted-foreground)" }}>
                {p.scopeOfWork}
              </p>
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline: {new Date(p.deadline).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {Number(p.budget).toLocaleString()}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  REQUIRED SKILLS
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-foreground)" }}>
                  {p.requiredSkills}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
