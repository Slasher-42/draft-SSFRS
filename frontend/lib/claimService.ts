import executionApi from "./executionApi";

export interface ClaimResponse {
  id: string;
  projectId: string;
  providerId: string;
  workerId: string;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  proofDocumentUrls: string[];
  ghostProjectImageUrls: string[];
  messageEvidence: string | null;
  geotagPhotoUrl: string | null;
  extractedLat: number | null;
  extractedLon: number | null;
  extractedPhotoTimestamp: string | null;
  workerResponse: string | null;
  aiMediationReport: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEvidenceItem {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  sentAt: string;
}

export const claimService = {
  async fileClaim(
    projectId: string,
    description: string,
    proofDocuments: File[],
    ghostProjectImages: File[],
    messageEvidenceJson: string | null
  ): Promise<ClaimResponse> {
    const form = new FormData();
    form.append("projectId", projectId);
    form.append("description", description);
    proofDocuments.forEach((f) => form.append("proofDocuments", f));
    ghostProjectImages.forEach((f) => form.append("ghostProjectImages", f));
    if (messageEvidenceJson) form.append("messageEvidenceJson", messageEvidenceJson);
    const res = await executionApi.post<ClaimResponse>("/api/claims", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getMyClaims(): Promise<ClaimResponse[]> {
    const res = await executionApi.get<ClaimResponse[]>("/api/claims/my");
    return res.data;
  },

  async getClaimsAgainstMe(): Promise<ClaimResponse[]> {
    const res = await executionApi.get<ClaimResponse[]>("/api/claims/against-me");
    return res.data;
  },

  async getAllClaims(): Promise<ClaimResponse[]> {
    const res = await executionApi.get<ClaimResponse[]>("/api/claims/all");
    return res.data;
  },

  async getClaim(id: string): Promise<ClaimResponse> {
    const res = await executionApi.get<ClaimResponse>(`/api/claims/${id}`);
    return res.data;
  },

  async respondToClaim(id: string, response: string): Promise<ClaimResponse> {
    const res = await executionApi.post<ClaimResponse>(`/api/claims/${id}/respond`, { response });
    return res.data;
  },

  async approveClaim(id: string): Promise<ClaimResponse> {
    const res = await executionApi.patch<ClaimResponse>(`/api/claims/${id}/approve`);
    return res.data;
  },

  async rejectClaim(id: string): Promise<ClaimResponse> {
    const res = await executionApi.patch<ClaimResponse>(`/api/claims/${id}/reject`);
    return res.data;
  },

  async getMessageRange(
    partnerId: string,
    from: string,
    to: string
  ): Promise<MessageEvidenceItem[]> {
    const res = await executionApi.get<MessageEvidenceItem[]>("/api/messages/range", {
      params: { partnerId, from, to },
    });
    return res.data;
  },
};
