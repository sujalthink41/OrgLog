"use client";

import { Search, X, Filter } from "lucide-react";
import { Input, Select, Button } from "@/components/ui";
import type { LogLevel } from "@/lib/types";

interface LogFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  service: string;
  onServiceChange: (value: string) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const levelOptions = [
  { value: "DEBUG", label: "DEBUG" },
  { value: "INFO", label: "INFO" },
  { value: "WARNING", label: "WARNING" },
  { value: "ERROR", label: "ERROR" },
  { value: "CRITICAL", label: "CRITICAL" },
];

export function LogFilters({
  searchText,
  onSearchChange,
  level,
  onLevelChange,
  service,
  onServiceChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  onClear,
  hasActiveFilters,
}: LogFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Primary search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search log messages..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select
          options={levelOptions}
          placeholder="All Levels"
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="Filter by service"
          value={service}
          onChange={(e) => onServiceChange(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Time range filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 shrink-0">From</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 shrink-0">To</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
