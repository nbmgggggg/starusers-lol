"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/server";

interface UserProfileProps {
  userId: string;
  onClose?: () => void;
}

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
      setBio(data.user.bio || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBio() {
    if (!user) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!user) {
    return <div className="p-4 text-gray-500">User not found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
      {/* Banner */}
      {user.banner && (
        <div
          className="h-24 bg-cover bg-center"
          style={{ backgroundImage: `url(${user.banner})` }}
        />
      )}

      {/* Profile Content */}
      <div className="p-6">
        {/* Avatar */}
        <div className="flex justify-center -mt-16 mb-4">
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
          )}
        </div>

        {/* Username */}
        <h2 className="text-2xl font-bold text-center mb-2">{user.username}</h2>

        {/* Bio */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                maxLength={150}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setBio(user.bio || "");
                  }}
                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-700 mb-2">
                {user.bio || "No bio yet"}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Edit Bio
              </button>
            </>
          )}
        </div>

        {/* Member Since */}
        <div className="text-center text-sm text-gray-500">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}