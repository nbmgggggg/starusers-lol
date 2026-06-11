import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Params {
  serverId: string;
  memberId: string;
}

// PATCH /api/servers/[serverId]/members/[memberId] - Update member role
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
    const { role } = body;

    if (!role || !["member", "moderator"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const member = await prisma.serverMember.findFirst({
      where: {
        id: params.memberId,
        serverId: params.serverId,
      },
      select: { id: true, userId: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Cannot change owner role
    if (member.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.serverMember.update({
      where: { id: params.memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[serverId]/members/[memberId] - Remove member
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

    const member = await prisma.serverMember.findFirst({
      where: {
        id: params.memberId,
        serverId: params.serverId,
      },
      select: { id: true, userId: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Cannot remove the owner
    if (member.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself as owner" },
        { status: 400 }
      );
    }

    await prisma.serverMember.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}