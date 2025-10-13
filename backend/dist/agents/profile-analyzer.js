"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileAnalyzerAgent = exports.ProfileAnalyzerAgent = void 0;
const zod_1 = require("zod");
const profile_analyzer_1 = require("./prompts/profile-analyzer");
const TalkingPointSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    relevance: zod_1.z.enum(['high', 'medium', 'low']),
    context: zod_1.z.string(),
    sourceField: zod_1.z.string(),
});
const ProfileAnalysisOutputSchema = zod_1.z.object({
    talkingPoints: zod_1.z.array(TalkingPointSchema),
    mutualInterests: zod_1.z.array(zod_1.z.string()),
    connectionOpportunities: zod_1.z.array(zod_1.z.string()),
    suggestedApproach: zod_1.z.string(),
    cautionFlags: zod_1.z.array(zod_1.z.string()),
});
class ProfileAnalyzerAgent {
    async analyzeProfile(targetProfile, userProfile, apiKey, modelName) {
        const startTime = Date.now();
        try {
            const userPrompt = (0, profile_analyzer_1.formatProfileAnalyzerPrompt)(targetProfile.rawProfileText || '', userProfile);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: profile_analyzer_1.PROFILE_ANALYZER_SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
            }
            const responseData = await response.json();
            const analysisData = JSON.parse(responseData.choices[0].message.content);
            const validatedData = ProfileAnalysisOutputSchema.parse(analysisData);
            return {
                targetProfileId: targetProfile.id,
                userProfileId: userProfile.id,
                ...validatedData,
                analyzedAt: new Date(),
                modelUsed: modelName,
                tokensUsed: responseData.usage?.total_tokens || 0,
                analysisTime: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error("Profile analysis failed:", error);
            throw new Error("Failed to analyze profile.");
        }
    }
}
exports.ProfileAnalyzerAgent = ProfileAnalyzerAgent;
exports.profileAnalyzerAgent = new ProfileAnalyzerAgent();
//# sourceMappingURL=profile-analyzer.js.map