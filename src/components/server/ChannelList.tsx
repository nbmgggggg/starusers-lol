"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Channel } from "@/types/server";

interface ChannelListProps {
  serverId: string;
  currentChannelId?: string;
  canEdit?: boolean;
}

export default function ChannelList({
  serverId,
  currentChannelId,
  canEdit = false,
}: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, [serverId]);

  async function fetchChannels() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/servers/${serverId}/channels`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-2 text-sm text-gray-500">Loading channels...</div>;
  }

  if (error) {
    return <div className="p-2 text-sm text-red-600">Error loading channels</div>;
  }

  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Text Channels */}
      {textChannels.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-600 px-3 py-2 uppercase">
            Text Channels
          </h3>
          <div className="space-y-1">
            {textChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/app/servers/${serverId}/channels/${channel.id}`}
                className={`block px-3 py-2 rounded-lg transition ${
                  currentChannelId === channel.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>#</span>
                  <span className="truncate">{channel.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Voice Channels */}
      {voiceChannels.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-600 px-3 py-2 uppercase">
            Voice Channels
          </h3>
          <div className="space-y-1">
            {voiceChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/app/servers/${serverId}/channels/${channel.id}`}
                className={`block px-3 py-2 rounded-lg transition ${
                  currentChannelId === channel.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🔊</span>
                  <span className="truncate">{channel.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {channels.length === 0 && (
        <p className="text-sm text-gray-500 px-3 py-2">
          No channels yet
        </p>
      )}
    </div>
  );
}