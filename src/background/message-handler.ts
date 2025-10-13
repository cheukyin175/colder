/**
 * Background Message Handler
 * Handles Chrome runtime messages between content scripts, popup, and background worker
 */

import storageService from '../services/storage-service';
import { logError } from '../utils/error-handlers';

/**
 * Message types for communication between extension contexts
 */
export enum MessageType {
  // Storage operations
  STORAGE_GET_USER_PROFILE = 'STORAGE_GET_USER_PROFILE',
  STORAGE_SAVE_USER_PROFILE = 'STORAGE_SAVE_USER_PROFILE',
  STORAGE_GET_SETTINGS = 'STORAGE_GET_SETTINGS',
  STORAGE_SAVE_SETTINGS = 'STORAGE_SAVE_SETTINGS',
  STORAGE_GET_SUBSCRIPTION = 'STORAGE_GET_SUBSCRIPTION',
  STORAGE_SAVE_SUBSCRIPTION = 'STORAGE_SAVE_SUBSCRIPTION',
  STORAGE_GET_USAGE = 'STORAGE_GET_USAGE',
  STORAGE_CLEAR_ALL = 'STORAGE_CLEAR_ALL',

  // Profile operations (will be implemented in US1)
  PROFILE_EXTRACT = 'PROFILE_EXTRACT',
  PROFILE_ANALYZE = 'PROFILE_ANALYZE',
  PROFILE_GET_CACHED = 'PROFILE_GET_CACHED',

  // Message operations (will be implemented in US1)
  MESSAGE_GENERATE = 'MESSAGE_GENERATE',
  MESSAGE_REGENERATE = 'MESSAGE_REGENERATE',
  MESSAGE_SAVE_DRAFT = 'MESSAGE_SAVE_DRAFT',
  MESSAGE_GET_DRAFT = 'MESSAGE_GET_DRAFT',

  // Extension status
  EXTENSION_STATUS = 'EXTENSION_STATUS',
  EXTENSION_ERROR = 'EXTENSION_ERROR'
}

/**
 * Base message interface
 */
export interface Message {
  type: MessageType;
  payload?: any;
  tabId?: number;
  timestamp?: number;
}

/**
 * Response wrapper for consistent error handling
 */
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Message handler class
 */
class MessageHandler {
  private handlers: Map<MessageType, (message: Message) => Promise<any>>;

  constructor() {
    this.handlers = new Map();
    this.registerHandlers();
  }

  /**
   * Register all message handlers
   */
  private registerHandlers(): void {
    // Storage handlers
    this.handlers.set(MessageType.STORAGE_GET_USER_PROFILE, this.handleGetUserProfile);
    this.handlers.set(MessageType.STORAGE_SAVE_USER_PROFILE, this.handleSaveUserProfile);
    this.handlers.set(MessageType.STORAGE_GET_SETTINGS, this.handleGetSettings);
    this.handlers.set(MessageType.STORAGE_SAVE_SETTINGS, this.handleSaveSettings);
    this.handlers.set(MessageType.STORAGE_GET_SUBSCRIPTION, this.handleGetSubscription);
    this.handlers.set(MessageType.STORAGE_SAVE_SUBSCRIPTION, this.handleSaveSubscription);
    this.handlers.set(MessageType.STORAGE_GET_USAGE, this.handleGetStorageUsage);
    this.handlers.set(MessageType.STORAGE_CLEAR_ALL, this.handleClearAllData);

    // Extension status
    this.handlers.set(MessageType.EXTENSION_STATUS, this.handleExtensionStatus);

    // Profile and message handlers will be added in user story phases
  }

  /**
   * Main message handler
   */
  async handleMessage(
    message: Message,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse> {
    try {
      // Add metadata to message
      message.tabId = sender.tab?.id;
      message.timestamp = Date.now();

      // Log message for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug('[MessageHandler] Received:', message.type, message.payload);
      }

      // Get handler for message type
      const handler = this.handlers.get(message.type);

      if (!handler) {
        throw new Error(`Unknown message type: ${message.type}`);
      }

      // Execute handler
      const data = await handler.call(this, message);

      return {
        success: true,
        data
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { messageType: message.type });

      return {
        success: false,
        error: {
          message: err.message,
          code: err.name
        }
      };
    }
  }

  // --------------------------------------------------------------------------
  // Storage Handlers
  // --------------------------------------------------------------------------

  private async handleGetUserProfile(message: Message): Promise<any> {
    return storageService.getUserProfile();
  }

  private async handleSaveUserProfile(message: Message): Promise<any> {
    const { profile } = message.payload;
    if (!profile) {
      throw new Error('Profile data is required');
    }
    await storageService.saveUserProfile(profile);
    return { saved: true };
  }

  private async handleGetSettings(message: Message): Promise<any> {
    return storageService.getSettings();
  }

  private async handleSaveSettings(message: Message): Promise<any> {
    const { settings } = message.payload;
    if (!settings) {
      throw new Error('Settings data is required');
    }
    await storageService.saveSettings(settings);
    return { saved: true };
  }

  private async handleGetSubscription(message: Message): Promise<any> {
    return storageService.getSubscriptionPlan();
  }

  private async handleSaveSubscription(message: Message): Promise<any> {
    const { plan } = message.payload;
    if (!plan) {
      throw new Error('Subscription plan data is required');
    }
    await storageService.saveSubscriptionPlan(plan);
    return { saved: true };
  }

  private async handleGetStorageUsage(message: Message): Promise<any> {
    return storageService.getStorageUsage();
  }

  private async handleClearAllData(message: Message): Promise<any> {
    const { confirmation } = message.payload;
    if (!confirmation) {
      throw new Error('Confirmation is required to clear all data');
    }
    await storageService.clearAllData(confirmation);
    return { cleared: true };
  }

  // --------------------------------------------------------------------------
  // Extension Status
  // --------------------------------------------------------------------------

  private async handleExtensionStatus(message: Message): Promise<any> {
    const manifest = chrome.runtime.getManifest();
    const settings = await storageService.getSettings();
    const userProfile = await storageService.getUserProfile();
    const storageUsage = await storageService.getStorageUsage();

    return {
      version: manifest.version,
      name: manifest.name,
      hasApiKey: !!settings.openrouterApiKey,
      hasUserProfile: !!userProfile,
      profileComplete: userProfile?.completeness || 0,
      storageUsage
    };
  }
}

// Create singleton instance
const messageHandler = new MessageHandler();

/**
 * Setup message listener for Chrome runtime
 */
export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
      // Handle message asynchronously
      messageHandler.handleMessage(message, sender)
        .then(sendResponse)
        .catch(error => {
          sendResponse({
            success: false,
            error: {
              message: error.message || 'Unknown error occurred'
            }
          });
        });

      // Return true to indicate async response
      return true;
    }
  );
}

/**
 * Send message to background worker from content script or popup
 */
export async function sendMessage<T = any>(
  type: MessageType,
  payload?: any
): Promise<T> {
  const message: Message = {
    type,
    payload,
    timestamp: Date.now()
  };

  try {
    const response = await chrome.runtime.sendMessage<Message, MessageResponse<T>>(message);

    if (!response.success) {
      throw new Error(response.error?.message || 'Message failed');
    }

    return response.data as T;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      messageType: type,
      payload
    });
    throw error;
  }
}

/**
 * Send message to specific tab
 */
export async function sendMessageToTab<T = any>(
  tabId: number,
  type: MessageType,
  payload?: any
): Promise<T> {
  const message: Message = {
    type,
    payload,
    timestamp: Date.now()
  };

  try {
    const response = await chrome.tabs.sendMessage<Message, MessageResponse<T>>(
      tabId,
      message
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Message failed');
    }

    return response.data as T;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      messageType: type,
      tabId,
      payload
    });
    throw error;
  }
}

/**
 * Broadcast message to all tabs
 */
export async function broadcastMessage(
  type: MessageType,
  payload?: any
): Promise<void> {
  const tabs = await chrome.tabs.query({});

  const promises = tabs.map(tab => {
    if (tab.id) {
      return sendMessageToTab(tab.id, type, payload).catch(() => {
        // Ignore errors for tabs that don't have the content script
      });
    }
  });

  await Promise.allSettled(promises);
}

export default messageHandler;