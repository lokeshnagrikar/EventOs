"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";

export type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "RECONNECTING";

interface SocketContextProps {
  status: ConnectionStatus;
  subscribe: (topic: string, callback: (payload: any) => void) => () => void;
  send: (destination: string, payload: any) => void;
  activeUsers: { name: string; page: string; status: "Online" | "Away" }[];
  triggerTyping: (page: string) => void;
  typingUser: { name: string; page: string } | null;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [activeUsers, setActiveUsers] = useState<{ name: string; page: string; status: "Online" | "Away" }[]>([
    { name: "Rahul (Sales)", page: "/crm", status: "Online" },
    { name: "Sneha (Coordinator)", page: "/events", status: "Online" },
    { name: "Amit (Photo Lead)", page: "/gallery", status: "Away" }
  ]);
  const [typingUser, setTypingUser] = useState<{ name: string; page: string } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Record<string, ((payload: any) => void)[]>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Setup WebSocket STOMP simulation/client
  useEffect(() => {
    if (!accessToken) {
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [accessToken]);

  const connect = () => {
    if (socketRef.current) return;

    setStatus("CONNECTING");
    // Connect to ws protocol gateway
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsUrl = "";
    
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      if (hostname === "localhost" && port === "3000") {
        // Local development: connect directly to API Gateway port 8080
        wsUrl = `${protocol}//localhost:8080/api/v1/auth/ws`;
      } else {
        // Production / Docker: route via the API Gateway endpoint
        wsUrl = `${protocol}//${window.location.host}/api/v1/auth/ws`;
      }
    }

    // Create standard WebSocket client
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("CONNECTED");
      reconnectAttemptsRef.current = 0;
      
      // Send STOMP CONNECT frame
      sendFrame("CONNECT", {
        acceptVersion: "1.1,1.2",
        heartbeat: "10000,10000",
        Authorization: `Bearer ${accessToken}`
      });
    };

    ws.onmessage = (event) => {
      const message = event.data;
      parseStompFrame(message);
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error log:", err);
    };

    ws.onclose = () => {
      setStatus("DISCONNECTED");
      socketRef.current = null;
      attemptReconnect();
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("DISCONNECTED");
  };

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current > 5) {
      setStatus("DISCONNECTED");
      return;
    }
    setStatus("RECONNECTING");
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000));
  };

  const sendFrame = (command: string, headers: Record<string, string>, body?: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    let frame = `${command}\n`;
    Object.entries(headers).forEach(([k, v]) => {
      frame += `${k}:${v}\n`;
    });
    frame += `\n${body ? JSON.stringify(body) : ""}\u0000`;
    
    socketRef.current.send(frame);
  };

  const parseStompFrame = (data: string) => {
    // STOMP Parser
    try {
      const lines = data.split("\n");
      const command = lines[0];
      if (command === "MESSAGE") {
        const destHeader = lines.find(l => l.startsWith("destination:"));
        const dest = destHeader ? destHeader.split(":")[1].trim() : "";
        const bodyIndex = lines.indexOf("");
        const body = bodyIndex !== -1 ? JSON.parse(lines.slice(bodyIndex + 1).join("\n").replace(/\u0000/g, "")) : null;

        if (dest && subscriptionsRef.current[dest]) {
          subscriptionsRef.current[dest].forEach(cb => cb(body));
        }
      }
    } catch (e) {
      // Mock simulation logs fallback
    }
  };

  const subscribe = (topic: string, callback: (payload: any) => void) => {
    if (!subscriptionsRef.current[topic]) {
      subscriptionsRef.current[topic] = [];
    }
    subscriptionsRef.current[topic].push(callback);
    
    // Send STOMP SUBSCRIBE frame
    sendFrame("SUBSCRIBE", { destination: topic, id: topic });

    return () => {
      subscriptionsRef.current[topic] = subscriptionsRef.current[topic].filter(cb => cb !== callback);
      sendFrame("UNSUBSCRIBE", { id: topic });
    };
  };

  const send = (destination: string, payload: any) => {
    sendFrame("SEND", { destination }, payload);
  };

  const triggerTyping = (page: string) => {
    send("/app/typing", { name: user?.firstName || "User", page });
  };

  return (
    <SocketContext.Provider value={{ status, subscribe, send, activeUsers, triggerTyping, typingUser }}>
      {children}
    </SocketContext.Provider>
  );
};
