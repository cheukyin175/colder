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
 * Few-shot examples for better analysis
 */
export const PROFILE_ANALYZER_EXAMPLES = [
  {
    input: {
      targetProfile: `
Name: Sarah Johnson
Senior Product Manager at TechCorp

About:
Passionate about building products that solve real problems. 10+ years experience in B2B SaaS.
Currently leading the platform team at TechCorp, focusing on developer experience and API design.

Experience:
Senior Product Manager - TechCorp (2021 - Present)
- Leading platform team of 15 engineers
- Launched new API gateway reducing integration time by 60%
- Driving adoption of microservices architecture

Product Manager - StartupXYZ (2018 - 2021)
- Built payment processing platform from 0 to $5M ARR
- Managed team of 8 engineers

Recent Activity:
"Just published an article on the importance of API-first design in modern SaaS products"
"Excited to announce we're hiring senior engineers for our platform team!"
      `,
      userProfile: {
        name: "John Doe",
        role: "Solutions Architect",
        company: "CloudServices Inc",
        background: "10 years in cloud infrastructure and API design",
        goals: "Connect with product leaders in B2B SaaS",
        value: "Help companies scale their infrastructure and improve developer experience"
      }
    },
    output: {
      talkingPoints: [
        {
          topic: "API gateway launch reducing integration time by 60%",
          relevance: "high",
          context: "Recent major achievement directly related to user's expertise",
          sourceField: "experience"
        },
        {
          topic: "Article on API-first design",
          relevance: "high",
          context: "Recent thought leadership showing current focus area",
          sourceField: "recentActivity"
        },
        {
          topic: "Hiring senior engineers for platform team",
          relevance: "medium",
          context: "Indicates growth and potential collaboration opportunities",
          sourceField: "recentActivity"
        },
        {
          topic: "Transition from StartupXYZ to TechCorp",
          relevance: "medium",
          context: "Career progression from startup to larger company",
          sourceField: "experience"
        }
      ],
      mutualInterests: [
        "API design and developer experience",
        "B2B SaaS platform development",
        "Scaling engineering teams",
        "Microservices architecture"
      ],
      connectionOpportunities: [
        "Share insights on scaling API infrastructure based on CloudServices experience",
        "Discuss best practices for developer experience in platform products",
        "Potential collaboration on API-first design strategies"
      ],
      suggestedApproach: "Lead with congratulations on the API gateway success and reference their article on API-first design. Position yourself as someone with complementary expertise in cloud infrastructure who has helped similar B2B SaaS companies scale.",
      cautionFlags: []
    }
  }
];

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