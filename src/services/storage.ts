/**
 * Chrome Storage Service
 * Manages user settings and message history using Chrome Storage API
 */

export interface ExtensionSettings {
  userName?: string;
  userRole?: string;
  userCompany?: string;
  userBackground?: string;
  userValueProposition?: string;
}

export interface StoredMessage {
  id: string;
  body: string;
  wordCount: number;
  targetProfileUrl: string;
  targetProfileName: string;
  tone: string;
  length: string;
  purpose: string;
  generatedAt: string; // ISO string
}

interface StorageData {
  settings: ExtensionSettings;
  messages: StoredMessage[];
  dailyUsage: {
    date: string; // YYYY-MM-DD
    count: number;
  };
}

class ChromeStorageService {
  private readonly SETTINGS_KEY = 'colder_settings';
  private readonly MESSAGES_KEY = 'colder_messages';
  private readonly USAGE_KEY = 'colder_usage';
  private readonly MAX_MESSAGES = 100; // Keep last 100 messages

  /**
   * Get user settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.local.get(this.SETTINGS_KEY);
      return result[this.SETTINGS_KEY] || this.getDefaultSettings();
    } catch (error) {
      console.error('Error reading settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.SETTINGS_KEY]: settings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): ExtensionSettings {
    return {
      userName: '',
      userRole: '',
      userCompany: '',
      userBackground: '',
      userValueProposition: ''
    };
  }

  /**
   * Save generated message
   */
  async saveMessage(message: Omit<StoredMessage, 'id' | 'generatedAt'>): Promise<void> {
    try {
      const messages = await this.getMessages();

      const newMessage: StoredMessage = {
        ...message,
        id: `msg_${Date.now()}`,
        generatedAt: new Date().toISOString()
      };

      // Add new message to the beginning of the array
      messages.unshift(newMessage);

      // Keep only the last MAX_MESSAGES messages
      const trimmedMessages = messages.slice(0, this.MAX_MESSAGES);

      await chrome.storage.local.set({
        [this.MESSAGES_KEY]: trimmedMessages
      });
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Get all saved messages
   */
  async getMessages(): Promise<StoredMessage[]> {
    try {
      const result = await chrome.storage.local.get(this.MESSAGES_KEY);
      return result[this.MESSAGES_KEY] || [];
    } catch (error) {
      console.error('Error reading messages:', error);
      return [];
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messages = await this.getMessages();
      const filtered = messages.filter(msg => msg.id !== messageId);

      await chrome.storage.local.set({
        [this.MESSAGES_KEY]: filtered
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Clear all messages
   */
  async clearMessages(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.MESSAGES_KEY]: []
      });
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw new Error('Failed to clear messages');
    }
  }

  /**
   * Get daily usage count
   */
  async getDailyUsage(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await chrome.storage.local.get(this.USAGE_KEY);
      const usage = result[this.USAGE_KEY];

      if (!usage || usage.date !== today) {
        // New day, reset counter
        return 0;
      }

      return usage.count || 0;
    } catch (error) {
      console.error('Error reading usage:', error);
      return 0;
    }
  }

  /**
   * Increment daily usage count
   */
  async incrementDailyUsage(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await chrome.storage.local.get(this.USAGE_KEY);
      const usage = result[this.USAGE_KEY];

      let newCount = 1;

      if (usage && usage.date === today) {
        // Same day, increment
        newCount = (usage.count || 0) + 1;
      }

      await chrome.storage.local.set({
        [this.USAGE_KEY]: {
          date: today,
          count: newCount
        }
      });

      return newCount;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw new Error('Failed to update usage');
    }
  }

  /**
   * Reset daily usage (for testing)
   */
  async resetDailyUsage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.USAGE_KEY]: {
          date: new Date().toISOString().split('T')[0],
          count: 0
        }
      });
    } catch (error) {
      console.error('Error resetting usage:', error);
      throw new Error('Failed to reset usage');
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    bytesInUse: number;
    messagesCount: number;
    hasSettings: boolean;
  }> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      const messages = await this.getMessages();
      const settings = await this.getSettings();

      return {
        bytesInUse,
        messagesCount: messages.length,
        hasSettings: !!(settings.userName || settings.userRole)
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        bytesInUse: 0,
        messagesCount: 0,
        hasSettings: false
      };
    }
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Export all data
   */
  async exportData(): Promise<StorageData> {
    try {
      const settings = await this.getSettings();
      const messages = await this.getMessages();
      const result = await chrome.storage.local.get(this.USAGE_KEY);

      return {
        settings,
        messages,
        dailyUsage: result[this.USAGE_KEY] || { date: '', count: 0 }
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data
   */
  async importData(data: Partial<StorageData>): Promise<void> {
    try {
      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      if (data.messages) {
        await chrome.storage.local.set({
          [this.MESSAGES_KEY]: data.messages
        });
      }

      if (data.dailyUsage) {
        await chrome.storage.local.set({
          [this.USAGE_KEY]: data.dailyUsage
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }
}

// Export singleton instance
export const storage = new ChromeStorageService();
