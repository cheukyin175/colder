/**
 * AI Prompts for Chrome Built-in AI
 */

export const MESSAGE_GENERATOR_SYSTEM_PROMPT = `You are an expert at writing personalized cold outreach messages for LinkedIn that get high response rates.

Core Principles:
1. PERSONALIZATION: Reference 2-3 specific, unique details from their profile
2. AUTHENTICITY: Write like a real person who genuinely researched their profile
3. VALUE-FIRST: Lead with what's in it for them
4. CLEAR PURPOSE: Match the message purpose with an appropriate call-to-action
5. TONE CONSISTENCY: Maintain the requested tone throughout

Important: Extract meaningful details and weave them naturally into your message.`;

export interface MessageGeneratorOptions {
  tone: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
  length: 'short' | 'medium' | 'long';
  purpose: string;
}

export interface UserProfile {
  userName: string;
  userRole: string;
  userCompany: string;
  userBackground: string;
  userValueProposition: string;
}

const MESSAGE_GENERATOR_EXAMPLES = {
  "General Connection": '{"body":"Hi Alex,\\n\\nYour post about Figma variables caught my eye - I\'ve been experimenting with them for our design system at DesignLab too! Noticed you led that impressive mobile app redesign with 40% engagement boost.\\n\\nWould love to connect and stay in touch about design systems.","wordCount":45}',
  "Coffee Chat Request": '{"body":"Hey Emma,\\n\\nJust saw your talk at ReactConf about micro-frontends - your approach to module federation is exactly what we\'ve been exploring at TechCo.\\n\\nI\'m also in SF and would love to grab coffee next week if you\'re free. Would be great to compare notes on scaling React apps!","wordCount":48}',
  "Informational Interview Request": '{"body":"Hi Sarah,\\n\\nYour transition from engineering to product management at Stripe is fascinating - especially how you leveraged your technical background to drive API-first product decisions.\\n\\nI\'m at a similar crossroads in my career. Could I ask you a few questions about your experience making that leap? Even 15 minutes would be incredibly valuable.","wordCount":53}',
};

export function formatMessageGeneratorPrompt(
  targetProfileText: string,
  userProfile: UserProfile,
  options: MessageGeneratorOptions
): string {
  const lengthGuide = {
    short: '50-100 words',
    medium: '100-200 words',
    long: '200-300 words'
  };

  const toneGuidelines = {
    professional: `
- Style: Polished, respectful, and clear. Avoids slang and overly casual language.
- Structure: Well-structured with full sentences and proper grammar.
- Goal: To convey competence and respect for the recipient's time.
- Example Opening: "Dear [Name]," or "Hi [Name],"
- Key considerations: Focus on a clear value proposition and a direct call to action.`,
    casual: `
- Style: Conversational, relaxed, and friendly. Contractions (e.g., "I'm," "you're") are acceptable.
- Structure: Can be less formal, but should still be clear and easy to read.
- Goal: To build rapport and come across as approachable.
- Example Opening: "Hey [Name],"
- Key considerations: Use a more personal and less corporate tone. It's okay to show more personality.`,
    enthusiastic: `
- Style: High energy, positive, and passionate. Use of exclamation points is acceptable but should be used sparingly to maintain impact.
- Structure: Can be more expressive.
- Goal: To convey genuine excitement about the reason for reaching out.
- Example Opening: "Hi [Name]!",
- Key considerations: The energy should feel authentic, not forced. Highlight shared interests or passions.`,
    formal: `
- Style: Business-like, respectful, and adhering to traditional professional etiquette. Avoids contractions and any form of casualness.
- Structure: Very formal, similar to a traditional business letter.
- Goal: To show a high degree of respect and seriousness, often used when contacting senior executives or in traditional industries.
- Example Opening: "Dear Mr./Ms. [Last Name],"
- Key considerations: Err on the side of being more formal than necessary. The language should be very precise.`,
    friendly: `
- Style: Warm, approachable, and collaborative. Like talking to a respected colleague or a new acquaintance at a conference.
- Structure: Friendly and open, but still professional.
- Goal: To create a warm and positive first impression.
- Example Opening: "Hi [Name],"
- Key considerations: Focus on mutual interests and a collaborative tone. It's a good middle-ground between "casual" and "professional".`
  };

  const example = MESSAGE_GENERATOR_EXAMPLES[options.purpose as keyof typeof MESSAGE_GENERATOR_EXAMPLES] || MESSAGE_GENERATOR_EXAMPLES["General Connection"];

  return `${MESSAGE_GENERATOR_SYSTEM_PROMPT}

Generate a personalized LinkedIn outreach message:

## Target Profile:
${targetProfileText}

## Sender:
Name: ${userProfile.userName || 'User'}
Role: ${userProfile.userRole || 'Professional'}
Company: ${userProfile.userCompany || ''}
Background: ${userProfile.userBackground || ''}
Value: ${userProfile.userValueProposition || ''}

## Parameters:
Objective: ${options.purpose}
Tone: ${options.tone} - ${toneGuidelines[options.tone]}
Length: ${lengthGuide[options.length]}

## Example:
${example}

## Requirements:
1. Start with something specific about THEM
2. Weave in 2-3 specific references naturally
3. Make value obvious within first 2 sentences
4. Write authentically
5. End with ONE clear ask

Return ONLY valid JSON (no markdown):
{"body":"string","wordCount":number}`;
}

export function formatPolishPrompt(
  originalMessage: string,
  userFeedback: string,
  options: Pick<MessageGeneratorOptions, 'tone' | 'length'>
): string {
  const lengthGuide = {
    short: '50-100 words',
    medium: '100-200 words',
    long: '200-300 words'
  };

  return `Refine this LinkedIn message based on feedback.

## Original:
${originalMessage}

## Feedback:
${userFeedback}

## Requirements:
- Tone: ${options.tone}
- Length: ${lengthGuide[options.length]}
- Keep personalization
- Apply feedback

Return ONLY valid JSON (no markdown):
{"body":"string","wordCount":number,"changes":"string"}`;
}
