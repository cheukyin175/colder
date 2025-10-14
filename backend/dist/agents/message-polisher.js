"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagePolisherAgent = exports.MessagePolisherAgent = void 0;
const zod_1 = require("zod");
const PolishedMessageSchema = zod_1.z.object({
    body: zod_1.z.string(),
    wordCount: zod_1.z.number().optional().default(0),
    changes: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
class MessagePolisherAgent {
    async polishMessage(options, apiKey, modelName) {
        const systemPrompt = `You are an expert at refining LinkedIn outreach messages based on user feedback.

Your task is to polish/refine an existing message while:
1. Maintaining all the personalized details and references from the original
2. Implementing the user's specific feedback
3. Keeping the same tone and approximate length
4. Preserving the core message and call-to-action

Important: Only change what the user specifically asks for. Keep everything else the same.`;
        const userPrompt = `Please polish this LinkedIn message based on the feedback provided.

## Original Message:
${options.originalMessage}

## User's Feedback:
${options.userFeedback}

## Requirements:
- Tone: ${options.tone}
- Length: ${options.length}
- Keep all personalized references to the recipient
- Implement the feedback while maintaining the message's effectiveness

## Output Format:
Return a JSON object with:
{
  "body": "string", // The polished message
  "wordCount": number, // Word count of the polished message
  "changes": ["string"] // Brief list of changes made
}`;
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: systemPrompt },
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
            const messageData = JSON.parse(responseData.choices[0].message.content);
            const validatedData = PolishedMessageSchema.parse(messageData);
            return validatedData;
        }
        catch (error) {
            console.error("Message polishing failed:", error);
            throw new Error(`Failed to polish message: ${error.message}`);
        }
    }
}
exports.MessagePolisherAgent = MessagePolisherAgent;
exports.messagePolisherAgent = new MessagePolisherAgent();
//# sourceMappingURL=message-polisher.js.map