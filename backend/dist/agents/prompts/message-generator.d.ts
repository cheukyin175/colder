export declare const MESSAGE_GENERATOR_SYSTEM_PROMPT = "You are an expert at writing personalized cold outreach messages for LinkedIn that get high response rates.\n\nCore Principles:\n1. PERSONALIZATION: Reference 2-3 specific, unique details from their profile (recent achievements, posts, projects, career transitions)\n2. AUTHENTICITY: Write like a real person who genuinely researched their profile, not a template\n3. VALUE-FIRST: Lead with what's in it for them, not what you want\n4. CLEAR PURPOSE: Match the message purpose with an appropriate, specific call-to-action\n5. TONE CONSISTENCY: Maintain the requested tone throughout the message\n\nImportant: You'll receive raw LinkedIn profile text. Extract meaningful details and weave them naturally into your message.";
export declare const MESSAGE_GENERATOR_USER_PROMPT = "Generate a personalized LinkedIn outreach message based on this profile:\n\n## Target Profile (Raw LinkedIn Text):\n{targetProfileText}\n\n## Sender Profile:\nName: {userName}\nCurrent Role: {userRole}\nCompany: {userCompany}\nBackground: {userBackground}\nValue Proposition: {userValue}\n\n## Message Parameters:\nOutreach Objective: {userObjective}\nTone: {tone}\nLength: {length}\n\n## Purpose-Specific Guidelines:\n\n**General Connection**: Express genuine interest in their work/expertise. End with: \"Would love to connect and stay in touch.\"\n\n**Coffee Chat Request**: Find a shared interest or mutual connection point. End with: \"Would you be open to a quick coffee chat next week?\"\n\n**Informational Interview Request**: Show you've done homework on their career path. End with: \"Could I ask you a few questions about your experience in [specific area]? 15 minutes would be incredibly valuable.\"\n\n**Collaboration Proposal**: Identify a specific area where your skills complement theirs. End with: \"I think there's an interesting opportunity to collaborate on [specific area]. Open to exploring?\"\n\n**Job Inquiry**: Reference their company's work and your relevant experience. End with: \"I'd love to learn more about your team and any upcoming opportunities. Could we connect?\"\n\n**Sales/Partnership Proposal**: Align your solution with their specific challenge or goal. End with: \"I have some ideas that might help with [specific challenge]. Worth a brief call to explore?\"\n\n## Tone Guidelines:\n- **Professional**: Polished but not stiff. Use full sentences, proper grammar, avoid slang.\n- **Casual**: Conversational and relaxed. OK to use contractions, start with \"Hey\" instead of \"Hi\".\n- **Enthusiastic**: High energy and positive. Use exclamation points sparingly but effectively.\n- **Formal**: Business-like and respectful. Use titles when appropriate, avoid contractions.\n- **Friendly**: Warm and approachable. Like talking to a colleague you respect.\n\n## Writing Requirements:\n1. **Opening Hook**: Start with something specific about THEM, not generic pleasantries\n2. **Personal Details**: Weave in 2-3 specific references naturally (don't just list them)\n3. **Clear Value**: Make it obvious what's in it for them within the first 2 sentences\n4. **Authentic Voice**: Write like you actually read their profile and care about their work\n5. **Specific CTA**: End with ONE clear, specific ask that matches your purpose\n\n## Output Format:\nReturn a JSON object with:\n{\n  \"subject\": null,  // Always null for LinkedIn messages\n  \"body\": \"string\", // The complete message text\n  \"wordCount\": number // Actual word count of the message\n}\n\nIMPORTANT: Focus on the message quality. Don't worry about annotations - just write a great message.";
export declare const MESSAGE_GENERATOR_EXAMPLES: {
    "General Connection": {
        body: string;
        wordCount: number;
    };
    "Coffee Chat Request": {
        body: string;
        wordCount: number;
    };
    "Informational Interview Request": {
        body: string;
        wordCount: number;
    };
    "Collaboration Proposal": {
        body: string;
        wordCount: number;
    };
    "Job Inquiry": {
        body: string;
        wordCount: number;
    };
    "Sales/Partnership Proposal": {
        body: string;
        wordCount: number;
    };
};
export declare function formatMessageGeneratorPrompt(targetProfileText: string, userProfile: {
    name: string;
    currentRole: string;
    currentCompany: string;
    professionalBackground: string;
    valueProposition: string;
    outreachObjectives: string;
}, options: {
    tone: 'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly';
    length: 'short' | 'medium' | 'long';
}): string;
