/**
 * Background Service Worker Entry Point
 * Manages the Chrome extension background tasks and message handling
 */

import { setupMessageListener } from './message-handler';
import storageService from '../services/storage-service';
import { logError } from '../utils/error-handlers';

// Export to prevent "isolatedModules" error
export {};

console.log('[Colder] Background worker loaded');

// --------------------------------------------------------------------------
// Service Worker Lifecycle
// --------------------------------------------------------------------------

/**
 * Handle extension installation or update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Colder] Extension installed/updated:', details.reason);

  try {
    // Initialize default settings on first install
    if (details.reason === 'install') {
      await initializeExtension();
    }

    // Handle extension update
    if (details.reason === 'update') {
      console.log('[Colder] Updated from version:', details.previousVersion);
      // Future: Run migration scripts if needed
    }

    // Set up storage cleanup alarm (runs daily)
    await setupCleanupAlarm();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      event: 'onInstalled',
      reason: details.reason
    });
  }
});

/**
 * Initialize extension on first install
 */
async function initializeExtension(): Promise<void> {
  console.log('[Colder] Initializing extension...');

  // Check if user profile exists
  const profile = await storageService.getUserProfile();

  if (!profile) {
    console.log('[Colder] No user profile found - will prompt for setup');
  }

  // Initialize settings with defaults
  const settings = await storageService.getSettings();
  console.log('[Colder] Settings initialized:', {
    hasApiKey: !!settings.openrouterApiKey,
    theme: settings.theme,
    model: settings.openrouterModel
  });

  console.log('[Colder] Extension initialization complete');
}

// --------------------------------------------------------------------------
// Storage Cleanup
// --------------------------------------------------------------------------

/**
 * Set up daily cleanup alarm
 */
async function setupCleanupAlarm(): Promise<void> {
  const alarmName = 'storage-cleanup';

  // Clear existing alarm if any
  await chrome.alarms.clear(alarmName);

  // Create alarm that runs every 24 hours
  chrome.alarms.create(alarmName, {
    periodInMinutes: 24 * 60, // 24 hours
    delayInMinutes: 1 // Start 1 minute after setup
  });

  console.log('[Colder] Storage cleanup alarm scheduled');
}

/**
 * Handle alarms
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Colder] Alarm triggered:', alarm.name);

  if (alarm.name === 'storage-cleanup') {
    await runStorageCleanup();
  }
});

/**
 * Run storage cleanup tasks
 */
async function runStorageCleanup(): Promise<void> {
  try {
    console.log('[Colder] Running storage cleanup...');

    // Get storage usage before cleanup
    const usageBefore = await storageService.getStorageUsage();
    console.log('[Colder] Storage usage before cleanup:', {
      sync: `${usageBefore.sync.percentage}%`,
      local: `${usageBefore.local.percentage}%`
    });

    // TODO: In future phases, implement cleanup for:
    // - Expired target profiles (> 24 hours)
    // - Expired profile analyses (> 24 hours)
    // - Expired message drafts (> 7 days)
    // - Expired outreach history (free plan, > 5 days)

    // Get storage usage after cleanup
    const usageAfter = await storageService.getStorageUsage();
    console.log('[Colder] Storage usage after cleanup:', {
      sync: `${usageAfter.sync.percentage}%`,
      local: `${usageAfter.local.percentage}%`
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      task: 'storage-cleanup'
    });
  }
}

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
setupMessageListener();

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
