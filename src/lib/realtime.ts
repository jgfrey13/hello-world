import type { Server as IOServer } from 'socket.io';

// The custom server (server.ts) attaches the Socket.io instance to globalThis so
// that API route handlers — which run in the same Node process — can emit events
// without holding a direct reference.
const globalForIo = globalThis as unknown as { __io?: IOServer };

export function setIo(io: IOServer) {
  globalForIo.__io = io;
}

export function getIo(): IOServer | undefined {
  return globalForIo.__io;
}

// A conversation thread is uniquely identified by a project and the contractor
// in the pair (the homeowner is always the project owner). One Socket.io room
// per thread keeps each contractor's chat private from the others.
export const threadRoom = (projectId: string, contractorId: string) =>
  `thread:${projectId}:${contractorId}`;

export function emitNewMessage(projectId: string, contractorId: string, message: unknown) {
  getIo()?.to(threadRoom(projectId, contractorId)).emit('message:new', message);
}
