import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  serverId: string;
}

// GET /api/servers/[serverId]/channels - Get all channels in a server
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

    const channels = await prisma.channel.findMany({
      where: { serverId: params.serverId },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/servers/[serverId]/channels - Create a new channel
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
        { error: "Server not found or not authorized" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, type } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Channel name must be less than 100 characters" },
        { status: 400 }
      );
    }

    if (type && !["text", "voice"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type" },
        { status: 400 }
      );
    }

    // Get the highest position
    const lastChannel = await prisma.channel.findFirst({
      where: { serverId: params.serverId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (lastChannel?.position || -1) + 1;

    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "text",
        position,
        serverId: params.serverId,
      },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}