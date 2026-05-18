"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSignature, CheckCircle, Clock, Shield, Loader2, Eye, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { contractService, type ContractResponse } from "@/lib/contractService";
import { projectService, type ProjectResponse } from "@/lib/projectService";

export default function ContractPage({ role }: { role: "PROVIDER" | "WORKER" }) {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [myContracts, assignedProjects] = await Promise.allSettled([
        contractService.getMyContracts(),
        projectService.getAssignedProjects(),
      ]);

      const contractList = myContracts.status === "fulfilled" ? myContracts.value : [];
      const projectList = assignedProjects.status === "fulfilled" ? assignedProjects.value : [];
      setProjects(projectList);

      /* Auto-create contracts for assigned projects that don't have one */
      const existing = new Set(contractList.map((c) => c.projectId));
      const created: ContractResponse[] = [...contractList];
      await Promise.allSettled(
        projectList
          .filter((p) => p.assignedWorkerId && !existing.has(p.id))
          .map(async (p) => {
            try {
              const c = await contractService.getOrCreateForProject(p.id);
              created.push(c);
            } catch { /* ok */ }
          })
      );
      setContracts(created);
    } catch {
      toast.error("Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role]);

  const sign = async (contractId: string) => {
    setSigning(contractId);
    try {
      const updated = await contractService.sign(contractId);
      setContracts((prev) => prev.map((c) => c.id === contractId ? updated : c));
      toast.success("Contract signed successfully!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to sign contract.";
      toast.error(msg);
    } finally {
      setSigning(null);
    }
  };

  const viewing = contracts.find((c) => c.id === viewingId) ?? null;
  const project = projects.find((p) => p.id === viewing?.projectId) ?? null;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Contracts</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Sign contracts for your assigned projects. Both parties must sign, then admin validates.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm border transition"
          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <FileSignature className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No contracts yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Contracts appear here once you have an assigned project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c, i) => {
            const mySigned = role === "WORKER" ? c.workerSigned : c.providerSigned;
            const otherSigned = role === "WORKER" ? c.providerSigned : c.workerSigned;
            const fullySignedAndValidated = c.workerSigned && c.providerSigned && c.adminValidated;
            const fullySigned = c.workerSigned && c.providerSigned;

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{c.projectTitle}</h5>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        Created {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: fullySignedAndValidated ? "#22c55e20" : fullySigned ? "#3b82f620" : "#f59e0b20",
                        color: fullySignedAndValidated ? "#22c55e" : fullySigned ? "#3b82f6" : "#f59e0b",
                      }}>
                      {fullySignedAndValidated ? "Validated" : fullySigned ? "Awaiting Admin" : "Pending Signatures"}
                    </span>
                  </div>

                  {/* Signature status */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Worker", signed: c.workerSigned, at: c.workerSignedAt },
                      { label: "Provider", signed: c.providerSigned, at: c.providerSignedAt },
                      { label: "Admin", signed: c.adminValidated, at: c.validatedAt },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg p-3 text-center space-y-1.5"
                        style={{ backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-border)" }}>
                        <div className="flex justify-center">
                          {s.signed
                            ? <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />
                            : <Clock className="h-5 w-5" style={{ color: "var(--color-neutral-400)" }} />}
                        </div>
                        <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{s.label}</p>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          {s.signed ? (s.at ? new Date(s.at).toLocaleDateString() : "Validated") : "Pending"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setViewingId(c.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                      <Eye className="h-3.5 w-3.5" />
                      View Contract
                    </button>
                    {!mySigned && (
                      <button onClick={() => sign(c.id)} disabled={signing === c.id}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-white transition"
                        style={{ backgroundColor: "var(--color-primary)" }}>
                        {signing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
                        {signing === c.id ? "Signing…" : "Sign Contract"}
                      </button>
                    )}
                    {mySigned && !otherSigned && (
                      <p className="text-xs self-center" style={{ color: "var(--color-muted-foreground)" }}>
                        Waiting for the other party to sign.
                      </p>
                    )}
                    {fullySigned && !c.adminValidated && (
                      <p className="flex items-center gap-1 text-xs self-center" style={{ color: "#3b82f6" }}>
                        <Shield className="h-3.5 w-3.5" />
                        Awaiting admin validation.
                      </p>
                    )}
                    {fullySignedAndValidated && (
                      <p className="flex items-center gap-1 text-xs self-center" style={{ color: "#22c55e" }}>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Contract fully validated!
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Contract viewer modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setViewingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-5"
              style={{ backgroundColor: "var(--color-card)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-lg" style={{ color: "var(--color-foreground)" }}>SERVICE CONTRACT</h4>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                  Agreement No. {viewing.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="space-y-3 text-sm" style={{ color: "var(--color-foreground)" }}>
                <p><strong>Project:</strong> {viewing.projectTitle}</p>
                {project && (
                  <>
                    <p><strong>Scope of Work:</strong> {project.scopeOfWork}</p>
                    <p><strong>Budget:</strong> {Number(project.budget).toLocaleString()}</p>
                    <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                  </>
                )}
                <p><strong>Worker:</strong> {viewing.workerName}</p>
                <p><strong>Provider:</strong> {viewing.providerName}</p>
              </div>
              <div className="rounded-lg p-4 text-xs space-y-2"
                style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-muted-foreground)" }}>
                <p>This contract constitutes a legally binding agreement between the Worker and Project Provider.
                   The Worker agrees to deliver the specified scope of work by the deadline in exchange for the agreed budget.
                   Any disputes will be mediated through the SSFRS platform dispute resolution system.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[{ label: "Worker", signed: viewing.workerSigned, at: viewing.workerSignedAt },
                  { label: "Provider", signed: viewing.providerSigned, at: viewing.providerSignedAt }].map((s) => (
                  <div key={s.label} className="text-center space-y-1">
                    {s.signed
                      ? <p className="text-xs font-medium" style={{ color: "#22c55e" }}>✓ {s.label} signed {s.at ? `on ${new Date(s.at).toLocaleDateString()}` : ""}</p>
                      : <div className="border-t-2 border-dashed pt-2 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>{s.label} signature</div>}
                  </div>
                ))}
              </div>
              <button onClick={() => setViewingId(null)}
                className="w-full rounded-lg py-2 text-sm font-medium border transition"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
