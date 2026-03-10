export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface LogEntry {
  id: string;
  project_id: string;
  trace_id: string;
  service: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
  created_at: string;
}

export interface LogListResponse {
  logs: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface LogQuery {
  project_id: string;
  service?: string;
  level?: LogLevel;
  start_time?: string;
  end_time?: string;
  search_text?: string;
  limit?: number;
  offset?: number;
}

export interface ErrorPerMinute {
  minute: string;
  count: number;
}

export interface LogAnalytics {
  project_id: string;
  total_logs: number;
  logs_by_level: Record<string, number>;
  logs_by_service: Record<string, number>;
  errors_per_minute: ErrorPerMinute[];
}

export interface LogCreateRequest {
  project_id: string;
  trace_id: string;
  service: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

// WebSocket message (same shape as log entry but without id/created_at)
export interface LiveLogMessage {
  project_id: string;
  trace_id: string;
  service: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}
