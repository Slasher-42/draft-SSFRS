
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
  // ── Call the Spring Boot login endpoint ──
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/api/auth/login", data);
    return res.data;
  },

  // ── Call the Spring Boot register endpoint ──
  async register(data: RegisterRequest): Promise<UserResponse> {
    const res = await api.post<UserResponse>("/api/auth/register", data);
    return res.data;
  },

  // ── Save JWT and user info to localStorage after login ──
  saveSession(data: LoginResponse) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("role", data.role);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.email);
  },

  // ── Read saved session from localStorage ──
  getSession() {
    return {
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
      role: localStorage.getItem("role"),
      fullName: localStorage.getItem("fullName"),
      email: localStorage.getItem("email"),
    };
  },

  // ── Clear session and go to login ──
  logout() {
    localStorage.clear();
    window.location.href = "/login";
  },

  // ── Check if user is logged in ──
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  // ── Return the correct dashboard path for each role ──
  getDashboardRoute(role: string): string {
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