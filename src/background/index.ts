// Background service worker for Colder extension
export {};

console.log('Colder extension background worker loaded');

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  // Handle different message types
  switch (request.type) {
    case 'PING':
      sendResponse({ success: true, message: 'pong' });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep the message channel open for async responses
});

// Keep the service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('Colder extension installed');
});
