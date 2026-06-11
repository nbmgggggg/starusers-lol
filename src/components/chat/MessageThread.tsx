"use client";

import { useEffect, useState } from "react";
import { Message } from "@/types/server";

interface MessageThreadProps {
  messageId: string;
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageThread({
  messageId,
  channelId,
  isOpen,
  onClose,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchThreadMessages();
    }
  }, [messageId, isOpen]);

  async function fetchThreadMessages() {
    try {
      setLoading(true);
      console.log("Fetching thread messages for:", messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 w-96 h-screen bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="font-bold">Thread</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {messages.length === 0 && !loading && (
          <p className="text-gray-500 text-sm">No replies yet</p>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNewReply("");
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}