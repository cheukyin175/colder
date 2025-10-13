# Testing the LinkedIn Profile Extractor

## 🚀 Quick Start

The extension is now ready for testing! Follow these steps to test the LinkedIn profile extraction functionality.

## Installation Steps

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the puzzle icon in Chrome toolbar → "Manage Extensions"

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder from this project
   - The extension should appear in your extensions list as "DEV | Colder"

4. **Pin the Extension**
   - Click the puzzle icon in Chrome toolbar
   - Find "DEV | Colder - LinkedIn Cold Outreach AI Assistant"
   - Click the pin icon to keep it visible

5. **IMPORTANT: Reload LinkedIn Pages**
   - After installing/updating the extension, refresh any open LinkedIn tabs
   - This ensures the content script is properly injected

## Testing the Profile Extractor

### Test Scenario 1: Basic Profile Extraction

1. **Navigate to a LinkedIn Profile**
   - Go to any LinkedIn profile page (must be logged in to LinkedIn)
   - Example: `https://www.linkedin.com/in/[username]/`

2. **Open the Extension Popup**
   - Click the Colder extension icon in your toolbar
   - You should see:
     - Current tab URL
     - "LinkedIn Profile Detected" indicator (green)
     - "Extract LinkedIn Profile" button enabled

3. **Extract Profile Data**
   - Click the "🔍 Extract LinkedIn Profile" button
   - Watch for the loading spinner
   - Results should appear showing:
     - Name
     - Job Title
     - Company
     - Extraction Quality (COMPLETE/PARTIAL/MINIMAL)
     - Statistics (work experience, education, skills, posts counts)
     - Any missing fields

### Test Scenario 2: Visual Indicators

1. **Check Content Script Injection**
   - On a LinkedIn profile page, look for:
     - Small green dot in bottom-right corner (pulsing)
     - Click the dot to trigger extraction
     - Dot turns blue while extracting
     - Green on success, red on error

### Test Scenario 3: Storage Testing

1. **Test Storage Service**
   - Click "📊 Test Storage" button in the popup
   - Should show storage usage percentages

### Test Scenario 4: Non-Profile Pages

1. **Navigate to Non-Profile LinkedIn Pages**
   - Go to LinkedIn homepage, feed, or company pages
   - Extension should show "Not a LinkedIn Profile" indicator
   - Extract button should be disabled

## What to Check

### ✅ Successful Extraction Should Show:
- Profile name
- Current job title and company (if available)
- Extraction quality indicator
- Count of extracted data points
- Missing fields (if any)

### 🔍 Console Logs
Open Chrome DevTools (F12) and check:
- **Extension Popup Console**: Right-click popup → Inspect
- **Background Console**: chrome://extensions/ → Click "service worker"
- **Content Script Console**: On LinkedIn page, check main console

Look for:
- `[Colder Content] Content script loaded`
- `[LinkedIn Extractor] Starting profile extraction...`
- `[Colder] Background worker ready`

### ⚠️ Common Issues & Solutions

1. **"Could not establish connection. Receiving end does not exist"**
   - **Solution**: Refresh the LinkedIn page (F5 or Cmd+R)
   - This error occurs when the content script isn't loaded yet
   - After installing/updating the extension, always refresh LinkedIn tabs
   - If error persists, reload the extension in chrome://extensions/

2. **"Please navigate to a LinkedIn profile page first"**
   - Make sure you're on a profile URL: `linkedin.com/in/...`
   - Not on feed, company page, or search results

3. **Content Script Not Loading**
   - Refresh the LinkedIn page after installing extension
   - Check permissions in chrome://extensions/
   - Look for the green indicator dot in bottom-right corner of LinkedIn profile pages

4. **Extraction Returns Minimal Quality**
   - LinkedIn page might not be fully loaded
   - Try refreshing the page
   - Make sure you're logged into LinkedIn

5. **No Data Extracted**
   - Check if LinkedIn has changed their DOM structure
   - Look for errors in console
   - Try different profiles

## Development Mode Features

The popup shows additional debug information in DEV MODE:
- Current tab URL
- Profile detection status
- Extraction quality metrics
- Field-by-field extraction counts
- Missing fields list

## Live Reload

With `pnpm dev` running:
- Changes to code auto-reload the extension
- You may need to refresh the LinkedIn page after code changes
- Popup will auto-update when reopened

## Testing Different Profiles

Try extracting from various profile types:
- Complete profiles with all sections
- Minimal profiles with just basic info
- Profiles with/without posts
- Profiles with multiple work experiences
- Your own profile vs. others

## Reporting Issues

If extraction fails:
1. Note the profile URL
2. Check console for errors
3. Note which fields were missing
4. Check extraction quality reported

## Next Steps

Once profile extraction is working:
- User profile setup will be added (T020)
- AI analysis will be integrated (T021-T022)
- Message generation will follow (T023-T024)
- Full UI will be implemented (T026-T029)

Happy Testing! 🎉