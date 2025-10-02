const puppeteer = require("puppeteer");

/**
 * Debug script to help identify the correct selectors on a login page
 * This script will open the page, take screenshots, and log all form elements
 */
async function debugSelectors(url = "https://quillbot.com/login") {
  console.log("🔍 Starting selector debugging...");
  
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
    await page.screenshot({ path: "debug-initial.png", fullPage: true });
    console.log("📸 Initial screenshot saved as debug-initial.png");
    
    // Get all form elements
    const formElements = await page.evaluate(() => {
      const elements = {
        inputs: [],
        buttons: [],
        forms: [],
        labels: []
      };
      
      // Get all input elements
      document.querySelectorAll('input').forEach((input, index) => {
        elements.inputs.push({
          index: index + 1,
          tagName: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          value: input.value,
          autocomplete: input.autocomplete,
          required: input.required,
          disabled: input.disabled,
          visible: input.offsetParent !== null,
          selector: input.id ? `#${input.id}` : 
                   input.name ? `input[name="${input.name}"]` : 
                   input.type ? `input[type="${input.type}"]` : 
                   `input:nth-of-type(${index + 1})`,
          outerHTML: input.outerHTML
        });
      });
      
      // Get all button elements
      document.querySelectorAll('button').forEach((button, index) => {
        elements.buttons.push({
          index: index + 1,
          tagName: button.tagName,
          type: button.type,
          className: button.className,
          textContent: button.textContent.trim(),
          id: button.id,
          testId: button.getAttribute('data-testid'),
          disabled: button.disabled,
          visible: button.offsetParent !== null,
          selector: button.id ? `#${button.id}` : 
                   button.getAttribute('data-testid') ? `button[data-testid="${button.getAttribute('data-testid')}"]` : 
                   `button:nth-of-type(${index + 1})`,
          outerHTML: button.outerHTML
        });
      });
      
      // Get all form elements
      document.querySelectorAll('form').forEach((form, index) => {
        elements.forms.push({
          index: index + 1,
          tagName: form.tagName,
          action: form.action,
          method: form.method,
          id: form.id,
          className: form.className,
          selector: form.id ? `#${form.id}` : `form:nth-of-type(${index + 1})`,
          outerHTML: form.outerHTML.substring(0, 500) + '...'
        });
      });
      
      // Get all label elements
      document.querySelectorAll('label').forEach((label, index) => {
        elements.labels.push({
          index: index + 1,
          tagName: label.tagName,
          textContent: label.textContent.trim(),
          htmlFor: label.htmlFor,
          className: label.className,
          selector: label.htmlFor ? `label[for="${label.htmlFor}"]` : `label:nth-of-type(${index + 1})`,
          outerHTML: label.outerHTML
        });
      });
      
      return elements;
    });
    
    // Log all findings
    console.log("\n" + "=".repeat(60));
    console.log("📋 FORM ELEMENTS ANALYSIS");
    console.log("=".repeat(60));
    
    console.log("\n🔸 INPUT ELEMENTS:");
    console.log("-".repeat(40));
    formElements.inputs.forEach(input => {
      console.log(`Input ${input.index}:`);
      console.log(`  Type: ${input.type}`);
      console.log(`  Name: ${input.name}`);
      console.log(`  ID: ${input.id}`);
      console.log(`  Placeholder: ${input.placeholder}`);
      console.log(`  Class: ${input.className}`);
      console.log(`  Autocomplete: ${input.autocomplete}`);
      console.log(`  Visible: ${input.visible}`);
      console.log(`  Suggested Selector: ${input.selector}`);
      console.log(`  HTML: ${input.outerHTML.substring(0, 200)}...`);
      console.log("");
    });
    
    console.log("\n🔸 BUTTON ELEMENTS:");
    console.log("-".repeat(40));
    formElements.buttons.forEach(button => {
      console.log(`Button ${button.index}:`);
      console.log(`  Type: ${button.type}`);
      console.log(`  Text: "${button.textContent}"`);
      console.log(`  ID: ${button.id}`);
      console.log(`  Test ID: ${button.testId}`);
      console.log(`  Class: ${button.className}`);
      console.log(`  Visible: ${button.visible}`);
      console.log(`  Suggested Selector: ${button.selector}`);
      console.log(`  HTML: ${button.outerHTML.substring(0, 200)}...`);
      console.log("");
    });
    
    console.log("\n🔸 FORM ELEMENTS:");
    console.log("-".repeat(40));
    formElements.forms.forEach(form => {
      console.log(`Form ${form.index}:`);
      console.log(`  Action: ${form.action}`);
      console.log(`  Method: ${form.method}`);
      console.log(`  ID: ${form.id}`);
      console.log(`  Class: ${form.className}`);
      console.log(`  Suggested Selector: ${form.selector}`);
      console.log("");
    });
    
    // Generate recommended selectors
    console.log("\n" + "=".repeat(60));
    console.log("💡 RECOMMENDED SELECTORS");
    console.log("=".repeat(60));
    
    const emailInput = formElements.inputs.find(input => 
      input.type === 'email' || 
      input.name?.toLowerCase().includes('email') || 
      input.placeholder?.toLowerCase().includes('email') ||
      input.name?.toLowerCase().includes('username')
    );
    
    const passwordInput = formElements.inputs.find(input => 
      input.type === 'password' || 
      input.name?.toLowerCase().includes('password') || 
      input.placeholder?.toLowerCase().includes('password')
    );
    
    const loginButton = formElements.buttons.find(button => 
      button.textContent?.toLowerCase().includes('log in') ||
      button.textContent?.toLowerCase().includes('login') ||
      button.textContent?.toLowerCase().includes('sign in') ||
      button.type === 'submit'
    );
    
    if (emailInput) {
      console.log("📧 Email/Username Input:");
      console.log(`   Recommended: ${emailInput.selector}`);
      console.log(`   Alternative: input[type="${emailInput.type}"]`);
      if (emailInput.name) console.log(`   Alternative: input[name="${emailInput.name}"]`);
      if (emailInput.id) console.log(`   Alternative: #${emailInput.id}`);
    } else {
      console.log("❌ No email/username input found automatically");
    }
    
    if (passwordInput) {
      console.log("\n🔐 Password Input:");
      console.log(`   Recommended: ${passwordInput.selector}`);
      console.log(`   Alternative: input[type="password"]`);
      if (passwordInput.name) console.log(`   Alternative: input[name="${passwordInput.name}"]`);
      if (passwordInput.id) console.log(`   Alternative: #${passwordInput.id}`);
    } else {
      console.log("\n❌ No password input found automatically");
    }
    
    if (loginButton) {
      console.log("\n🔘 Login Button:");
      console.log(`   Recommended: ${loginButton.selector}`);
      if (loginButton.testId) console.log(`   Alternative: button[data-testid="${loginButton.testId}"]`);
      console.log(`   Alternative: button:contains("${loginButton.textContent}")`);
      if (loginButton.type === 'submit') console.log(`   Alternative: button[type="submit"]`);
    } else {
      console.log("\n❌ No login button found automatically");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎯 NEXT STEPS");
    console.log("=".repeat(60));
    console.log("1. Review the recommended selectors above");
    console.log("2. Update your login.js file with the correct selectors");
    console.log("3. Test the selectors manually in browser DevTools");
    console.log("4. Screenshots saved for visual reference");
    
    // Keep browser open for manual inspection
    console.log("\n🔍 Browser will stay open for manual inspection...");
    console.log("Press Ctrl+C when you're done examining the page");
    
    // Wait indefinitely until user closes
    await new Promise(() => {});
    
  } catch (error) {
    console.error("❌ Error during debugging:", error);
    await page.screenshot({ path: "debug-error.png", fullPage: true });
  } finally {
    // Don't automatically close - let user inspect
    // await browser.close();
  }
}

// Run the debug script
if (require.main === module) {
  const url = process.argv[2] || "https://quillbot.com/login";
  debugSelectors(url).catch(console.error);
}

module.exports = debugSelectors;
