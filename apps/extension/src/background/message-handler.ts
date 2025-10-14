import { startTime } from './index';
import storageService from '../services/storage-service';
import { profileAnalyzerAgent } from './agent/profile-analyzer';
import { messageGeneratorAgent } from './agent/message-generator';
import { UserProfile } from '../models/user-profile';

// Simplified Message and Response types
export interface Message {
  type: string;
  payload?: any;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// All message types the new UI uses
export enum MessageType {
  STORAGE_GET_SETTINGS = 'STORAGE_GET_SETTINGS',
  STORAGE_SAVE_SETTINGS = 'STORAGE_SAVE_SETTINGS',
  ANALYZE_AND_GENERATE = 'ANALYZE_AND_GENERATE',
  EXTRACT_PROFILE = 'EXTRACT_PROFILE', // For content script
}

/**
 * The central message router for the background script.
 * It receives messages from the popup and content scripts and delegates them to the appropriate handler.
 */
class MessageHandler {
  private handlers: Map<string, (message: Message) => Promise<any>>;

  constructor() {
    this.handlers = new Map();
    this.registerHandlers();
  }

  /**
   * Registers all known message handlers.
   */
  private registerHandlers(): void {
    this.handlers.set(MessageType.STORAGE_GET_SETTINGS, this.handleGetSettings);
    this.handlers.set(MessageType.STORAGE_SAVE_SETTINGS, this.handleSaveSettings);
    this.handlers.set(MessageType.ANALYZE_AND_GENERATE, this.handleAnalyzeAndGenerate);
  }

  /**
   * The main entry point for handling incoming messages.
   * It finds the correct handler and executes it, returning a standardized response.
   * @param message The incoming message object.
   * @returns A promise that resolves to a MessageResponse object.
   */
  async handleMessage(message: Message): Promise<MessageResponse> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      // This is a silent failure for messages not meant for the background script (e.g., PING)
      return { success: false, error: `Unknown message type: ${message.type}` };
    }

    try {
      const data = await handler.call(this, message);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  private async handleGetSettings(): Promise<any> {
    return storageService.getSettings();
  }

  private async handleSaveSettings(message: Message): Promise<any> {
    const { settings } = message.payload;
    if (!settings) throw new Error('Settings data is required');
    await storageService.saveSettings(settings);
    return { saved: true };
  }

  private async handleAnalyzeAndGenerate(message: Message): Promise<any> {
    const { targetProfile, settings } = message.payload;
    if (!targetProfile || !settings) {
      throw new Error('Target profile and settings are required');
    }

    // Create a UserProfile object from settings
    const userProfile: UserProfile = {
      id: 'user_1',
      name: settings.userName,
      currentRole: settings.userRole,
      currentCompany: settings.userCompany,
      professionalBackground: settings.userBackground,
      valueProposition: settings.userValueProposition,
      // Add other fields with defaults if necessary
      email: '',
      outreachObjectives: '',
      careerGoals: '',
      defaultTone: 'professional',
      defaultLength: 'medium',
      completeness: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1. Analyze the profile
    const analysis = await profileAnalyzerAgent.analyzeProfile(targetProfile, userProfile);

    // 2. Generate the message
    const messageDraft = await messageGeneratorAgent.generateMessage(
      targetProfile,
      userProfile,
      analysis,
      { tone: 'professional', length: 'medium' } // Default options
    );

    return messageDraft;
  }
}

const messageHandler = new MessageHandler();

export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Pass the message to the handler and ensure a response is always sent.
    messageHandler.handleMessage(message).then(sendResponse);
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  });
}
