"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "@/types/server";

interface RealtimeChatProps {
  channelId: string;
  currentUserId?: string;
  currentUsername?: string;
}

interface RealtimeMessage extends Message {
  isOptimistic?: boolean;
}

export function useRealtimeChat(channelId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.warn("Socket URL not configured");
      return;
    }

    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      newSocket.emit("join_channel", { channelId });
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("message_sent", (message: RealtimeMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("message_edited", (message: RealtimeMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    });

    newSocket.on("message_deleted", (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    newSocket.on("error", (error: string) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [channelId]);

  const sendMessage = (content: string) => {
    if (!socket || !isConnected) return;
    socket.emit("send_message", { channelId, content });
  };

  const editMessage = (messageId: string, content: string) => {
    if (!socket || !isConnected) return;
    socket.emit("edit_message", { messageId, content });
  };

  const deleteMessage = (messageId: string) => {
    if (!socket || !isConnected) return;
    socket.emit("delete_message", { messageId });
  };

  return {
    socket,
    messages,
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}