export declare class GenerateMessageDto {
    targetProfile: {
        id: string;
        linkedinUrl: string;
        name: string;
        currentJobTitle?: string;
        currentCompany?: string;
        rawProfileText: string;
    };
    tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
    purpose?: 'connection' | 'coffee_chat' | 'informational_interview' | 'collaboration' | 'job_inquiry' | 'sales' | 'custom';
    customPurpose?: string;
    length?: 'short' | 'medium' | 'long';
}
