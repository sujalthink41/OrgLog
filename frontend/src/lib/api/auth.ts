import { API_CONFIG } from "@/lib/constants";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/lib/types";
import { apiClient } from "./client";

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<User>(API_CONFIG.endpoints.register, data, true),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>(API_CONFIG.endpoints.login, data, true),

  me: (signal?: AbortSignal) =>
    apiClient.get<User>(API_CONFIG.endpoints.me, undefined, signal),

  logout: () =>
    apiClient.post<{ message: string }>(API_CONFIG.endpoints.logout, {}),
};
