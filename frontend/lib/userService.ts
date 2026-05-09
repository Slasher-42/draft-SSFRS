import api from "./api";

export interface UpdateUserRequest {
  fullName: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
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

export interface ProviderProfile {
  id?: string;
  userId?: string;
  organizationName: string;
  industry: string;
  country: string;
  city: string;
  website: string;
  contactDetails: string;
}

export interface WorkerProfile {
  id?: string;
  userId?: string;
  professionalTitle: string;
  country: string;
  city: string;
  specialization: string;
}

export interface EvaluatorProfile {
  id?: string;
  userId?: string;
  department: string;
  specialization: string;
  country: string;
  city: string;
}

export interface RefundOfficeProfile {
  id?: string;
  userId?: string;
  staffName: string;
  department: string;
  contactDetails: string;
}

function roleToPath(role: string): string {
  switch (role) {
    case "PROVIDER":     return "provider";
    case "WORKER":       return "worker";
    case "EVALUATOR":    return "evaluator";
    case "REFUND_OFFICE": return "refund-office";
    default:             return role.toLowerCase();
  }
}

export const userService = {
  async getUser(userId: string): Promise<UserProfile> {
    const res = await api.get<UserProfile>(`/api/users/${userId}`);
    return res.data;
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<UserProfile> {
    const res = await api.put<UserProfile>(`/api/users/${userId}`, data);
    return res.data;
  },

  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    await api.patch(`/api/users/${userId}/change-password`, data);
  },

  async getIdentityProfile(role: string, userId: string) {
    const path = roleToPath(role);
    const res = await api.get(`/api/profiles/${path}/${userId}`);
    return res.data;
  },

  async saveIdentityProfile(role: string, userId: string, data: unknown) {
    const path = roleToPath(role);
    const res = await api.put(`/api/profiles/${path}/${userId}`, data);
    return res.data;
  },
};
