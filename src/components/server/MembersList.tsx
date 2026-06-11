"use client";

import { useEffect, useState } from "react";
import { ServerMember } from "@/types/server";

interface MembersListProps {
  serverId: string;
  isOwner?: boolean;
}

export default function MembersList({
  serverId,
  isOwner = false,
}: MembersListProps) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [serverId]);

  async function fetchMembers() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/servers/${serverId}/members`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    try {
      setAddingMember(true);
      const response = await fetch(
        `/api/servers/${serverId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newUsername.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add member");
      }

      const data = await response.json();
      setMembers([...members, data.member]);
      setNewUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/servers/${serverId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Members ({members.length})</h3>

      {isOwner && (
        <form onSubmit={handleAddMember} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter username to add..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={addingMember}
            />
            <button
              type="submit"
              disabled={addingMember}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {addingMember ? "Adding..." : "Add"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </form>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {member.user.avatar && (
                <img
                  src={member.user.avatar}
                  alt={member.user.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{member.user.username}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {member.role}
                </p>
              </div>
            </div>
            {isOwner && member.role !== "owner" && (
              <button
                onClick={() => handleRemoveMember(member.id)}
                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}