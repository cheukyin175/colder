"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_GENERATOR_EXAMPLES = exports.MESSAGE_GENERATOR_USER_PROMPT = exports.MESSAGE_GENERATOR_SYSTEM_PROMPT = void 0;
exports.formatMessageGeneratorPrompt = formatMessageGeneratorPrompt;
exports.MESSAGE_GENERATOR_SYSTEM_PROMPT = `You are an expert at writing personalized cold outreach messages for LinkedIn that get high response rates.

Core Principles:
1. PERSONALIZATION: Reference 2-3 specific, unique details from their profile (recent achievements, posts, projects, career transitions)
2. AUTHENTICITY: Write like a real person who genuinely researched their profile, not a template
3. VALUE-FIRST: Lead with what's in it for them, not what you want
4. CLEAR PURPOSE: Match the message purpose with an appropriate, specific call-to-action
5. TONE CONSISTENCY: Maintain the requested tone throughout the message

Important: You'll receive raw LinkedIn profile text. Extract meaningful details and weave them naturally into your message.`;
exports.MESSAGE_GENERATOR_USER_PROMPT = `Generate a personalized LinkedIn outreach message based on this profile:

## Target Profile (Raw LinkedIn Text):
{targetProfileText}

## Sender Profile:
Name: {userName}
Current Role: {userRole}
Company: {userCompany}
Background: {userBackground}
Value Proposition: {userValue}

## Message Parameters:
Outreach Objective: {userObjective}
Tone: {tone}
Length: {length}

## Purpose-Specific Guidelines:

**General Connection**: Express genuine interest in their work/expertise. End with: "Would love to connect and stay in touch."

**Coffee Chat Request**: Find a shared interest or mutual connection point. End with: "Would you be open to a quick coffee chat next week?"

**Informational Interview Request**: Show you've done homework on their career path. End with: "Could I ask you a few questions about your experience in [specific area]? 15 minutes would be incredibly valuable."

**Collaboration Proposal**: Identify a specific area where your skills complement theirs. End with: "I think there's an interesting opportunity to collaborate on [specific area]. Open to exploring?"

**Job Inquiry**: Reference their company's work and your relevant experience. End with: "I'd love to learn more about your team and any upcoming opportunities. Could we connect?"

**Sales/Partnership Proposal**: Align your solution with their specific challenge or goal. End with: "I have some ideas that might help with [specific challenge]. Worth a brief call to explore?"

## Tone Guidelines:
- **Professional**: Polished but not stiff. Use full sentences, proper grammar, avoid slang.
- **Casual**: Conversational and relaxed. OK to use contractions, start with "Hey" instead of "Hi".
- **Enthusiastic**: High energy and positive. Use exclamation points sparingly but effectively.
- **Formal**: Business-like and respectful. Use titles when appropriate, avoid contractions.
- **Friendly**: Warm and approachable. Like talking to a colleague you respect.

## Writing Requirements:
1. **Opening Hook**: Start with something specific about THEM, not generic pleasantries
2. **Personal Details**: Weave in 2-3 specific references naturally (don't just list them)
3. **Clear Value**: Make it obvious what's in it for them within the first 2 sentences
4. **Authentic Voice**: Write like you actually read their profile and care about their work
5. **Specific CTA**: End with ONE clear, specific ask that matches your purpose

## Output Format:
Return a JSON object with:
{
  "subject": null,  // Always null for LinkedIn messages
  "body": "string", // The complete message text
  "wordCount": number // Actual word count of the message
}

IMPORTANT: Focus on the message quality. Don't worry about annotations - just write a great message.`;
exports.MESSAGE_GENERATOR_EXAMPLES = {
    "General Connection": {
        body: "Hi Alex,\n\nYour post about Figma variables caught my eye - I've been experimenting with them for our design system at DesignLab too! Noticed you led that impressive mobile app redesign with 40% engagement boost.\n\nWould love to connect and stay in touch about design systems.",
        wordCount: 45
    },
    "Coffee Chat Request": {
        body: "Hey Emma,\n\nJust saw your talk at ReactConf about micro-frontends - your approach to module federation is exactly what we've been exploring at TechCo.\n\nI'm also in SF and would love to grab coffee next week if you're free. Would be great to compare notes on scaling React apps!",
        wordCount: 48
    },
    "Informational Interview Request": {
        body: "Hi Sarah,\n\nYour transition from engineering to product management at Stripe is fascinating - especially how you leveraged your technical background to drive API-first product decisions.\n\nI'm at a similar crossroads in my career. Could I ask you a few questions about your experience making that leap? Even 15 minutes would be incredibly valuable.",
        wordCount: 53
    },
    "Collaboration Proposal": {
        body: "Hi David,\n\nYour open-source work on the GraphQL caching library is impressive! I've been building a complementary tool for real-time subscriptions that could work really well with your approach.\n\nI think there's an interesting opportunity to collaborate on making these tools work together seamlessly. Open to exploring?",
        wordCount: 46
    },
    "Job Inquiry": {
        body: "Hi Jennifer,\n\nI've been following Notion's evolution from note-taking app to full workspace platform - your team's approach to building collaborative tools is exactly the kind of product vision I'm passionate about.\n\nWith my background in real-time collaboration features at Miro, I'd love to learn more about your team and any upcoming opportunities. Could we connect?",
        wordCount: 56
    },
    "Sales/Partnership Proposal": {
        body: "Hi Rachel,\n\nYour recent post about struggling with customer churn really resonated - we faced the same challenge at my last startup until we implemented predictive analytics.\n\nI have some ideas from helping 50+ SaaS companies reduce churn by 30%+ that might help with your Q4 retention goals. Worth a brief call to explore?",
        wordCount: 53
    }
};
function formatMessageGeneratorPrompt(targetProfileText, userProfile, options) {
    const lengthGuide = {
        short: '50-100 words',
        medium: '100-200 words',
        long: '200-300 words'
    };
    const example = exports.MESSAGE_GENERATOR_EXAMPLES[userProfile.outreachObjectives] || exports.MESSAGE_GENERATOR_EXAMPLES["General Connection"];
    const exampleText = `Here is a good example for your reference:
${JSON.stringify(example, null, 2)}

`;
    const basePrompt = exports.MESSAGE_GENERATOR_USER_PROMPT
        .replace('{targetProfileText}', targetProfileText)
        .replace('{userName}', userProfile.name)
        .replace('{userRole}', userProfile.currentRole)
        .replace('{userCompany}', userProfile.currentCompany)
        .replace('{userBackground}', userProfile.professionalBackground)
        .replace('{userValue}', userProfile.valueProposition)
        .replace('{userObjective}', userProfile.outreachObjectives)
        .replace('{tone}', options.tone)
        .replace('{length}', lengthGuide[options.length]);
    return exampleText + basePrompt;
}
//# sourceMappingURL=message-generator.js.map