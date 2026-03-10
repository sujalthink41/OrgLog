"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_CONFIG } from "@/lib/constants";
import type { LiveLogMessage } from "@/lib/types";

interface UseWebSocketOptions {
  projectId: string;
  enabled?: boolean;
  maxMessages?: number;
  onMessage?: (message: LiveLogMessage) => void;
}

interface UseWebSocketReturn {
  messages: LiveLogMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  clearMessages: () => void;
  reconnect: () => void;
}

export function useWebSocket({
  projectId,
  enabled = true,
  maxMessages = 500,
  onMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [messages, setMessages] = useState<LiveLogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const connect = useCallback(() => {
    if (!enabledRef.current || !projectId) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

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
          return updated.slice(0, maxMessages);
        });
        onMessageRef.current?.(data);
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

      // Auto-reconnect with exponential backoff
      if (enabledRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [projectId, maxMessages]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && projectId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, projectId, connect]);

  return {
    messages,
    isConnected,
    isConnecting,
    error,
    clearMessages,
    reconnect,
  };
}
