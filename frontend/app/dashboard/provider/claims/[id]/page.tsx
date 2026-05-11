"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, FileText, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { claimService, ClaimResponse } from "@/lib/claimService";

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", UNDER_REVIEW: "#3b82f6", APPROVED: "#22c55e", REJECTED: "#ef4444",
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    claimService.getClaim(id)
      .then(setClaim)
      .catch(() => toast.error("Claim not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );

  if (!claim) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/provider/claims"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to claims
        </Link>
        <div className="flex items-start justify-between">
          <h3 style={{ color: "var(--color-primary-800)" }}>Claim #{claim.id.slice(0, 8)}</h3>
          <span className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: statusColor[claim.status] + "20", color: statusColor[claim.status] }}>
            {claim.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Filed {new Date(claim.createdAt).toLocaleString()}
        </p>
      </div>

      <Section title="Description">
        <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.description}</p>
      </Section>

      {claim.proofDocumentUrls.length > 0 && (
        <Section title="Proof Documents">
          <div className="space-y-2">
            {claim.proofDocumentUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-primary)" }}>
                <FileText className="h-4 w-4" />
                Document {i + 1}
              </a>
            ))}
          </div>
        </Section>
      )}

      {(claim.extractedLat || claim.extractedLon) && (
        <Section title="Geotagged Photo Verification">
          <div className="space-y-2">
            {claim.geotagPhotoUrl && (
              <a href={claim.geotagPhotoUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm" style={{ color: "var(--color-primary)" }}>
                View photo
              </a>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {claim.extractedLat?.toFixed(6)}, {claim.extractedLon?.toFixed(6)}
              </span>
            </div>
            {claim.extractedPhotoTimestamp && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
                <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                  {claim.extractedPhotoTimestamp}
                </span>
              </div>
            )}
          </div>
        </Section>
      )}

      {claim.workerResponse && (
        <Section title="Worker Response">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5" style={{ color: "var(--color-neutral-400)" }} />
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.workerResponse}</p>
          </div>
        </Section>
      )}

      {claim.aiMediationReport && (
        <Section title="AI Mediation Report">
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.aiMediationReport}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 space-y-3"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h5>
      {children}
    </motion.div>
  );
}
