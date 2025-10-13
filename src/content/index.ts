/**
 * Simplified LinkedIn Content Script
 * Extracts everything from the profile page (except ads)
 */

// Export empty to satisfy TypeScript
export {};

import {
  extractProfileForAI,
  formatProfileForPrompt,
  extractName,
  extractJobTitle,
  extractCompany,
  extractAbout,
  extractWorkExperience,
  extractEducation,
  extractSkills,
  extractRecentPosts,
  isLinkedInProfilePage,
  getProfileUrl
} from '../utils/linkedin-selectors';

console.log('[Colder] Content script loaded on:', window.location.href);

/**
 * Extract EVERYTHING from the page
 */
function extractEverything() {
  console.log('[Colder] Starting comprehensive extraction...');

  try {
    // Get all sections individually for detailed logging
    const name = extractName();
    const headline = extractJobTitle();
    const company = extractCompany();
    const about = extractAbout();
    const experience = extractWorkExperience();
    const education = extractEducation();
    const skills = extractSkills();
    const recentActivity = extractRecentPosts();
    const profileUrl = getProfileUrl();

    // Get the complete formatted profile
    const fullProfile = extractProfileForAI();
    const formattedText = formatProfileForPrompt();

    // Get all text from main profile sections (excluding ads)
    const allSections: Record<string, string> = {};

    // Extract text from ALL sections we can find
    const sectionIds = [
      'about', 'experience', 'education', 'skills', 'languages',
      'certifications', 'projects', 'honors', 'publications',
      'courses', 'organizations', 'volunteering', 'recommendations',
      'interests', 'causes', 'activity', 'content_main'
    ];

    sectionIds.forEach(sectionId => {
      const section = document.querySelector(`section:has(#${sectionId})`);
      if (section) {
        // Get ALL text content from the section
        const allText = section.textContent?.replace(/\s+/g, ' ').trim() || '';
        allSections[sectionId] = allText;
        console.log(`[Colder] Section "${sectionId}": ${allText.length} characters`);
      }
    });

    // Get profile header info (the card at top)
    const headerSection = document.querySelector('section.artdeco-card, .pv-top-card');
    let headerText = '';
    if (headerSection) {
      headerText = headerSection.textContent?.replace(/\s+/g, ' ').trim() || '';
      console.log('[Colder] Header text:', headerText.substring(0, 200) + '...');
    }

    // Get profile image URL if available
    const profileImages = document.querySelectorAll('img');
    let profileImageUrl = null;
    profileImages.forEach(img => {
      if (img.alt?.toLowerCase().includes(name?.toLowerCase() || '') ||
          img.classList.toString().includes('profile') ||
          img.classList.toString().includes('presence')) {
        profileImageUrl = img.src;
      }
    });

    // Get ALL links on the profile
    const allLinks: string[] = [];
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('/feed/') && !href.includes('/ads/')) {
        allLinks.push(href);
      }
    });
    console.log(`[Colder] Found ${allLinks.length} links on profile`);

    // Extract contact info if visible
    let contactInfo = '';
    const contactSection = document.querySelector('[aria-label*="contact"]');
    if (contactSection) {
      contactInfo = contactSection.textContent?.replace(/\s+/g, ' ').trim() || '';
      console.log('[Colder] Contact info found:', contactInfo.length > 0);
    }

    // Count various elements for statistics
    const stats = {
      totalSections: Object.keys(allSections).length,
      experienceItems: document.querySelectorAll('section:has(#experience) > div li').length,
      educationItems: document.querySelectorAll('section:has(#education) > div li').length,
      skillItems: skills.length,
      activityItems: document.querySelectorAll('section:has(#activity) article, .feed-shared-update-v2').length,
      recommendationCount: document.querySelectorAll('section:has(#recommendations) li').length,
      totalTextElements: document.querySelectorAll('span[aria-hidden="true"]').length,
      totalLinks: allLinks.length,
      totalImages: document.querySelectorAll('img').length,
      pageSize: document.documentElement.innerHTML.length
    };

    console.log('[Colder] Page statistics:', stats);

    // Get the ENTIRE main content as text (fallback)
    const mainContent = document.querySelector('main');
    const entireMainText = mainContent?.textContent?.replace(/\s+/g, ' ').trim() || '';

    // Create comprehensive result object with EVERYTHING
    const result = {
      success: true,
      url: profileUrl,
      timestamp: new Date().toISOString(),

      // Formatted data for AI
      formattedText,

      // Individual sections
      sections: {
        name,
        headline,
        company,
        about,
        experience,
        education,
        skills,
        activity: recentActivity,
        header: headerText,
        contact: contactInfo,
        ...allSections
      },

      // Full profile object
      fullProfile,

      // Additional metadata
      metadata: {
        imageUrl: profileImageUrl,
        stats,
        extractedSections: Object.keys(allSections),
        hasAbout: about !== 'No about section available.',
        hasExperience: experience !== 'No work experience information available.',
        hasEducation: education !== 'No education information available.',
        hasActivity: recentActivity !== 'No recent activity found.',
        pageTitle: document.title,
        pageDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
        pageKeywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || null,
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
        ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null,
        canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
        totalPageTextLength: entireMainText.length,
        links: allLinks.slice(0, 50) // First 50 links
      },

      // Entire main content as fallback
      entireMainText: entireMainText.substring(0, 10000) // First 10k chars
    };

    // Log EVERYTHING
    console.log('=== FULL EXTRACTION RESULT ===');
    console.log('URL:', result.url);
    console.log('Timestamp:', result.timestamp);
    console.log('\n--- FORMATTED TEXT FOR AI ---');
    console.log(result.formattedText);
    console.log('\n--- ALL SECTIONS ---');
    Object.entries(result.sections).forEach(([key, value]) => {
      if (typeof value === 'string') {
        console.log(`${key}: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
      } else {
        console.log(`${key}:`, value);
      }
    });
    console.log('\n--- STATISTICS ---');
    console.log(result.metadata.stats);
    console.log('\n--- METADATA ---');
    console.log(result.metadata);
    console.log('=== END EXTRACTION ===');

    return result;

  } catch (error) {
    console.error('[Colder] Extraction error:', error);
    return {
      success: false,
      error: error.message || 'Unknown extraction error',
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Colder] Received message:', message);

  // Handle both new and old message formats
  if (message.action === 'extract-everything' ||
      message.action === 'extract-profile' ||  // Added this for new popup
      message.type === 'PROFILE_EXTRACT' ||
      message.type === 'CHECK_CAPABILITY') {
    const result = extractEverything();
    sendResponse(result);
    return true;
  }

  sendResponse({ success: false, error: 'Unknown action', receivedMessage: message });
  return true;
});

// Log initial page state
console.log('[Colder] Initial page analysis:', {
  url: window.location.href,
  isLinkedInProfile: isLinkedInProfilePage(),
  title: document.title,
  hasSections: {
    about: !!document.querySelector('section:has(#about)'),
    experience: !!document.querySelector('section:has(#experience)'),
    education: !!document.querySelector('section:has(#education)'),
    skills: !!document.querySelector('section:has(#skills)'),
    activity: !!document.querySelector('section:has(#activity)')
  },
  domReady: document.readyState
});

// Log when DOM changes (for debugging dynamic loading)
const observer = new MutationObserver((mutations) => {
  // Check if new sections appeared
  const sections = ['about', 'experience', 'education', 'skills', 'activity'];
  sections.forEach(section => {
    const elem = document.querySelector(`section:has(#${section})`);
    if (elem && !elem.hasAttribute('data-colder-logged')) {
      console.log(`[Colder] Section appeared: ${section}`);
      elem.setAttribute('data-colder-logged', 'true');
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[Colder] Content script ready - click "Extract Everything" in extension popup');