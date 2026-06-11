import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  recipientId: string;
}

// GET /api/direct-messages/[recipientId] - Get DM history with a user
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get messages between the two users
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: currentUser.id,
            recipientId: params.recipientId,
          },
          {
            senderId: params.recipientId,
            recipientId: currentUser.id,
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Mark as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: params.recipientId,
        recipientId: currentUser.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching DM history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/direct-messages/[recipientId] - Send a direct message
export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: params.recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        content: content.trim(),
        senderId: currentUser.id,
        recipientId: params.recipientId,
      },
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

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending DM:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}