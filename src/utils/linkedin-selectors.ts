/**
 * LinkedIn Selectors Utility
 * Multi-fallback selector patterns for LinkedIn DOM elements.
 * LinkedIn's DOM structure changes frequently, so we use multiple fallback selectors.
 */

/**
 * Selector configuration with multiple fallbacks
 */
interface SelectorConfig {
  name: string;
  selectors: string[];
}

/**
 * Try multiple selectors and return the first match
 */
function trySelectors(selectors: string[], context: Document | Element = document): Element | null {
  for (const selector of selectors) {
    try {
      const element = context.querySelector(selector);
      if (element) return element;
    } catch (e) {
      // Invalid selector, continue to next
      console.debug(`Invalid selector: ${selector}`, e);
    }
  }
  return null;
}

/**
 * Try multiple selectors and return all matches
 */
function trySelectorAll(selectors: string[], context: Document | Element = document): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();

  for (const selector of selectors) {
    try {
      const elements = context.querySelectorAll(selector);
      elements.forEach(el => {
        if (!seen.has(el)) {
          seen.add(el);
          results.push(el);
        }
      });
    } catch (e) {
      console.debug(`Invalid selector: ${selector}`, e);
    }
  }

  return results;
}

/**
 * Extract text content safely
 */
function extractText(element: Element | null): string | null {
  if (!element) return null;
  const text = element.textContent?.trim();
  return text && text.length > 0 ? text : null;
}

/**
 * Extract name from LinkedIn profile
 */
export function extractName(): string | null {
  const selectors = [
    // V1: Main profile header
    'h1.text-heading-xlarge',
    // V2: Profile intro card
    '.pv-text-details__left-panel h1',
    // V3: Legacy profile
    'h1[data-control-name="identity_profile_headline"]',
    // V4: Mobile view
    '.profile-topcard-person-entity__name',
    // V5: New profile layout (2024)
    '[data-generated-suggestion-target] h1',
    // V6: Generic h1 in profile section
    'main section:first-of-type h1',
    // V7: Aria label fallback
    'h1[aria-label*="name"]'
  ];

  const element = trySelectors(selectors);
  return extractText(element);
}

/**
 * Extract job title from LinkedIn profile
 */
export function extractJobTitle(): string | null {
  const selectors = [
    // V1: Main profile headline
    '.text-body-medium.break-words',
    // V2: Profile intro card
    '.pv-text-details__left-panel .text-body-medium',
    // V3: Legacy profile
    'h2.mt1.t-18',
    // V4: Mobile view
    '.profile-topcard-person-entity__summary',
    // V5: New profile layout (2024)
    '[data-generated-suggestion-target] .text-body-medium',
    // V6: Headline in first section
    'main section:first-of-type .text-body-medium',
    // V7: Data attribute fallback
    '[data-field="headline"]'
  ];

  const element = trySelectors(selectors);
  return extractText(element);
}

/**
 * Extract company from LinkedIn profile
 */
export function extractCompany(): string | null {
  const selectors = [
    // V1: First experience item company
    '.experience-item:first-child .t-14.t-normal',
    // V2: Experience section first company
    '#experience-section .pv-entity__secondary-title',
    // V3: Current position company
    'section[data-section="experience"] li:first-child span.t-14',
    // V4: Work experience list
    '.pvs-list__outer-container .t-normal.t-black--light',
    // V5: New experience layout (2024)
    '[data-view-name="profile-card"] .t-normal',
    // V6: Experience card company name
    '.experience-group-position__company',
    // V7: Generic experience section
    'section:has(#experience) li:first-child .t-normal'
  ];

  const element = trySelectors(selectors);
  let company = extractText(element);

  // Clean up company name (remove "· Full-time" type suffixes)
  if (company) {
    company = company.split('·')[0].trim();
  }

  return company;
}

/**
 * Extract work experience from LinkedIn profile
 */
export function extractWorkExperience(): Array<{
  title: string;
  company: string;
  duration: string;
  description: string | null;
}> {
  const experiences: Array<{
    title: string;
    company: string;
    duration: string;
    description: string | null;
  }> = [];

  // Multiple selector strategies for experience sections
  const sectionSelectors = [
    // V1: New profile experience section
    'section:has(#experience) ul > li',
    // V2: Experience section items
    '#experience-section .pv-profile-section__list-item',
    // V3: PVS list items in experience
    '.pvs-list__container .pvs-list__item--line-separated',
    // V4: Experience group positions
    '.experience-group-position',
    // V5: Data section experience
    '[data-section="experience"] li'
  ];

  const experienceElements = trySelectorAll(sectionSelectors);

  // Process up to 2 most recent experiences
  experienceElements.slice(0, 2).forEach(element => {
    const titleSelectors = [
      '.t-bold span[aria-hidden="true"]',
      '.pv-entity__summary-title-text',
      '.t-14.t-bold',
      '[data-field="position_title"]'
    ];

    const companySelectors = [
      '.t-normal:not(.t-black--light) span[aria-hidden="true"]',
      '.pv-entity__secondary-title',
      '.t-14.t-normal'
    ];

    const durationSelectors = [
      '.t-normal.t-black--light span[aria-hidden="true"]',
      '.pv-entity__date-range span:nth-child(2)',
      '.pvs-entity__caption-wrapper'
    ];

    const descriptionSelectors = [
      '.pvs-list__outer-container .t-normal:not(.t-black--light)',
      '.pv-entity__description',
      '.experience-item__description'
    ];

    const title = extractText(trySelectors(titleSelectors, element));
    const company = extractText(trySelectors(companySelectors, element));
    const duration = extractText(trySelectors(durationSelectors, element));
    const description = extractText(trySelectors(descriptionSelectors, element));

    if (title && company) {
      experiences.push({
        title,
        company: company.split('·')[0].trim(), // Remove employment type
        duration: duration || '',
        description
      });
    }
  });

  return experiences;
}

/**
 * Extract recent posts from LinkedIn profile
 */
export function extractRecentPosts(): Array<{
  content: string;
  timestamp: string | null;
  engagement: {
    likes: number;
    comments: number;
  };
}> {
  const posts: Array<{
    content: string;
    timestamp: string | null;
    engagement: {
      likes: number;
      comments: number;
    };
  }> = [];

  // Selectors for activity/posts section
  const sectionSelectors = [
    // V1: Activity section posts
    'section:has(#activity) .feed-shared-update-v2',
    // V2: Recent activity items
    '.pv-recent-activity-section .occludable-update',
    // V3: Profile activity posts
    '[data-view-name="profile-activity"] article',
    // V4: Feed posts in profile
    '.profile-creator-shared-feed-update',
    // V5: Generic activity items
    'section[aria-label*="Activity"] article'
  ];

  const postElements = trySelectorAll(sectionSelectors);

  // Process up to 5 most recent posts
  postElements.slice(0, 5).forEach(element => {
    const contentSelectors = [
      '.feed-shared-text span[aria-hidden="true"]',
      '.feed-shared-text-view span',
      '.update-components-text',
      'div[data-test-app-aware-link]'
    ];

    const timestampSelectors = [
      '.feed-shared-actor__sub-description',
      'time',
      '.actor__sub-description'
    ];

    const likesSelectors = [
      '.social-counts-reactions__count',
      '[aria-label*="reactions"] .v-align-middle',
      '.social-details-social-counts__reactions-count'
    ];

    const commentsSelectors = [
      '.social-counts-comments',
      '[aria-label*="comments"]',
      '.social-details-social-counts__comments'
    ];

    const content = extractText(trySelectors(contentSelectors, element));
    if (content) {
      const timestamp = extractText(trySelectors(timestampSelectors, element));
      const likesText = extractText(trySelectors(likesSelectors, element));
      const commentsText = extractText(trySelectors(commentsSelectors, element));

      posts.push({
        content: content.substring(0, 500), // Limit to 500 chars
        timestamp,
        engagement: {
          likes: parseEngagementCount(likesText),
          comments: parseEngagementCount(commentsText)
        }
      });
    }
  });

  return posts;
}

/**
 * Extract education from LinkedIn profile
 */
export function extractEducation(): Array<{
  school: string;
  degree: string | null;
  field: string | null;
  years: string | null;
}> {
  const education: Array<{
    school: string;
    degree: string | null;
    field: string | null;
    years: string | null;
  }> = [];

  const sectionSelectors = [
    // V1: Education section items
    'section:has(#education) ul > li',
    // V2: Legacy education section
    '#education-section .pv-profile-section__list-item',
    // V3: PVS list education items
    '[data-view-name="profile-education"] li',
    // V4: Education list items
    '.education__list-item'
  ];

  const educationElements = trySelectorAll(sectionSelectors);

  educationElements.forEach(element => {
    const schoolSelectors = [
      '.t-bold span[aria-hidden="true"]',
      '.pv-entity__school-name',
      '[data-field="school_name"]'
    ];

    const degreeSelectors = [
      '.t-normal span[aria-hidden="true"]',
      '.pv-entity__degree-name',
      '.education__degree'
    ];

    const yearsSelectors = [
      '.t-normal.t-black--light span[aria-hidden="true"]',
      '.pv-entity__dates span:nth-child(2)',
      '.education__date'
    ];

    const school = extractText(trySelectors(schoolSelectors, element));
    if (school) {
      const degreeField = extractText(trySelectors(degreeSelectors, element));
      const years = extractText(trySelectors(yearsSelectors, element));

      // Parse degree and field (often combined)
      let degree = null;
      let field = null;
      if (degreeField) {
        const parts = degreeField.split(',');
        degree = parts[0]?.trim() || null;
        field = parts[1]?.trim() || null;
      }

      education.push({ school, degree, field, years });
    }
  });

  return education;
}

/**
 * Extract skills from LinkedIn profile
 */
export function extractSkills(): string[] {
  const skills: string[] = [];

  const sectionSelectors = [
    // V1: Skills section items
    'section:has(.skills-section) .skill-categories-expanded li',
    // V2: Legacy skills
    '.pv-skill-category-entity__name',
    // V3: Skills endorsements
    '[data-view-name="profile-skills"] span[aria-hidden="true"]',
    // V4: Skill pills
    '.pvs-list__item--one-column span[aria-hidden="true"]'
  ];

  const skillElements = trySelectorAll(sectionSelectors);

  skillElements.forEach(element => {
    const skill = extractText(element);
    if (skill && !skills.includes(skill)) {
      skills.push(skill);
    }
  });

  return skills;
}

/**
 * Parse engagement count from text (e.g., "1.2K" -> 1200)
 */
function parseEngagementCount(text: string | null): number {
  if (!text) return 0;

  // Remove non-numeric characters except K, M, and .
  const cleaned = text.replace(/[^\d.KM]/gi, '');

  if (cleaned.includes('K')) {
    return Math.round(parseFloat(cleaned.replace('K', '')) * 1000);
  }
  if (cleaned.includes('M')) {
    return Math.round(parseFloat(cleaned.replace('M', '')) * 1000000);
  }

  return parseInt(cleaned) || 0;
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
      const hasTitle = extractJobTitle() !== null;

      if (hasName || Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(hasName);
      }
    }, 500);
  });
}