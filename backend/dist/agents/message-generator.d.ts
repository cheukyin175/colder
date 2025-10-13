import type { UserProfile, TargetProfile, ProfileAnalysis, MessageDraft, TonePreset, MessageLength } from '../models';
export interface MessageGenerationOptions {
    tone: TonePreset;
    length: MessageLength;
}
export declare class MessageGeneratorAgent {
    generateMessage(targetProfile: TargetProfile, userProfile: UserProfile, analysis: ProfileAnalysis, options: MessageGenerationOptions, apiKey: string, modelName: string): Promise<MessageDraft>;
}
export declare const messageGeneratorAgent: MessageGeneratorAgent;
