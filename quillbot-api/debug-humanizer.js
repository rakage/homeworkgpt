const puppeteer = require("puppeteer");

/**
 * Debug script to help identify the correct selectors for the AI Humanizer page
 * This script will analyze the page structure after text input and button clicking
 */
async function debugHumanizer(testText = "This is a test text for AI humanization.", url = "https://quillbot.com/ai-humanizer") {
  console.log("🔍 Starting AI Humanizer debugging...");
  
  const browser = await puppeteer.launch({
    headless: false, // Keep browser open for visual inspection
    slowMo: 1000,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  try {
    console.log(`🌐 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    // Take initial screenshot
    await page.screenshot({ path: "debug-humanizer-initial.png", fullPage: true });
    console.log("📸 Initial screenshot saved as debug-humanizer-initial.png");
    
    // Analyze input box
    console.log("\n" + "=".repeat(60));
    console.log("📝 ANALYZING INPUT BOX");
    console.log("=".repeat(60));
    
    const inputAnalysis = await page.evaluate(() => {
      const possibleInputs = [
        'div[data-testid="editable-content-within-article"]#paraphraser-input-box',
        '#paraphraser-input-box',
        '[data-testid="editable-content-within-article"]'
      ];
      
      const results = {};
      
      possibleInputs.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
          results[`input_${index + 1}`] = {
            selector: selector,
            found: true,
            id: element.id,
            className: element.className,
            textContent: element.textContent.substring(0, 100),
            tagName: element.tagName,
            contentEditable: element.contentEditable,
            outerHTML: element.outerHTML.substring(0, 300) + '...'
          };
        } else {
          results[`input_${index + 1}`] = {
            selector: selector,
            found: false
          };
        }
      });
      
      return results;
    });
    
    console.log("🔍 Input box analysis:");
    Object.entries(inputAnalysis).forEach(([key, value]) => {
      console.log(`${key}:`, JSON.stringify(value, null, 2));
    });
    
    // Try to input text
    console.log("\n📝 Attempting to input text...");
    const inputSelector = 'div[data-testid="editable-content-within-article"]#paraphraser-input-box';
    
    try {
      await page.waitForSelector(inputSelector, { timeout: 10000, visible: true });
      await page.focus(inputSelector);
      
      // Clear and input text
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.keyboard.press("Delete");
      
      await page.evaluate((selector, text) => {
        const element = document.querySelector(selector);
        if (element) {
          element.innerHTML = '';
          element.textContent = text;
          element.focus();
          
          const inputEvent = new Event('input', { bubbles: true });
          element.dispatchEvent(inputEvent);
          
          const changeEvent = new Event('change', { bubbles: true });
          element.dispatchEvent(changeEvent);
        }
      }, inputSelector, testText);
      
      console.log("✅ Text input successful");
      await page.waitForTimeout(2000);
      
      // Take screenshot after text input
      await page.screenshot({ path: "debug-humanizer-text-entered.png", fullPage: true });
      console.log("📸 Text input screenshot saved");
      
    } catch (inputError) {
      console.error("❌ Text input failed:", inputError.message);
    }
    
    // Analyze buttons
    console.log("\n" + "=".repeat(60));
    console.log("🔘 ANALYZING BUTTONS");
    console.log("=".repeat(60));
    
    const buttonAnalysis = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      
      return allButtons.map((button, index) => ({
        index: index + 1,
        tagName: button.tagName,
        type: button.type,
        className: button.className,
        textContent: button.textContent.trim(),
        innerHTML: button.innerHTML.substring(0, 200) + '...',
        id: button.id,
        testId: button.getAttribute('data-testid'),
        disabled: button.disabled,
        visible: button.offsetParent !== null,
        parentElement: {
          id: button.parentElement?.id,
          className: button.parentElement?.className,
          tagName: button.parentElement?.tagName
        },
        outerHTML: button.outerHTML.substring(0, 300) + '...'
      }));
    });
    
    console.log("🔍 Found buttons:");
    buttonAnalysis.forEach((button) => {
      console.log(`Button ${button.index}:`, JSON.stringify(button, null, 2));
      console.log("-".repeat(40));
    });
    
    // Try to find and click the humanize button
    console.log("\n🔘 Attempting to find and analyze Humanize button...");
    
    // Test the XPath from user
    try {
      const xpathResult = await page.$x('//*[@id="controlledInputBoxContainer"]/div[2]/div/div[2]/span/div/button');
      if (xpathResult.length > 0) {
        console.log(`✅ XPath found ${xpathResult.length} button(s)`);
        
        for (let i = 0; i < xpathResult.length; i++) {
          const buttonInfo = await page.evaluate(el => ({
            textContent: el.textContent.trim(),
            className: el.className,
            id: el.id,
            disabled: el.disabled,
            visible: el.offsetParent !== null,
            outerHTML: el.outerHTML.substring(0, 300) + '...'
          }), xpathResult[i]);
          
          console.log(`XPath Button ${i + 1}:`, JSON.stringify(buttonInfo, null, 2));
        }
        
        // Try clicking the first button found via XPath
        if (xpathResult.length > 0) {
          console.log("🔘 Clicking button via XPath...");
          await xpathResult[0].click();
          console.log("✅ Button clicked via XPath");
        }
      } else {
        console.log("❌ XPath found no buttons");
      }
    } catch (xpathError) {
      console.error("❌ XPath failed:", xpathError.message);
    }
    
    // Wait for processing
    console.log("\n⏳ Waiting for processing...");
    await page.waitForTimeout(10000);
    
    // Take screenshot after button click
    await page.screenshot({ path: "debug-humanizer-after-click.png", fullPage: true });
    console.log("📸 After-click screenshot saved");
    
    // Analyze potential output areas
    console.log("\n" + "=".repeat(60));
    console.log("📋 ANALYZING OUTPUT AREAS");
    console.log("=".repeat(60));
    
    const outputAnalysis = await page.evaluate(() => {
      const results = {};
      
      // Check common output selectors
      const possibleOutputs = [
        'div#paraphraser-output-box',
        '#paraphraser-output-box',
        '[data-testid="editable-content-within-article"]:not(#paraphraser-input-box)',
        'div[data-testid="editable-content-within-article"]:nth-of-type(2)'
      ];
      
      possibleOutputs.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
          results[`output_${index + 1}`] = {
            selector: selector,
            found: true,
            id: element.id,
            className: element.className,
            textContent: element.textContent.substring(0, 300),
            textLength: element.textContent.length,
            tagName: element.tagName,
            contentEditable: element.contentEditable,
            outerHTML: element.outerHTML.substring(0, 500) + '...'
          };
        } else {
          results[`output_${index + 1}`] = {
            selector: selector,
            found: false
          };
        }
      });
      
      // Also check all editable content areas
      const allEditableContent = Array.from(document.querySelectorAll('[data-testid="editable-content-within-article"]'));
      results.allEditableAreas = allEditableContent.map((el, index) => ({
        index: index + 1,
        id: el.id,
        className: el.className,
        textContent: el.textContent.substring(0, 200),
        textLength: el.textContent.length,
        contentEditable: el.contentEditable
      }));
      
      // Check for any divs with substantial text content
      const allDivs = Array.from(document.querySelectorAll('div'));
      results.substantialTextDivs = allDivs
        .filter(div => div.textContent && div.textContent.trim().length > 50)
        .map((div, index) => ({
          index: index + 1,
          id: div.id,
          className: div.className,
          textContent: div.textContent.substring(0, 200),
          textLength: div.textContent.length
        }))
        .slice(0, 10); // Limit to first 10
      
      return results;
    });
    
    console.log("🔍 Output analysis:");
    Object.entries(outputAnalysis).forEach(([key, value]) => {
      console.log(`${key}:`, JSON.stringify(value, null, 2));
      console.log("-".repeat(40));
    });
    
    // Final analysis
    console.log("\n" + "=".repeat(60));
    console.log("💡 RECOMMENDATIONS");
    console.log("=".repeat(60));
    
    const recommendations = await page.evaluate(() => {
      const editableAreas = Array.from(document.querySelectorAll('[data-testid="editable-content-within-article"]'));
      
      let inputRecommendation = "div[data-testid=\"editable-content-within-article\"]#paraphraser-input-box";
      let outputRecommendation = null;
      let buttonRecommendation = null;
      
      if (editableAreas.length >= 2) {
        outputRecommendation = editableAreas[1].id ? 
          `#${editableAreas[1].id}` : 
          'div[data-testid="editable-content-within-article"]:nth-of-type(2)';
      } else if (editableAreas.length === 1) {
        // Look for other output indicators
        const outputBox = document.querySelector('[id*="output"]');
        if (outputBox) {
          outputRecommendation = `#${outputBox.id}`;
        }
      }
      
      // Check for XPath button
      const xpathButton = document.evaluate(
        '//*[@id="controlledInputBoxContainer"]/div[2]/div/div[2]/span/div/button',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      if (xpathButton.singleNodeValue) {
        buttonRecommendation = "XPath: //*[@id=\"controlledInputBoxContainer\"]/div[2]/div/div[2]/span/div/button";
      }
      
      return {
        input: inputRecommendation,
        output: outputRecommendation,
        button: buttonRecommendation
      };
    });
    
    console.log("📝 Input Selector:", recommendations.input);
    console.log("📋 Output Selector:", recommendations.output || "Not found - check manual inspection");
    console.log("🔘 Button Selector:", recommendations.button || "Not found - check manual inspection");
    
    console.log("\n🔍 Browser will stay open for manual inspection...");
    console.log("Check the screenshots and console output for debugging info");
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
  const text = process.argv[2] || "This is a test text for AI humanization.";
  const url = process.argv[3] || "https://quillbot.com/ai-humanizer";
  debugHumanizer(text, url).catch(console.error);
}

module.exports = debugHumanizer;
