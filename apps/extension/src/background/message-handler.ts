/**
 * Background Message Handler
 * Simplified handler for backend-based architecture
 */

// Message types
export interface Message {
  type: string;
  payload?: any;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Simple message handler that just responds to PING messages
 * All other functionality is handled by the backend via API calls from the sidepanel
 */
export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Just respond to PING messages to confirm the extension is loaded
    if (message.type === 'PING') {
      sendResponse({ success: true, data: 'pong' });
      return true;
    }

    // All other messages are not handled by background (handled by sidepanel -> backend)
    sendResponse({ success: false, error: 'Unknown message type' });
    return true;
  });
}
