// ============================================================================
// OrgLog Design System Constants
// ============================================================================
// Single source of truth for all design tokens across the application.
// Import these constants instead of using raw values in components.

export const COLORS = {
  // Primary brand palette
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Neutral palette for backgrounds, text, borders
  neutral: {
    0: "#ffffff",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  // Semantic colors for log levels
  logLevel: {
    DEBUG: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    INFO: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
    WARNING: { bg: "#fffbeb", text: "#b45309", border: "#fcd34d" },
    ERROR: { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
    CRITICAL: { bg: "#fdf2f8", text: "#be185d", border: "#f9a8d4" },
  },

  // Status indicators
  status: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    neutral: "#94a3b8",
  },

  // Chart palette (for analytics visualizations)
  chart: [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#6366f1",
  ],
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const SPACING = {
  sidebar: {
    width: "260px",
    collapsedWidth: "72px",
  },
  header: {
    height: "64px",
  },
  page: {
    padding: "24px",
    maxWidth: "1440px",
  },
  card: {
    padding: "24px",
    borderRadius: "12px",
  },
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
} as const;

export const TRANSITIONS = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const Z_INDEX = {
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
} as const;
