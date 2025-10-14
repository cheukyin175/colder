import { vi } from 'vitest';

// Mock Chrome APIs
const chrome = {
  storage: {
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      getBytesInUse: vi.fn(() => Promise.resolve(0)),
    },
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve()),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      manifest_version: 3,
    })),
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(() => Promise.resolve()),
  },
  identity: {
    getAuthToken: vi.fn(() => Promise.resolve({ token: 'mock-token' })),
    launchWebAuthFlow: vi.fn(() => Promise.resolve('mock-redirect-url')),
  },
};

// @ts-ignore
global.chrome = chrome;

export { chrome };
