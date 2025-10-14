export class GenerateMessageDto {
  targetProfile: {
    id: string;
    linkedinUrl: string;
    name: string;
    currentJobTitle?: string;
    currentCompany?: string;
    rawProfileText: string;
  };

  // Message customization options
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';

  // Purpose/objective of the message with presets
  purpose?: 'connection' | 'coffee_chat' | 'informational_interview' | 'collaboration' | 'job_inquiry' | 'sales' | 'custom';

  // Custom purpose description if purpose is 'custom'
  customPurpose?: string;

  // Message length preference
  length?: 'short' | 'medium' | 'long';
}
