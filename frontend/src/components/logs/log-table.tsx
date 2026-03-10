"use client";

import { Fragment, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { LogEntry } from "@/lib/types";

interface LogTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

function LogDetailRow({ log }: { log: LogEntry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = JSON.stringify(log, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr>
      <td colSpan={5} className="p-0">
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Log Details
            </h4>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Log ID
              </p>
              <p className="text-xs font-mono text-slate-700 break-all">{log.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Trace ID
              </p>
              <p className="text-xs font-mono text-slate-700 break-all">{log.trace_id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Project ID
              </p>
              <p className="text-xs font-mono text-slate-700 break-all">{log.project_id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Created At
              </p>
              <p className="text-xs font-mono text-slate-700">{formatTimestamp(log.created_at)}</p>
            </div>
          </div>

          {/* Full message */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Full Message
            </p>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">
                {log.message}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Metadata
              </p>
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export function LogTable({ logs, isLoading }: LogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-50 border-b border-slate-100" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-slate-50 px-6 py-3">
              <div className="h-4 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 w-[180px]">
                Timestamp
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 w-[90px]">
                Level
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 w-[140px]">
                Service
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Message
              </th>
              <th className="w-10 py-3" />
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className={cn(
                      "border-b border-slate-100 cursor-pointer transition-colors",
                      isExpanded ? "bg-blue-50/30" : "hover:bg-slate-50/50"
                    )}
                  >
                    <td className="px-6 py-3">
                      <span className="text-xs font-mono text-slate-600 tabular-nums">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="level" level={log.level}>
                        {log.level}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-medium text-slate-700">{log.service}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-600 line-clamp-1 font-mono">
                        {log.message}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </td>
                  </tr>
                  {isExpanded && <LogDetailRow log={log} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
