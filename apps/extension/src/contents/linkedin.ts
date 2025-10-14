import type { PlasmoCSConfig } from "plasmo";
import { formatProfileForPrompt, extractName, extractJobTitle, extractCompany, getProfileUrl } from "../utils/linkedin-selectors";
import type { TargetProfile } from "../models/target-profile";

export const config: PlasmoCSConfig = {
  matches: ["https://*.linkedin.com/*"],
};

console.log("Colder content script loaded.");

/**
 * Listen for messages from the popup.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ success: true, status: "ready" });
    return true;
  }

  if (request.type === "EXTRACT_PROFILE") {
    console.log("EXTRACT_PROFILE message received");
    try {
      const rawProfileText = formatProfileForPrompt();
      const name = extractName();

      if (!name) {
        throw new Error("Could not extract profile name. Please make sure you are on a valid LinkedIn profile page.");
      }

      const targetProfile: Partial<TargetProfile> = {
        id: btoa(getProfileUrl()), // Simple ID generation
        linkedinUrl: getProfileUrl(),
        name: name,
        currentJobTitle: extractJobTitle(),
        currentCompany: extractCompany(),
        rawProfileText: rawProfileText,
        extractedAt: new Date(),
      };

      sendResponse({ success: true, data: targetProfile });

    } catch (e: any) {
      console.error("Extraction failed:", e);
      sendResponse({ success: false, error: e.message });
    }

    return true; // Keep the message channel open for async response
  }
});
