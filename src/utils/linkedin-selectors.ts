/**
 * LinkedIn Selectors Utility - Simplified for AI Prompt Generation
 * Focuses on extracting clean text content rather than perfect structure
 */

/**
 * Extract clean text from an element, filtering out UI elements
 */
function extractCleanText(element: Element | null): string {
  if (!element) return '';

  // Get all text content
  const text = element.textContent?.trim() || '';

  // Filter out common UI elements and clean up
  const uiPatterns = [
    /^View .+ profile$/,
    /^Message$/,
    /^Connect$/,
    /^Follow$/,
    /^More$/,
    /^Show all \d+/,
    /^\d+ connection/,
    /^Logo$/
  ];

  // Remove UI patterns
  let cleanText = text;
  uiPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '');
  });

  // Clean up multiple spaces and newlines
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  return cleanText;
}

/**
 * Get text content from a section - comprehensive extraction
 */
function getSectionText(sectionId: string): string {
  const section = document.querySelector(`section:has(#${sectionId})`);
  if (!section) return '';

  // Get all text content, not just spans
  const textElements = section.querySelectorAll('span[aria-hidden="true"], span:not([aria-hidden]), div[dir="ltr"], p, h1, h2, h3, h4, h5, h6');
  const texts: string[] = [];

  textElements.forEach(elem => {
    const text = elem.textContent?.trim();
    if (text && text.length > 1) {
      // Skip if already included (avoid duplicates)
      const isAlreadyIncluded = texts.some(existingText =>
        existingText.includes(text) || text.includes(existingText)
      );

      if (!isAlreadyIncluded) {
        // Skip common UI elements
        const uiElements = ['View', 'Message', 'Connect', 'Logo', 'Show all', 'see more', 'see less'];
        const isUIElement = uiElements.some(ui => text === ui || text.startsWith(`${ui} `));

        if (!isUIElement) {
          texts.push(text);
        }
      }
    }
  });

  return texts.join('\n');
}

/**
 * Extract name from LinkedIn profile
 */
export function extractName(): string | null {
  // Try multiple approaches
  const selectors = [
    'h1.text-heading-xlarge',
    '.pv-text-details__left-panel h1',
    'main section:first-of-type h1',
    'h1'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 1 && text.length < 100) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Extract job title/headline from LinkedIn profile
 */
export function extractJobTitle(): string | null {
  const selectors = [
    '.text-body-medium.break-words',
    '.pv-text-details__left-panel .text-body-medium',
    'main section:first-of-type .text-body-medium'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 5) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Extract current company - from headline or first experience
 */
export function extractCompany(): string | null {
  // First try to get from the headline which often has "Title at Company" format
  const headline = extractJobTitle();
  if (headline && headline.includes(' at ')) {
    const parts = headline.split(' at ');
    if (parts.length >= 2) {
      return parts[parts.length - 1].trim();
    }
  }

  // If not in headline, just return null and let the experience section handle it
  // We don't want to incorrectly parse job titles as companies
  return null;
}

/**
 * Extract work experience - raw text for AI
 */
export function extractWorkExperience(): string {
  const expSection = document.querySelector('section:has(#experience)');
  if (!expSection) {
    return 'No work experience information available.';
  }

  // Get all list items in experience section
  const experienceItems = expSection.querySelectorAll('li');
  const experienceTexts: string[] = [];

  experienceItems.forEach((item, index) => {
    // Skip nested items (like skill tags)
    const parentLi = item.parentElement?.closest('li');
    if (parentLi && expSection.contains(parentLi)) {
      return; // Skip if this is a nested li
    }

    // Get all text from this experience item
    const textContent = item.textContent?.trim();
    if (textContent && textContent.length > 20) {
      // Clean up the text - remove excessive whitespace
      const cleaned = textContent.replace(/\s+/g, ' ').trim();

      // Skip if it's just UI elements
      if (!cleaned.includes('Logo') && !cleaned.startsWith('View') && !cleaned.startsWith('Message')) {
        experienceTexts.push(cleaned);
      }
    }
  });

  // If no items found, fallback to section text
  if (experienceTexts.length === 0) {
    return getSectionText('experience') || 'No work experience information available.';
  }

  // Join experiences with clear separation
  return experienceTexts.join('\n\n---\n\n');
}

/**
 * Extract education - raw text for AI
 */
export function extractEducation(): string {
  const eduSection = document.querySelector('section:has(#education)');
  if (!eduSection) {
    return 'No education information available.';
  }

  // Get all list items in education section
  const educationItems = eduSection.querySelectorAll('li');
  const educationTexts: string[] = [];

  educationItems.forEach((item) => {
    // Skip nested items
    const parentLi = item.parentElement?.closest('li');
    if (parentLi && eduSection.contains(parentLi)) {
      return;
    }

    // Get all text from this education item
    const textContent = item.textContent?.trim();
    if (textContent && textContent.length > 20) {
      // Clean up the text
      const cleaned = textContent.replace(/\s+/g, ' ').trim();

      // Skip UI elements
      if (!cleaned.includes('Logo') && !cleaned.startsWith('View')) {
        educationTexts.push(cleaned);
      }
    }
  });

  // If no items found, fallback to section text
  if (educationTexts.length === 0) {
    return getSectionText('education') || 'No education information available.';
  }

  // Join education entries with clear separation
  return educationTexts.join('\n\n');
}

/**
 * Extract skills - simplified for AI
 */
export function extractSkills(): string[] {
  const skillsSection = document.querySelector('section:has(#skills)') ||
                       document.querySelector('section:has(.skills-section)');

  if (!skillsSection) return [];

  const skills: string[] = [];
  const skillElements = skillsSection.querySelectorAll('span[aria-hidden="true"]');

  skillElements.forEach(elem => {
    const text = elem.textContent?.trim();

    // Filter for reasonable skill names
    if (text && text.length > 2 && text.length < 50 && !text.includes('·')) {
      // Skip if it's a number or common UI text
      if (!/^\d+$/.test(text) && !text.includes('endorsement') && !text.includes('View')) {
        if (!skills.includes(text)) {
          skills.push(text);
        }
      }
    }
  });

  return skills.slice(0, 20); // Limit to 20 skills
}

/**
 * Extract recent posts/activity - get full content
 */
export function extractRecentPosts(): string {
  // Try multiple sections where activity might be
  const activitySection = document.querySelector('section:has(#activity)') ||
                         document.querySelector('section:has(#content_main)') ||
                         document.querySelector('[aria-label*="Activity"]');

  if (!activitySection) {
    // Try to get from recent activity feed
    const feedSection = document.querySelector('.pv-recent-activity-section') ||
                       document.querySelector('.profile-creator-shared-feed-update__container');

    if (!feedSection) {
      return 'No recent activity found.';
    }

    // Extract from feed section
    const posts = feedSection.querySelectorAll('article, .feed-shared-update-v2, .occludable-update');
    const postTexts: string[] = [];

    posts.forEach((post, index) => {
      if (index >= 5) return; // Limit to 5 posts

      // Get all text content from the post
      const textElements = post.querySelectorAll('span[aria-hidden="true"], span[dir="ltr"], .feed-shared-text');
      const postContent: string[] = [];

      textElements.forEach(elem => {
        const text = elem.textContent?.trim();
        if (text && text.length > 10 && !postContent.includes(text)) {
          postContent.push(text);
        }
      });

      if (postContent.length > 0) {
        postTexts.push(`Post ${index + 1}:\n${postContent.join('\n')}`);
      }
    });

    return postTexts.length > 0 ? postTexts.join('\n\n') : 'No recent posts found.';
  }

  // Get all text from activity section
  const activityItems = activitySection.querySelectorAll('article, li, .feed-shared-update-v2');
  const activities: string[] = [];

  activityItems.forEach((item, index) => {
    if (index >= 5) return; // Limit to 5 activities

    // Get text content
    const textElements = item.querySelectorAll('span[aria-hidden="true"], span:not([aria-hidden])');
    const itemTexts: string[] = [];

    textElements.forEach(elem => {
      const text = elem.textContent?.trim();
      if (text && text.length > 10 && !itemTexts.includes(text)) {
        // Skip UI elements
        if (!text.includes('View') && !text.includes('Message') && !text.includes('Connect')) {
          itemTexts.push(text);
        }
      }
    });

    if (itemTexts.length > 0) {
      activities.push(`Activity ${index + 1}:\n${itemTexts.join('\n')}`);
    }
  });

  return activities.length > 0 ? activities.join('\n\n') : 'No recent activity found.';
}

/**
 * Extract About/Summary section
 */
export function extractAbout(): string {
  const aboutText = getSectionText('about');

  if (!aboutText) {
    return 'No about section available.';
  }

  // Clean up the text
  const lines = aboutText.split('\n');
  const cleanedLines: string[] = [];

  lines.forEach(line => {
    if (line.length < 3) return;
    if (line === 'About') return; // Skip section header
    cleanedLines.push(line);
  });

  return cleanedLines.join('\n');
}

/**
 * Extract all profile information as a structured text for AI
 */
export function extractProfileForAI(): {
  name: string | null;
  headline: string | null;
  company: string | null;
  about: string;
  experience: string;
  education: string;
  skills: string[];
  activity: string;
  profileUrl: string;
} {
  return {
    name: extractName(),
    headline: extractJobTitle(),
    company: extractCompany(),
    about: extractAbout(),
    experience: extractWorkExperience(),
    education: extractEducation(),
    skills: extractSkills(),
    activity: extractRecentPosts(),
    profileUrl: getProfileUrl()
  };
}

/**
 * Check if current page is a LinkedIn profile page
 */
export function isLinkedInProfilePage(): boolean {
  // Check URL pattern
  const urlPatterns = [
    /linkedin\.com\/in\/[\w-]+\/?$/,
    /linkedin\.com\/in\/[\w-]+\/$/,
    /linkedin\.com\/profile\/view/
  ];

  const currentUrl = window.location.href;
  const isProfileUrl = urlPatterns.some(pattern => pattern.test(currentUrl));

  if (!isProfileUrl) return false;

  // Additional check: verify profile elements exist
  const profileIndicators = [
    'section.profile',
    'main.scaffold-layout__main',
    '[data-view-name*="profile"]',
    '#profile-content'
  ];

  return profileIndicators.some(selector => {
    try {
      return document.querySelector(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Extract LinkedIn profile URL from current page
 */
export function getProfileUrl(): string {
  // Clean URL of query parameters and trailing slashes
  const url = new URL(window.location.href);

  // Remove query parameters and hash
  url.search = '';
  url.hash = '';

  // Remove trailing slash
  let cleanUrl = url.toString();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  return cleanUrl;
}

/**
 * Wait for profile content to load
 */
export async function waitForProfileLoad(timeout = 10000): Promise<boolean> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // Check if key profile elements are loaded
      const hasName = extractName() !== null;

      if (hasName || Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(hasName);
      }
    }, 500);
  });
}

/**
 * Format profile data for AI prompt
 */
export function formatProfileForPrompt(): string {
  const profile = extractProfileForAI();

  const sections: string[] = [];

  // Add header
  sections.push('=== LINKEDIN PROFILE DATA ===\n');

  // Basic information
  if (profile.name) {
    sections.push(`Name: ${profile.name}`);
  }

  if (profile.headline) {
    sections.push(`Current Role/Headline: ${profile.headline}`);
  }

  if (profile.company) {
    sections.push(`Current Company: ${profile.company}`);
  }

  sections.push(`LinkedIn URL: ${profile.profileUrl}`);

  // About section
  if (profile.about && profile.about !== 'No about section available.') {
    sections.push('\n--- ABOUT ---');
    sections.push(profile.about);
  }

  // Work experience
  if (profile.experience && profile.experience !== 'No work experience information available.') {
    sections.push('\n--- WORK EXPERIENCE ---');
    sections.push(profile.experience);
  }

  // Education
  if (profile.education && profile.education !== 'No education information available.') {
    sections.push('\n--- EDUCATION ---');
    sections.push(profile.education);
  }

  // Skills
  if (profile.skills.length > 0) {
    sections.push('\n--- SKILLS ---');
    sections.push(profile.skills.join(', '));
  }

  // Recent activity/posts
  if (profile.activity && profile.activity !== 'No recent activity found.') {
    sections.push('\n--- RECENT ACTIVITY & POSTS ---');
    sections.push(profile.activity);
  }

  sections.push('\n=== END OF PROFILE ===');

  return sections.join('\n');
}