# LinkedIn Experience Debug - Comprehensive Version

## Copy and run this in the console:

```javascript
// LinkedIn Experience Debug - Find the correct selector
(() => {
  console.clear();
  console.log("%c=== LinkedIn Selector Debugger ===", "color: blue; font-size: 16px; font-weight: bold");

  // Get the experience section
  const expSection = document.querySelector('section:has(#experience)');
  if (!expSection) {
    console.error("No experience section found!");
    return;
  }

  console.log("✓ Found experience section");

  // Try ALL possible selectors
  const selectors = [
    ':scope > div > div > div > ul > li',
    ':scope > div > div > ul > li',
    ':scope > div > ul > li',
    ':scope ul > li',
    ':scope li.pvs-list__paged-list-item',
    ':scope .pvs-list > li',
    'ul.pvs-list > li',
    '.pvs-list__paged-list-item',
    'ul > li:not(li li)',  // Top level LI only
    'div.pvs-list__container > ul > li',
    '.pvs-list__outer-container li.artdeco-list__item'
  ];

  console.log("\nTrying different selectors:");
  let parentLIs = null;
  let workingSelector = null;

  for (const selector of selectors) {
    try {
      const elements = expSection.querySelectorAll(selector);
      console.log(`  ${selector}: ${elements.length} elements`);
      if (elements.length > 0 && !parentLIs) {
        parentLIs = elements;
        workingSelector = selector;
      }
    } catch (e) {
      console.log(`  ${selector}: ERROR - ${e.message}`);
    }
  }

  // If still nothing, get ALL li elements and filter
  if (!parentLIs || parentLIs.length === 0) {
    console.log("\nFallback: Getting ALL li elements and filtering...");
    const allLIs = expSection.querySelectorAll('li');
    console.log(`Total LI elements in experience section: ${allLIs.length}`);

    // Filter to get only parent-level items (not nested in another LI)
    const topLevelLIs = Array.from(allLIs).filter(li => {
      const parentLI = li.parentElement?.closest('li');
      return !parentLI || !expSection.contains(parentLI);
    });

    console.log(`Top-level LI elements: ${topLevelLIs.length}`);
    parentLIs = topLevelLIs;
  }

  console.log(`\n%cUsing selector: ${workingSelector || 'fallback filter'}`, "color: orange; font-weight: bold");
  console.log(`Found ${parentLIs.length} parent elements`);

  // Show structure of first element
  if (parentLIs.length > 0) {
    console.log("\n%c=== First Element Structure ===", "color: purple; font-weight: bold");
    const firstLI = parentLIs[0];
    console.log("Tag:", firstLI.tagName);
    console.log("Classes:", firstLI.className);
    console.log("Parent tag:", firstLI.parentElement?.tagName);
    console.log("Parent classes:", firstLI.parentElement?.className);
    console.log("Has nested UL?", !!firstLI.querySelector('ul'));
    console.log("Text preview:", firstLI.innerText.substring(0, 200));
  }

  // Extract experiences
  const allExperiences = [];

  Array.from(parentLIs).forEach((li, index) => {
    // Only process first 5 for debugging
    if (index >= 5) return;

    console.log(`\n%c--- Item ${index + 1} ---`, "color: green; font-weight: bold");

    // Show structure
    const hasNestedUL = !!li.querySelector('ul > li');
    console.log(`Has nested roles: ${hasNestedUL}`);

    // Get all text content
    const allText = li.innerText;
    const lines = allText.split('\n').filter(l => l.trim());
    console.log(`Number of text lines: ${lines.length}`);
    console.log(`First 3 lines:`, lines.slice(0, 3));

    // Try to extract company and role
    const boldTexts = Array.from(li.querySelectorAll('.t-bold span[aria-hidden="true"]')).map(el => el.textContent.trim());
    const normalTexts = Array.from(li.querySelectorAll('.t-normal span[aria-hidden="true"]')).map(el => el.textContent.trim());

    console.log("Bold texts:", boldTexts);
    console.log("Normal texts:", normalTexts);

    if (hasNestedUL) {
      // Company with multiple roles
      const companyName = boldTexts[0] || lines[0];
      const nestedLIs = li.querySelectorAll('ul > li');

      console.log(`Company: ${companyName}`);
      console.log(`Nested roles: ${nestedLIs.length}`);

      nestedLIs.forEach((roleLi, roleIdx) => {
        const roleTitle = roleLi.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
        console.log(`  Role ${roleIdx + 1}: ${roleTitle}`);

        allExperiences.push({
          company: companyName,
          title: roleTitle,
          type: 'nested'
        });
      });
    } else {
      // Single role
      const title = boldTexts[0];
      let company = null;

      // Find company in normal texts with · separator
      for (const text of normalTexts) {
        if (text.includes('·')) {
          company = text.split('·')[0].trim();
          break;
        }
      }

      console.log(`Title: ${title}`);
      console.log(`Company: ${company}`);

      allExperiences.push({
        company: company,
        title: title,
        type: 'single'
      });
    }
  });

  // Final summary
  console.log("\n%c=== FINAL SUMMARY ===", "color: red; font-size: 14px; font-weight: bold");
  console.log(`Total experiences extracted: ${allExperiences.length}`);
  console.table(allExperiences);

  // Show the actual DOM path
  console.log("\n%c=== DOM PATH TO EXPERIENCES ===", "color: teal; font-weight: bold");
  if (parentLIs.length > 0) {
    const firstLI = parentLIs[0];
    let path = [];
    let current = firstLI;

    while (current && current !== document.body) {
      const tag = current.tagName.toLowerCase();
      const classes = current.className ? `.${current.className.split(' ')[0]}` : '';
      const id = current.id ? `#${current.id}` : '';
      path.unshift(tag + id + classes);
      current = current.parentElement;
    }

    console.log("Path to first experience element:");
    console.log(path.join(' > '));
  }

  return {
    selectorUsed: workingSelector || 'fallback',
    parentElementsFound: parentLIs.length,
    experiences: allExperiences
  };
})();
```

## This will show you:

1. **All possible selectors** and how many elements each finds
2. **The structure** of the first experience element
3. **Exact DOM path** to the experience items
4. **All text content** extracted from each item
5. **A table summary** of all experiences found

Run this and share the complete output!