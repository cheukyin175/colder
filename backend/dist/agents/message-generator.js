"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageGeneratorAgent = exports.MessageGeneratorAgent = void 0;
const zod_1 = require("zod");
const message_generator_1 = require("./prompts/message-generator");
const AnnotationSchema = zod_1.z.object({
    text: zod_1.z.string(),
    source: zod_1.z.enum(['target_profile', 'user_profile', 'generated']),
    sourceField: zod_1.z.string().nullable(),
});
const MessageOutputSchema = zod_1.z.object({
    subject: zod_1.z.string().optional().nullable(),
    body: zod_1.z.string(),
    annotations: zod_1.z.array(AnnotationSchema).optional().default([]),
    wordCount: zod_1.z.number().optional().default(0),
});
class MessageGeneratorAgent {
    async generateMessage(targetProfile, userProfile, analysis, options, apiKey, modelName) {
        const startTime = Date.now();
        try {
            const userPrompt = (0, message_generator_1.formatMessageGeneratorPrompt)(targetProfile.rawProfileText || '', userProfile, options);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: message_generator_1.MESSAGE_GENERATOR_SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.8,
                    max_tokens: 1500,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
            }
            const responseData = await response.json();
            const messageData = JSON.parse(responseData.choices[0].message.content);
            const validatedData = MessageOutputSchema.parse(messageData);
            return {
                id: `draft_${Date.now()}`,
                targetProfileId: targetProfile.id,
                analysisId: `${targetProfile.id}_${userProfile.id}`,
                ...validatedData,
                annotations: (validatedData.annotations || []).map(ann => ({ ...ann, highlight: ann.source === 'target_profile' })),
                tone: options.tone,
                length: options.length,
                generatedAt: new Date(),
                modelUsed: modelName,
                tokensUsed: responseData.usage?.total_tokens || 0,
                generationTime: Date.now() - startTime,
                version: 1,
            };
        }
        catch (error) {
            console.error("Message generation failed:", error);
            throw new Error(`Failed to generate message: ${error.message}`);
        }
    }
}
exports.MessageGeneratorAgent = MessageGeneratorAgent;
exports.messageGeneratorAgent = new MessageGeneratorAgent();
//# sourceMappingURL=message-generator.js.map