import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  messageId: string;
}

// PATCH /api/messages/[messageId] - Edit a message
export async function PATCH(
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

    // Check if message exists and user is the author
    const message = await prisma.message.findFirst({
      where: {
        id: params.messageId,
        authorId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or not authorized" },
        { status: 404 }
      );
    }

    // Check if message is older than 15 minutes
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 15) {
      return NextResponse.json(
        { error: "Cannot edit messages older than 15 minutes" },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id: params.messageId },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[messageId] - Delete a message
export async function DELETE(
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

    // Check if message exists and user is the author
    const message = await prisma.message.findFirst({
      where: {
        id: params.messageId,
        authorId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or not authorized" },
        { status: 404 }
      );
    }

    // Check if message is older than 1 hour
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 60) {
      return NextResponse.json(
        { error: "Cannot delete messages older than 1 hour" },
        { status: 400 }
      );
    }

    await prisma.message.delete({
      where: { id: params.messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}