/**
 * Outreach History Model
 * Record of previous contacts to prevent duplicate outreach.
 * MVP scope: minimal fields for duplicate detection
 */

export interface OutreachHistory {
  // Identity
  id: string;                    // UUID v4

  // Minimal target information (MVP scope)
  targetName: string;            // Contact name
  targetLinkedinUrl: string;     // LinkedIn profile URL

  // Interaction metadata
  contactedAt: Date;             // When message was sent

  // Plan-based retention
  expiresAt: Date | null;        // Null for paid plan (indefinite retention)
}

/**
 * Create a new outreach history entry
 */
export function createOutreachHistory(
  targetName: string,
  targetLinkedinUrl: string,
  isPaidPlan: boolean = false
): OutreachHistory {
  const now = new Date();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;

  return {
    id: crypto.randomUUID(),
    targetName,
    targetLinkedinUrl,
    contactedAt: now,
    expiresAt: isPaidPlan ? null : new Date(now.getTime() + fiveDays)
  };
}

/**
 * Check if outreach history has expired
 */
export function isHistoryExpired(history: OutreachHistory): boolean {
  if (!history.expiresAt) {
    return false; // Paid plan - never expires
  }

  return new Date() > history.expiresAt;
}

/**
 * Calculate days since contact
 */
export function daysSinceContact(history: OutreachHistory): number {
  const now = Date.now();
  const contactedAt = history.contactedAt.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((now - contactedAt) / msPerDay);
}

/**
 * Format contact date for display
 */
export function formatContactDate(history: OutreachHistory): string {
  const days = daysSinceContact(history);

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
}

/**
 * Check if a LinkedIn URL matches an existing history entry
 */
export function isDuplicateContact(
  linkedinUrl: string,
  history: OutreachHistory[]
): OutreachHistory | null {
  // Normalize URLs for comparison (remove trailing slashes, query params)
  const normalizeUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
    } catch {
      return url.toLowerCase().trim().replace(/\/$/, '');
    }
  };

  const normalizedUrl = normalizeUrl(linkedinUrl);

  for (const entry of history) {
    // Skip expired entries
    if (isHistoryExpired(entry)) {
      continue;
    }

    if (normalizeUrl(entry.targetLinkedinUrl) === normalizedUrl) {
      return entry;
    }
  }

  return null;
}

/**
 * Sort history entries by contact date (newest first)
 */
export function sortHistoryByDate(history: OutreachHistory[]): OutreachHistory[] {
  return [...history].sort((a, b) => {
    return b.contactedAt.getTime() - a.contactedAt.getTime();
  });
}

/**
 * Filter history by search term (searches name)
 */
export function searchHistory(
  history: OutreachHistory[],
  searchTerm: string
): OutreachHistory[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return history;

  return history.filter(entry =>
    entry.targetName.toLowerCase().includes(term)
  );
}

/**
 * Get history statistics
 */
export function getHistoryStats(history: OutreachHistory[]): {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: history.length,
    today: history.filter(h => h.contactedAt >= todayStart).length,
    thisWeek: history.filter(h => h.contactedAt >= weekStart).length,
    thisMonth: history.filter(h => h.contactedAt >= monthStart).length
  };
}