"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_CONFIG } from "@/lib/constants";
import { useProjectContext } from "./project-provider";
import type { LiveLogMessage } from "@/lib/types";

const MAX_MESSAGES = 1000;
const MAX_RECONNECT_ATTEMPTS = 10;

interface LiveLogsContextValue {
  /** Buffered messages (newest first), persists across page navigation */
  messages: LiveLogMessage[];
  /** WebSocket is open and receiving */
  isConnected: boolean;
  /** WebSocket is in the process of connecting */
  isConnecting: boolean;
  /** Whether streaming is active (user can pause/resume) */
  isStreaming: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Total messages received in this session (including cleared) */
  totalReceived: number;
  /** Toggle streaming on/off (pauses WebSocket) */
  setStreaming: (streaming: boolean) => void;
  /** Clear the message buffer */
  clearMessages: () => void;
  /** Force reconnect */
  reconnect: () => void;
}

const LiveLogsContext = createContext<LiveLogsContextValue | null>(null);

export function LiveLogsProvider({ children }: { children: ReactNode }) {
  const { projectId } = useProjectContext();
  const [messages, setMessages] = useState<LiveLogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReceived, setTotalReceived] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  const cleanupWs = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!projectId) return;

    cleanupWs();
    setIsConnecting(true);
    setError(null);

    const wsUrl = `${API_CONFIG.wsUrl}${API_CONFIG.endpoints.websocket}/${projectId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: LiveLogMessage = JSON.parse(event.data);
        setMessages((prev) => {
          const updated = [data, ...prev];
          return updated.length > MAX_MESSAGES
            ? updated.slice(0, MAX_MESSAGES)
            : updated;
        });
        setTotalReceived((prev) => prev + 1);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
      setIsConnecting(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;

      // Auto-reconnect with exponential backoff (only if streaming is still on)
      if (
        isStreamingRef.current &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, [projectId, cleanupWs]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTotalReceived(0);
  }, []);

  const setStreaming = useCallback(
    (streaming: boolean) => {
      setIsStreaming(streaming);
      if (streaming && !wsRef.current) {
        reconnectAttemptsRef.current = 0;
        connect();
      } else if (!streaming) {
        cleanupWs();
        setIsConnected(false);
        setIsConnecting(false);
      }
    },
    [connect, cleanupWs]
  );

  // Connect on mount / when projectId changes
  useEffect(() => {
    if (isStreaming && projectId) {
      connect();
    }
    return cleanupWs;
  }, [projectId, isStreaming, connect, cleanupWs]);

  return (
    <LiveLogsContext.Provider
      value={{
        messages,
        isConnected,
        isConnecting,
        isStreaming,
        error,
        totalReceived,
        setStreaming,
        clearMessages,
        reconnect,
      }}
    >
      {children}
    </LiveLogsContext.Provider>
  );
}

export function useLiveLogsContext() {
  const context = useContext(LiveLogsContext);
  if (!context) {
    throw new Error(
      "useLiveLogsContext must be used within a LiveLogsProvider"
    );
  }
  return context;
}
