import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onOpen?: (event: WebSocketEventMap['open']) => void;
  onMessage?: (event: WebSocketEventMap['message']) => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

interface UseWebSocketReturn {
  sendMessage: (data: any) => void;
  lastMessage: WebSocketEventMap['message'] | null;
  readyState: number;
  getWebSocket: () => WebSocket | null;
}

export function useWebSocket(
  url: string,
  {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  }: WebSocketOptions = {}
): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketEventMap['message'] | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const webSocket = useRef<WebSocket | null>(null);
  const reconnectCount = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Append the specific WebSocket path
  const fullUrl = url.includes('/api/ws') ? url : `${window.location.origin.replace('http', 'ws')}/api/ws`;

  const connect = useCallback(() => {
    if (webSocket.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(fullUrl);
    webSocket.current = ws;

    ws.onopen = (event) => {
      console.log('WebSocket connected');
      setReadyState(WebSocket.OPEN);
      reconnectCount.current = 0;
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      setLastMessage(event);
      if (onMessage) onMessage(event);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected');
      setReadyState(WebSocket.CLOSED);
      if (onClose) onClose(event);

      // Reconnect if not closed cleanly and we haven't reached max attempts
      if (!event.wasClean && reconnectCount.current < reconnectAttempts) {
        reconnectCount.current += 1;
        if (reconnectTimeoutRef.current !== null) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectCount.current}/${reconnectAttempts})`);
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      if (onError) onError(event);
    };
  }, [fullUrl, onOpen, onMessage, onClose, onError, reconnectAttempts, reconnectInterval]);

  const getWebSocket = useCallback((): WebSocket | null => {
    return webSocket.current;
  }, []);

  const sendMessage = useCallback((data: any): void => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (webSocket.current) {
        webSocket.current.close();
      }
    };
  }, [connect]);

  return { sendMessage, lastMessage, readyState, getWebSocket };
}