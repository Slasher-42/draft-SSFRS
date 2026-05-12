"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, DollarSign, User,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, ProjectImageResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    projectService.getProject(id)
      .then(setProject)
      .catch(() => toast.error("Project not found."))
      .finally(() => setLoading(false));
  }, [id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null || !project?.images?.length) return;
    const total = project.images.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setLightboxIndex((i) => i !== null ? (i + 1) % total : null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => i !== null ? (i - 1 + total) % total : null);
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, project?.images?.length]);

  const handleStatusChange = async (action: "complete" | "fail") => {
    setActionLoading(true);
    try {
      const updated = action === "complete"
        ? await projectService.markCompleted(id)
        : await projectService.markFailed(id);
      setProject(updated);
      toast.success(action === "complete" ? "Project marked as completed!" : "Project marked as failed.");
      if (action === "fail") router.push(`/dashboard/provider/claims/new?projectId=${id}`);
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

  const images = project.images ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link href="/dashboard/provider/projects"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h3 style={{ color: "var(--color-primary-800)" }}>{project.title}</h3>
          <span className="flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Project details card */}
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

      {/* Supporting Images Gallery */}
      {images.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border p-5"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-xs font-medium mb-4" style={{ color: "var(--color-muted-foreground)" }}>
            SUPPORTING IMAGES ({images.length})
          </p>
          <ImageGallery images={images} onOpen={setLightboxIndex} />
        </motion.div>
      )}

      {/* Actions */}
      {project.status === "OPEN" && (
        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            This project is open. The system administrator will review AI-ranked candidates and assign the best-matched worker.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images[lightboxIndex] && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
            onNext={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Image Grid ─── */
function ImageGallery({
  images,
  onOpen,
}: {
  images: ProjectImageResponse[];
  onOpen: (i: number) => void;
}) {
  if (images.length === 1) {
    return (
      <div className="space-y-2">
        <button onClick={() => onOpen(0)} className="w-full overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--color-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0].imageUrl} alt={images[0].description}
            className="w-full object-cover max-h-72" />
        </button>
        <p className="text-xs text-center" style={{ color: "var(--color-muted-foreground)" }}>
          {images[0].description}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((img, i) => (
        <button key={img.id} onClick={() => onOpen(i)}
          className="group relative overflow-hidden rounded-xl aspect-square"
          style={{ border: "1px solid var(--color-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.imageUrl} alt={img.description}
            className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
          <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition duration-200"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
            <p className="p-2 text-xs text-white text-left line-clamp-2 leading-tight">
              {img.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Lightbox ─── */
function Lightbox({
  images, index, onClose, onPrev, onNext,
}: {
  images: ProjectImageResponse[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const img = images[index];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      {/* Close */}
      <button className="absolute top-4 right-4 text-white z-10 p-1 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        onClick={onClose}>
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
        {index + 1} / {images.length}
      </p>

      {/* Prev */}
      {images.length > 1 && (
        <button className="absolute left-4 text-white p-2 rounded-full z-10"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center gap-3 px-16 max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.imageUrl} alt={img.description}
          className="max-h-[75vh] max-w-full rounded-xl object-contain" />
        <div className="text-center">
          <p className="text-sm font-medium text-white">{img.description}</p>
          <p className="text-xs mt-0.5 text-white/50">Image {index + 1} of {images.length}</p>
        </div>
      </motion.div>

      {/* Next */}
      {images.length > 1 && (
        <button className="absolute right-4 text-white p-2 rounded-full z-10"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          onClick={(e) => { e.stopPropagation(); onNext(); }}>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}
