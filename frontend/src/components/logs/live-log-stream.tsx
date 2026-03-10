"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTimestampShort } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LiveLogMessage } from "@/lib/types";

interface LiveLogStreamProps {
  messages: LiveLogMessage[];
}

const levelConfig: Record<string, { dot: string; text: string; bg: string; glow: string }> = {
  DEBUG: {
    dot: "bg-slate-400",
    text: "text-slate-400",
    bg: "",
    glow: "",
  },
  INFO: {
    dot: "bg-blue-400",
    text: "text-blue-400",
    bg: "",
    glow: "",
  },
  WARNING: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/[0.03]",
    glow: "border-l-2 border-l-amber-500/40",
  },
  ERROR: {
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-500/[0.04]",
    glow: "border-l-2 border-l-red-500/50",
  },
  CRITICAL: {
    dot: "bg-pink-400 animate-pulse",
    text: "text-pink-400 font-bold",
    bg: "bg-red-500/[0.06]",
    glow: "border-l-2 border-l-pink-500/60",
  },
};

export function LiveLogStream({ messages }: LiveLogStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Auto-scroll to top (newest first)
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages.length, autoScroll]);

  // Detect manual scrolling
  const handleScroll = () => {
    if (!scrollRef.current) return;
    setAutoScroll(scrollRef.current.scrollTop < 10);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0B1120] shadow-2xl shadow-blue-950/20 flex flex-col flex-1 min-h-0">
      {/* Terminal chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F1729] border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm shadow-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm shadow-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm shadow-green-500/20" />
          </div>
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400">
              orglog://live-tail
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            {messages.length} events
          </span>
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
              }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-[10px] font-mono text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
              Jump to latest
            </button>
          )}
        </div>
      </div>

      {/* Log stream body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#1e293b transparent",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-700 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">
              Listening for events
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Waiting for incoming log data...
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {messages.map((msg, index) => {
              const config = levelConfig[msg.level] || levelConfig.DEBUG;
              const isExpanded = expandedIndex === index;
              const hasMetadata = msg.metadata && Object.keys(msg.metadata).length > 0;

              return (
                <div
                  key={`${msg.timestamp}-${index}`}
                  className={cn(
                    "group transition-colors duration-100",
                    config.bg,
                    config.glow,
                    isExpanded
                      ? "bg-slate-800/30"
                      : "hover:bg-slate-800/20"
                  )}
                >
                  {/* Main log row */}
                  <div
                    className="flex items-start gap-3 px-4 py-2 cursor-pointer"
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  >
                    {/* Level dot */}
                    <div className="flex items-center pt-[3px] shrink-0">
                      <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0 pt-px w-[85px]">
                      {formatTimestampShort(msg.timestamp)}
                    </span>

                    {/* Level */}
                    <span
                      className={cn(
                        "text-[11px] font-mono uppercase shrink-0 pt-px w-[68px]",
                        config.text
                      )}
                    >
                      {msg.level}
                    </span>

                    {/* Service tag */}
                    <span className="text-[11px] font-mono text-cyan-400/80 shrink-0 pt-px w-[140px] truncate">
                      [{msg.service}]
                    </span>

                    {/* Message */}
                    <span
                      className={cn(
                        "text-[12px] font-mono text-slate-300 flex-1 pt-px",
                        isExpanded ? "whitespace-pre-wrap break-all" : "truncate"
                      )}
                    >
                      {msg.message}
                    </span>

                    {/* Expand indicator */}
                    {hasMetadata && (
                      <div className="shrink-0 pt-px opacity-0 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded metadata panel */}
                  {isExpanded && hasMetadata && (
                    <div className="px-4 pb-3 pl-[52px]">
                      <div className="rounded-lg bg-[#070D1A] border border-slate-800 p-3 mt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                            Metadata
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            trace: {msg.trace_id.slice(0, 8)}...
                          </span>
                        </div>
                        <pre className="text-[11px] font-mono text-emerald-400/80 whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(msg.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
