"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { FileText, Upload, Star } from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService, WorkerCvResponse } from "@/lib/workerCvService";

const schema = z.object({
  specialization: z.string().min(2, "Specialization is required"),
  yearsOfExperience: z.number({ error: "Must be a number" }).min(0).max(50),
  additionalCredentials: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WorkerCvPage() {
  const [existing, setExisting] = useState<WorkerCvResponse | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    workerCvService.getMyCv()
      .then((cv) => {
        setExisting(cv);
        reset({
          specialization: cv.specialization,
          yearsOfExperience: cv.yearsOfExperience,
          additionalCredentials: cv.additionalCredentials ?? "",
        });
      })
      .catch(() => { /* no CV yet — show empty form */ })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const updated = await workerCvService.submitOrUpdateCv(
        data.specialization,
        data.yearsOfExperience,
        data.additionalCredentials ?? "",
        cvFile ?? undefined
      );
      setExisting(updated);
      setCvFile(null);
      toast.success(existing ? "CV updated successfully!" : "CV submitted successfully!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to save CV.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>{existing ? "My CV" : "Submit Your CV"}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {existing
            ? "Update your CV to improve your ranking for new projects."
            : "Submit your CV to be matched with projects. The AI Engine will analyze it and generate your score."}
        </p>
      </div>

      {existing && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-center h-12 w-12 rounded-full"
            style={{ backgroundColor: "var(--color-primary-50, #f5f5f5)" }}>
            <Star className="h-6 w-6" style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              AI Rating Score
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
              {existing.ratingScore.toFixed(1)}
            </p>
          </div>
          {existing.cvFileUrl && (
            <a href={existing.cvFileUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-sm"
              style={{ color: "var(--color-primary)" }}>
              <FileText className="h-4 w-4" />
              View CV
            </a>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Area of Specialization
            </label>
            <input {...register("specialization")} placeholder="e.g. Full-Stack Development, Data Analysis"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ ...inputStyle, borderColor: errors.specialization ? "#ef4444" : "var(--color-border)" }} />
            {errors.specialization && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errors.specialization.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Years of Experience
            </label>
            <input {...register("yearsOfExperience", { valueAsNumber: true })} type="number"
              min={0} max={50} placeholder="5"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ ...inputStyle, borderColor: errors.yearsOfExperience ? "#ef4444" : "var(--color-border)" }} />
            {errors.yearsOfExperience && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errors.yearsOfExperience.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Additional Credentials <span style={{ color: "var(--color-muted-foreground)" }}>(optional)</span>
            </label>
            <textarea {...register("additionalCredentials")} rows={3}
              placeholder="Certifications, portfolio links, notable achievements..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ ...inputStyle }} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              CV File <span style={{ color: "var(--color-muted-foreground)" }}>(PDF, DOC — {existing ? "optional to replace" : "optional"})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition"
              style={{ borderColor: "var(--color-border)" }}>
              <Upload className="h-5 w-5" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {cvFile ? cvFile.name : "Click to upload CV"}
              </span>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={e => setCvFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : existing ? "Update CV" : "Submit CV"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
