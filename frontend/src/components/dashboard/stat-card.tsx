"use client";

import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "emerald" | "amber" | "red" | "violet";
  className?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    accent: "text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    accent: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    accent: "text-amber-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    accent: "text-red-600",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    accent: "text-violet-600",
  },
};

export function StatCard({ title, value, icon: Icon, trend, color = "blue", className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(value)}</p>
          {trend && (
            <p className={cn("text-xs font-medium", colors.accent)}>
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>
    </Card>
  );
}
