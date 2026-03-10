"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout";
import { Button, StatusDot, Badge, Card, Select } from "@/components/ui";
import { LiveLogStream } from "@/components/logs";
import { useLiveLogsContext } from "@/lib/providers";
import {
  Pause,
  Play,
  Trash2,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Info,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogLevel } from "@/lib/types";

const levelOptions = [
  { value: "DEBUG", label: "DEBUG" },
  { value: "INFO", label: "INFO" },
  { value: "WARNING", label: "WARNING" },
  { value: "ERROR", label: "ERROR" },
  { value: "CRITICAL", label: "CRITICAL" },
];

const levelIconMap: Record<string, { icon: typeof Info; color: string }> = {
  DEBUG: { icon: Bug, color: "text-slate-400" },
  INFO: { icon: Info, color: "text-blue-400" },
  WARNING: { icon: AlertTriangle, color: "text-amber-400" },
  ERROR: { icon: AlertOctagon, color: "text-red-400" },
  CRITICAL: { icon: AlertOctagon, color: "text-pink-400" },
};

export default function LiveTailPage() {
  const {
    messages,
    isConnected,
    isConnecting,
    isStreaming,
    error,
    totalReceived,
    setStreaming,
    clearMessages,
    reconnect,
  } = useLiveLogsContext();

  const [levelFilter, setLevelFilter] = useState("");

  const filteredMessages = useMemo(() => {
    if (!levelFilter) return messages;
    return messages.filter((m) => m.level === levelFilter);
  }, [messages, levelFilter]);

  const messageStats = useMemo(() => {
    const ordered: LogLevel[] = ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"];
    const counts: Record<string, number> = {};
    for (const msg of messages) {
      counts[msg.level] = (counts[msg.level] || 0) + 1;
    }
    return ordered
      .filter((lvl) => counts[lvl])
      .map((lvl) => ({ level: lvl, count: counts[lvl] }));
  }, [messages]);

  return (
    <>
      <Header title="Live Tail" description="Real-time log stream via WebSocket" />
      <main className="p-6 flex flex-col gap-4" style={{ height: "calc(100vh - 64px)" }}>
        {/* Top control bar */}
        <div className="flex items-stretch gap-4">
          {/* Connection card */}
          <Card className="flex items-center gap-3 px-5 py-3 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg",
                isConnected
                  ? "bg-emerald-50"
                  : isConnecting
                    ? "bg-amber-50"
                    : "bg-slate-100"
              )}
            >
              {isConnected ? (
                <Activity className="h-4 w-4 text-emerald-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <StatusDot
                  status={isConnected ? "online" : isConnecting ? "warning" : "offline"}
                  pulse={isConnected}
                />
                <span className="text-sm font-semibold text-slate-900">
                  {isConnected
                    ? "Connected"
                    : isConnecting
                      ? "Connecting..."
                      : isStreaming
                        ? "Disconnected"
                        : "Paused"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalReceived.toLocaleString()} events received this session
              </p>
            </div>
          </Card>

          {/* Level breakdown mini-cards */}
          {messageStats.length > 0 && (
            <Card className="flex items-center gap-1 px-3 py-3 flex-1 overflow-x-auto">
              {messageStats.map(({ level, count }) => {
                const { icon: Icon, color } = levelIconMap[level] || levelIconMap.INFO;
                return (
                  <button
                    key={level}
                    onClick={() =>
                      setLevelFilter(levelFilter === level ? "" : level)
                    }
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                      levelFilter === level
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                    <span>{level}</span>
                    <span className="font-bold tabular-nums">{count}</span>
                  </button>
                );
              })}
            </Card>
          )}

          {/* Actions */}
          <Card className="flex items-center gap-2 px-3 py-3 shrink-0">
            <Select
              options={levelOptions}
              placeholder="Filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-28"
            />
            <Button
              variant={isStreaming ? "secondary" : "primary"}
              size="sm"
              onClick={() => setStreaming(!isStreaming)}
            >
              {isStreaming ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isStreaming ? "Pause" : "Resume"}
            </Button>
            {isStreaming && !isConnected && !isConnecting && (
              <Button variant="outline" size="sm" onClick={reconnect}>
                <Wifi className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 shrink-0">
              <WifiOff className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">Connection Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Live stream terminal */}
        <LiveLogStream messages={filteredMessages} />
      </main>
    </>
  );
}
