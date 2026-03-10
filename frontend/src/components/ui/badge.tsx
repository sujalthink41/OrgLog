import { cn } from "@/lib/utils";
import type { LogLevel } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "level";
  level?: LogLevel;
  className?: string;
}

const levelStyles: Record<LogLevel, string> = {
  DEBUG: "bg-slate-100 text-slate-600 border-slate-200",
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  ERROR: "bg-red-50 text-red-600 border-red-200",
  CRITICAL: "bg-pink-50 text-pink-700 border-pink-200",
};

export function Badge({ children, variant = "default", level, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border transition-colors",
        variant === "default" && "bg-blue-50 text-blue-700 border-blue-200",
        variant === "outline" && "bg-transparent text-slate-600 border-slate-300",
        variant === "level" && level && levelStyles[level],
        className
      )}
    >
      {children}
    </span>
  );
}
