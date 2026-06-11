import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  serverId: string;
  channelId: string;
}

// GET /api/servers/[serverId]/channels/[channelId] - Get channel details
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

    // Check if user is a member of the server
    const isMember = await prisma.serverMember.findFirst({
      where: {
        serverId: params.serverId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: params.channelId,
        serverId: params.serverId,
      },
      include: {
        messages: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/servers/[serverId]/channels/[channelId] - Update channel
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

    // Check if user is the server owner
    const server = await prisma.server.findFirst({
      where: {
        id: params.serverId,
        ownerId: user.id,
      },
      select: { id: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, position } = body;

    const updatedChannel = await prisma.channel.update({
      where: { id: params.channelId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json({ channel: updatedChannel });
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[serverId]/channels/[channelId] - Delete channel
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

    // Check if user is the server owner
    const server = await prisma.server.findFirst({
      where: {
        id: params.serverId,
        ownerId: user.id,
      },
      select: { id: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: params.channelId,
        serverId: params.serverId,
      },
      select: { id: true, name: true },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of the last channel or "general" channel
    if (channel.name === "general") {
      return NextResponse.json(
        { error: "Cannot delete the general channel" },
        { status: 400 }
      );
    }

    const channelCount = await prisma.channel.count({
      where: { serverId: params.serverId },
    });

    if (channelCount <= 1) {
      return NextResponse.json(
        { error: "Server must have at least one channel" },
        { status: 400 }
      );
    }

    await prisma.channel.delete({
      where: { id: params.channelId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}