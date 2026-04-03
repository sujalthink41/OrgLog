"use client";

import { useHealth } from "@/lib/hooks";
import { useProjectContext } from "@/lib/providers";
import { StatusDot } from "@/components/ui";
import { FolderKanban } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { data: health } = useHealth();
  const { currentProject } = useProjectContext();
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

        {/* Right: Status and project */}
        <div className="flex items-center gap-3">
          {/* API Health */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <StatusDot status={isHealthy ? "online" : "offline"} pulse={isHealthy} />
            <span className="text-xs font-medium text-slate-600">
              {isHealthy ? "API Connected" : "Disconnected"}
            </span>
          </div>

          {/* Current Project */}
          {currentProject && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 truncate max-w-[140px]">
                {currentProject.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
