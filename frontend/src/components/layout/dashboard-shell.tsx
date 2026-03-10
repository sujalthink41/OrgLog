"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardShell({ children, title, description }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-[260px] transition-all duration-300">
        <Header title={title} description={description} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
