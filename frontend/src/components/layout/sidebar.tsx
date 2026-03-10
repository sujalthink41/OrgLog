"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Radio,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION, APP_CONFIG } from "@/lib/constants";
import { useLiveLogsContext, useSidebarContext } from "@/lib/providers";

const iconMap = {
  LayoutDashboard,
  Search,
  Radio,
  BarChart3,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarContext();
  const { isConnected, messages } = useLiveLogsContext();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
            <Layers className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">
                {APP_CONFIG.name}
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {APP_CONFIG.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform
          </p>
        )}
        {NAVIGATION.items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const isLiveTail = item.href === "/dashboard/live";

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="relative shrink-0">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                />
                {/* Tiny dot on icon when collapsed + live connected */}
                {isLiveTail && isConnected && collapsed && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {isLiveTail && isConnected && !collapsed && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
              {isLiveTail && !collapsed && messages.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                  {messages.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-slate-200 shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full h-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
