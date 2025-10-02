const puppeteer = require("puppeteer");

/**
 * Debug script to help identify the correct selectors on QuillBot humanizer page
 * This script will open the page, take screenshots, and log all potential output elements
 */
async function debugHumanizerSelectors() {
  console.log("🔍 Starting humanizer selector debugging...");
  
  const browser = await puppeteer.launch({
    headless: false, // Keep browser open for visual inspection
    slowMo: 1000,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  try {
    console.log(`🌐 Navigating to QuillBot...`);
    await page.goto("https://quillbot.com/", { waitUntil: "networkidle2", timeout: 30000 });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: "debug-humanizer-initial.png", fullPage: true });
    console.log("📸 Initial screenshot saved as debug-humanizer-initial.png");
    
    // Add some sample text to input
    const sampleText = "This is a test text that will be used to see how the humanizer works and what selectors are available.";
    
    // Find and fill input
    const inputSelectors = [
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      'div#paraphraser-input-box',
      '[data-testid*="input"]',
      '.input-box',
      '[role="textbox"]'
    ];
    
    let inputFound = false;
    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000, visible: true });
        console.log(`✅ Found input with selector: ${selector}`);
        
        // Clear and type text
        await page.click(selector);
        await page.keyboard.down("Control");
        await page.keyboard.press("KeyA");
        await page.keyboard.up("Control");
        await page.keyboard.press("Delete");
        await page.type(selector, sampleText);
        
        inputFound = true;
        break;
      } catch (e) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }
    
    if (!inputFound) {
      console.log("⚠️ Could not find input field automatically. Please manually enter text.");
      await page.waitForTimeout(10000); // Wait for manual input
    }
    
    // Look for humanize button
    const buttonSelectors = [
      'button[data-testid="pphr/input_footer/paraphrase_button"]',
      'button:contains("Humanize")',
      'button:contains("Paraphrase")',
      '[data-testid*="paraphrase"]',
      '[data-testid*="humanize"]',
      'button[type="submit"]'
    ];
    
    let buttonFound = false;
    for (const selector of buttonSelectors) {
      try {
        if (selector.includes('contains')) {
          // Special handling for text-based selectors
          const button = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => 
              btn.textContent.toLowerCase().includes('humanize') || 
              btn.textContent.toLowerCase().includes('paraphrase')
            );
          });
          
          if (button.asElement()) {
            console.log(`✅ Found button containing humanize/paraphrase text`);
            await button.click();
            buttonFound = true;
            break;
          }
        } else {
          await page.waitForSelector(selector, { timeout: 2000, visible: true });
          console.log(`✅ Found button with selector: ${selector}`);
          await page.click(selector);
          buttonFound = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Button selector not found: ${selector}`);
      }
    }
    
    if (!buttonFound) {
      console.log("⚠️ Could not find humanize button automatically. Please click manually.");
      await page.waitForTimeout(5000); // Wait for manual click
    }
    
    // Wait for processing
    console.log("⏳ Waiting for output to appear...");
    await page.waitForTimeout(10000);
    
    // Take screenshot after processing
    await page.screenshot({ path: "debug-humanizer-after-processing.png", fullPage: true });
    console.log("📸 After processing screenshot saved");
    
    // Get all potential output elements
    const outputElements = await page.evaluate(() => {
      const elements = [];
      
      // Common output selectors to check
      const selectors = [
        'div#paraphraser-output-box',
        '[data-testid*="output"]',
        '[data-testid*="result"]',
        '.output-box',
        '.result-box',
        '[role="textbox"][contenteditable="false"]',
        'div[contenteditable="false"]',
        '.paraphraser-output',
        '.humanizer-output'
      ];
      
      selectors.forEach((selector, index) => {
        try {
          const element = document.querySelector(selector);
          if (element) {
            elements.push({
              selector: selector,
              textContent: element.textContent?.trim().substring(0, 200) || '',
              innerHTML: element.innerHTML?.substring(0, 200) || '',
              innerText: element.innerText?.trim().substring(0, 200) || '',
              className: element.className || '',
              id: element.id || '',
              visible: element.offsetParent !== null,
              hasContent: (element.textContent || element.innerText || '').trim().length > 0
            });
          }
        } catch (e) {
          // Selector not found, ignore
        }
      });
      
      // Also find all divs with substantial text content
      const allDivs = Array.from(document.querySelectorAll('div'));
      allDivs.forEach((div, index) => {
        const text = div.innerText || div.textContent || '';
        if (text.length > 20 && text.length < 1000 && div.offsetParent !== null) {
          // This might be an output div
          const selector = div.id ? `div#${div.id}` : 
                         div.className ? `div.${div.className.split(' ')[0]}` :
                         `div:nth-child(${index + 1})`;
          
          elements.push({
            selector: selector,
            textContent: text.substring(0, 200),
            innerHTML: div.innerHTML?.substring(0, 200) || '',
            innerText: text.substring(0, 200),
            className: div.className || '',
            id: div.id || '',
            visible: true,
            hasContent: true,
            isPotentialOutput: true
          });
        }
      });
      
      return elements;
    });
    
    // Log all findings
    console.log("\n" + "=".repeat(60));
    console.log("📋 OUTPUT ELEMENTS ANALYSIS");
    console.log("=".repeat(60));
    
    console.log("\n🔸 FOUND OUTPUT ELEMENTS:");
    console.log("-".repeat(40));
    
    outputElements.forEach((element, index) => {
      console.log(`Element ${index + 1}:`);
      console.log(`  Selector: ${element.selector}`);
      console.log(`  ID: ${element.id}`);
      console.log(`  Class: ${element.className}`);
      console.log(`  Visible: ${element.visible}`);
      console.log(`  Has Content: ${element.hasContent}`);
      console.log(`  Text Content: "${element.textContent}"`);
      console.log(`  Inner Text: "${element.innerText}"`);
      if (element.isPotentialOutput) {
        console.log(`  🎯 POTENTIAL OUTPUT CANDIDATE`);
      }
      console.log("");
    });
    
    // Generate recommended selectors
    console.log("\n" + "=".repeat(60));
    console.log("💡 RECOMMENDED OUTPUT SELECTORS");
    console.log("=".repeat(60));
    
    const validOutputs = outputElements.filter(el => el.hasContent && el.visible);
    
    if (validOutputs.length > 0) {
      console.log("\n🎯 Best candidates for output selector:");
      validOutputs.forEach((element, index) => {
        console.log(`${index + 1}. ${element.selector}`);
        if (element.textContent) {
          console.log(`   Content preview: "${element.textContent}"`);
        }
      });
    } else {
      console.log("❌ No valid output elements found with content");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎯 TESTING RECOMMENDATIONS");
    console.log("=".repeat(60));
    console.log("Try these selectors in your humanizer.js file:");
    
    if (validOutputs.length > 0) {
      validOutputs.slice(0, 3).forEach((element, index) => {
        console.log(`Option ${index + 1}: "${element.selector}"`);
      });
    }
    
    // Keep browser open for manual inspection
    console.log("\n🔍 Browser will stay open for manual inspection...");
    console.log("Check the screenshots and inspect the output elements manually");
    console.log("Press Ctrl+C when you're done examining the page");
    
    // Wait indefinitely until user closes
    await new Promise(() => {});
    
  } catch (error) {
    console.error("❌ Error during debugging:", error);
    await page.screenshot({ path: "debug-humanizer-error.png", fullPage: true });
  } finally {
    // Don't automatically close - let user inspect
    // await browser.close();
  }
}

// Run the debug script
if (require.main === module) {
  debugHumanizerSelectors().catch(console.error);
}

module.exports = debugHumanizerSelectors;