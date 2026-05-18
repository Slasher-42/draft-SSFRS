"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Star, CheckCircle, XCircle, Search,
  Briefcase, Mail, Loader2, Video, User,
} from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService, type WorkerCvResponse } from "@/lib/workerCvService";
import { interviewService, type InterviewResponse } from "@/lib/interviewService";

const APPROVED_KEY = "ssfrs_approved_workers";
const REJECTED_KEY = "ssfrs_rejected_workers";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveSet(key: string, s: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...s]));
}

interface AlumniWorker extends WorkerCvResponse {
  interviewScore?: number;
  interviewStatus?: "pending" | "submitted" | "not_started";
  interviewId?: string;
}

export default function AdminAlumniPage() {
  const [workers, setWorkers] = useState<AlumniWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [actioning, setActioning] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "pending">("all");

  useEffect(() => {
    setApproved(loadSet(APPROVED_KEY));
    setRejected(loadSet(REJECTED_KEY));

    Promise.allSettled([
      workerCvService.getAllCvs(),
      interviewService.getAllInterviews(),
    ]).then(([cvsRes, interviewsRes]) => {
      const cvs = cvsRes.status === "fulfilled" ? cvsRes.value : [];
      const interviews: InterviewResponse[] = interviewsRes.status === "fulfilled" ? interviewsRes.value : [];
      const interviewMap = new Map(interviews.map((i) => [i.workerId, i]));
      setWorkers(cvs.map((cv) => {
        const interview = interviewMap.get(cv.workerId);
        return {
          ...cv,
          interviewScore: interview?.interviewScore,
          interviewStatus: interview ? (interview.status === "SCORED" ? "submitted" : "pending") : "not_started",
          interviewId: interview?.id,
        };
      }));
    }).finally(() => setLoading(false));
  }, []);

  const approve = async (workerId: string, workerName: string) => {
    setActioning(workerId);
    await new Promise((r) => setTimeout(r, 700));
    const newApproved = new Set(approved).add(workerId);
    const newRejected = new Set(rejected);
    newRejected.delete(workerId);
    setApproved(newApproved);
    setRejected(newRejected);
    saveSet(APPROVED_KEY, newApproved);
    saveSet(REJECTED_KEY, newRejected);
    setActioning(null);
    toast.success(`${workerName} has been approved.`);
  };

  const reject = async (workerId: string, workerName: string) => {
    setActioning(workerId);
    await new Promise((r) => setTimeout(r, 700));
    const newRejected = new Set(rejected).add(workerId);
    const newApproved = new Set(approved);
    newApproved.delete(workerId);
    setRejected(newRejected);
    setApproved(newApproved);
    saveSet(REJECTED_KEY, newRejected);
    saveSet(APPROVED_KEY, newApproved);
    setActioning(null);
    toast.success(`${workerName}'s profile has been rejected.`);
  };

  const filtered = workers.filter((w) => {
    const matchSearch =
      w.workerName.toLowerCase().includes(search.toLowerCase()) ||
      w.specialization.toLowerCase().includes(search.toLowerCase()) ||
      w.workerEmail.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filter === "approved") return approved.has(w.workerId);
    if (filter === "rejected") return rejected.has(w.workerId);
    if (filter === "pending") return !approved.has(w.workerId) && !rejected.has(w.workerId);
    return true;
  });

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (id: string) => {
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const ratingBar = (score: number, max = 10) => {
    const pct = Math.min(100, (score / max) * 100);
    const color = score >= max * 0.7 ? "#22c55e" : score >= max * 0.4 ? "#f59e0b" : "#ef4444";
    return { pct, color };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>System Alumni</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          View all workers with their AI rating and interview scores. Approve or reject their profiles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", count: workers.length, color: "var(--color-primary)" },
          { label: "Approved", count: workers.filter((w) => approved.has(w.workerId)).length, color: "#22c55e" },
          { label: "Rejected", count: workers.filter((w) => rejected.has(w.workerId)).length, color: "#ef4444" },
          { label: "Pending", count: workers.filter((w) => !approved.has(w.workerId) && !rejected.has(w.workerId)).length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <input type="text" placeholder="Search workers…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }} />
        </div>
        <div className="flex gap-1 rounded-lg border p-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          {(["all", "approved", "pending", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition capitalize"
              style={{
                backgroundColor: filter === f ? "var(--color-primary)" : "transparent",
                color: filter === f ? "white" : "var(--color-muted-foreground)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <User className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No workers found</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers will appear here once they submit their CVs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((w, i) => {
              const isApproved = approved.has(w.workerId);
              const isRejected = rejected.has(w.workerId);
              const aiBar = ratingBar(w.ratingScore, 10);
              const intBar = w.interviewScore !== undefined ? ratingBar(w.interviewScore, 100) : null;

              return (
                <motion.div key={w.workerId}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: isApproved ? "#22c55e60" : isRejected ? "#ef444460" : "var(--color-border)",
                  }}>
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
                          style={{ backgroundColor: avatarColor(w.workerId) }}>
                          {initials(w.workerName)}
                        </div>
                        {isApproved && (
                          <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                        )}
                        {isRejected && (
                          <XCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-red-500 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: isApproved ? "#22c55e20" : isRejected ? "#ef444420" : "#f59e0b20",
                              color: isApproved ? "#22c55e" : isRejected ? "#ef4444" : "#f59e0b",
                            }}>
                            {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3.5 w-3.5" style={{ color: "var(--color-neutral-400)" }} />
                          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3.5 w-3.5" style={{ color: "var(--color-neutral-400)" }} />
                          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                            {w.specialization} · {w.yearsOfExperience} yrs exp
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-5 w-5" style={{ color: "#f59e0b" }} />
                        <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                          {w.ratingScore.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                            <Award className="h-3.5 w-3.5" />
                            AI Rating
                          </span>
                          <span style={{ color: aiBar.color }}>{w.ratingScore.toFixed(1)} / 10</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                          <div className="h-2 rounded-full" style={{ width: `${aiBar.pct}%`, backgroundColor: aiBar.color }} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                            <Video className="h-3.5 w-3.5" />
                            Interview Score
                          </span>
                          <span style={{ color: intBar ? intBar.color : "var(--color-muted-foreground)" }}>
                            {w.interviewStatus === "submitted" && w.interviewScore !== undefined
                              ? `${w.interviewScore} / 100`
                              : w.interviewStatus === "pending" ? "In Review"
                              : "Not Started"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                          {intBar && (
                            <div className="h-2 rounded-full"
                              style={{ width: `${intBar.pct}%`, backgroundColor: intBar.color }} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isApproved && !isRejected && (
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => approve(w.workerId, w.workerName)}
                          disabled={actioning === w.workerId}
                          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                          style={{ backgroundColor: "#22c55e" }}>
                          {actioning === w.workerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve
                        </button>
                        <button onClick={() => reject(w.workerId, w.workerName)}
                          disabled={actioning === w.workerId}
                          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                          style={{ backgroundColor: "#ef4444" }}>
                          {actioning === w.workerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#22c55e" }}>
                          <CheckCircle className="h-4 w-4" />
                          Profile Approved — eligible for project matching
                        </p>
                        <button onClick={() => reject(w.workerId, w.workerName)}
                          disabled={actioning === w.workerId}
                          className="text-xs border rounded-lg px-3 py-1.5 transition"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                          Revoke & Reject
                        </button>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#ef4444" }}>
                          <XCircle className="h-4 w-4" />
                          Profile Rejected — hidden from all project matching
                        </p>
                        <button onClick={() => approve(w.workerId, w.workerName)}
                          disabled={actioning === w.workerId}
                          className="text-xs border rounded-lg px-3 py-1.5 transition"
                          style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                          Re-approve
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
