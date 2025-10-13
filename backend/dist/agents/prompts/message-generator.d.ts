export declare const MESSAGE_GENERATOR_SYSTEM_PROMPT = "You are an expert at writing personalized cold outreach messages for LinkedIn that get responses.\n\nYour messages should:\n1. Reference at least 2 specific details from the target's profile.\n2. Be authentic and conversational, not templated or salesy.\n3. Clearly communicate value without being pushy.\n4. Strictly adhere to the user's specified Outreach Objective, tailoring the angle and call-to-action accordingly.\n5. Match the requested tone and length.\n\nImportant: You will receive raw LinkedIn profile text. Extract and reference specific details naturally in your message.";
export declare const MESSAGE_GENERATOR_USER_PROMPT = "Generate a personalized LinkedIn outreach message based on this profile:\n\n## Target Profile (Raw LinkedIn Text):\n{targetProfileText}\n\n## Sender Profile:\nName: {userName}\nCurrent Role: {userRole}\nCompany: {userCompany}\nBackground: {userBackground}\nValue Proposition: {userValue}\n\n## Message Parameters:\nOutreach Objective: {userObjective}\nTone: {tone}\nLength: {length}\n\n## Objective-Specific Instructions:\n- If Objective is \"General Connection\": Focus on mutual interests or admiration for their work. The call-to-action should be a soft ask to connect and follow their work.\n- If Objective is \"Recruiting Inquiry\": Subtly hint at a potential opportunity that aligns with their skills. The call-to-action should be a confidential chat about their career goals or what they're looking for in their next role.\n- If Objective is \"Sales/Partnership Proposal\": Clearly align your value proposition with a specific project, achievement, or stated goal from their profile. The call-to-action should be a brief meeting to discuss how you can specifically help them achieve a goal.\n- If Objective is \"Informational Interview Request\": Position yourself as an admirer of their work and career path. The call-to-action should be a request for a brief 15-minute chat to learn from their experience.\n\n## General Requirements:\n1. **Personalization**: Reference at least 2 specific details from their profile (recent posts, projects, career moves, skills, etc.).\n2. **Value Communication**: Clearly but subtly communicate how you can provide value, as it relates to your objective.\n3. **Authentic Voice**: Write naturally as if you've genuinely researched their profile.\n4. **Call to Action**: End with a soft, specific ask that is directly related to your stated objective.\n\n## Output Format:\nReturn a JSON object with:\n{\n  \"subject\": \"string\", // For email-style messages\n  \"body\": \"string\",\n  \"annotations\": [\n    {\n      \"text\": \"string\", // Part of the message\n      \"source\": \"target_profile|user_profile|generated\",\n      \"sourceField\": \"string|null\" // Which part of profile it came from\n    }\n  ],\n  \"wordCount\": number\n}";
export declare const MESSAGE_GENERATOR_EXAMPLES: {
    "General Connection": {
        body: string;
        wordCount: number;
    };
    "Recruiting Inquiry": {
        body: string;
        wordCount: number;
    };
    "Sales/Partnership Proposal": {
        body: string;
        wordCount: number;
    };
    "Informational Interview Request": {
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
    tone: 'professional' | 'casual' | 'enthusiastic';
    length: 'short' | 'medium' | 'long';
}): string;
