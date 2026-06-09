// Next.js' server runtime expects `globalThis.AsyncLocalStorage` to exist.
// When Next is hosted from a custom Node server (rather than `next start`), we
// must provide it ourselves. This module is imported first in server.ts, before
// any Next.js module loads.
import { AsyncLocalStorage } from 'node:async_hooks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

export {};
