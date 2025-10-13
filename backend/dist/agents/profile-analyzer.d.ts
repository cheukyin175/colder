import type { UserProfile, TargetProfile, ProfileAnalysis } from '../models';
export declare class ProfileAnalyzerAgent {
    analyzeProfile(targetProfile: TargetProfile, userProfile: UserProfile, apiKey: string, modelName: string): Promise<ProfileAnalysis>;
}
export declare const profileAnalyzerAgent: ProfileAnalyzerAgent;
