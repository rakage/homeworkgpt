const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const thesaurus = require("thesaurus");

// Load environment variables
dotenv.config();

class AIHumanizer {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      slowMo: options.slowMo || 100,
      timeout: options.timeout || 30000,
      waitForNavigation: options.waitForNavigation !== false,
      dbPath: options.dbPath || path.join(__dirname, "humanizer_data.db"),
      sessionDbPath: options.sessionDbPath || path.join(__dirname, "session_data.db"),
      persistentProfile: options.persistentProfile !== false, // Default to true
      profilePath:
        options.profilePath || path.join(__dirname, "chrome_profile"),
      ...options,
    };
    this.browser = null;
    this.page = null;
    this.db = null;
    this.sessionDb = null;
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.options.dbPath, (err) => {
        if (err) {
          console.error("❌ Error opening database:", err.message);
          reject(err);
        } else {
          console.log("📊 Connected to SQLite database");
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initSessionDatabase() {
    return new Promise((resolve, reject) => {
      this.sessionDb = new sqlite3.Database(this.options.sessionDbPath, (err) => {
        if (err) {
          console.error("❌ Error opening session database:", err.message);
          reject(err);
        } else {
          console.log("📊 Connected to session SQLite database");
          resolve();
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createHumanizerTable = `
        CREATE TABLE IF NOT EXISTS humanizer_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          original_text TEXT NOT NULL,
          humanized_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createHumanizerTable, (err) => {
        if (err) {
          console.error(
            "❌ Error creating humanizer_results table:",
            err.message
          );
          reject(err);
          return;
        }
        console.log("✅ Database table created successfully");
        resolve();
      });
    });
  }

  async saveResultToDatabase(originalText, humanizedText, sessionId = null) {
    if (!this.db) {
      await this.initDatabase();
    }

    const currentSessionId = sessionId || `humanizer_session_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const insertResult = this.db.prepare(`
        INSERT INTO humanizer_results (session_id, original_text, humanized_text)
        VALUES (?, ?, ?)
      `);

      insertResult.run(
        [currentSessionId, originalText, humanizedText],
        function (err) {
          if (err) {
            console.error("❌ Error saving result:", err.message);
            reject(err);
          } else {
            console.log(
              `✅ Saved humanizer result to database with ID: ${this.lastID}`
            );
            resolve(currentSessionId);
          }
        }
      );

      insertResult.finalize();
    });
  }

  async launch() {
    console.log("🚀 Launching browser...");

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1920x1080",
    ];

    // Add persistent profile if enabled
    if (this.options.persistentProfile) {
      launchArgs.push(`--user-data-dir=${this.options.profilePath}`);
      console.log(
        `📁 Using persistent Chrome profile: ${this.options.profilePath}`
      );
    }

    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: launchArgs,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    this.page = await this.browser.newPage();

    // Set user agent to avoid detection
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    console.log("✅ Browser launched successfully");
  }

  processThesaurus(text) {
    try {
      console.log("📚 Processing thesaurus for words using npm package...");

      // Split text into words
      const words = text.toLowerCase().match(/\b[a-zA-Z]+\b/g) || [];
      const uniqueWords = [...new Set(words)]; // Remove duplicates
      const thesaurusData = {};

      console.log(`🔍 Processing ${uniqueWords.length} unique words...`);

      // Process each unique word using the thesaurus npm package
      uniqueWords.forEach((word, index) => {
        console.log(
          `🔄 Processing word ${index + 1}/${uniqueWords.length}: "${word}"`
        );

        try {
          // Use thesaurus.find() to get synonyms
          const synonyms = thesaurus.find(word) || [];

          if (synonyms.length > 0) {
            // Include original word + synonyms, limit to 6 total (original + 5 synonyms)
            const limitedSynonyms = synonyms.slice(0, 5);
            thesaurusData[word] = [word, ...limitedSynonyms];
            console.log(
              `✅ Found ${limitedSynonyms.length} synonyms for "${word}"`
            );
          } else {
            // No synonyms found, keep only original word
            thesaurusData[word] = [word];
            console.log(`⚠️ No synonyms found for "${word}"`);
          }
        } catch (wordError) {
          console.error(
            `❌ Error processing word "${word}":`,
            wordError.message
          );
          thesaurusData[word] = [word]; // Keep original word if error
        }
      });

      console.log("✅ Thesaurus processing completed");
      return thesaurusData;
    } catch (error) {
      console.error("❌ Thesaurus processing failed:", error.message);
      // Return fallback data on error
      const words = text.toLowerCase().match(/\b[a-zA-Z]+\b/g) || [];
      const uniqueWords = [...new Set(words)];
      const fallbackData = {};
      uniqueWords.forEach((word) => {
        fallbackData[word] = [word];
      });
      return fallbackData;
    }
  }

  async checkIfLoggedIn() {
    try {
      console.log("🔍 Checking login status from session database...");
      
      // Initialize session database if not already connected
      if (!this.sessionDb) {
        await this.initSessionDatabase();
      }

      return new Promise((resolve, reject) => {
        // Query the session_status table for active sessions
        const query = `
          SELECT session_id, status, email, last_updated 
          FROM session_status 
          WHERE status = 'Active' 
          ORDER BY last_updated DESC 
          LIMIT 1
        `;

        this.sessionDb.get(query, [], (err, row) => {
          if (err) {
            console.error("❌ Error querying session database:", err.message);
            resolve({
              loggedIn: false,
              error: err.message,
              message: "Database query failed",
            });
            return;
          }

          if (row) {
            // Check if session is recent (within last 24 hours)
            const lastUpdated = new Date(row.last_updated);
            const now = new Date();
            const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
            
            if (hoursDiff <= 24) {
              console.log(
                `✅ Active session found! Session ID: ${row.session_id}, Email: ${row.email}, Last updated: ${row.last_updated}`
              );
              
              // Update the last_updated timestamp to refresh the session
              this.updateLoginStatus(row.session_id, 'Active').catch(err => {
                console.error('⚠️ Could not update session timestamp:', err.message);
              });
              
              resolve({
                loggedIn: true,
                sessionId: row.session_id,
                email: row.email,
                lastUpdated: row.last_updated,
                message: "User is logged in - Active session found in database",
              });
            } else {
              console.log(
                `❌ Session found but expired. Last updated: ${row.last_updated} (${hoursDiff.toFixed(1)} hours ago)`
              );
              resolve({
                loggedIn: false,
                sessionId: row.session_id,
                email: row.email,
                lastUpdated: row.last_updated,
                message: `Session expired - Last activity ${hoursDiff.toFixed(1)} hours ago`,
              });
            }
          } else {
            console.log("❌ No active session found in database");
            resolve({
              loggedIn: false,
              message: "No active session found in database",
            });
          }
        });
      });
    } catch (error) {
      console.error("❌ Error checking login status:", error.message);
      return {
        loggedIn: false,
        error: error.message,
        message: "Could not determine login status from database",
      };
    }
  }

  async humanizeText(text, humanizeUrl = "https://quillbot.com/ai-humanizer") {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    try {
      console.log(`🌐 Navigating to ${humanizeUrl}...`);
      await this.page.goto(humanizeUrl, {
        waitUntil: "networkidle2",
        timeout: this.options.timeout,
      });

      console.log("⏳ Waiting for AI Humanizer page to load...");
      await this.page.waitForTimeout(3000);

      // Find the input text box
      console.log("🔍 Looking for input text box...");
      const inputSelector =
        'div[data-testid="editable-content-within-article"]#paraphraser-input-box';

      try {
        await this.page.waitForSelector(inputSelector, {
          timeout: 10000,
          visible: true,
        });
        console.log("✅ Found input text box");
      } catch (e) {
        throw new Error("Could not find input text box on AI Humanizer page");
      }

      // Use fast JavaScript-based text injection
      console.log(`⚡ Injecting text directly (${text.length} chars)...`);
      
      try {
        // Method 1: Try direct DOM manipulation (fastest)
        const success = await this.page.evaluate((selector, textContent) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          
          // Clear existing content
          element.innerHTML = '';
          element.textContent = '';
          element.innerText = '';
          
          // Set new content
          element.textContent = textContent;
          
          // Trigger input events to notify the application
          const inputEvent = new Event('input', { bubbles: true, cancelable: true });
          const changeEvent = new Event('change', { bubbles: true, cancelable: true });
          const keydownEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
          const keyupEvent = new KeyboardEvent('keyup', { bubbles: true, cancelable: true });
          
          element.dispatchEvent(keydownEvent);
          element.dispatchEvent(inputEvent);
          element.dispatchEvent(keyupEvent);
          element.dispatchEvent(changeEvent);
          
          // Focus the element
          element.focus();
          
          return element.textContent === textContent;
        }, inputSelector, text);
        
        if (success) {
          console.log("✅ Text injected successfully via DOM manipulation");
        } else {
          throw new Error("DOM injection failed");
        }
        
      } catch (domError) {
        console.log("⚠️ DOM injection failed, trying alternative method...");
        
        try {
          // Method 2: Try setting value property (React/modern apps)
          const valueSuccess = await this.page.evaluate((selector, textContent) => {
            const element = document.querySelector(selector);
            if (!element) return false;
            
            // Clear and set value
            element.value = '';
            element.value = textContent;
            
            // Trigger React/Vue change detection
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            
            if (element.tagName === 'INPUT' && nativeInputValueSetter) {
              nativeInputValueSetter.call(element, textContent);
            } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
              nativeTextAreaValueSetter.call(element, textContent);
            }
            
            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.focus();
            
            return true;
          }, inputSelector, text);
          
          if (valueSuccess) {
            console.log("✅ Text set successfully via value property");
          } else {
            throw new Error("Value property method failed");
          }
          
        } catch (valueError) {
          console.log("⚠️ Advanced methods failed, falling back to optimized typing...");
          
          // Method 3: Fallback to very fast typing (no delay)
          await this.page.focus(inputSelector);
          
          // Clear existing content
          await this.page.keyboard.down("Control");
          await this.page.keyboard.press("KeyA");
          await this.page.keyboard.up("Control");
          await this.page.keyboard.press("Delete");
          
          // Type without any delay (much faster)
          await this.page.type(inputSelector, text, { delay: 0 });
          console.log("✅ Text input completed via fast typing fallback");
        }
      }

      // Wait a moment for the content to be processed
      await this.page.waitForTimeout(1000);

      // Click the Humanize button once
      console.log("🔘 Looking for Humanize button...");

      const humanizeButtonSelector =
        'button[data-testid="pphr/input_footer/paraphrase_button"]';

      try {
        // Wait for the button to be available
        await this.page.waitForSelector(humanizeButtonSelector, {
          timeout: 10000,
          visible: true,
        });

        console.log("✅ Found Humanize button");

        // Single click
        console.log("🔘 Clicking Humanize button...");
        await this.page.click(humanizeButtonSelector);
        console.log("✅ Humanize button clicked successfully");
      } catch (buttonError) {
        console.error(
          "❌ Failed to click Humanize button:",
          buttonError.message
        );
        await this.takeScreenshot("humanize-button-click-failed.png");
        throw buttonError;
      }

      // Wait for the output to be generated
      console.log("⏳ Waiting for humanized output...");
      
      // Multiple output selectors to try (QuillBot changes their HTML frequently)
      const outputSelectors = [
        "div#paraphraser-output-box", // Specific selector from user's example
        "div.MuiDrawer-root", // Current working selector
        "[data-testid*='output']",
        "[data-testid*='result']",
        ".output-box",
        ".result-box",
        "[role='textbox'][contenteditable='false']",
        "div[contenteditable='false']",
        ".paraphraser-output",
        ".humanizer-output"
      ];

      let outputFound = false;
      let workingSelector = null;

      // Try each selector until we find one that works
      for (const selector of outputSelectors) {
        try {
          console.log(`🔍 Trying output selector: ${selector}`);
          await this.page.waitForSelector(selector, {
            timeout: 5000,
            visible: true,
          });
          
          // Check if this element has content
          const hasContent = await this.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return false;
            const text = element.innerText || element.textContent || '';
            return text.trim().length > 0;
          }, selector);
          
          if (hasContent) {
            console.log(`✅ Found working output selector: ${selector}`);
            workingSelector = selector;
            outputFound = true;
            break;
          } else {
            console.log(`⚠️ Selector found but no content: ${selector}`);
          }
        } catch (e) {
          console.log(`❌ Selector failed: ${selector}`);
          continue;
        }
      }

      if (!outputFound) {
        console.log("⚠️ No standard selectors worked, trying dynamic detection...");
        
        // Fallback: Look for any div with substantial text content that might be the output
        await this.page.waitForTimeout(5000); // Wait a bit more
        
        workingSelector = await this.page.evaluate(() => {
          // Look for divs with text content that might be the output
          const allDivs = Array.from(document.querySelectorAll('div'));
          
          for (let div of allDivs) {
            const text = div.innerText || div.textContent || '';
            // Look for divs with substantial content that are visible
            if (text.length > 20 && text.length < 2000 && 
                div.offsetParent !== null && 
                !div.querySelector('input') && 
                !div.querySelector('textarea') &&
                !div.querySelector('button')) {
              
              // Generate a unique selector for this div
              if (div.id) {
                return `div#${div.id}`;
              } else if (div.className) {
                const firstClass = div.className.split(' ')[0];
                return `div.${firstClass}`;
              } else {
                // Use a more specific path
                let path = 'div';
                let current = div;
                while (current.parentElement && current.parentElement !== document.body) {
                  const parent = current.parentElement;
                  const index = Array.from(parent.children).indexOf(current) + 1;
                  path = `${parent.tagName.toLowerCase()}:nth-child(${index}) > ${path}`;
                  current = parent;
                  if (path.length > 100) break; // Prevent overly long selectors
                }
                return path;
              }
            }
          }
          return null;
        });
        
        if (workingSelector) {
          console.log(`✅ Found output via dynamic detection: ${workingSelector}`);
          outputFound = true;
        }
      }

      if (!outputFound) {
        await this.takeScreenshot("output-not-found.png");
        throw new Error("Timeout waiting for humanized output to be generated - no output element found");
      }

      // Wait a bit more for the content to fully load
      await this.page.waitForTimeout(3000);

      // Extract the humanized text using the working selector
      console.log(`📋 Extracting humanized text using selector: ${workingSelector}`);
      const humanizedText = await this.page.evaluate((selector) => {
        const outputBox = document.querySelector(selector);
        if (!outputBox) {
          return null;
        }

        // Try multiple approaches to extract clean text content
        
        // Method 1: Try to reconstruct text from sentence structure
        let textContent = '';
        const sentences = outputBox.querySelectorAll('[data-testid^="output-sentence-"]');
        if (sentences.length > 0) {
          // Extract text by sentences to preserve proper structure
          textContent = Array.from(sentences)
            .map(sentence => {
              const words = sentence.querySelectorAll('span[data-testid^="output-word"]');
              if (words.length > 0) {
                return Array.from(words)
                  .map(wordSpan => wordSpan.textContent || wordSpan.innerText || '')
                  .join('')
                  .replace(/\u00a0/g, ' ') // Replace non-breaking spaces
                  .trim();
              }
              return sentence.textContent || sentence.innerText || '';
            })
            .join(' ') // Join sentences with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        } else {
          // Method 2: Try to extract text from word spans
          const wordSpans = outputBox.querySelectorAll('span[data-testid^="output-word"]');
          if (wordSpans.length > 0) {
            // Extract text from individual word spans
            textContent = Array.from(wordSpans)
              .map(span => span.textContent || span.innerText)
              .join('')
              .replace(/\u00a0/g, ' ') // Replace non-breaking spaces with regular spaces
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          } else {
            // Method 3: Fallback to innerText/textContent
            textContent = outputBox.innerText || outputBox.textContent || "";
            
            // Clean up the text
            textContent = textContent.trim().replace(/\s+/g, " ");
          }
        }
        
        // Remove common UI text that might be included
        textContent = textContent.replace(/^(Copy|Copied|Download|Share)\s*/i, '');
        textContent = textContent.replace(/\s*(Copy|Copied|Download|Share)$/i, '');
        
        return textContent;
      }, workingSelector);

      if (!humanizedText || humanizedText.length < 10) {
        await this.takeScreenshot("extraction-failed.png");
        throw new Error(`Could not extract meaningful humanized text from output box. Got: "${humanizedText}"`);
      }

      console.log("✅ Successfully extracted humanized text");

      // Process thesaurus for the humanized text
      console.log("📚 Starting thesaurus processing...");
      const thesaurusData = this.processThesaurus(humanizedText);

      // Save to database if enabled
      let sessionId = null;
      try {
        const finalResult = {
          text: humanizedText,
          thesaurus: thesaurusData,
        };
        sessionId = await this.saveResultToDatabase(
          text,
          JSON.stringify(finalResult)
        );
        console.log("💾 Result saved to database");
      } catch (dbError) {
        console.warn("⚠️ Failed to save to database:", dbError.message);
      }

      // Return in the requested JSON format
      return {
        success: true,
        data: {
          text: humanizedText,
          thesaurus: thesaurusData,
        },
        originalText: text,
        sessionId: sessionId,
        url: this.page.url(),
      };
    } catch (error) {
      console.error("❌ Humanization failed:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          text: "",
          thesaurus: {},
        },
        originalText: text,
        url: this.page ? this.page.url() : "unknown",
      };
    }
  }

  async takeScreenshot(path = "humanizer-screenshot.png") {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved to ${path}`);
  }

  async updateLoginStatus(sessionId, status) {
    if (!this.sessionDb) {
      await this.initSessionDatabase();
    }

    return new Promise((resolve, reject) => {
      // Update the status for the given session
      this.sessionDb.run(
        `UPDATE session_status 
         SET status = ?, last_updated = CURRENT_TIMESTAMP 
         WHERE session_id = ?`,
        [status, sessionId],
        (err) => {
          if (err) {
            console.error("❌ Error updating login status:", err.message);
            reject(err);
          } else {
            console.log(`✅ Updated login status to: ${status} for session ${sessionId}`);
            resolve();
          }
        }
      );
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("🔒 Browser closed");
    }

    if (this.db) {
      await new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error("❌ Error closing database:", err.message);
          } else {
            console.log("🔒 Database connection closed");
          }
          resolve();
        });
      });
    }

    if (this.sessionDb) {
      await new Promise((resolve) => {
        this.sessionDb.close((err) => {
          if (err) {
            console.error("❌ Error closing session database:", err.message);
          } else {
            console.log("🔒 Session database connection closed");
          }
          resolve();
        });
      });
    }
  }
}

// Main execution function
async function main() {
  const humanizer = new AIHumanizer({
    headless: process.argv.includes("--headless"),
    slowMo: process.argv.includes("--slow") ? 250 : 100,
    persistentProfile: !process.argv.includes("--no-profile"),
  });

  try {
    await humanizer.launch();

    // Check if already logged in when using persistent profile
    if (humanizer.options.persistentProfile) {
      const loginStatus = await humanizer.checkIfLoggedIn();

      if (!loginStatus.loggedIn) {
        console.error("❌ Not logged in! Please run the login script first:");
        console.log("node login.js <email> <password>");
        process.exit(1);
      }

      console.log("✅ Already logged in with persistent profile!");
    }

    // Get text from command line argument or prompt for it
    let textToHumanize = process.argv[2];

    if (!textToHumanize) {
      console.error("❌ Please provide text to humanize");
      console.log('Usage: node humanizer.js "Your text to humanize here"');
      console.log("\nOptions:");
      console.log("  --headless       Run in headless mode");
      console.log("  --slow           Add extra delays");
      console.log("  --no-profile     Disable persistent profile");
      console.log("  --screenshot     Take screenshot after processing");
      process.exit(1);
    }

    console.log(
      `🤖 Humanizing text: "${textToHumanize.substring(0, 100)}${
        textToHumanize.length > 100 ? "..." : ""
      }"`
    );
    const result = await humanizer.humanizeText(textToHumanize);

    if (result.success) {
      console.log("\n🎉 Humanization and Thesaurus processing successful!");
      console.log("\n📝 Original text:");
      console.log(result.originalText);
      console.log("\n🤖 Humanized text:");
      console.log(result.data.text);
      console.log("\n📚 Thesaurus data:");
      console.log(JSON.stringify(result.data.thesaurus, null, 2));
      console.log("\n📋 Final JSON output:");
      console.log(JSON.stringify(result.data, null, 2));

      if (result.sessionId) {
        console.log(`\n📊 Session ID: ${result.sessionId}`);
        console.log("💾 Result automatically saved to SQLite database");
      }

      // Take screenshot if requested
      if (process.argv.includes("--screenshot")) {
        await humanizer.takeScreenshot("humanizer-success.png");
      }
    } else {
      console.error("❌ Humanization failed:", result.error);

      // Take screenshot on failure for debugging
      await humanizer.takeScreenshot("humanizer-failed.png");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  } finally {
    await humanizer.close();
  }
}

// Export for use as a module
module.exports = AIHumanizer;

// Run if this file is executed directly
if (require.main === module) {
  main();
}
