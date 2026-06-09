// Preloaded via NODE_OPTIONS before the custom server (and Next.js) is loaded.
// Next.js' server runtime reads `globalThis.AsyncLocalStorage` at module-eval
// time; when hosting Next from a custom server we must provide it ourselves.
const { AsyncLocalStorage } = require('node:async_hooks');
globalThis.AsyncLocalStorage = AsyncLocalStorage;
