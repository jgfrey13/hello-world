import './src/lib/als-polyfill';
import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import next from 'next';
import cookie from 'cookie';
import { Server as IOServer } from 'socket.io';
import { env } from './src/lib/env';
import { verifyToken, AUTH_COOKIE } from './src/lib/auth';
import { prisma } from './src/lib/prisma';
import { setIo, threadRoom } from './src/lib/realtime';

const dev = !env.isProd;
const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const server = express();

  // --- Security & CORS middleware ---
  server.use(
    helmet({
      // Next.js injects inline scripts/styles in dev; relax CSP there.
      contentSecurityPolicy: env.isProd ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  server.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  // Hand everything else to Next.js (pages + API routes).
  server.all('*', (req, res) => handle(req, res));

  const httpServer = createServer(server);

  // --- Socket.io realtime layer ---
  const io = new IOServer(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    path: '/socket.io',
  });
  setIo(io);

  // Authenticate every socket connection from the auth cookie.
  io.use((socket, nextFn) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || '');
      const token = cookies[AUTH_COOKIE];
      const payload = token ? verifyToken(token) : null;
      if (!payload) return nextFn(new Error('Unauthorized'));
      (socket.data as { userId: string }).userId = payload.sub;
      nextFn();
    } catch {
      nextFn(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;

    // Client joins a conversation thread (projectId + contractorId). We verify
    // the user is one of the two participants before letting them into the room.
    socket.on('join', async (payload: { projectId: string; contractorId: string }) => {
      const { projectId, contractorId } = payload || {};
      if (typeof projectId !== 'string' || typeof contractorId !== 'string') return;
      const allowed = await userCanAccessThread(userId, projectId, contractorId);
      if (allowed) socket.join(threadRoom(projectId, contractorId));
    });

    socket.on('leave', (payload: { projectId: string; contractorId: string }) => {
      const { projectId, contractorId } = payload || {};
      if (typeof projectId === 'string' && typeof contractorId === 'string') {
        socket.leave(threadRoom(projectId, contractorId));
      }
    });

    // Lightweight typing indicator relayed to the other participant in the thread.
    socket.on('typing', (payload: { projectId: string; contractorId: string }) => {
      const { projectId, contractorId } = payload || {};
      if (typeof projectId === 'string' && typeof contractorId === 'string') {
        socket.to(threadRoom(projectId, contractorId)).emit('typing', { userId, projectId });
      }
    });
  });

  httpServer.listen(env.port, () => {
    console.log(`🏠  Home Improvement Marketplace ready on http://localhost:${env.port}`);
    console.log(`    Mode: ${dev ? 'development' : 'production'}`);
  });
}

// Authorization helper: a user may join a thread only if they are one of its two
// participants — the project's homeowner, or the contractor in the pair (who must
// have placed a bid on the project).
async function userCanAccessThread(
  userId: string,
  projectId: string,
  contractorId: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      homeownerId: true,
      bids: { where: { contractorId }, select: { id: true } },
    },
  });
  if (!project || project.bids.length === 0) return false;
  return userId === project.homeownerId || userId === contractorId;
}

main().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
