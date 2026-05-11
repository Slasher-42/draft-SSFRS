import executionApi from "./executionApi";

export interface CreateProjectRequest {
  title: string;
  scopeOfWork: string;
  requiredSkills: string;
  deadline: string; // ISO date string yyyy-MM-dd
  budget: number;
}

export interface ProjectResponse {
  id: string;
  providerId: string;
  title: string;
  scopeOfWork: string;
  requiredSkills: string;
  deadline: string;
  budget: number;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "FAILED";
  assignedWorkerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RankedWorkerResponse {
  workerId: string;
  workerName: string;
  workerEmail: string;
  specialization: string;
  yearsOfExperience: number;
  ratingScore: number;
  rankScore: number;
}

export const projectService = {
  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const res = await executionApi.post<ProjectResponse>("/api/projects", data);
    return res.data;
  },

  async getMyProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/my");
    return res.data;
  },

  async getAssignedProjects(): Promise<ProjectResponse[]> {
    const res = await executionApi.get<ProjectResponse[]>("/api/projects/assigned");
    return res.data;
  },

  async getProject(id: string): Promise<ProjectResponse> {
    const res = await executionApi.get<ProjectResponse>(`/api/projects/${id}`);
    return res.data;
  },

  async markCompleted(id: string): Promise<ProjectResponse> {
    const res = await executionApi.patch<ProjectResponse>(`/api/projects/${id}/complete`);
    return res.data;
  },

  async markFailed(id: string): Promise<ProjectResponse> {
    const res = await executionApi.patch<ProjectResponse>(`/api/projects/${id}/fail`);
    return res.data;
  },

  async getCandidates(id: string): Promise<RankedWorkerResponse[]> {
    const res = await executionApi.get<RankedWorkerResponse[]>(`/api/projects/${id}/candidates`);
    return res.data;
  },

  async assignWorker(projectId: string, workerId: string): Promise<ProjectResponse> {
    const res = await executionApi.post<ProjectResponse>(
      `/api/projects/${projectId}/assign/${workerId}`
    );
    return res.data;
  },
};
