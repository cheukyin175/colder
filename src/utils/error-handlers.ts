/**
 * Error Handlers Utility
 * Centralized error handling for the Colder extension
 */

/**
 * Custom error types for different error scenarios
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public missingFields: string[] = [],
    public extractionQuality?: 'complete' | 'partial' | 'minimal'
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: 'openrouter' | 'gmail',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public quotaExceeded: boolean = false,
    public storageType?: 'sync' | 'local'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public isOffline: boolean = false,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * User-friendly error messages based on error type
 */
export function getUserFriendlyMessage(error: Error): {
  message: string;
  severity: ErrorSeverity;
  actions?: string[];
} {
  // ExtractionError - Issues with LinkedIn profile extraction
  if (error instanceof ExtractionError) {
    if (error.extractionQuality === 'minimal') {
      return {
        message: 'Unable to extract enough profile information. The profile may be private or the page structure has changed.',
        severity: ErrorSeverity.ERROR,
        actions: [
          'Make sure you\'re viewing a complete LinkedIn profile',
          'Try refreshing the page',
          'Check if the profile is publicly visible'
        ]
      };
    }

    if (error.missingFields.length > 0) {
      return {
        message: `Some profile information couldn't be extracted: ${error.missingFields.join(', ')}`,
        severity: ErrorSeverity.WARNING,
        actions: ['The message will be generated with available information']
      };
    }

    return {
      message: 'There was an issue extracting the LinkedIn profile.',
      severity: ErrorSeverity.ERROR,
      actions: ['Please refresh the page and try again']
    };
  }

  // ApiError - Issues with external API calls
  if (error instanceof ApiError) {
    if (error.provider === 'openrouter') {
      if (error.statusCode === 401) {
        return {
          message: 'Invalid OpenRouter API key. Please check your settings.',
          severity: ErrorSeverity.ERROR,
          actions: [
            'Go to extension settings',
            'Verify your OpenRouter API key',
            'Make sure the key starts with "sk-or-"'
          ]
        };
      }

      if (error.statusCode === 429) {
        return {
          message: 'API rate limit exceeded. Please wait a moment before trying again.',
          severity: ErrorSeverity.WARNING,
          actions: ['Wait 60 seconds before retrying']
        };
      }

      if (error.statusCode === 503 || error.statusCode === 500) {
        return {
          message: 'OpenRouter service is temporarily unavailable.',
          severity: ErrorSeverity.ERROR,
          actions: ['Try again in a few minutes']
        };
      }

      return {
        message: 'Failed to generate message. There was an issue with the AI service.',
        severity: ErrorSeverity.ERROR,
        actions: ['Check your internet connection', 'Try again later']
      };
    }

    if (error.provider === 'gmail') {
      if (error.statusCode === 401) {
        return {
          message: 'Gmail authentication expired. Please reconnect your Gmail account.',
          severity: ErrorSeverity.ERROR,
          actions: ['Go to settings', 'Click "Connect Gmail"', 'Authorize access again']
        };
      }

      return {
        message: 'Failed to connect to Gmail.',
        severity: ErrorSeverity.ERROR,
        actions: ['Check Gmail connection in settings']
      };
    }
  }

  // StorageError - Chrome storage issues
  if (error instanceof StorageError) {
    if (error.quotaExceeded) {
      return {
        message: 'Storage quota exceeded. Please clear some old data.',
        severity: ErrorSeverity.ERROR,
        actions: [
          'Go to extension settings',
          'Clear old outreach history',
          'Remove cached profiles'
        ]
      };
    }

    return {
      message: 'Failed to save data. Storage error occurred.',
      severity: ErrorSeverity.ERROR,
      actions: ['Try again', 'Check browser storage permissions']
    };
  }

  // NetworkError - Connection issues
  if (error instanceof NetworkError) {
    if (error.isOffline) {
      return {
        message: 'No internet connection detected.',
        severity: ErrorSeverity.ERROR,
        actions: ['Check your internet connection', 'Try again when online']
      };
    }

    return {
      message: 'Network error occurred. Please check your connection.',
      severity: ErrorSeverity.WARNING,
      actions: error.retryable ? ['Retry the operation'] : ['Check your network settings']
    };
  }

  // ValidationError - Input validation issues
  if (error instanceof ValidationError) {
    return {
      message: `Invalid ${error.field || 'input'}: ${error.message}`,
      severity: ErrorSeverity.WARNING,
      actions: ['Correct the input and try again']
    };
  }

  // Generic/Unknown errors
  return {
    message: 'An unexpected error occurred.',
    severity: ErrorSeverity.ERROR,
    actions: ['Refresh the page', 'Try again', 'Contact support if the issue persists']
  };
}

/**
 * Log error with appropriate level
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = getUserFriendlyMessage(error);

  const logData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    severity: errorInfo.severity,
    timestamp: new Date().toISOString(),
    ...context
  };

  switch (errorInfo.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      console.error('[Colder Error]', logData);
      break;
    case ErrorSeverity.WARNING:
      console.warn('[Colder Warning]', logData);
      break;
    case ErrorSeverity.INFO:
      console.info('[Colder Info]', logData);
      break;
  }

  // In production, could send to error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(logData);
  // }
}

/**
 * Show error notification to user
 */
export async function showErrorNotification(error: Error): Promise<void> {
  const { message, actions } = getUserFriendlyMessage(error);

  // Use Chrome notifications API if available
  if (chrome?.notifications) {
    const notificationOptions: chrome.notifications.NotificationOptions<true> = {
      type: 'basic',
      iconUrl: '/assets/icon-128.png',
      title: 'Colder Extension',
      message: message,
      ...(actions && actions.length > 0 && {
        buttons: actions.slice(0, 2).map(action => ({ title: action }))
      })
    };

    try {
      await chrome.notifications.create(
        `error-${Date.now()}`,
        notificationOptions
      );
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    showNotification?: boolean;
    fallback?: any;
    context?: Record<string, any>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Log the error
      logError(err, options?.context);

      // Show notification if requested
      if (options?.showNotification) {
        await showErrorNotification(err);
      }

      // Return fallback value if provided
      if (options?.fallback !== undefined) {
        return options.fallback;
      }

      // Re-throw the error
      throw err;
    }
  }) as T;
}

/**
 * Retry logic for flaky operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delay?: number;
    exponentialBackoff?: boolean;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts || 3;
  const delay = options?.delay || 1000;
  const exponentialBackoff = options?.exponentialBackoff ?? true;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (options?.shouldRetry && !options.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      const waitTime = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Handle OpenRouter API errors
 */
export function handleOpenRouterError(error: any): never {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    throw new ApiError(
      data?.error?.message || `OpenRouter API error: ${status}`,
      status,
      'openrouter',
      data
    );
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    throw new NetworkError('Cannot connect to OpenRouter API', false, true);
  }

  throw new ApiError('Unknown OpenRouter API error', undefined, 'openrouter', error);
}

/**
 * Handle Chrome storage errors
 */
export function handleStorageError(error: any): never {
  const message = error?.message || 'Storage operation failed';

  // Check for quota exceeded
  if (message.includes('quota') || message.includes('QUOTA_EXCEEDED')) {
    throw new StorageError(message, true);
  }

  throw new StorageError(message);
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(json);
  } catch (error) {
    logError(new Error(`JSON parse error: ${error}`), { json: json.substring(0, 100) });
    return fallback;
  }
}