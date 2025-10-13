/**
 * Content Script for LinkedIn
 * Plasmo will automatically inject this into LinkedIn pages
 */

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.linkedin.com/*"]
}

// Import the content script logic
import "../content/index"