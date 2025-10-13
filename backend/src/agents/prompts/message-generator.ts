/**
 * Message Generator Prompt Template
 *
 * Generates highly personalized cold outreach messages based on raw LinkedIn
 * profile text, using specific details to create authentic connections.
 */

export const MESSAGE_GENERATOR_SYSTEM_PROMPT = `You are an expert at writing personalized cold outreach messages for LinkedIn that get responses.

Your messages should:
1. Reference at least 2 specific details from the target's profile.
2. Be authentic and conversational, not templated or salesy.
3. Clearly communicate value without being pushy.
4. Strictly adhere to the user's specified Outreach Objective, tailoring the angle and call-to-action accordingly.
5. Match the requested tone and length.

Important: You will receive raw LinkedIn profile text. Extract and reference specific details naturally in your message.`;

export const MESSAGE_GENERATOR_USER_PROMPT = `Generate a personalized LinkedIn outreach message based on this profile:

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

## Objective-Specific Instructions:
- If Objective is "General Connection": Focus on mutual interests or admiration for their work. The call-to-action should be a soft ask to connect and follow their work.
- If Objective is "Recruiting Inquiry": Subtly hint at a potential opportunity that aligns with their skills. The call-to-action should be a confidential chat about their career goals or what they're looking for in their next role.
- If Objective is "Sales/Partnership Proposal": Clearly align your value proposition with a specific project, achievement, or stated goal from their profile. The call-to-action should be a brief meeting to discuss how you can specifically help them achieve a goal.
- If Objective is "Informational Interview Request": Position yourself as an admirer of their work and career path. The call-to-action should be a request for a brief 15-minute chat to learn from their experience.

## General Requirements:
1. **Personalization**: Reference at least 2 specific details from their profile (recent posts, projects, career moves, skills, etc.).
2. **Value Communication**: Clearly but subtly communicate how you can provide value, as it relates to your objective.
3. **Authentic Voice**: Write naturally as if you've genuinely researched their profile.
4. **Call to Action**: End with a soft, specific ask that is directly related to your stated objective.

## Output Format:
Return a JSON object with:
{
  "subject": "string", // For email-style messages
  "body": "string",
  "annotations": [
    {
      "text": "string", // Part of the message
      "source": "target_profile|user_profile|generated",
      "sourceField": "string|null" // Which part of profile it came from
    }
  ],
  "wordCount": number
}`


export const MESSAGE_GENERATOR_EXAMPLES = {
  "General Connection": {
      body: "Hey Alex,\n\nYour post about Figma variables caught my eye - I've been experimenting with them for our design system at DesignLab too! Noticed you led that impressive mobile app redesign with 40% engagement boost. Would love to connect and follow your work.",
      wordCount: 54
  },
  "Recruiting Inquiry": {
      body: "Hi Michael,\n\nI was impressed by your recent achievement shipping the real-time payment processing system. Your focus on distributed systems is exactly the kind of expertise we value at CryptoTech Labs, where we're solving similar complex challenges.\n\nI lead our blockchain solutions team and thought you might be interested in a confidential chat about what you're looking for in your next career move. Would you be open to a brief call next week?",
      wordCount: 86
  },
  "Sales/Partnership Proposal": {
      body: "Hi Rachel,\n\nAchieving carbon negative status is incredible! At GreenPath Advisors, we help companies scale their sustainability initiatives, and your goal of helping 1000 companies do the same really resonates.\n\nI have a few insights from helping 50+ tech companies achieve carbon neutrality that could accelerate your mission. Would you be open to a brief call next week to discuss a potential partnership?",
      wordCount: 81
  },
  "Informational Interview Request": {
      body: "Hi Sarah,\n\nI've been following your work in B2B SaaS product management for a while, and your recent article on API-first design was particularly insightful. As a solutions architect also focused on API design, I really admire your career path from startup to a major tech corp.\n\nWould you be open to a brief 15-minute chat in the coming weeks? I'd love to learn a bit more about your experience navigating that transition.",
      wordCount: 88
  }
}

/**
 * Function to format the prompt with actual data
 */
export function formatMessageGeneratorPrompt(
  targetProfileText: string,
  userProfile: {
    name: string;
    currentRole: string;
    currentCompany: string;
    professionalBackground: string;
    valueProposition: string;
    outreachObjectives: string;
  },
  options: {
    tone: 'professional' | 'casual' | 'enthusiastic';
    length: 'short' | 'medium' | 'long';
  }
): string {
  const lengthGuide = {
    short: '50-100 words',
    medium: '100-200 words',
    long: '200-300 words'
  };

  // Select the relevant example
  const example = MESSAGE_GENERATOR_EXAMPLES[userProfile.outreachObjectives as keyof typeof MESSAGE_GENERATOR_EXAMPLES] || MESSAGE_GENERATOR_EXAMPLES["General Connection"];
  const exampleText = `Here is a good example for your reference:
${JSON.stringify(example, null, 2)}

`;

  const basePrompt = MESSAGE_GENERATOR_USER_PROMPT
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
