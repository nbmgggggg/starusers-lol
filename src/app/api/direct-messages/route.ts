import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/direct-messages - Get all DM conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get unique conversations
    const sentMessages = await prisma.directMessage.findMany({
      where: { senderId: user.id },
      distinct: ["recipientId"],
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const receivedMessages = await prisma.directMessage.findMany({
      where: { recipientId: user.id },
      distinct: ["senderId"],
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Merge and deduplicate
    const conversationMap = new Map();

    [...sentMessages, ...receivedMessages].forEach((msg) => {
      const otherUserId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: msg.sender.id === user.id ? msg.recipientId : msg.sender.id,
          username: msg.sender.username,
          avatar: msg.sender.avatar,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
        });
      }
    });

    // Get unread counts
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (convo) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            senderId: convo.userId,
            recipientId: user.id,
            isRead: false,
          },
        });
        return { ...convo, unreadCount };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching DM conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}