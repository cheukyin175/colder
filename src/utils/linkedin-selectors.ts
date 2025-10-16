/**
 * LinkedIn Selectors Utility
 * A collection of functions to extract structured information from a LinkedIn profile page.
 * These selectors are subject to change with LinkedIn's UI updates and may need maintenance.
 */

/**
 * A robust function to get all visible text from a given section element.
 * @param sectionId The ID of the section to extract text from (e.g., 'about', 'experience').
 * @returns A string containing all the cleaned text from that section.
 */
function getSectionText(sectionId: string): string {
  // LinkedIn sections are often identifiable by a direct ID or an element with that ID inside.
  const section = document.querySelector(`section:has(#${sectionId})`);
  if (!section) return '';

  const texts: string[] = [];
  // Query for all common text-containing elements.
  const textElements = section.querySelectorAll('span[aria-hidden="true"], span:not([aria-hidden]), div[dir="ltr"], p, h1, h2, h3, h4, h5, h6');
  
  textElements.forEach(elem => {
    const text = elem.textContent?.trim();
    if (text && text.length > 1) {
      const isAlreadyIncluded = texts.some(existingText => existingText.includes(text));
      if (!isAlreadyIncluded) {
        texts.push(text);
      }
    }
  });

  return texts.join('\n');
}

/**
 * Extracts the profile name.
 * It tries multiple selectors to account for different versions of the LinkedIn UI.
 */
export function extractName(): string | null {
  const selectors = [
    'h1.text-heading-xlarge', // Standard profile name selector
    'h1[class*="text-heading"]', // Any h1 with text-heading class
    '.pv-text-details__left-panel h1', // Older profile layout
    'div[class*="pv-top-card"] h1', // Top card area
    'main section:first-of-type h1', // A more generic selector for the main content area
    '[data-generated-suggestion-target] h1', // New LinkedIn layout
    'main h1:first-of-type', // First h1 in main
    'h1' // Last resort: the first h1 on the page
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      // Name should be reasonable length and not contain common UI text
      if (text && text.length > 1 && text.length < 100 &&
          !text.toLowerCase().includes('linkedin') &&
          !text.toLowerCase().includes('profile')) {
        console.log('[Colder] Found name with selector:', selector, '→', text);
        return text;
      }
    }
  }

  // Debug: log all h1 elements found on the page
  const allH1s = document.querySelectorAll('h1');
  console.log('[Colder] All h1 elements found:', allH1s.length);
  allH1s.forEach((h1, index) => {
    console.log(`[Colder] h1[${index}]:`, h1.textContent?.trim().substring(0, 50));
  });

  return null;
}

/**
 * Extracts the job title and headline.
 */
export function extractJobTitle(): string | null {
  const selectors = [
    '.text-body-medium.break-words', // Standard headline selector
    'div[class*="text-body-medium"]', // Any text-body-medium div
    '.pv-text-details__left-panel .text-body-medium', // Older layout
    'div[class*="pv-top-card"] .text-body-medium', // Top card area
    'main section:first-of-type .text-body-medium', // Generic selector
    '[data-generated-suggestion-target] + div', // After the name element
    'main h1 + div' // Right after the name h1
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 5 && text.length < 200) {
        console.log('[Colder] Found headline with selector:', selector, '→', text.substring(0, 50));
        return text;
      }
    }
  }

  console.log('[Colder] Could not find headline');
  return null;
}

/**
 * Extracts the current company from the headline.
 */
export function extractCompany(): string | null {
  const headline = extractJobTitle();
  if (headline && headline.includes(' at ')) {
    const parts = headline.split(' at ');
    return parts[parts.length - 1].trim();
  }
  return null;
}

/**
 * Extracts the entire work experience section as formatted text.
 */
export function extractWorkExperience(): string {
  const expSection = document.querySelector('section:has(#experience)');
  if (!expSection) return 'No work experience information available.';

  const experienceItems = expSection.querySelectorAll('li');
  const experienceTexts: string[] = [];

  experienceItems.forEach(item => {
    const textContent = item.textContent?.trim().replace(/\s+/g, ' ').trim();
    if (textContent && textContent.length > 20) {
      experienceTexts.push(textContent);
    }
  });

  return experienceTexts.length > 0 ? experienceTexts.join('\n\n---\n\n') : 'No work experience information available.';
}

/**
 * Extracts the education section as formatted text.
 */
export function extractEducation(): string {
  const eduSection = document.querySelector('section:has(#education)');
  if (!eduSection) return 'No education information available.';

  const educationItems = eduSection.querySelectorAll('li');
  const educationTexts: string[] = [];

  educationItems.forEach(item => {
    const textContent = item.textContent?.trim().replace(/\s+/g, ' ').trim();
    if (textContent && textContent.length > 20) {
      educationTexts.push(textContent);
    }
  });

  return educationTexts.length > 0 ? educationTexts.join('\n\n') : 'No education information available.';
}

/**
 * Extracts a list of skills.
 */
export function extractSkills(): string[] {
  const skillsSection = document.querySelector('section:has(#skills)');
  if (!skillsSection) return [];

  const skills: string[] = [];
  // Skills are often within span elements with this specific attribute.
  const skillElements = skillsSection.querySelectorAll('span[aria-hidden="true"]');

  skillElements.forEach(elem => {
    const text = elem.textContent?.trim();
    if (text && text.length > 1 && !skills.includes(text)) {
      skills.push(text);
    }
  });

  return skills.slice(0, 20); // Limit to 20 skills
}

/**
 * Extracts recent posts and activity.
 */
export function extractRecentPosts(): string {
  const activitySection = document.querySelector('section:has(#activity)');
  if (!activitySection) return 'No recent activity found.';

  const activityItems = activitySection.querySelectorAll('li');
  const activities: string[] = [];

  activityItems.forEach((item, index) => {
    if (index >= 5) return; // Limit to 5 activities
    const textContent = item.textContent?.trim().replace(/\s+/g, ' ').trim();
    if (textContent) {
      activities.push(textContent);
    }
  });

  return activities.length > 0 ? activities.join('\n\n') : 'No recent activity found.';
}

/**
 * Extracts the "About" section.
 */
export function extractAbout(): string {
  const aboutText = getSectionText('about');
  return aboutText || 'No about section available.';
}

/**
 * Gets the canonical LinkedIn profile URL.
 */
export function getProfileUrl(): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  let cleanUrl = url.toString();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
}

/**
 * Gathers all extracted text into a single string formatted for an AI prompt.
 */
export function formatProfileForPrompt(): string {
  const profile = {
    name: extractName(),
    headline: extractJobTitle(),
    company: extractCompany(),
    about: extractAbout(),
    experience: extractWorkExperience(),
    education: extractEducation(),
    skills: extractSkills(),
    activity: extractRecentPosts(),
    profileUrl: getProfileUrl(),
  };

  const sections: string[] = [];
  sections.push('=== LINKEDIN PROFILE DATA ===\n');
  if (profile.name) sections.push(`Name: ${profile.name}`);
  if (profile.headline) sections.push(`Current Role/Headline: ${profile.headline}`);
  if (profile.company) sections.push(`Current Company: ${profile.company}`);
  sections.push(`LinkedIn URL: ${profile.profileUrl}`);

  if (profile.about !== 'No about section available.') sections.push('\n--- ABOUT ---\n' + profile.about);
  if (profile.experience !== 'No work experience information available.') sections.push('\n--- WORK EXPERIENCE ---\n' + profile.experience);
  if (profile.education !== 'No education information available.') sections.push('\n--- EDUCATION ---\n' + profile.education);
  if (profile.skills.length > 0) sections.push('\n--- SKILLS ---\n' + profile.skills.join(', '));
  if (profile.activity !== 'No recent activity found.') sections.push('\n--- RECENT ACTIVITY & POSTS ---\n' + profile.activity);

  sections.push('\n=== END OF PROFILE ===');
  return sections.join('\n');
}
