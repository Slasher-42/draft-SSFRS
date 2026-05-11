"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Plus, Calendar, DollarSign, ChevronRight, Image } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e",
  ASSIGNED: "#3b82f6",
  COMPLETED: "#8b5cf6",
  FAILED: "#ef4444",
};

export default function ProviderProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .getMyProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>My Projects</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} posted
          </p>
        </div>
        <Link
          href="/dashboard/provider/projects/new"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus className="h-4 w-4" />
          Post Project
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span
            className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }}
          />
        </div>
      ) : projects.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <Briefcase
            className="mx-auto mb-3 h-10 w-10"
            style={{ color: "var(--color-neutral-300)" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No projects yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Post your first project to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p, i) => {
            const thumb = p.images?.[0];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/dashboard/provider/projects/${p.id}`}
                  className="flex items-center gap-4 rounded-xl border p-4 transition hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--color-neutral-100)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb.imageUrl}
                        alt={thumb.description}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        className="h-6 w-6"
                        style={{ color: "var(--color-neutral-300)" }}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {p.title}
                      </span>
                      <span
                        className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: statusColor[p.status] + "20",
                          color: statusColor[p.status],
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {p.requiredSkills}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(p.deadline).toLocaleDateString()}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        <DollarSign className="h-3 w-3" />
                        {Number(p.budget).toLocaleString()}
                      </span>
                      {p.images?.length > 0 && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          <Image className="h-3 w-3" />
                          {p.images.length} image{p.images.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--color-neutral-400)" }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
