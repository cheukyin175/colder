export declare class PolishMessageDto {
    originalMessage: string;
    userFeedback: string;
    tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
    length?: 'short' | 'medium' | 'long';
}
