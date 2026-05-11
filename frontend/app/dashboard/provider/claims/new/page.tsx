"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { claimService } from "@/lib/claimService";

const schema = z.object({
  description: z.string().min(20, "Please provide a detailed description (at least 20 characters)"),
});

type FormData = z.infer<typeof schema>;

export default function FileClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!projectId) { toast.error("No project selected."); return; }
    setLoading(true);
    try {
      const claim = await claimService.fileClaim(projectId, data.description, files);
      toast.success("Claim filed successfully!");
      router.push(`/dashboard/provider/claims/${claim.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to file claim.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/dashboard/provider/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to project
        </Link>
        <h3 style={{ color: "var(--color-primary-800)" }}>File a Claim</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Describe the failure and upload supporting proof documents.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Description of Failure
            </label>
            <textarea {...register("description")} rows={5}
              placeholder="Describe what went wrong, how the worker failed to deliver, and any supporting context..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{
                borderColor: errors.description ? "#ef4444" : "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }} />
            {errors.description && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Proof Documents
            </label>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Upload screenshots, contracts, communications, or photos. JPEG photos with GPS data will have location automatically extracted.
            </p>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition"
              style={{ borderColor: "var(--color-border)" }}>
              <Upload className="h-5 w-5" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Click to upload files
              </span>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx"
                onChange={onFileChange} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                      {f.name}
                    </span>
                    <button type="button" onClick={() => removeFile(i)}>
                      <X className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "#ef4444" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting…
              </span>
            ) : "Submit Claim"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
