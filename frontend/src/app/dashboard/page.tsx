"use client";

import { Header } from "@/components/layout";
import { Skeleton } from "@/components/ui";
import {
  StatCard,
  LevelDistributionChart,
  ErrorTrendChart,
  ServiceBreakdownChart,
  RecentLogsTable,
} from "@/components/dashboard";
import { useAnalytics, useLogs } from "@/lib/hooks";
import { useProjectContext } from "@/lib/providers";
import {
  FileText,
  AlertTriangle,
  AlertOctagon,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const { projectId } = useProjectContext();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(projectId);
  const { data: recentLogs, isLoading: logsLoading } = useLogs({
    project_id: projectId,
    limit: 10,
  });

  const totalErrors =
    (analytics?.logs_by_level?.ERROR || 0) + (analytics?.logs_by_level?.CRITICAL || 0);
  const totalWarnings = analytics?.logs_by_level?.WARNING || 0;

  return (
    <>
      <Header title="Dashboard" description="Platform overview and key metrics" />
      <main className="p-6 space-y-6">
        {/* Stat Cards */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Logs"
              value={analytics?.total_logs ?? 0}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Services"
              value={Object.keys(analytics?.logs_by_service ?? {}).length}
              icon={Activity}
              color="violet"
            />
            <StatCard
              title="Warnings"
              value={totalWarnings}
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              title="Errors + Critical"
              value={totalErrors}
              icon={AlertOctagon}
              color="red"
            />
          </div>
        )}

        {/* Charts Row */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[320px] rounded-xl" />
            <Skeleton className="h-[320px] rounded-xl" />
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LevelDistributionChart data={analytics.logs_by_level} />
            <ErrorTrendChart data={analytics.errors_per_minute} />
          </div>
        ) : null}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {logsLoading ? (
              <Skeleton className="h-[400px] rounded-xl" />
            ) : (
              <RecentLogsTable logs={recentLogs?.logs ?? []} />
            )}
          </div>
          <div>
            {analyticsLoading ? (
              <Skeleton className="h-[400px] rounded-xl" />
            ) : analytics ? (
              <ServiceBreakdownChart data={analytics.logs_by_service} />
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
