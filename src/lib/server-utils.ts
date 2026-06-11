import prisma from "@/lib/prisma";

/**
 * Check if a user is a member of a server
 */
export async function isServerMember(
  userId: string,
  serverId: string
): Promise<boolean> {
  const membership = await prisma.serverMember.findFirst({
    where: {
      userId,
      serverId,
    },
    select: { id: true },
  });

  return !!membership;
}

/**
 * Check if a user is the server owner
 */
export async function isServerOwner(
  userId: string,
  serverId: string
): Promise<boolean> {
  const server = await prisma.server.findFirst({
    where: {
      id: serverId,
      ownerId: userId,
    },
    select: { id: true },
  });

  return !!server;
}

/**
 * Get user's role in a server
 */
export async function getUserRole(
  userId: string,
  serverId: string
): Promise<string | null> {
  const membership = await prisma.serverMember.findFirst({
    where: {
      userId,
      serverId,
    },
    select: { role: true },
  });

  return membership?.role || null;
}

/**
 * Check if user can manage channels (owner or moderator)
 */
export async function canManageChannels(
  userId: string,
  serverId: string
): Promise<boolean> {
  const isOwner = await isServerOwner(userId, serverId);
  if (isOwner) return true;

  const role = await getUserRole(userId, serverId);
  return role === "moderator";
}

/**
 * Get server with all data
 */
export async function getServerWithData(
  serverId: string,
  userId?: string
) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      channels: {
        orderBy: { position: "asc" },
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

  if (!server) return null;

  // Check membership if userId provided
  if (userId) {
    const isMember = await isServerMember(userId, serverId);
    if (!isMember && server.ownerId !== userId) {
      return null;
    }
  }

  return server;
}

/**
 * Create default channels for a new server
 */
export async function createDefaultChannels(serverId: string) {
  const defaultChannels = [
    { name: "general", type: "text", position: 0 },
    { name: "announcements", type: "text", position: 1 },
    { name: "general-voice", type: "voice", position: 2 },
  ];

  for (const channel of defaultChannels) {
    await prisma.channel.create({
      data: {
        ...channel,
        serverId,
      },
    });
  }
}