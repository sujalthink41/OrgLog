// ============================================================================
// Application Configuration
// ============================================================================

export const APP_CONFIG = {
  name: "OrgLog",
  description: "Centralized Logging Platform",
  version: "1.0.0",
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  endpoints: {
    health: "/api/v1/health",
    logs: "/api/v1/logs",
    analytics: "/api/v1/logs/analytics",
    websocket: "/api/v1/ws",
  },
  defaults: {
    pageSize: 50,
    maxPageSize: 100,
    pollInterval: 30_000, // 30 seconds
  },
} as const;

export const NAVIGATION = {
  items: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard" as const,
      description: "Overview & analytics",
    },
    {
      label: "Log Explorer",
      href: "/dashboard/logs",
      icon: "Search" as const,
      description: "Search & filter logs",
    },
    {
      label: "Live Tail",
      href: "/dashboard/live",
      icon: "Radio" as const,
      description: "Real-time log stream",
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: "BarChart3" as const,
      description: "Metrics & insights",
    },
  ],
} as const;

// Placeholder project ID for demo/development (before auth is implemented)
export const DEFAULT_PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
