import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/servers - Get all servers for current user
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

    const servers = await prisma.server.findMany({
      where: {
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
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
          },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/servers - Create a new server
export async function POST(req: NextRequest) {
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
    const { name, description, icon } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Server name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Server name must be less than 100 characters" },
        { status: 400 }
      );
    }

    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
        channels: {
          create: {
            name: "general",
            type: "text",
            position: 0,
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
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    console.error("Error creating server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}