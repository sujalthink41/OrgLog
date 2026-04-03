// ============================================================================
// Application Configuration
// ============================================================================

export const APP_CONFIG = {
  name: "OrgLog",
  description: "Centralized Logging Platform",
  version: "1.0.0",
} as const;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080",
  endpoints: {
    health: "/api/v1/health",
    logs: "/api/v1/logs",
    analytics: "/api/v1/logs/analytics",
    websocket: "/api/v1/ws",
    // auth endpoints
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    // project endpoints
    projects: "/api/v1/projects",
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

export const AUTH_TOKEN_KEY = "orglog_access_token";
