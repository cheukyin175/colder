import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateMessageDto } from './dto/generate-message.dto';
export declare class GenerateService {
    private prisma;
    private configService;
    private readonly openRouterApiKey;
    private readonly defaultModel;
    constructor(prisma: PrismaService, configService: ConfigService);
    generateMessageForUser(userId: string, generateDto: GenerateMessageDto): Promise<import("../models").MessageDraft>;
    polishMessage(userId: string, polishDto: {
        originalMessage: string;
        userFeedback: string;
        tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
        length?: 'short' | 'medium' | 'long';
    }): Promise<{
        body: string;
        wordCount: number;
        changes: string[];
    }>;
}
