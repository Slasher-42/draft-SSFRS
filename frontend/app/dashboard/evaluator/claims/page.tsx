"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, MapPin, MessageSquare, ChevronDown, ChevronUp,
  AlertTriangle, Eye, Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { evaluatorService, type EvaluatorClaimResponse, type MessageEvidenceItem } from "@/lib/evaluatorService";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface GeoValidationResult {
  imageCoords: { lat: number; lon: number } | null;
  projectCoords: { lat: number; lon: number } | null;
  distanceKm: number | null;
  projectAddress: string | null;
  valid: boolean | null;
  error: string | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SSFRS-EvaluatorApp/1.0 (evaluation)" },
  });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  return null;
}

export default function EvaluatorClaimsPage() {
  const [claims, setClaims] = useState<EvaluatorClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<Record<string, GeoValidationResult>>({});
  const [geoLoading, setGeoLoading] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [msgExpanded, setMsgExpanded] = useState<Record<string, boolean>>({});

  const loadClaims = useCallback(async () => {
    try {
      const all = await evaluatorService.getAllClaims();
      setClaims(all);
    } catch {
      toast.error("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleValidate = async (claim: EvaluatorClaimResponse) => {
    if (!claim.constructionLocation) {
      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords: null, projectCoords: null, distanceKm: null,
          projectAddress: null, valid: null,
          error: "No construction location recorded for this project.",
        },
      }));
      return;
    }

    if (!claim.extractedLat || !claim.extractedLon) {
      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords: null, projectCoords: null, distanceKm: null,
          projectAddress: claim.constructionLocation,
          valid: null, error: "No GPS data found in the uploaded ghost project images.",
        },
      }));
      return;
    }

    setGeoLoading(prev => ({ ...prev, [claim.id]: true }));
    try {
      const projectCoords = await geocodeAddress(claim.constructionLocation);
      const imageCoords = { lat: claim.extractedLat, lon: claim.extractedLon };

      if (!projectCoords) {
        setGeoResults(prev => ({
          ...prev,
          [claim.id]: {
            imageCoords, projectCoords: null, distanceKm: null,
            projectAddress: claim.constructionLocation,
            valid: null, error: `Could not geocode address: "${claim.constructionLocation}". Try a more specific address.`,
          },
        }));
        return;
      }

      const distanceKm = haversineKm(imageCoords.lat, imageCoords.lon, projectCoords.lat, projectCoords.lon);
      const THRESHOLD_KM = 1.0;
      const valid = distanceKm <= THRESHOLD_KM;

      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords, projectCoords, distanceKm,
          projectAddress: claim.constructionLocation,
          valid, error: null,
        },
      }));
    } catch {
      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords: null, projectCoords: null, distanceKm: null,
          projectAddress: claim.constructionLocation,
          valid: null, error: "Geolocation validation failed. Check your internet connection.",
        },
      }));
    } finally {
      setGeoLoading(prev => ({ ...prev, [claim.id]: false }));
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await evaluatorService.approveClaim(id);
      setClaims(prev => prev.map(c => c.id === id ? updated : c));
      toast.success("Claim approved. Worker notified.");
    } catch {
      toast.error("Failed to approve claim.");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await evaluatorService.rejectClaim(id);
      setClaims(prev => prev.map(c => c.id === id ? updated : c));
      toast.success("Claim rejected.");
    } catch {
      toast.error("Failed to reject claim.");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const filtered = claims.filter(c =>
    statusFilter === "ALL" ? true : c.status === statusFilter
  );

  const parseMessages = (json: string | null): MessageEvidenceItem[] => {
    if (!json) return [];
    try { return JSON.parse(json) as MessageEvidenceItem[]; } catch { return []; }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: "#f59e0b", text: "Pending" },
      APPROVED: { bg: "#22c55e", text: "Approved" },
      REJECTED: { bg: "#ef4444", text: "Rejected" },
    };
    const style = map[s] ?? { bg: "#6b7280", text: s };
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
        style={{ backgroundColor: style.bg }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Submitted Claims</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Review, validate, and decide on filed claims.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{
                backgroundColor: statusFilter === s ? "var(--color-primary)" : "var(--color-neutral-100)",
                color: statusFilter === s ? "#fff" : "var(--color-foreground)",
              }}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border py-12 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            No claims found{statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((claim) => {
            const isConstruction = !!claim.constructionLocation;
            const isExpanded = expandedId === claim.id;
            const messages = parseMessages(claim.messageEvidence);
            const geo = geoResults[claim.id];

            return (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                <button
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:opacity-80 transition"
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(claim.status)}
                      {isConstruction && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                          Construction
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                      Project: {claim.projectId.slice(0, 8)}…
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Filed {new Date(claim.createdAt).toLocaleDateString()} · Provider: {claim.providerId.slice(0, 8)}…
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <div className="pt-4 space-y-1">
                          <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Description</p>
                          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.description}</p>
                        </div>

                        {claim.workerResponse && (
                          <div className="rounded-lg border p-3 space-y-1"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Worker Response</p>
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.workerResponse}</p>
                          </div>
                        )}

                        {claim.proofDocumentUrls.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                              Proof Documents ({claim.proofDocumentUrls.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {claim.proofDocumentUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition hover:opacity-80"
                                  style={{ borderColor: "var(--color-border)", color: "var(--color-primary-600)" }}>
                                  <Eye className="h-3 w-3" /> Document {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {messages.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" style={{ color: "var(--color-primary-600)" }} />
                              <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                                Message Evidence ({messages.length} messages)
                              </p>
                              <button
                                onClick={() => setMsgExpanded(prev => ({ ...prev, [claim.id]: !prev[claim.id] }))}
                                className="text-xs"
                                style={{ color: "var(--color-primary-600)" }}>
                                {msgExpanded[claim.id] ? "Hide" : "View"}
                              </button>
                            </div>
                            <AnimatePresence>
                              {msgExpanded[claim.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="max-h-56 overflow-y-auto rounded-lg border p-3 space-y-3"
                                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                                    {messages.map((m) => (
                                      <div key={m.id}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{m.senderName}</span>
                                          <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                            {new Date(m.sentAt).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{m.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {isConstruction && claim.ghostProjectImageUrls.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" style={{ color: "#ef4444" }} />
                                <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                                  Ghost Project Images ({claim.ghostProjectImageUrls.length})
                                </p>
                              </div>
                              <button
                                onClick={() => handleValidate(claim)}
                                disabled={geoLoading[claim.id]}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-50"
                                style={{ backgroundColor: "#ef4444" }}>
                                {geoLoading[claim.id] ? (
                                  <>
                                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                    Validating…
                                  </>
                                ) : "Validate Location"}
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {claim.ghostProjectImageUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt=""
                                    className="w-full h-24 object-cover rounded-lg border"
                                    style={{ borderColor: "var(--color-border)" }} />
                                </a>
                              ))}
                            </div>

                            {geo && (
                              <div className="rounded-xl border p-4 space-y-2"
                                style={{
                                  borderColor: geo.error ? "var(--color-border)"
                                    : geo.valid ? "#22c55e" : "#ef4444",
                                  backgroundColor: geo.error ? "var(--color-background)"
                                    : geo.valid
                                      ? "color-mix(in srgb, #22c55e 8%, transparent)"
                                      : "color-mix(in srgb, #ef4444 8%, transparent)",
                                }}>
                                {geo.error ? (
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                                    <p className="text-xs" style={{ color: "var(--color-foreground)" }}>{geo.error}</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      {geo.valid
                                        ? <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
                                        : <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />}
                                      <p className="text-sm font-semibold"
                                        style={{ color: geo.valid ? "#16a34a" : "#dc2626" }}>
                                        {geo.valid ? "Location Validated" : "Location Mismatch"}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>
                                          Image GPS Coordinates
                                        </p>
                                        <p style={{ color: "var(--color-muted-foreground)" }}>
                                          {geo.imageCoords?.lat.toFixed(6)}, {geo.imageCoords?.lon.toFixed(6)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>
                                          Project Address Coordinates
                                        </p>
                                        <p style={{ color: "var(--color-muted-foreground)" }}>
                                          {geo.projectCoords?.lat.toFixed(6)}, {geo.projectCoords?.lon.toFixed(6)}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                      Distance between image location and project site:{" "}
                                      <strong style={{ color: "var(--color-foreground)" }}>
                                        {geo.distanceKm?.toFixed(3)} km
                                      </strong>
                                      {" "}(threshold: 1.0 km)
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                      Project address: <strong>{geo.projectAddress}</strong>
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {claim.status === "PENDING" && (
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => handleApprove(claim.id)}
                              disabled={!!actionLoading[claim.id]}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                              style={{ backgroundColor: "#22c55e" }}>
                              {actionLoading[claim.id] ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                <><CheckCircle className="h-4 w-4" /> Approve Claim</>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(claim.id)}
                              disabled={!!actionLoading[claim.id]}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                              style={{ backgroundColor: "#ef4444" }}>
                              {actionLoading[claim.id] ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                <><XCircle className="h-4 w-4" /> Reject Claim</>
                              )}
                            </button>
                          </div>
                        )}

                        {claim.status !== "PENDING" && (
                          <div className="flex items-center gap-2 pt-2">
                            {claim.status === "APPROVED"
                              ? <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
                              : <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />}
                            <p className="text-sm font-medium"
                              style={{ color: claim.status === "APPROVED" ? "#16a34a" : "#dc2626" }}>
                              This claim has been {claim.status.toLowerCase()}.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
