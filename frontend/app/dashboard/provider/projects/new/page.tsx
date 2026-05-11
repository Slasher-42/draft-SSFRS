"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { projectService } from "@/lib/projectService";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  scopeOfWork: z.string().min(10, "Please describe the scope of work"),
  requiredSkills: z.string().min(2, "Required skills are needed"),
  deadline: z.string().min(1, "Deadline is required"),
  budget: z.number({ error: "Budget must be a number" }).positive("Budget must be greater than 0"),
});

type FormData = z.infer<typeof schema>;

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-background)",
  color: "var(--color-foreground)",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await projectService.createProject({
        ...data,
        deadline: data.deadline,
        budget: data.budget,
      });
      toast.success("Project posted successfully!");
      router.push("/dashboard/provider/projects");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to post project.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/provider/projects"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <h3 style={{ color: "var(--color-primary-800)" }}>Post a Project</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Fill in the details and the AI Engine will rank eligible workers for you.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Project Title" error={errors.title?.message}>
            <input {...register("title")} placeholder="e.g. Build a mobile app" className="field-input"
              style={{ ...inputStyle, borderColor: errors.title ? "#ef4444" : "var(--color-border)" }} />
          </Field>

          <Field label="Scope of Work" error={errors.scopeOfWork?.message}>
            <textarea {...register("scopeOfWork")} rows={4}
              placeholder="Describe what needs to be done in detail..."
              className="field-input resize-none"
              style={{ ...inputStyle, borderColor: errors.scopeOfWork ? "#ef4444" : "var(--color-border)" }} />
          </Field>

          <Field label="Required Skills" error={errors.requiredSkills?.message}>
            <input {...register("requiredSkills")} placeholder="e.g. React, Node.js, PostgreSQL"
              className="field-input"
              style={{ ...inputStyle, borderColor: errors.requiredSkills ? "#ef4444" : "var(--color-border)" }} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Deadline" error={errors.deadline?.message}>
              <input {...register("deadline")} type="date" className="field-input"
                style={{ ...inputStyle, borderColor: errors.deadline ? "#ef4444" : "var(--color-border)" }} />
            </Field>

            <Field label="Budget ($)" error={errors.budget?.message}>
              <input {...register("budget", { valueAsNumber: true })} type="number" step="0.01"
                placeholder="5000" className="field-input"
                style={{ ...inputStyle, borderColor: errors.budget ? "#ef4444" : "var(--color-border)" }} />
            </Field>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Posting…
              </span>
            ) : "Post Project"}
          </button>
        </form>
      </motion.div>

      <style>{`.field-input{width:100%;border-radius:0.5rem;border-width:1px;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
