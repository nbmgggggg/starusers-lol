import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  serverId: string;
}

// GET /api/servers/[serverId] - Get server details
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

    const server = await prisma.server.findFirst({
      where: {
        id: params.serverId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        channels: {
          orderBy: {
            position: "asc",
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Server not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error("Error fetching server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/servers/[serverId] - Update server
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

    const server = await prisma.server.findFirst({
      where: {
        id: params.serverId,
        ownerId: user.id,
      },
      select: { id: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Server not found or not authorized" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, icon } = body;

    const updatedServer = await prisma.server.update({
      where: { id: params.serverId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        channels: {
          orderBy: {
            position: "asc",
          },
        },
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ server: updatedServer });
  } catch (error) {
    console.error("Error updating server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[serverId] - Delete server
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

    const server = await prisma.server.findFirst({
      where: {
        id: params.serverId,
        ownerId: user.id,
      },
      select: { id: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Server not found or not authorized" },
        { status: 404 }
      );
    }

    await prisma.server.delete({
      where: { id: params.serverId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}