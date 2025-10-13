export type TonePreset = 'professional' | 'casual' | 'enthusiastic';
export type MessageLength = 'short' | 'medium' | 'long';
export type ExtractionQuality = 'complete' | 'partial' | 'minimal';
export type Relevance = 'high' | 'medium' | 'low';
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    currentRole: string;
    currentCompany: string;
    professionalBackground: string;
    careerGoals?: string;
    outreachObjectives?: string;
    valueProposition: string;
}
export interface TargetProfile {
    id: string;
    linkedinUrl: string;
    name: string;
    currentJobTitle: string | null;
    currentCompany: string | null;
    rawProfileText?: string;
}
export interface ProfileAnalysis {
    targetProfileId: string;
    userProfileId: string;
    talkingPoints: TalkingPoint[];
    mutualInterests: string[];
    connectionOpportunities: string[];
    suggestedApproach: string;
    cautionFlags: string[];
    analyzedAt: Date;
    modelUsed: string;
    tokensUsed: number;
    analysisTime?: number;
}
export interface TalkingPoint {
    topic: string;
    relevance: Relevance;
    context: string;
    sourceField: string;
}
export interface MessageDraft {
    id: string;
    targetProfileId: string;
    analysisId: string;
    subject?: string | null;
    body: string;
    annotations: Annotation[];
    tone: TonePreset;
    length: MessageLength;
    generatedAt: Date;
    modelUsed: string;
    tokensUsed: number;
    generationTime: number;
    version: number;
}
export interface Annotation {
    text: string;
    source: 'target_profile' | 'user_profile' | 'generated';
    sourceField: string | null;
    highlight: boolean;
}
