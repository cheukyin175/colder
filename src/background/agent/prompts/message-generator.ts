/**
 * Message Generator Prompt Template
 *
 * Generates highly personalized cold outreach messages based on raw LinkedIn
 * profile text, using specific details to create authentic connections.
 */

export const MESSAGE_GENERATOR_SYSTEM_PROMPT = `You are an expert at writing personalized cold outreach messages for LinkedIn that get responses.

Your messages should:
1. Reference at least 2 specific details from the target's profile
2. Be authentic and conversational, not templated or salesy
3. Clearly communicate value without being pushy
4. Match the requested tone and length
5. Include a clear but soft call-to-action

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
Outreach Objective: {userObjective}

## Message Parameters:
Tone: {tone}
Length: {length}

## Requirements:
1. **Personalization**: Reference at least 2 specific details from their profile:
   - Recent posts, articles, or activity
   - Specific projects or achievements
   - Career transitions or milestones
   - Skills or expertise areas
   - Educational background if relevant

2. **Value Communication**: Clearly but subtly communicate how you can provide value

3. **Authentic Voice**: Write naturally as if you've genuinely researched their profile

4. **Call to Action**: End with a soft, specific ask (not just "let's connect")

## Tone Guidelines:
- Professional: Formal but friendly, focus on business value
- Casual: Conversational and approachable, like reaching out to a colleague
- Enthusiastic: Energetic and passionate, showing genuine excitement

## Length Guidelines:
- short: 50-100 words (2-3 sentences)
- medium: 100-200 words (4-6 sentences)
- long: 200-300 words (7-10 sentences)

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
}`;

/**
 * Few-shot examples for each tone
 */
export const MESSAGE_GENERATOR_EXAMPLES = {
  professional: {
    input: {
      targetProfile: `
Name: Michael Chen
Director of Engineering at FinTech Solutions

About:
Leading engineering teams to build scalable financial platforms. 15+ years in fintech.
Passionate about blockchain, distributed systems, and team mentorship.

Recent Activity:
"Just shipped our new real-time payment processing system - 10x improvement in throughput!"
"Looking for senior engineers who love solving complex distributed systems challenges"
      `,
      userProfile: {
        name: "Jessica Martinez",
        role: "Blockchain Solutions Architect",
        company: "CryptoTech Labs",
        background: "Specialized in enterprise blockchain implementations for financial services",
        value: "Help fintech companies integrate blockchain for improved security and efficiency",
        objective: "Explore potential collaboration on blockchain initiatives"
      },
      tone: "professional",
      length: "medium"
    },
    output: {
      subject: "Congratulations on the payment processing milestone",
      body: "Hi Michael,\n\nI was impressed by your recent achievement shipping the real-time payment processing system with 10x throughput improvement - that's a remarkable engineering feat in the fintech space.\n\nYour focus on distributed systems particularly caught my attention. At CryptoTech Labs, I've been helping financial services companies integrate blockchain solutions to enhance their distributed architectures, and I've seen firsthand how the right implementation can transform payment processing capabilities.\n\nGiven your team's expertise in scalable financial platforms and your interest in blockchain technology, I'd love to share some insights from our recent enterprise implementations that might be relevant to FinTech Solutions' roadmap.\n\nWould you be open to a brief call next week to discuss how blockchain could complement your impressive distributed systems work?",
      annotations: [
        {
          text: "real-time payment processing system with 10x throughput improvement",
          source: "target_profile",
          sourceField: "recentActivity"
        },
        {
          text: "distributed systems",
          source: "target_profile",
          sourceField: "about"
        },
        {
          text: "CryptoTech Labs",
          source: "user_profile",
          sourceField: "company"
        },
        {
          text: "blockchain solutions",
          source: "user_profile",
          sourceField: "background"
        }
      ],
      wordCount: 127
    }
  },
  casual: {
    input: {
      targetProfile: `
Name: Alex Thompson
Product Designer at StartupHub

About:
Creating delightful user experiences for early-stage startups. Design thinking enthusiast.

Experience:
- Led redesign of mobile app resulting in 40% increase in user engagement
- Mentoring junior designers through ADPList

Recent Activity:
"Anyone else obsessed with the new Figma variables feature? Game changer for design systems!"
      `,
      userProfile: {
        name: "Sam Wilson",
        role: "UX Researcher",
        company: "DesignLab",
        background: "Helping startups validate designs through user research",
        value: "Provide user insights that inform better design decisions",
        objective: "Connect with designers interested in research collaboration"
      },
      tone: "casual",
      length: "short"
    },
    output: {
      subject: "Fellow Figma variables enthusiast here!",
      body: "Hey Alex,\n\nYour post about Figma variables caught my eye - I've been experimenting with them for our design system at DesignLab too! \n\nNoticed you led that impressive mobile app redesign with 40% engagement boost. I'm actually researching how early-stage startups validate such impactful design decisions. Would love to swap notes on what research methods worked best for your team sometime!",
      annotations: [
        {
          text: "Figma variables",
          source: "target_profile",
          sourceField: "recentActivity"
        },
        {
          text: "mobile app redesign with 40% engagement boost",
          source: "target_profile",
          sourceField: "experience"
        },
        {
          text: "DesignLab",
          source: "user_profile",
          sourceField: "company"
        }
      ],
      wordCount: 68
    }
  },
  enthusiastic: {
    input: {
      targetProfile: `
Name: Rachel Kim
Founder & CEO at EcoTech Innovations

About:
Building sustainable technology solutions for a better planet. Stanford MBA.
Raised $5M seed round last year.

Recent Activity:
"Thrilled to announce we're carbon negative as of Q3! Next stop: helping 1000 companies do the same"
"Speaking at Climate Tech Summit next month on scaling sustainable practices"
      `,
      userProfile: {
        name: "David Green",
        role: "Sustainability Consultant",
        company: "GreenPath Advisors",
        background: "Helped 50+ tech companies achieve carbon neutrality",
        value: "Accelerate sustainability initiatives through proven frameworks",
        objective: "Support mission-driven founders in their environmental goals"
      },
      tone: "enthusiastic",
      length: "medium"
    },
    output: {
      subject: "Your carbon negative achievement is inspiring! 🌱",
      body: "Hi Rachel,\n\nWOW - achieving carbon negative status is incredible! Your announcement about helping 1000 companies follow your lead really resonates with me.\n\nI've been following EcoTech Innovations since your seed round, and your rapid progress is exactly what the climate tech space needs. At GreenPath Advisors, I've helped 50+ tech companies achieve carbon neutrality, and seeing a founder push beyond that to carbon negative is absolutely inspiring!\n\nYour Climate Tech Summit talk next month sounds fantastic - I'll definitely be attending! I'd love to share some frameworks we've developed that have helped companies scale their sustainable practices 3x faster.\n\nWould you be interested in a quick coffee chat before the summit? I'm genuinely excited about your mission and would love to explore how we might accelerate your goal of helping those 1000 companies!",
      annotations: [
        {
          text: "carbon negative",
          source: "target_profile",
          sourceField: "recentActivity"
        },
        {
          text: "Climate Tech Summit",
          source: "target_profile",
          sourceField: "recentActivity"
        },
        {
          text: "seed round",
          source: "target_profile",
          sourceField: "about"
        },
        {
          text: "50+ tech companies achieve carbon neutrality",
          source: "user_profile",
          sourceField: "background"
        }
      ],
      wordCount: 142
    }
  }
};

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

  return MESSAGE_GENERATOR_USER_PROMPT
    .replace('{targetProfileText}', targetProfileText)
    .replace('{userName}', userProfile.name)
    .replace('{userRole}', userProfile.currentRole)
    .replace('{userCompany}', userProfile.currentCompany)
    .replace('{userBackground}', userProfile.professionalBackground)
    .replace('{userValue}', userProfile.valueProposition)
    .replace('{userObjective}', userProfile.outreachObjectives)
    .replace('{tone}', options.tone)
    .replace('{length}', lengthGuide[options.length]);
}