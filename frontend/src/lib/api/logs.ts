import { API_CONFIG } from "@/lib/constants";
import type { HealthResponse, LogAnalytics, LogListResponse, LogQuery } from "@/lib/types";
import { apiClient } from "./client";

export const logsApi = {
  health: (signal?: AbortSignal) =>
    apiClient.get<HealthResponse>(API_CONFIG.endpoints.health, undefined, signal),

  search: (query: LogQuery, signal?: AbortSignal) =>
    apiClient.get<LogListResponse>(
      API_CONFIG.endpoints.logs,
      {
        project_id: query.project_id,
        service: query.service,
        level: query.level,
        start_time: query.start_time,
        end_time: query.end_time,
        search_text: query.search_text,
        limit: query.limit,
        offset: query.offset,
      },
      signal
    ),

  analytics: (projectId: string, signal?: AbortSignal) =>
    apiClient.get<LogAnalytics>(
      API_CONFIG.endpoints.analytics,
      { project_id: projectId },
      signal
    ),
};
