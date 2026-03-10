"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { formatTimestampShort, formatRelativeTime } from "@/lib/utils";
import type { LogEntry } from "@/lib/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentLogsTableProps {
  logs: LogEntry[];
}

export function RecentLogsTable({ logs }: RecentLogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Logs</CardTitle>
          <Link
            href="/dashboard/logs"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">
            No recent logs
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-2.5">
                    Time
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2.5">
                    Level
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2.5">
                    Service
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2.5">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 8).map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-2.5">
                      <span className="text-xs font-mono text-slate-500 tabular-nums">
                        {formatTimestampShort(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="level" level={log.level}>
                        {log.level}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-medium text-slate-700">{log.service}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[300px]">
                      <span className="text-xs text-slate-600 truncate block">
                        {log.message}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
