"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { LogFilters, LogTable, LogPagination } from "@/components/logs";
import { useLogs } from "@/lib/hooks";
import { useProjectContext } from "@/lib/providers";
import { API_CONFIG } from "@/lib/constants";
import type { LogLevel } from "@/lib/types";
import { SearchX } from "lucide-react";

export default function LogExplorerPage() {
  const { projectId } = useProjectContext();

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [level, setLevel] = useState("");
  const [service, setService] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = API_CONFIG.defaults.pageSize;

  const hasActiveFilters = !!(searchText || level || service || startTime || endTime);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setLevel("");
    setService("");
    setStartTime("");
    setEndTime("");
    setOffset(0);
  }, []);

  // Build query
  const query = {
    project_id: projectId,
    search_text: searchText || undefined,
    level: (level || undefined) as LogLevel | undefined,
    service: service || undefined,
    start_time: startTime ? new Date(startTime).toISOString() : undefined,
    end_time: endTime ? new Date(endTime).toISOString() : undefined,
    limit,
    offset,
  };

  const { data, isLoading, isError } = useLogs(query);

  // Reset offset when filters change
  const handleFilterChange = useCallback(
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      setOffset(0);
    },
    []
  );

  return (
    <>
      <Header title="Log Explorer" description="Search, filter, and inspect log entries" />
      <main className="p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <LogFilters
            searchText={searchText}
            onSearchChange={handleFilterChange(setSearchText)}
            level={level}
            onLevelChange={handleFilterChange(setLevel)}
            service={service}
            onServiceChange={handleFilterChange(setService)}
            startTime={startTime}
            onStartTimeChange={handleFilterChange(setStartTime)}
            endTime={endTime}
            onEndTimeChange={handleFilterChange(setEndTime)}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Results summary */}
        {data && !isLoading && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Found{" "}
              <span className="font-semibold text-slate-700">
                {data.total.toLocaleString()}
              </span>{" "}
              logs
              {hasActiveFilters && " matching your filters"}
            </p>
          </div>
        )}

        {/* Log Table */}
        {isError ? (
          <EmptyState
            icon={<SearchX className="h-12 w-12" />}
            title="Failed to load logs"
            description="There was an error fetching logs. Make sure the API server is running."
          />
        ) : data && data.logs.length === 0 && !isLoading ? (
          <EmptyState
            icon={<SearchX className="h-12 w-12" />}
            title="No logs found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "No logs have been ingested yet. Send some logs to get started."
            }
          />
        ) : (
          <>
            <LogTable logs={data?.logs ?? []} isLoading={isLoading} />
            {data && data.total > limit && (
              <LogPagination
                total={data.total}
                limit={limit}
                offset={offset}
                onPageChange={setOffset}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
