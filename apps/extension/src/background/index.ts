/**
 * Background Service Worker Entry Point
 * Manages the Chrome extension background tasks and message handling
 */

import { setupMessageListener } from './message-handler';
import { logError } from '../utils/error-handlers';

// Export to prevent "isolatedModules" error
export const startTime = Date.now();

console.log('[Colder] Background worker loaded');
console.log('[Colder] Environment check:', {
  hasChrome: typeof chrome !== 'undefined',
  hasRuntime: typeof chrome?.runtime !== 'undefined',
  hasStorage: typeof chrome?.storage !== 'undefined',
  version: chrome?.runtime?.getManifest?.()?.version
});

// --------------------------------------------------------------------------
// Service Worker Lifecycle
// --------------------------------------------------------------------------

/**
 * Handle extension installation or update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Colder] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('[Colder] Extension installed - user will be prompted to sign in');
  }

  if (details.reason === 'update') {
    console.log('[Colder] Updated from version:', details.previousVersion);
  }
});

// --------------------------------------------------------------------------
// Service Worker Keep-Alive
// --------------------------------------------------------------------------

/**
 * Keep service worker alive during active use
 * Manifest V3 service workers terminate after 30 seconds of inactivity
 */
let keepAliveInterval: number | null = null;

/**
 * Start keep-alive ping
 */
function startKeepAlive(): void {
  if (keepAliveInterval) return;

  // Ping every 20 seconds to prevent termination
  keepAliveInterval = setInterval(() => {
    chrome.storage.local.get('_keepAlive', () => {
      // Just accessing storage keeps the worker alive
    });
  }, 20000) as unknown as number;

  console.log('[Colder] Keep-alive started');
}

/**
 * Stop keep-alive ping
 */
function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[Colder] Keep-alive stopped');
  }
}

// Start keep-alive when a tab is active
chrome.tabs.onActivated.addListener(() => {
  startKeepAlive();
});

// Stop keep-alive when all tabs are closed
chrome.tabs.onRemoved.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  if (tabs.length === 0) {
    stopKeepAlive();
  }
});

// --------------------------------------------------------------------------
// Message Handling
// --------------------------------------------------------------------------

// Set up the message listener from our message handler
try {
  console.log('[Colder] Setting up message listener...');
  setupMessageListener();
  console.log('[Colder] ✓ Message listener ready');
} catch (error) {
  console.error('[Colder] ❌ Failed to setup message listener:', error);
  logError(error instanceof Error ? error : new Error(String(error)), {
    task: 'setupMessageListener'
  });
}

// --------------------------------------------------------------------------
// Side Panel Action
// --------------------------------------------------------------------------

/**
 * Open side panel when extension icon is clicked
 */
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
      console.error('[Colder] Failed to open side panel:', error);
    });
  }
});

// --------------------------------------------------------------------------
// Context Menu (Future Feature)
// --------------------------------------------------------------------------

/**
 * Create context menu items
 */
chrome.runtime.onInstalled.addListener(() => {
  // Future: Add context menu items for quick actions
  // e.g., "Analyze LinkedIn Profile", "Generate Message"
});

// --------------------------------------------------------------------------
// Badge Management
// --------------------------------------------------------------------------

/**
 * Update extension badge to show status
 */
export async function updateBadge(status: 'ready' | 'working' | 'error'): Promise<void> {
  const badges = {
    ready: { text: '', color: '#4CAF50' },
    working: { text: '...', color: '#2196F3' },
    error: { text: '!', color: '#F44336' }
  };

  const badge = badges[status];

  await chrome.action.setBadgeText({ text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

// --------------------------------------------------------------------------
// Error Handling
// --------------------------------------------------------------------------

/**
 * Global error handler for unhandled promise rejections
 */
self.addEventListener('unhandledrejection', (event) => {
  logError(new Error(`Unhandled rejection: ${event.reason}`), {
    type: 'unhandledRejection'
  });
});

/**
 * Global error handler
 */
self.addEventListener('error', (event) => {
  logError(event.error || new Error(event.message), {
    type: 'globalError',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// --------------------------------------------------------------------------
// Startup
// --------------------------------------------------------------------------

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Colder] Extension started');
  await updateBadge('ready');
});

// Set initial badge
updateBadge('ready').catch(console.error);

console.log('[Colder] Background worker ready');
