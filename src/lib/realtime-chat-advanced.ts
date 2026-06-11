"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface TypingIndicator {
  userId: string;
  username: string;
}

interface OnlineUser {
  userId: string;
  username: string;
}

export function useRealtimeChat(channelId: string, currentUserId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.warn("Socket URL not configured");
      return;
    }

    const newSocket = io(socketUrl, {
      auth: {
        userId: currentUserId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected");
      setIsConnected(true);
      newSocket.emit("join_channel", { channelId });
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    newSocket.on("user_joined", (user: OnlineUser) => {
      setOnlineUsers((prev) => [...new Set([...prev, user])]);
    });

    newSocket.on("user_left", (userId: string) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    newSocket.on("user_typing", (data: TypingIndicator) => {
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.userId);
        return [...filtered, data];
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== data.userId)
        );
      }, 3000);
    });

    newSocket.on("error", (error: string) => {
      console.error("[Socket] Error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [channelId, currentUserId]);

  const broadcastTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("typing", { channelId });
    }
  }, [socket, isConnected, channelId]);

  return {
    socket,
    isConnected,
    typingUsers,
    onlineUsers,
    broadcastTyping,
  };
}