/**
 * Profile Analyzer Prompt Template
 *
 * Analyzes raw LinkedIn profile text to extract insights and talking points
 * for personalized outreach messages.
 */

export const PROFILE_ANALYZER_SYSTEM_PROMPT = `You are an expert at analyzing LinkedIn profiles to identify valuable talking points and connection opportunities for cold outreach.

Your task is to analyze the raw LinkedIn profile text and user profile to identify:
1. Key talking points based on the target's experience, skills, and recent activity
2. Mutual interests or shared experiences with the user
3. Potential connection opportunities
4. A suggested approach for outreach
5. Any caution flags (e.g., minimal profile info, competitive relationship)

The profile text is already extracted and formatted - you need to understand the context and identify relevant details that would make a personalized outreach message more effective.

Output your analysis as a structured JSON object.`;

export const PROFILE_ANALYZER_USER_PROMPT = `Analyze this LinkedIn profile for cold outreach opportunities:

## Target Profile (Raw LinkedIn Text):
{targetProfileText}

## My Profile (User):
Name: {userName}
Current Role: {userRole}
Company: {userCompany}
Background: {userBackground}
Goals: {userGoals}
Value Proposition: {userValue}

## Analysis Requirements:

Identify:
1. **Talking Points**: Extract 3-5 specific talking points from their profile that could be referenced in an outreach message. Focus on:
   - Recent career transitions or achievements
   - Specific projects or initiatives they've worked on
   - Skills or expertise areas
   - Recent posts or activity topics
   - Educational background if relevant

2. **Mutual Interests**: Find any commonalities between the target and user profiles:
   - Shared skills or expertise
   - Similar career paths or transitions
   - Common interests from their activity
   - Overlapping professional networks or companies

3. **Connection Opportunities**: Identify specific ways the user could provide value:
   - Based on the target's current role and challenges
   - Aligned with their recent activity or interests
   - Related to their career trajectory

4. **Suggested Approach**: Recommend the best angle for initial outreach:
   - What specific aspect to lead with
   - Which talking point would resonate most
   - Tone recommendation based on their profile style

5. **Caution Flags**: Note any concerns:
   - Minimal profile information
   - Potential competitive relationship
   - Signs they may not be receptive to outreach

Return your analysis as a JSON object with this structure:
{
  "talkingPoints": [
    {
      "topic": "string",
      "relevance": "high|medium|low",
      "context": "string",
      "sourceField": "string"
    }
  ],
  "mutualInterests": ["string"],
  "connectionOpportunities": ["string"],
  "suggestedApproach": "string",
  "cautionFlags": ["string"]
}`;

/**
 * Function to format the prompt with actual data
 */
export function formatProfileAnalyzerPrompt(
  targetProfileText: string,
  userProfile: {
    name: string;
    currentRole: string;
    currentCompany: string;
    professionalBackground: string;
    careerGoals: string;
    valueProposition: string;
  }
): string {
  return PROFILE_ANALYZER_USER_PROMPT
    .replace('{targetProfileText}', targetProfileText)
    .replace('{userName}', userProfile.name)
    .replace('{userRole}', userProfile.currentRole)
    .replace('{userCompany}', userProfile.currentCompany)
    .replace('{userBackground}', userProfile.professionalBackground)
    .replace('{userGoals}', userProfile.careerGoals)
    .replace('{userValue}', userProfile.valueProposition);
}
