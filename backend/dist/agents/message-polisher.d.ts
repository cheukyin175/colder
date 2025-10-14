import type { TonePreset, MessageLength } from '../models';
export interface PolishOptions {
    tone: TonePreset;
    length: MessageLength;
    userFeedback: string;
    originalMessage: string;
}
export declare class MessagePolisherAgent {
    polishMessage(options: PolishOptions, apiKey: string, modelName: string): Promise<{
        body: string;
        wordCount: number;
        changes: string[];
    }>;
}
export declare const messagePolisherAgent: MessagePolisherAgent;
