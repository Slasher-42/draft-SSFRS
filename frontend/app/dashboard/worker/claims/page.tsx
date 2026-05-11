"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, MessageSquare, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { claimService, ClaimResponse } from "@/lib/claimService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const responseSchema = z.object({
  response: z.string().min(10, "Please provide a detailed response"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", UNDER_REVIEW: "#3b82f6", APPROVED: "#22c55e", REJECTED: "#ef4444",
};

export default function WorkerClaimsPage() {
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
  });

  useEffect(() => {
    claimService.getClaimsAgainstMe()
      .then(setClaims)
      .catch(() => toast.error("Failed to load claims."))
      .finally(() => setLoading(false));
  }, []);

  const onRespond = async (claimId: string, data: ResponseFormData) => {
    setSubmitting(true);
    try {
      const updated = await claimService.respondToClaim(claimId, data.response);
      setClaims(prev => prev.map(c => c.id === claimId ? updated : c));
      setRespondingTo(null);
      reset();
      toast.success("Response submitted.");
    } catch {
      toast.error("Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Claims Against Me</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Review claims filed against you and submit your response.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <AlertCircle className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No claims against you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border p-5 space-y-4"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                    Claim #{c.id.slice(0, 8)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    Filed {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: statusColor[c.status] + "20", color: statusColor[c.status] }}>
                  {c.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                  CLAIM DESCRIPTION
                </p>
                <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{c.description}</p>
              </div>

              {(c.extractedLat || c.extractedLon) && (
                <div className="flex items-center gap-2 rounded-lg p-2"
                  style={{ backgroundColor: "var(--color-neutral-50)" }}>
                  <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
                  <span className="text-xs" style={{ color: "var(--color-foreground)" }}>
                    GPS verified photo: {c.extractedLat?.toFixed(4)}, {c.extractedLon?.toFixed(4)}
                    {c.extractedPhotoTimestamp && ` · ${c.extractedPhotoTimestamp}`}
                  </span>
                </div>
              )}

              {c.workerResponse ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-neutral-50)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                    YOUR RESPONSE
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{c.workerResponse}</p>
                </div>
              ) : (
                <>
                  {respondingTo === c.id ? (
                    <form onSubmit={handleSubmit((data) => onRespond(c.id, data))} className="space-y-3">
                      <textarea {...register("response")} rows={4}
                        placeholder="Acknowledge the failure, provide your counter-explanation, or dispute the claim..."
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                        style={{
                          borderColor: errors.response ? "#ef4444" : "var(--color-border)",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-foreground)",
                        }} />
                      {errors.response && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{errors.response.message}</p>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                          style={{ backgroundColor: "var(--color-primary)" }}>
                          <MessageSquare className="h-4 w-4" />
                          {submitting ? "Submitting…" : "Submit Response"}
                        </button>
                        <button type="button" onClick={() => { setRespondingTo(null); reset(); }}
                          className="rounded-lg px-4 py-2 text-sm border transition"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setRespondingTo(c.id)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                      <MessageSquare className="h-4 w-4" />
                      Respond to Claim
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
