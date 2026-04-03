import { API_CONFIG } from "@/lib/constants";
import type { CreateProjectRequest, Project } from "@/lib/types";
import { apiClient } from "./client";

export const projectsApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<Project[]>(API_CONFIG.endpoints.projects, undefined, signal),

  get: (projectId: string, signal?: AbortSignal) =>
    apiClient.get<Project>(`${API_CONFIG.endpoints.projects}/${projectId}`, undefined, signal),

  create: (data: CreateProjectRequest) =>
    apiClient.post<Project>(API_CONFIG.endpoints.projects, data),
};
