# LinkedIn Profile Experience Extractor Debug Tool

## Usage
1. Open a LinkedIn profile page in Chrome
2. Open Developer Console (F12 or right-click → Inspect → Console)
3. Copy and paste the entire code below into the console
4. Press Enter to run
5. Check the output and share the results

## Console Command

```javascript
// LinkedIn Profile Experience Extractor - Debug Version
(() => {
  console.clear();
  console.log("%c=== LinkedIn Experience Extractor ===", "color: blue; font-size: 16px; font-weight: bold");

  // Get the experience section
  const expSection = document.querySelector('section:has(#experience)');
  if (!expSection) {
    console.error("No experience section found!");
    return;
  }

  console.log("Found experience section");

  // Try multiple selectors to find parent LI elements
  let parentLIs = expSection.querySelectorAll(':scope > div > div > div > ul > li');
  if (parentLIs.length === 0) {
    parentLIs = expSection.querySelectorAll('ul.pvs-list > li');
  }
  if (parentLIs.length === 0) {
    parentLIs = expSection.querySelectorAll('ul > li.pvs-list__paged-list-item');
  }

  console.log(`Found ${parentLIs.length} parent-level experience items\n`);

  const allExperiences = [];

  parentLIs.forEach((li, index) => {
    console.log(`%c--- Processing Item ${index + 1} ---`, "color: green; font-weight: bold");

    // Check if this has nested roles
    const nestedLIs = li.querySelectorAll(':scope > div > div > ul > li');
    const hasNested = nestedLIs.length > 0;

    if (hasNested) {
      // Company with multiple roles
      console.log("Type: Company with multiple roles");

      // Get company name (first bold text in parent)
      const companyName = li.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim() ||
                         li.textContent.split('\n')[0].trim();
      console.log(`Company: ${companyName}`);
      console.log(`Number of roles: ${nestedLIs.length}`);

      // Extract each role
      nestedLIs.forEach((roleLi, roleIndex) => {
        const roleTitle = roleLi.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
        const roleDuration = roleLi.querySelector('.t-normal.t-black--light span[aria-hidden="true"]')?.textContent?.trim();
        const roleDescription = roleLi.querySelector('.pvs-list__outer-container .t-normal')?.textContent?.trim();

        const experience = {
          title: roleTitle,
          company: companyName,
          duration: roleDuration,
          description: roleDescription ? roleDescription.substring(0, 100) : '',
          type: 'nested_role'
        };

        console.log(`  Role ${roleIndex + 1}: ${roleTitle}`);
        console.log(`     Duration: ${roleDuration}`);
        allExperiences.push(experience);
      });

    } else {
      // Single role at a company
      console.log("Type: Single role");

      const title = li.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
      const duration = li.querySelector('.t-normal.t-black--light span[aria-hidden="true"]')?.textContent?.trim();

      // Find company (look for pattern "Company · Employment Type")
      let company = null;
      const spans = Array.from(li.querySelectorAll('span[aria-hidden="true"]')).map(s => s.textContent.trim());

      for (const span of spans) {
        if (span.includes('·')) {
          const parts = span.split('·').map(p => p.trim());
          const employmentTypes = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Self-employed'];

          // Check if first part is company (not employment type)
          if (!employmentTypes.includes(parts[0])) {
            company = parts[0];
            break;
          }
        }
      }

      const experience = {
        title: title,
        company: company,
        duration: duration,
        type: 'single_role'
      };

      console.log(`  Title: ${title}`);
      console.log(`  Company: ${company}`);
      console.log(`  Duration: ${duration}`);
      allExperiences.push(experience);
    }

    console.log("");
  });

  // Summary
  console.log("%c=== EXTRACTION SUMMARY ===", "color: purple; font-size: 14px; font-weight: bold");
  console.log(`Total experiences extracted: ${allExperiences.length}`);
  console.log("\nComplete list:");
  allExperiences.forEach((exp, i) => {
    console.log(`${i + 1}. ${exp.title} at ${exp.company} (${exp.duration || 'current'})`);
  });

  console.log("\n%c=== JSON OUTPUT ===", "color: orange; font-size: 14px; font-weight: bold");
  console.log(JSON.stringify(allExperiences, null, 2));

  // Create final output
  const output = {
    profile_name: document.querySelector('h1')?.textContent?.trim(),
    headline: document.querySelector('.text-body-medium.break-words')?.textContent?.trim(),
    total_experiences: allExperiences.length,
    experiences: allExperiences,
    debug_info: {
      parent_elements_found: parentLIs.length,
      experience_section_exists: !!expSection,
      extraction_timestamp: new Date().toISOString()
    }
  };

  // Try to copy to clipboard (may fail if console is focused)
  navigator.clipboard.writeText(JSON.stringify(output, null, 2))
    .then(() => {
      console.log("\n=== Data copied to clipboard! ===");
    })
    .catch(() => {
      console.log("\n=== Clipboard copy failed (console is focused) - Copy manually below ===");
    });

  // Also show raw text of first 2 parent elements for debugging
  console.log("\n%c=== RAW TEXT (First 2 Elements) ===", "color: red; font-size: 14px; font-weight: bold");
  Array.from(parentLIs).slice(0, 2).forEach((li, i) => {
    console.log(`\nElement ${i + 1} raw text:`);
    console.log(li.innerText.substring(0, 300) + "...");
  });

  return output;
})();
```

## What This Script Does

1. **Finds the Experience Section**: Locates the section containing work experience
2. **Identifies Parent Elements**: Finds top-level list items (companies/roles)
3. **Detects Structure**: Determines if it's a company with multiple roles or a single role
4. **Extracts Data**: Gets title, company, duration for each experience
5. **Outputs Results**: Shows color-coded console output and JSON data
6. **Copies to Clipboard**: Attempts to copy the JSON data for easy sharing

## Expected Output

The script will show:
- Number of parent elements found
- Details of each experience (title, company, duration)
- Total count of experiences extracted
- Complete JSON output
- Raw text samples for debugging

## Troubleshooting

If you get 0 experiences:
1. Make sure you're on a LinkedIn profile page (not feed or search)
2. Check that the experience section is visible on the page
3. Try scrolling to the experience section first
4. Share the console output for debugging