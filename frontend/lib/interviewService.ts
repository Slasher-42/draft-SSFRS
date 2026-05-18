import executionApi from "./executionApi";

export interface InterviewAnswer {
  questionIndex: number;
  question: string;
  transcript: string;
  durationSec: number;
}

export interface InterviewResponse {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  answersJson: string;
  interviewScore: number;
  status: "SUBMITTED" | "UNDER_REVIEW" | "SCORED";
  submittedAt: string;
  reviewedAt: string | null;
}

export const interviewService = {
  async submitInterview(answers: InterviewAnswer[]): Promise<InterviewResponse> {
    const res = await executionApi.post<InterviewResponse>("/api/interviews", {
      answersJson: JSON.stringify(answers),
    });
    return res.data;
  },

  async getMyInterview(): Promise<InterviewResponse> {
    const res = await executionApi.get<InterviewResponse>("/api/interviews/my");
    return res.data;
  },

  async getAllInterviews(): Promise<InterviewResponse[]> {
    const res = await executionApi.get<InterviewResponse[]>("/api/interviews/all");
    return res.data;
  },

  async scoreInterview(id: string, score: number): Promise<InterviewResponse> {
    const res = await executionApi.patch<InterviewResponse>(`/api/interviews/${id}/score`, { score });
    return res.data;
  },
};
