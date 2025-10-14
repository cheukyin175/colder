"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const profile_analyzer_1 = require("../agents/profile-analyzer");
const message_generator_1 = require("../agents/message-generator");
const message_polisher_1 = require("../agents/message-polisher");
let GenerateService = class GenerateService {
    prisma;
    configService;
    openRouterApiKey;
    defaultModel;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        const apiKey = this.configService.get('OPENROUTER_API_KEY');
        if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY is not configured in .env file");
        }
        this.openRouterApiKey = apiKey;
        this.defaultModel = this.configService.get('DEFAULT_MODEL', 'google/gemini-pro');
    }
    async generateMessageForUser(userId, generateDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.credits <= 0) {
            throw new common_1.UnauthorizedException('You have no remaining credits.');
        }
        try {
            const { targetProfile, tone, purpose, customPurpose, length } = generateDto;
            const purposeMapping = {
                'connection': 'General Connection',
                'coffee_chat': 'Coffee Chat Request',
                'informational_interview': 'Informational Interview Request',
                'collaboration': 'Collaboration Proposal',
                'job_inquiry': 'Job Inquiry',
                'sales': 'Sales/Partnership Proposal',
                'custom': customPurpose || 'General Connection'
            };
            const userProfile = {
                id: userId,
                name: user.userName || user.name || 'User',
                currentRole: user.userRole || '',
                currentCompany: user.userCompany || '',
                professionalBackground: user.userBackground || '',
                valueProposition: user.userValueProposition || '',
                outreachObjectives: purposeMapping[purpose || 'connection'],
            };
            const analysis = await profile_analyzer_1.profileAnalyzerAgent.analyzeProfile(targetProfile, userProfile, this.openRouterApiKey, this.defaultModel);
            const messageDraft = await message_generator_1.messageGeneratorAgent.generateMessage(targetProfile, userProfile, analysis, {
                tone: tone || 'professional',
                length: length || 'medium'
            }, this.openRouterApiKey, this.defaultModel);
            await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: { credits: { decrement: 1 } },
                });
                if (user.plan === client_1.Plan.PRO) {
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
        }
        catch (e) {
            console.error("Message generation failed:", e);
            throw new common_1.InternalServerErrorException("Failed to generate message due to an internal error.");
        }
    }
    async polishMessage(userId, polishDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.credits <= 0) {
            throw new common_1.UnauthorizedException('You have no remaining credits.');
        }
        try {
            const polishedMessage = await message_polisher_1.messagePolisherAgent.polishMessage({
                originalMessage: polishDto.originalMessage,
                userFeedback: polishDto.userFeedback,
                tone: polishDto.tone || 'professional',
                length: polishDto.length || 'medium',
            }, this.openRouterApiKey, this.defaultModel);
            await this.prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: 1 } },
            });
            return {
                body: polishedMessage.body,
                wordCount: polishedMessage.wordCount,
                changes: polishedMessage.changes,
            };
        }
        catch (e) {
            console.error("Message polishing failed:", e);
            throw new common_1.InternalServerErrorException("Failed to polish message due to an internal error.");
        }
    }
};
exports.GenerateService = GenerateService;
exports.GenerateService = GenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], GenerateService);
//# sourceMappingURL=generate.service.js.map