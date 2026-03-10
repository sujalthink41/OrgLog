"use client";

import { Header } from "@/components/layout";
import { Skeleton } from "@/components/ui";
import {
  StatCard,
  LevelDistributionChart,
  ErrorTrendChart,
  ServiceBreakdownChart,
} from "@/components/dashboard";
import { useAnalytics } from "@/lib/hooks";
import { useProjectContext } from "@/lib/providers";
import {
  FileText,
  AlertTriangle,
  AlertOctagon,
  Server,
  Activity,
  TrendingUp,
} from "lucide-react";

export default function AnalyticsPage() {
  const { projectId } = useProjectContext();
  const { data: analytics, isLoading } = useAnalytics(projectId);

  const totalErrors =
    (analytics?.logs_by_level?.ERROR || 0) + (analytics?.logs_by_level?.CRITICAL || 0);
  const totalWarnings = analytics?.logs_by_level?.WARNING || 0;
  const errorRate =
    analytics && analytics.total_logs > 0
      ? ((totalErrors / analytics.total_logs) * 100).toFixed(2)
      : "0";

  return (
    <>
      <Header title="Analytics" description="Detailed metrics and insights" />
      <main className="p-6 space-y-6">
        {/* Top stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard
              title="Total Logs"
              value={analytics?.total_logs ?? 0}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Active Services"
              value={Object.keys(analytics?.logs_by_service ?? {}).length}
              icon={Server}
              color="violet"
            />
            <StatCard
              title="Warnings"
              value={totalWarnings}
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              title="Errors"
              value={totalErrors}
              icon={AlertOctagon}
              color="red"
            />
            <StatCard
              title="Log Levels"
              value={Object.keys(analytics?.logs_by_level ?? {}).length}
              icon={Activity}
              color="emerald"
            />
          </div>
        )}

        {/* Error rate banner */}
        {!isLoading && analytics && (
          <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Error Rate: {errorRate}%
              </p>
              <p className="text-xs text-slate-500">
                {totalErrors.toLocaleString()} errors out of{" "}
                {analytics.total_logs.toLocaleString()} total logs
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[340px] rounded-xl" />
            <Skeleton className="h-[340px] rounded-xl" />
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LevelDistributionChart data={analytics.logs_by_level} />
              <ServiceBreakdownChart data={analytics.logs_by_service} />
            </div>

            {/* Full-width error trend */}
            <ErrorTrendChart data={analytics.errors_per_minute} />
          </>
        ) : null}
      </main>
    </>
  );
}
