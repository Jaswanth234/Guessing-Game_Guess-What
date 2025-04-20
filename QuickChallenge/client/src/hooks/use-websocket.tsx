import { useState, useEffect, useCallback, useRef } from 'react';

type WebSocketStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export function useWebSocket(accessCode: string | null = null) {
  const [status, setStatus] = useState<WebSocketStatus>('CLOSED');
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Setup the WebSocket connection
  useEffect(() => {
    if (!accessCode) return;
    
    try {
      // Use relative path to avoid port issues
      const wsUrl = `/ws`;
      
      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      const wsFullUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${wsUrl}`;
      console.log(`Full WebSocket URL: ${wsFullUrl}`);
      
      const ws = new WebSocket(wsFullUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setStatus('OPEN');
        console.log('WebSocket connected');
      };
      
      ws.onclose = () => {
        setStatus('CLOSED');
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('CLOSED');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      // Setup ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING', payload: {} }));
        }
      }, 30000);
      
      return () => {
        clearInterval(pingInterval);
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setStatus('CLOSED');
      return () => {}; // Return empty cleanup function
    }
  }, [accessCode]);
  
  // Function to send messages
  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }, []);
  
  // Function to join a quiz
  const joinQuiz = useCallback((accessCode: string, participantId: number) => {
    return sendMessage('JOIN_QUIZ', { accessCode, participantId });
  }, [sendMessage]);
  
  // Function to submit an answer
  const submitAnswer = useCallback((answer: any, questionId: number, quizId: number, participantId: number) => {
    return sendMessage('SUBMIT_ANSWER', { answer, questionId, quizId, participantId });
  }, [sendMessage]);
  
  // Function to end a quiz
  const endQuiz = useCallback((quizId: number) => {
    return sendMessage('END_QUIZ', { quizId });
  }, [sendMessage]);
  
  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    status,
    messages,
    sendMessage,
    joinQuiz,
    submitAnswer,
    endQuiz,
    clearMessages
  };
}
