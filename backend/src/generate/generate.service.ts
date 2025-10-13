import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { profileAnalyzerAgent } from '../agents/profile-analyzer';
import { messageGeneratorAgent } from '../agents/message-generator';

@Injectable()
export class GenerateService {
  private readonly openRouterApiKey: string;
  private readonly defaultModel: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured in .env file");
    }
    this.openRouterApiKey = apiKey;
    this.defaultModel = this.configService.get<string>('DEFAULT_MODEL', 'google/gemini-pro');
  }

  async generateMessageForUser(userId: string, generateDto: GenerateMessageDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.credits <= 0) {
      throw new UnauthorizedException('You have no remaining credits.');
    }

    try {
      const { targetProfile } = generateDto;
      const userProfile = { ...user, id: userId };

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
        { tone: 'professional', length: 'medium' },
        this.openRouterApiKey,
        this.defaultModel,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } },
        });

        if (user.plan === Plan.PRO) {
          await tx.generatedProfile.create({
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
      });

      return messageDraft;

    } catch (e) {
      console.error("Message generation failed:", e);
      throw new InternalServerErrorException("Failed to generate message due to an internal error.");
    }
  }
}
