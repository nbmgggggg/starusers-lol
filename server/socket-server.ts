import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

interface UserSocket {
  userId: string;
  username: string;
  channelId?: string;
}

const userSockets = new Map<string, UserSocket>();

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on("join_channel", async (data) => {
    const { channelId } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!userId || !username) {
      console.warn(`[Socket] No user data for socket ${socket.id}`);
      return;
    }

    socket.join(channelId);
    userSockets.set(socket.id, { userId, username, channelId });

    io.to(channelId).emit("user_joined", {
      userId,
      username,
      timestamp: new Date(),
    });

    console.log(`[Socket] User ${username} joined channel ${channelId}`);
  });

  socket.on("send_message", async (data) => {
    const { channelId, content } = data;
    const userSocket = userSockets.get(socket.id);

    if (!userSocket) {
      socket.emit("error", "Not in a channel");
      return;
    }

    try {
      io.to(channelId).emit("message_sent", {
        channelId,
        content,
        authorId: userSocket.userId,
        author: {
          id: userSocket.userId,
          username: userSocket.username,
        },
        timestamp: new Date(),
      });

      console.log(`[Socket] Message sent in ${channelId} by ${userSocket.username}`);
    } catch (error) {
      console.error("[Socket] Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("edit_message", async (data) => {
    const { messageId, content } = data;
    const userSocket = userSockets.get(socket.id);

    if (!userSocket) {
      socket.emit("error", "Not in a channel");
      return;
    }

    try {
      io.to(userSocket.channelId!).emit("message_edited", {
        id: messageId,
        content,
        timestamp: new Date(),
      });
      console.log(`[Socket] Message ${messageId} edited by ${userSocket.username}`);
    } catch (error) {
      console.error("[Socket] Error editing message:", error);
      socket.emit("error", "Failed to edit message");
    }
  });

  socket.on("delete_message", async (data) => {
    const { messageId } = data;
    const userSocket = userSockets.get(socket.id);

    if (!userSocket) {
      socket.emit("error", "Not in a channel");
      return;
    }

    try {
      io.to(userSocket.channelId!).emit("message_deleted", messageId);
      console.log(`[Socket] Message ${messageId} deleted by ${userSocket.username}`);
    } catch (error) {
      console.error("[Socket] Error deleting message:", error);
      socket.emit("error", "Failed to delete message");
    }
  });

  socket.on("disconnect", () => {
    const userSocket = userSockets.get(socket.id);

    if (userSocket && userSocket.channelId) {
      io.to(userSocket.channelId).emit("user_left", {
        userId: userSocket.userId,
        username: userSocket.username,
        timestamp: new Date(),
      });

      console.log(`[Socket] User ${userSocket.username} left channel ${userSocket.channelId}`);
    }

    userSockets.delete(socket.id);
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});
