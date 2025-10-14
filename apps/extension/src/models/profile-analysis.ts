/**
 * Profile Analysis Model
 * Structured analysis of target profile, used as input for message generation.
 */

import { Relevance } from './types';

export interface ProfileAnalysis {
  // Reference
  targetProfileId: string;       // FK to TargetProfile
  userProfileId: string;         // FK to UserProfile

  // Analysis results
  talkingPoints: TalkingPoint[];
  mutualInterests: string[];
  connectionOpportunities: string[];

  // Recommendations
  suggestedApproach: string;     // e.g., "Lead with shared interest in AI"
  cautionFlags: string[];        // e.g., "Profile has minimal info"

  // Metadata
  analyzedAt: Date;
  modelUsed: string;             // e.g., "gpt-4o-2024-08-06"
  tokensUsed: number;
  analysisTime?: number;         // Time taken in milliseconds
}

export interface TalkingPoint {
  topic: string;                 // e.g., "Recent career transition"
  relevance: Relevance;          // 'high' | 'medium' | 'low'
  context: string;               // Why this is relevant
  sourceField: string;           // e.g., "workExperience[0]"
}

/**
 * Create a new profile analysis
 */
export function createProfileAnalysis(
  targetProfileId: string,
  userProfileId: string,
  data: Partial<ProfileAnalysis>
): ProfileAnalysis {
  return {
    targetProfileId,
    userProfileId,
    talkingPoints: [],
    mutualInterests: [],
    connectionOpportunities: [],
    suggestedApproach: '',
    cautionFlags: [],
    analyzedAt: new Date(),
    modelUsed: 'gpt-4o',
    tokensUsed: 0,
    ...data
  };
}

/**
 * Check if a profile analysis has expired (24 hours)
 */
export function isAnalysisExpired(analysis: ProfileAnalysis): boolean {
  const now = Date.now();
  const analyzedAt = analysis.analyzedAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return (now - analyzedAt) > twentyFourHours;
}

/**
 * Sort talking points by relevance
 */
export function sortTalkingPointsByRelevance(points: TalkingPoint[]): TalkingPoint[] {
  const relevanceOrder: Record<Relevance, number> = {
    high: 0,
    medium: 1,
    low: 2
  };

  return [...points].sort((a, b) => {
    return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
  });
}

/**
 * Get high priority talking points
 */
export function getHighPriorityTalkingPoints(analysis: ProfileAnalysis): TalkingPoint[] {
  return analysis.talkingPoints.filter(point => point.relevance === 'high');
}

/**
 * Generate analysis summary for display
 */
export function generateAnalysisSummary(analysis: ProfileAnalysis): string {
  const highPriorityPoints = getHighPriorityTalkingPoints(analysis);
  const mutualInterestCount = analysis.mutualInterests.length;
  const opportunityCount = analysis.connectionOpportunities.length;

  const parts = [];

  if (highPriorityPoints.length > 0) {
    parts.push(`${highPriorityPoints.length} key talking points`);
  }

  if (mutualInterestCount > 0) {
    parts.push(`${mutualInterestCount} mutual interests`);
  }

  if (opportunityCount > 0) {
    parts.push(`${opportunityCount} connection opportunities`);
  }

  return parts.length > 0
    ? `Found ${parts.join(', ')}`
    : 'Analysis complete';
}