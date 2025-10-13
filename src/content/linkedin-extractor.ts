/**
 * LinkedIn Profile Extractor
 * Extracts profile data from LinkedIn DOM using multi-fallback selectors
 */

import {
  extractName,
  extractJobTitle,
  extractCompany,
  extractWorkExperience,
  extractRecentPosts,
  extractEducation,
  extractSkills,
  isLinkedInProfilePage,
  getProfileUrl,
  waitForProfileLoad
} from '../utils/linkedin-selectors';

import { TargetProfile, createTargetProfile, calculateExtractionQuality } from '../models/target-profile';
import { ExtractionError } from '../utils/error-handlers';

/**
 * Extract complete profile from current LinkedIn page
 */
export async function extractLinkedInProfile(): Promise<TargetProfile> {
  console.log('[LinkedIn Extractor] Starting profile extraction...');

  // Verify we're on a LinkedIn profile page
  if (!isLinkedInProfilePage()) {
    throw new ExtractionError(
      'Not a LinkedIn profile page',
      [],
      'minimal'
    );
  }

  // Wait for profile to load (up to 10 seconds)
  const profileLoaded = await waitForProfileLoad(10000);
  if (!profileLoaded) {
    console.warn('[LinkedIn Extractor] Profile may not be fully loaded');
  }

  // Extract profile URL
  const linkedinUrl = getProfileUrl();
  console.log('[LinkedIn Extractor] Extracting profile from:', linkedinUrl);

  // Extract basic information
  const name = extractName();
  const currentJobTitle = extractJobTitle();
  const currentCompany = extractCompany();

  // Validate minimum required data
  if (!name) {
    throw new ExtractionError(
      'Unable to extract profile name',
      ['name'],
      'minimal'
    );
  }

  // Extract detailed information
  const workExperience = extractWorkExperience();
  const recentPosts = extractRecentPosts();
  const education = extractEducation();
  const skills = extractSkills();

  console.log('[LinkedIn Extractor] Extracted data:', {
    name,
    currentJobTitle: currentJobTitle || 'Not found',
    currentCompany: currentCompany || 'Not found',
    workExperienceCount: workExperience.length,
    recentPostsCount: recentPosts.length,
    educationCount: education.length,
    skillsCount: skills.length
  });

  // Create target profile
  const profile = createTargetProfile({
    linkedinUrl,
    name,
    currentJobTitle,
    currentCompany,
    workExperience: workExperience.map(exp => ({
      title: exp.title,
      company: exp.company,
      startDate: '', // LinkedIn doesn't always show dates in accessible format
      endDate: null,
      duration: exp.duration,
      description: exp.description
    })),
    education: education.map(edu => ({
      institution: edu.school,
      degree: edu.degree || '',
      field: edu.field,
      graduationYear: edu.years ? parseInt(edu.years.match(/\d{4}/)?.[0] || '0') || null : null
    })),
    recentPosts: recentPosts.map(post => ({
      content: post.content,
      postedAt: new Date(), // We'd need to parse the timestamp
      engagement: post.engagement
    })),
    skills,
    mutualConnections: extractMutualConnections()
  });

  // Log extraction quality
  const { quality, missingFields } = calculateExtractionQuality(profile);
  console.log('[LinkedIn Extractor] Extraction quality:', quality);
  if (missingFields.length > 0) {
    console.log('[LinkedIn Extractor] Missing fields:', missingFields);
  }

  // Throw warning if extraction quality is poor
  if (quality === 'minimal') {
    throw new ExtractionError(
      'Limited profile information extracted',
      missingFields,
      quality
    );
  }

  if (quality === 'partial' && missingFields.length > 0) {
    console.warn('[LinkedIn Extractor] Some fields could not be extracted:', missingFields);
  }

  return profile;
}

/**
 * Extract mutual connections count
 */
function extractMutualConnections(): number {
  const selectors = [
    '.dist-value', // Old layout
    '.member-insights__mutual-connections-count',
    'span:contains("mutual connection")',
    '[data-test-mutual-connections-count]'
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim() || '';
        const match = text.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
    } catch {
      continue;
    }
  }

  return 0;
}

/**
 * Extract profile section by section for debugging
 */
export async function extractProfileSections(): Promise<{
  basic: {
    name: string | null;
    title: string | null;
    company: string | null;
    url: string;
  };
  experience: ReturnType<typeof extractWorkExperience>;
  education: ReturnType<typeof extractEducation>;
  skills: ReturnType<typeof extractSkills>;
  posts: ReturnType<typeof extractRecentPosts>;
}> {
  await waitForProfileLoad(5000);

  return {
    basic: {
      name: extractName(),
      title: extractJobTitle(),
      company: extractCompany(),
      url: getProfileUrl()
    },
    experience: extractWorkExperience(),
    education: extractEducation(),
    skills: extractSkills(),
    posts: extractRecentPosts()
  };
}

/**
 * Check profile extraction capability
 */
export function checkExtractionCapability(): {
  isProfilePage: boolean;
  hasName: boolean;
  hasJobInfo: boolean;
  hasExperience: boolean;
  overallScore: number;
} {
  const isProfilePage = isLinkedInProfilePage();
  const hasName = !!extractName();
  const hasJobInfo = !!(extractJobTitle() || extractCompany());
  const hasExperience = extractWorkExperience().length > 0;

  let score = 0;
  if (isProfilePage) score += 25;
  if (hasName) score += 25;
  if (hasJobInfo) score += 25;
  if (hasExperience) score += 25;

  return {
    isProfilePage,
    hasName,
    hasJobInfo,
    hasExperience,
    overallScore: score
  };
}

/**
 * Extract profile with retry logic for dynamic content
 */
export async function extractProfileWithRetry(maxAttempts = 3): Promise<TargetProfile> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[LinkedIn Extractor] Extraction attempt ${attempt}/${maxAttempts}`);

      // Wait longer on retries for dynamic content to load
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }

      const profile = await extractLinkedInProfile();
      return profile;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[LinkedIn Extractor] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        // Scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight / 2);
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.scrollTo(0, 0);
      }
    }
  }

  throw lastError || new ExtractionError('Failed to extract profile after retries');
}