import executionApi from "./executionApi";

export interface WorkerCvResponse {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  cvFileUrl: string | null;
  yearsOfExperience: number;
  specialization: string;
  additionalCredentials: string | null;
  ratingScore: number;
  ratingReasoning: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export const workerCvService = {
  async submitOrUpdateCv(
    specialization: string,
    yearsOfExperience: number,
    additionalCredentials: string,
    cvFile?: File
  ): Promise<WorkerCvResponse> {
    const form = new FormData();
    form.append("specialization", specialization);
    form.append("yearsOfExperience", String(yearsOfExperience));
    form.append("additionalCredentials", additionalCredentials);
    if (cvFile) form.append("cvFile", cvFile);
    const res = await executionApi.post<WorkerCvResponse>("/api/worker-cv", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getMyCv(): Promise<WorkerCvResponse> {
    const res = await executionApi.get<WorkerCvResponse>("/api/worker-cv/my");
    return res.data;
  },

  async getWorkerCv(workerId: string): Promise<WorkerCvResponse> {
    const res = await executionApi.get<WorkerCvResponse>(`/api/worker-cv/${workerId}`);
    return res.data;
  },

  async getAllCvs(): Promise<WorkerCvResponse[]> {
    const res = await executionApi.get<WorkerCvResponse[]>("/api/worker-cv/all");
    return res.data;
  },

  async setApprovalStatus(workerId: string, approvalStatus: "APPROVED" | "REJECTED" | "PENDING"): Promise<void> {
    await executionApi.patch(`/api/worker-cv/${workerId}/approval`, { approvalStatus });
  },
};
