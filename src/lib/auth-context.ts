import { AsyncLocalStorage } from "node:async_hooks";

import type { GitLabAuthHeader } from "../types/auth.js";

export interface SessionAuth {
  sessionId?: string;
  token?: string;
  apiUrl?: string;
  header?: GitLabAuthHeader;
  updatedAt: number;
}

const sessionAuthStore = new AsyncLocalStorage<SessionAuth | undefined>();

export function runWithSessionAuth<T>(auth: SessionAuth | undefined, callback: () => T): T {
  return sessionAuthStore.run(auth, callback);
}

export function getSessionAuth(): SessionAuth | undefined {
  return sessionAuthStore.getStore();
}
