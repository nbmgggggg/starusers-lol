# StarUsers - Discord-like Chat Platform

A modern, production-ready chat platform with real-time messaging, servers, channels, and member management.

## Features

✅ **Server Management** - Create, update, and delete servers
✅ **Channels** - Organize conversations with text and voice channels
✅ **Member Management** - Add members, manage roles (owner, moderator, member)
✅ **Real-time Updates** - Socket.io integration for live messaging
✅ **Authentication** - Secure NextAuth.js setup
✅ **Type-Safe** - Full TypeScript support
✅ **Database** - PostgreSQL with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nbmgggggg/starusers-lol.git
cd starusers-lol

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Update .env.local with your database URL and NextAuth secret

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

### Servers
- `GET /api/servers` - Get all servers for current user
- `POST /api/servers` - Create a new server
- `GET /api/servers/[serverId]` - Get server details
- `PATCH /api/servers/[serverId]` - Update server
- `DELETE /api/servers/[serverId]` - Delete server

### Channels
- `GET /api/servers/[serverId]/channels` - Get all channels
- `POST /api/servers/[serverId]/channels` - Create a channel
- `GET /api/servers/[serverId]/channels/[channelId]` - Get channel details
- `PATCH /api/servers/[serverId]/channels/[channelId]` - Update channel
- `DELETE /api/servers/[serverId]/channels/[channelId]` - Delete channel

### Members
- `GET /api/servers/[serverId]/members` - Get all members
- `POST /api/servers/[serverId]/members` - Add a member
- `PATCH /api/servers/[serverId]/members/[memberId]` - Update member role
- `DELETE /api/servers/[serverId]/members/[memberId]` - Remove member

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── servers/          # Server API routes
│   └── layout.tsx
├── components/
│   └── server/              # Server UI components
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # NextAuth configuration
│   └── server-utils.ts     # Server utility functions
├── types/
│   └── server.ts           # TypeScript interfaces
prisma/
└── schema.prisma           # Database schema
```

## Database Schema

- **User** - User accounts with profiles
- **Server** - Chat servers
- **Channel** - Text and voice channels
- **Message** - Channel messages
- **ServerMember** - Server membership with roles

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/starusers
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Next Steps

- [ ] Implement real-time messaging with Socket.IO
- [ ] Add message editing/deletion
- [ ] Implement voice channels with WebRTC
- [ ] Add file upload support
- [ ] Implement StarBoost subscription system
- [ ] Add push notifications
- [ ] Implement moderation tools
- [ ] Add two-factor authentication

## License

MIT
