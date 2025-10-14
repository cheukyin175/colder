import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { profileAnalyzerAgent } from '../agents/profile-analyzer';
import { messageGeneratorAgent } from '../agents/message-generator';
import { messagePolisherAgent } from '../agents/message-polisher';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class GenerateService {
  private readonly openRouterApiKey: string;
  private readonly defaultModel: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private creditsService: CreditsService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured in .env file");
    }
    this.openRouterApiKey = apiKey;
    this.defaultModel = this.configService.get<string>('DEFAULT_MODEL', 'google/gemini-pro');
  }

  async generateMessageForUser(userId: string, generateDto: GenerateMessageDto) {
    // Check user credits first
    const userCredits = await this.creditsService.getUserCredits(userId);

    if (userCredits.credits <= 0) {
      throw new UnauthorizedException(`You have no remaining credits. ${userCredits.plan === 'FREE' ? 'Upgrade to PRO for 500 messages per month!' : 'Your monthly credits will reset on ' + userCredits.nextResetTime?.toLocaleDateString()}`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    try {
      const { targetProfile, tone, purpose, customPurpose, length } = generateDto;

      // Map purpose to outreach objectives format expected by the prompt
      const purposeMapping = {
        'connection': 'General Connection',
        'coffee_chat': 'Coffee Chat Request',
        'informational_interview': 'Informational Interview Request',
        'collaboration': 'Collaboration Proposal',
        'job_inquiry': 'Job Inquiry',
        'sales': 'Sales/Partnership Proposal',
        'custom': customPurpose || 'General Connection'
      };

      // Construct userProfile with the correct field names expected by the message generator
      const userProfile = {
        id: userId,
        name: user.userName || user.name || 'User',
        currentRole: user.userRole || '',
        currentCompany: user.userCompany || '',
        professionalBackground: user.userBackground || '',
        valueProposition: user.userValueProposition || '',
        outreachObjectives: purposeMapping[purpose || 'connection'],
      };

      // Generate message first, before deducting credits
      const analysis = await profileAnalyzerAgent.analyzeProfile(
        targetProfile as any,
        userProfile as any,
        this.openRouterApiKey,
        this.defaultModel,
      );

      const messageDraft = await messageGeneratorAgent.generateMessage(
        targetProfile as any,
        userProfile as any,
        analysis,
        {
          tone: tone || 'professional',
          length: length || 'medium'
        },
        this.openRouterApiKey,
        this.defaultModel,
      );

      // Only deduct credits after successful generation
      await this.creditsService.deductCredits(userId, 1);

      // Save generated profile for PRO users
      if (user.plan === Plan.PRO) {
        await this.prisma.generatedProfile.create({
          data: {
            userId,
            linkedinUrl: targetProfile.linkedinUrl,
            name: targetProfile.name,
            basicInformation: {
              headline: targetProfile.currentJobTitle,
            },
          },
        });
      }

      return messageDraft;

    } catch (e) {
      console.error("Message generation failed:", e);
      throw new InternalServerErrorException("Failed to generate message due to an internal error.");
    }
  }

  async polishMessage(
    userId: string,
    polishDto: {
      originalMessage: string;
      userFeedback: string;
      tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
      length?: 'short' | 'medium' | 'long';
    }
  ) {
    // Check user credits first
    const userCredits = await this.creditsService.getUserCredits(userId);

    if (userCredits.credits <= 0) {
      throw new UnauthorizedException(`You have no remaining credits. ${userCredits.plan === 'FREE' ? 'Upgrade to PRO for 500 messages per month!' : 'Your monthly credits will reset on ' + userCredits.nextResetTime?.toLocaleDateString()}`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    try {
      // Polish message first, before deducting credits
      const polishedMessage = await messagePolisherAgent.polishMessage(
        {
          originalMessage: polishDto.originalMessage,
          userFeedback: polishDto.userFeedback,
          tone: polishDto.tone || 'professional',
          length: polishDto.length || 'medium',
        },
        this.openRouterApiKey,
        this.defaultModel,
      );

      // Only deduct credits after successful polishing
      await this.creditsService.deductCredits(userId, 1);

      return {
        body: polishedMessage.body,
        wordCount: polishedMessage.wordCount,
        changes: polishedMessage.changes,
      };
    } catch (e) {
      console.error("Message polishing failed:", e);
      throw new InternalServerErrorException("Failed to polish message due to an internal error.");
    }
  }
}
