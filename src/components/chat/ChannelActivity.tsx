"use client";

import { useEffect, useState } from "react";

interface PresenceIndicator {
  userId: string;
  username: string;
  isOnline: boolean;
}

export default function ChannelActivity() {
  const [typing, setTyping] = useState<PresenceIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceIndicator[]>([]);

  return (
    <div className="border-t border-gray-200 p-3 space-y-2">
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Online</p>
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typing Indicators */}
      {typing.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 italic">
            {typing.map((u) => u.username).join(", ")} typing...
          </p>
        </div>
      )}
    </div>
  );
}