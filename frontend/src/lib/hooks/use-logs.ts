"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";
import type { LogQuery } from "@/lib/types";
import { API_CONFIG } from "@/lib/constants";

export function useLogs(query: LogQuery, enabled = true) {
  return useQuery({
    queryKey: ["logs", query],
    queryFn: ({ signal }) => logsApi.search(query, signal),
    enabled: enabled && !!query.project_id,
    placeholderData: keepPreviousData,
    refetchInterval: API_CONFIG.defaults.pollInterval,
    staleTime: 10_000,
  });
}

export function useAnalytics(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["analytics", projectId],
    queryFn: ({ signal }) => logsApi.analytics(projectId, signal),
    enabled: enabled && !!projectId,
    refetchInterval: API_CONFIG.defaults.pollInterval,
    staleTime: 15_000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => logsApi.health(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}
