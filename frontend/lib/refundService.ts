import axios from "axios";

const EXECUTION_API_URL =
  process.env.NEXT_PUBLIC_EXECUTION_API_URL || "http://localhost:8082";

const refundApi = axios.create({
  baseURL: EXECUTION_API_URL,
  headers: { "Content-Type": "application/json" },
});

refundApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RefundClaimResponse {
  id: string;
  projectId: string;
  providerId: string;
  workerId: string;
  description: string;
  status: string;
  proofDocumentUrls: string[];
  ghostProjectImageUrls: string[];
  messageEvidence: string | null;
  geotagPhotoUrl: string | null;
  extractedLat: number | null;
  extractedLon: number | null;
  extractedPhotoTimestamp: string | null;
  workerResponse: string | null;
  aiMediationReport: string | null;
  projectBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

export const refundService = {
  async getRefundPendingClaims(): Promise<RefundClaimResponse[]> {
    const res = await refundApi.get<RefundClaimResponse[]>("/api/refund-office/claims");
    return res.data;
  },

  async processRefund(claimId: string): Promise<RefundClaimResponse> {
    const res = await refundApi.patch<RefundClaimResponse>(`/api/refund-office/claims/${claimId}/process-refund`);
    return res.data;
  },
};
