/**
 * Content Script
 * Injected into LinkedIn pages to handle profile extraction
 */

import { extractProfileWithRetry, checkExtractionCapability } from './linkedin-extractor';
import { isLinkedInProfilePage, getProfileUrl } from '../utils/linkedin-selectors';
import { MessageType } from '../background/message-handler';
import { ExtractionError, logError, showErrorNotification } from '../utils/error-handlers';

// Export empty object to satisfy TypeScript's isolatedModules
export {};

console.log('[Colder Content] Content script loaded on:', window.location.href);

/**
 * Message listener for commands from background/popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Colder Content] Received message:', message.type);

  // Handle messages asynchronously
  handleMessage(message)
    .then(response => {
      sendResponse({ success: true, data: response });
    })
    .catch(error => {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { messageType: message.type });
      sendResponse({
        success: false,
        error: {
          message: err.message,
          code: err.name
        }
      });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handle incoming messages
 */
async function handleMessage(message: any): Promise<any> {
  switch (message.type) {
    case MessageType.PROFILE_EXTRACT:
      return handleProfileExtraction();

    case 'CHECK_CAPABILITY':
      return checkExtractionCapability();

    case 'GET_PROFILE_URL':
      return getProfileUrl();

    case 'IS_PROFILE_PAGE':
      return isLinkedInProfilePage();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle profile extraction request
 */
async function handleProfileExtraction(): Promise<any> {
  console.log('[Colder Content] Starting profile extraction...');

  // Check if we're on a profile page
  if (!isLinkedInProfilePage()) {
    throw new ExtractionError(
      'Please navigate to a LinkedIn profile page first',
      [],
      'minimal'
    );
  }

  try {
    // Extract profile with retry logic
    const profile = await extractProfileWithRetry(3);

    console.log('[Colder Content] Profile extracted successfully:', {
      name: profile.name,
      quality: profile.extractionQuality,
      missingFields: profile.missingFields
    });

    // Send profile to background for caching and processing
    const response = await chrome.runtime.sendMessage({
      type: MessageType.PROFILE_EXTRACT,
      payload: { profile }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to process profile');
    }

    return profile;
  } catch (error) {
    if (error instanceof ExtractionError) {
      // Add more context to extraction errors
      throw new ExtractionError(
        `Profile extraction failed: ${error.message}`,
        error.missingFields,
        error.extractionQuality
      );
    }
    throw error;
  }
}

/**
 * Monitor URL changes (LinkedIn is a SPA)
 */
let currentUrl = window.location.href;

function checkUrlChange(): void {
  const newUrl = window.location.href;

  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    console.log('[Colder Content] URL changed to:', newUrl);

    // Notify background script of URL change
    chrome.runtime.sendMessage({
      type: 'URL_CHANGED',
      payload: {
        url: newUrl,
        isProfilePage: isLinkedInProfilePage()
      }
    }).catch(error => {
      console.error('[Colder Content] Failed to send URL change:', error);
    });
  }
}

// Check for URL changes periodically (LinkedIn is a SPA)
setInterval(checkUrlChange, 1000);

/**
 * Add visual indicators when on a profile page
 */
function addVisualIndicators(): void {
  if (!isLinkedInProfilePage()) return;

  // Add a small indicator that the extension is active
  const indicator = document.createElement('div');
  indicator.id = 'colder-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 12px;
    height: 12px;
    background: #4CAF50;
    border-radius: 50%;
    z-index: 9999;
    opacity: 0.8;
    transition: all 0.3s ease;
    cursor: pointer;
  `;
  indicator.title = 'Colder extension is active';

  // Pulse animation
  indicator.animate([
    { transform: 'scale(1)', opacity: 0.8 },
    { transform: 'scale(1.2)', opacity: 1 },
    { transform: 'scale(1)', opacity: 0.8 }
  ], {
    duration: 2000,
    iterations: Infinity
  });

  // Remove existing indicator if any
  const existing = document.getElementById('colder-indicator');
  if (existing) {
    existing.remove();
  }

  document.body.appendChild(indicator);

  // Click to extract profile
  indicator.addEventListener('click', async () => {
    indicator.style.background = '#2196F3'; // Blue while working

    try {
      await handleProfileExtraction();
      indicator.style.background = '#4CAF50'; // Green on success

      // Show success message
      showNotification('Profile extracted successfully! Open the extension to generate a message.');
    } catch (error) {
      indicator.style.background = '#F44336'; // Red on error
      console.error('[Colder Content] Extraction failed:', error);

      // Show error message
      const message = error instanceof Error ? error.message : 'Extraction failed';
      showNotification(message, 'error');
    }
  });
}

/**
 * Show a temporary notification
 */
function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 50px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4CAF50' : '#F44336'};
    color: white;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    notification.style.animationFillMode = 'forwards';

    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(slideOutStyle);

    setTimeout(() => {
      notification.remove();
      style.remove();
      slideOutStyle.remove();
    }, 300);
  }, 5000);
}

/**
 * Initialize content script
 */
function initialize(): void {
  console.log('[Colder Content] Initializing...');

  // Add visual indicators if on profile page
  if (isLinkedInProfilePage()) {
    // Wait a bit for page to settle
    setTimeout(() => {
      addVisualIndicators();
    }, 2000);
  }

  // Watch for navigation changes
  const observer = new MutationObserver(() => {
    checkUrlChange();
    if (isLinkedInProfilePage()) {
      setTimeout(() => {
        addVisualIndicators();
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[Colder Content] Content script ready');