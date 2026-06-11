"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Server } from "@/types/server";

export default function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  async function fetchServers() {
    try {
      setLoading(true);
      const response = await fetch("/api/servers");

      if (!response.ok) {
        throw new Error("Failed to fetch servers");
      }

      const data = await response.json();
      setServers(data.servers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading servers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-xl font-bold">Your Servers</h2>

      {servers.length === 0 ? (
        <p className="text-gray-500">No servers yet. Create one to get started!</p>
      ) : (
        <div className="space-y-2">
          {servers.map((server) => (
            <Link
              key={server.id}
              href={`/app/servers/${server.id}`}
              className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {server.icon && (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-10 h-10 rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{server.name}</h3>
                  {server.description && (
                    <p className="text-sm text-gray-600">
                      {server.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {server.members.length} members
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}