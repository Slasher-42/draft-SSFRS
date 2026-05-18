import executionApi from "./executionApi";

export interface ContractResponse {
  id: string;
  projectId: string;
  projectTitle: string;
  workerId: string;
  workerName: string;
  providerId: string;
  providerName: string;
  workerSigned: boolean;
  workerSignedAt: string | null;
  providerSigned: boolean;
  providerSignedAt: string | null;
  adminValidated: boolean;
  validatedAt: string | null;
  createdAt: string;
}

export const contractService = {
  async getMyContracts(): Promise<ContractResponse[]> {
    const res = await executionApi.get<ContractResponse[]>("/api/contracts/my");
    return res.data;
  },

  async getOrCreateForProject(projectId: string): Promise<ContractResponse> {
    const res = await executionApi.post<ContractResponse>(`/api/contracts/project/${projectId}`);
    return res.data;
  },

  async sign(contractId: string): Promise<ContractResponse> {
    const res = await executionApi.patch<ContractResponse>(`/api/contracts/${contractId}/sign`);
    return res.data;
  },

  async getAllContracts(): Promise<ContractResponse[]> {
    const res = await executionApi.get<ContractResponse[]>("/api/contracts/all");
    return res.data;
  },

  async validate(contractId: string): Promise<ContractResponse> {
    const res = await executionApi.patch<ContractResponse>(`/api/contracts/${contractId}/validate`);
    return res.data;
  },
};
