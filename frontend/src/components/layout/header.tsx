"use client";

import { useHealth } from "@/lib/hooks";
import { useProjectContext } from "@/lib/providers";
import { StatusDot } from "@/components/ui";
import { Bell, User } from "lucide-react";
import { Input } from "@/components/ui";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { data: health } = useHealth();
  const { projectId } = useProjectContext();
  const isHealthy = health?.status === "ok";

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Page title */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>

        {/* Right: Status and profile */}
        <div className="flex items-center gap-4">
          {/* API Health */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <StatusDot status={isHealthy ? "online" : "offline"} pulse={isHealthy} />
            <span className="text-xs font-medium text-slate-600">
              {isHealthy ? "API Connected" : "API Disconnected"}
            </span>
          </div>

          {/* Project ID indicator */}
          <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-xs font-mono text-blue-700 truncate max-w-[120px]">
              {projectId.slice(0, 8)}...
            </span>
          </div>

          {/* Notification bell placeholder */}
          <button className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <Bell className="h-4 w-4" />
          </button>

          {/* User avatar placeholder - ready for auth */}
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
