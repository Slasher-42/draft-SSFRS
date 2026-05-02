import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: "PROVIDER" | "WORKER";
}

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/api/auth/login", data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const res = await api.post<UserResponse>("/api/auth/register", data);
    return res.data;
  },

  saveSession(data: LoginResponse) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
  },

  getSession(): LoginResponse | null {
    const user = localStorage.getItem("user");
    if (!user) return null;
    try {
      return JSON.parse(user) as LoginResponse;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.clear();
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  getDashboardPath(role: string): string {
    switch (role) {
      case "ADMIN":         return "/dashboard/admin";
      case "PROVIDER":      return "/dashboard/provider";
      case "WORKER":        return "/dashboard/worker";
      case "EVALUATOR":     return "/dashboard/evaluator";
      case "REFUND_OFFICE": return "/dashboard/refund-office";
      default:              return "/login";
    }
  },
};