"use client";

import { Sidebar } from "@/components/layout";
import { useSidebarContext } from "@/lib/providers";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "pl-[72px]" : "pl-[260px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
