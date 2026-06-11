"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DMConversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export default function DMList() {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      setLoading(true);
      const response = await fetch("/api/direct-messages");

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">Error loading conversations</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-bold">Direct Messages</h2>

      {conversations.length === 0 ? (
        <p className="text-sm text-gray-500">No conversations yet</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <Link
              key={convo.userId}
              href={`/app/dm/${convo.userId}`}
              className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {convo.avatar && (
                  <img
                    src={convo.avatar}
                    alt={convo.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold">{convo.username}</h3>
                    {convo.unreadCount > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  {convo.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {convo.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}