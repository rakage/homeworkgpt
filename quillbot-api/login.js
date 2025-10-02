const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Load environment variables
dotenv.config();

class LoginAutomator {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      slowMo: options.slowMo || 100,
      timeout: options.timeout || 30000,
      waitForNavigation: options.waitForNavigation !== false,
      dbPath: options.dbPath || path.join(__dirname, 'session_data.db'),
      persistentProfile: options.persistentProfile !== false, // Default to true
      profilePath: options.profilePath || path.join(__dirname, 'chrome_profile'),
      ...options,
    };
    this.browser = null;
    this.page = null;
    this.db = null;
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

  async createTables() {
    return new Promise((resolve, reject) => {
      const createCookiesTable = `
        CREATE TABLE IF NOT EXISTS cookies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          name TEXT NOT NULL,
          value TEXT NOT NULL,
          domain TEXT,
          path TEXT,
          expires INTEGER,
          httpOnly BOOLEAN,
          secure BOOLEAN,
          sameSite TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createLocalStorageTable = `
        CREATE TABLE IF NOT EXISTS localStorage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createSessionStatusTable = `
        CREATE TABLE IF NOT EXISTS session_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          status TEXT NOT NULL,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.serialize(() => {
        this.db.run(createCookiesTable, (err) => {
          if (err) {
            console.error("❌ Error creating cookies table:", err.message);
            reject(err);
            return;
          }
        });

        this.db.run(createLocalStorageTable, (err) => {
          if (err) {
            console.error("❌ Error creating localStorage table:", err.message);
            reject(err);
            return;
          }
        });

        this.db.run(createSessionStatusTable, (err) => {
          if (err) {
            console.error("❌ Error creating session_status table:", err.message);
            reject(err);
            return;
          }
          console.log("✅ Database tables created successfully");
          resolve();
        });
      });
    });
  }

  async saveCookiesToDatabase(cookies, sessionId = null) {
    if (!this.db) {
      await this.initDatabase();
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const insertCookie = this.db.prepare(`
        INSERT INTO cookies (session_id, name, value, domain, path, expires, httpOnly, secure, sameSite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        cookies.forEach((cookie) => {
          insertCookie.run([
            currentSessionId,
            cookie.name,
            cookie.value,
            cookie.domain,
            cookie.path,
            cookie.expires || null,
            cookie.httpOnly || false,
            cookie.secure || false,
            cookie.sameSite || null
          ]);
        });

        this.db.run("COMMIT", (err) => {
          if (err) {
            console.error("❌ Error saving cookies:", err.message);
            reject(err);
          } else {
            console.log(`✅ Saved ${cookies.length} cookies to database`);
            resolve(currentSessionId);
          }
        });
      });

      insertCookie.finalize();
    });
  }

  async saveLocalStorageToDatabase(localStorage, sessionId = null) {
    if (!this.db) {
      await this.initDatabase();
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const insertLocalStorage = this.db.prepare(`
        INSERT INTO localStorage (session_id, key, value)
        VALUES (?, ?, ?)
      `);

      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        Object.entries(localStorage).forEach(([key, value]) => {
          insertLocalStorage.run([currentSessionId, key, value]);
        });

        this.db.run("COMMIT", (err) => {
          if (err) {
            console.error("❌ Error saving localStorage:", err.message);
            reject(err);
          } else {
            console.log(`✅ Saved ${Object.keys(localStorage).length} localStorage items to database`);
            resolve(currentSessionId);
          }
        });
      });

      insertLocalStorage.finalize();
    });
  }

  async saveLoginStatus(sessionId, email, status = "Active") {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      // First, delete any existing status for this session to avoid duplicates
      this.db.run(
        "DELETE FROM session_status WHERE session_id = ?",
        [sessionId],
        (err) => {
          if (err) {
            console.error("❌ Error deleting old session status:", err.message);
            reject(err);
            return;
          }

          // Insert the new status
          this.db.run(
            `INSERT INTO session_status (session_id, status, email) 
             VALUES (?, ?, ?)`,
            [sessionId, status, email],
            (err) => {
              if (err) {
                console.error("❌ Error saving login status:", err.message);
                reject(err);
              } else {
                console.log(`✅ Saved login status: ${status} for session ${sessionId}`);
                resolve();
              }
            }
          );
        }
      );
    });
  }

  async getLoginStatus(sessionId = null) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM session_status";
      let params = [];

      if (sessionId) {
        query += " WHERE session_id = ?";
        params = [sessionId];
      }

      query += " ORDER BY last_updated DESC LIMIT 1";

      this.db.get(query, params, (err, row) => {
        if (err) {
          console.error("❌ Error getting login status:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateLoginStatus(sessionId, status) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      // Update the status for the given session
      this.db.run(
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

  async launch() {
    console.log("🚀 Launching browser...");

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ];

    // Add persistent profile if enabled
    if (this.options.persistentProfile) {
      launchArgs.push(`--user-data-dir=${this.options.profilePath}`);
      console.log(`📁 Using persistent Chrome profile: ${this.options.profilePath}`);
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

  async checkIfLoggedIn(testUrl = "https://quillbot.com/settings") {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    try {
      console.log("🔍 Checking if already logged in by visiting /settings...");
      await this.page.goto(testUrl, {
        waitUntil: "networkidle2",
        timeout: this.options.timeout,
      });

      // Wait a bit for the page to fully load
      await this.page.waitForTimeout(3000);

      const currentUrl = this.page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // Check for the specific "Change password" element
      const changePasswordExists = await this.page.evaluate(() => {
        // Look for the specific span with "Change password" text
        const changePasswordSpan = document.querySelector('span.css-cneg6b');
        if (changePasswordSpan && changePasswordSpan.textContent.includes('Change password')) {
          return true;
        }

        // Also check for other variations of "Change password" text
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          if (element.textContent && element.textContent.trim() === 'Change password') {
            return true;
          }
        }

        return false;
      });

      // Also check if we were redirected to login page
      const isOnLoginPage = currentUrl.includes('/login');

      if (changePasswordExists && !isOnLoginPage) {
        console.log("✅ Already logged in! Found 'Change password' on settings page.");
        
        // Update database status to Active if using persistent profile
        if (this.options.persistentProfile) {
          try {
            // Try to get the most recent session ID from the database
            const latestStatus = await this.getLoginStatus();
            if (latestStatus) {
              // Always update the status and refresh the timestamp, even if already Active
              await this.updateLoginStatus(latestStatus.session_id, 'Active');
            } else {
              // If no status exists, create a new one
              const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await this.saveLoginStatus(sessionId, 'unknown', 'Active');
            }
          } catch (dbError) {
            console.error("⚠️ Could not update/create login status in database:", dbError.message);
          }
        }
        
        return {
          loggedIn: true,
          url: currentUrl,
          message: "User is already logged in - Change password option found on settings page"
        };
      } else if (isOnLoginPage) {
        console.log("❌ Not logged in - redirected to login page");
        
        // Update database status to Inactive if using persistent profile
        if (this.options.persistentProfile) {
          try {
            const latestStatus = await this.getLoginStatus();
            if (latestStatus) {
              if (latestStatus.status !== 'Inactive') {
                await this.updateLoginStatus(latestStatus.session_id, 'Inactive');
              }
            } else {
              // If no status exists, create a new one
              const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await this.saveLoginStatus(sessionId, 'unknown', 'Inactive');
            }
          } catch (dbError) {
            console.error("⚠️ Could not update/create login status in database:", dbError.message);
          }
        }
        
        return {
          loggedIn: false,
          url: currentUrl,
          message: "User was redirected to login page when accessing settings"
        };
      } else {
        console.log("❌ Not logged in - 'Change password' not found on settings page");
        
        // Update database status to Inactive if using persistent profile
        if (this.options.persistentProfile) {
          try {
            const latestStatus = await this.getLoginStatus();
            if (latestStatus) {
              if (latestStatus.status !== 'Inactive') {
                await this.updateLoginStatus(latestStatus.session_id, 'Inactive');
              }
            } else {
              // If no status exists, create a new one
              const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await this.saveLoginStatus(sessionId, 'unknown', 'Inactive');
            }
          } catch (dbError) {
            console.error("⚠️ Could not update/create login status in database:", dbError.message);
          }
        }
        
        return {
          loggedIn: false,
          url: currentUrl,
          message: "Change password option not found on settings page"
        };
      }
    } catch (error) {
      console.error("❌ Error checking login status:", error.message);
      return {
        loggedIn: false,
        error: error.message,
        message: "Could not determine login status"
      };
    }
  }

  async login(email, password, loginUrl = "https://quillbot.com/login") {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    try {
      console.log(`🌐 Navigating to ${loginUrl}...`);
      await this.page.goto(loginUrl, {
        waitUntil: "networkidle2",
        timeout: this.options.timeout,
      });

      console.log("⏳ Waiting for login form to load...");

      // Add a longer wait to ensure page is fully loaded
      await this.page.waitForTimeout(3000);

      // Debug: Take a screenshot to see what's on the page
      await this.takeScreenshot("debug-page-loaded.png");

      // Debug: Log all input elements on the page
      const allInputs = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        return inputs.map((input) => ({
          tagName: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          outerHTML: input.outerHTML.substring(0, 200) + "...",
        }));
      });

      console.log("🔍 Found input elements on page:");
      allInputs.forEach((input, index) => {
        console.log(`Input ${index + 1}:`, input);
      });

      // Try to find email input with multiple possible selectors
      console.log("🔍 Looking for email input field...");
      const possibleEmailSelectors = [
        'input[name="username"][type="email"]#mui-5', // Original selector
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="Email" i]',
        'input[id*="email" i]',
        'input[id*="username" i]',
        "#email",
        "#username",
        '[data-testid*="email" i]',
        '[data-testid*="username" i]',
      ];

      let emailSelector = null;
      let emailElement = null;

      for (const selector of possibleEmailSelectors) {
        try {
          console.log(`Trying email selector: ${selector}`);
          await this.page.waitForSelector(selector, {
            timeout: 3000,
            visible: true,
          });
          emailElement = await this.page.$(selector);
          if (emailElement) {
            emailSelector = selector;
            console.log(`✅ Found email field with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Email selector failed: ${selector}`);
        }
      }

      if (!emailSelector) {
        // Fallback: use the first input field
        const firstInput = await this.page.$("input");
        if (firstInput) {
          emailSelector = "input";
          emailElement = firstInput;
          console.log("🔄 Using fallback: first input field for email");
        } else {
          throw new Error("Could not find any email input field");
        }
      }

      console.log("📧 Filling email field...");

      // Clear any existing content first
      await this.page.focus(emailSelector);
      await this.page.keyboard.down("Control");
      await this.page.keyboard.press("KeyA");
      await this.page.keyboard.up("Control");
      await this.page.keyboard.press("Delete");

      // Type the email with human-like delays
      await this.page.type(emailSelector, email, { delay: 100 });

      // Wait for the password input field
      console.log("🔍 Looking for password field...");

      // Try different possible password field selectors
      const possiblePasswordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]',
        "#password",
        '[data-testid="password"]',
        '[data-testid*="password" i]',
        'input[name="username"]:nth-of-type(2)', // In case there are two username fields
      ];

      let passwordSelector = null;
      let passwordElement = null;

      for (const selector of possiblePasswordSelectors) {
        try {
          console.log(`Trying password selector: ${selector}`);
          await this.page.waitForSelector(selector, {
            timeout: 3000,
            visible: true,
          });
          passwordElement = await this.page.$(selector);
          if (passwordElement) {
            passwordSelector = selector;
            console.log(`✅ Found password field with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Password selector failed: ${selector}`);
        }
      }

      if (!passwordSelector) {
        // Fallback: use the second input field if there are multiple
        const allInputs = await this.page.$$("input");
        console.log(`Found ${allInputs.length} input fields total`);
        if (allInputs.length >= 2) {
          passwordSelector = "input:nth-of-type(2)";
          passwordElement = allInputs[1];
          console.log(
            "🔄 Using fallback password selector: second input field"
          );
        } else {
          throw new Error("Could not find password input field");
        }
      }

      console.log("🔐 Filling password field...");

      // Focus and clear the password field
      await this.page.focus(passwordSelector);
      await this.page.keyboard.down("Control");
      await this.page.keyboard.press("KeyA");
      await this.page.keyboard.up("Control");
      await this.page.keyboard.press("Delete");

      // Type the password with human-like delays
      await this.page.type(passwordSelector, password, { delay: 100 });

      // Take a screenshot after filling both fields
      await this.takeScreenshot("debug-fields-filled.png");

      // Find and click the login button
      console.log("🔍 Looking for login button...");

      // Debug: Log all buttons on the page
      const allButtons = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.map((button) => ({
          tagName: button.tagName,
          type: button.type,
          className: button.className,
          textContent: button.textContent.trim(),
          id: button.id,
          testId: button.getAttribute("data-testid"),
          outerHTML: button.outerHTML.substring(0, 200) + "...",
        }));
      });

      console.log("🔍 Found button elements on page:");
      allButtons.forEach((button, index) => {
        console.log(`Button ${index + 1}:`, button);
      });

      const possibleLoginButtonSelectors = [
        'button[data-testid="login-btn"]', // Original selector
        'button[type="submit"]',
        'button:contains("Log in")',
        'button:contains("Login")',
        'button:contains("Sign in")',
        '[data-testid*="login" i]',
        '[data-testid*="submit" i]',
        'button[class*="login" i]',
        'button[class*="submit" i]',
        'input[type="submit"]',
        ".login-button",
        ".submit-button",
      ];

      let loginButtonSelector = null;
      let loginButtonElement = null;

      for (const selector of possibleLoginButtonSelectors) {
        try {
          console.log(`Trying login button selector: ${selector}`);
          await this.page.waitForSelector(selector, {
            timeout: 3000,
            visible: true,
          });
          loginButtonElement = await this.page.$(selector);
          if (loginButtonElement) {
            loginButtonSelector = selector;
            console.log(`✅ Found login button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Login button selector failed: ${selector}`);
        }
      }

      if (!loginButtonSelector) {
        // Fallback: look for any button with login-related text
        loginButtonElement = await this.page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons.find((button) => {
            const text = button.textContent.toLowerCase();
            return (
              text.includes("log in") ||
              text.includes("login") ||
              text.includes("sign in")
            );
          });
        });

        if (loginButtonElement) {
          loginButtonSelector = "button"; // Generic selector for the found button
          console.log(
            "🔄 Using fallback: found button with login-related text"
          );
        } else {
          throw new Error("Could not find login button");
        }
      }

      console.log("🔘 Clicking login button...");

      // Click the login button and wait for navigation or response
      try {
        // If we have a loginButtonElement from evaluateHandle, use that
        if (loginButtonElement && loginButtonElement.click) {
          await loginButtonElement.click();
        } else {
          // Otherwise use the selector
          await this.page.click(loginButtonSelector);
        }

        console.log("✅ Login button clicked successfully");

        // Wait for potential navigation or response
        if (this.options.waitForNavigation) {
          try {
            await this.page.waitForNavigation({
              waitUntil: "networkidle2",
              timeout: this.options.timeout,
            });
          } catch (navError) {
            console.log("⚠️ Navigation timeout (this might be normal for SPA)");
          }
        }
      } catch (clickError) {
        console.error("❌ Failed to click login button:", clickError.message);
        await this.takeScreenshot("debug-click-failed.png");
        throw clickError;
      }

      console.log("⏳ Waiting for login to complete...");

      // Wait a bit more to ensure page is loaded
      await this.page.waitForTimeout(2000);

      // Check if login was successful by looking for common indicators
      const currentUrl = this.page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // Look for common success indicators
      const successIndicators = [
        () => !currentUrl.includes("/login"), // Redirected away from login
        () => this.page.$(".dashboard"), // Dashboard element
        () => this.page.$('[data-testid="user-menu"]'), // User menu
        () => this.page.$(".logout"), // Logout button
        () => this.page.$(".profile"), // Profile section
      ];

      let loginSuccess = false;
      for (const indicator of successIndicators) {
        try {
          const result = await indicator();
          if (result) {
            loginSuccess = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      if (loginSuccess || !currentUrl.includes("/login")) {
        console.log("✅ Login appears to be successful!");

        // Automatically save cookies and localStorage to database
        try {
          console.log("💾 Saving session data to database...");
          const cookies = await this.getCookies();
          const localStorage = await this.getLocalStorage();

          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await this.saveCookiesToDatabase(cookies, sessionId);
          await this.saveLocalStorageToDatabase(localStorage, sessionId);
          
          // Save login status to database
          await this.saveLoginStatus(sessionId, email, "Active");

          console.log(`📊 Session data saved with ID: ${sessionId}`);

          return {
            success: true,
            url: currentUrl,
            message: "Login completed successfully",
            sessionId: sessionId,
            cookies: cookies,
            localStorage: localStorage
          };
        } catch (dbError) {
          console.error("⚠️ Failed to save session data to database:", dbError.message);
          
          // Even if session data saving failed, try to save the login status
          try {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await this.saveLoginStatus(sessionId, email, "Active");
          } catch (statusError) {
            console.error("⚠️ Failed to save login status to database:", statusError.message);
          }
          
          return {
            success: true,
            url: currentUrl,
            message: "Login completed successfully, but failed to save session data",
            error: dbError.message
          };
        }
      } else {
        // Check for error messages
        const errorSelectors = [
          ".error",
          ".alert-error",
          '[data-testid="error"]',
          ".MuiAlert-message",
          ".error-message",
        ];

        let errorMessage = "Login may have failed - still on login page";
        for (const selector of errorSelectors) {
          try {
            const errorElement = await this.page.$(selector);
            if (errorElement) {
              errorMessage = await this.page.evaluate(
                (el) => el.textContent,
                errorElement
              );
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        console.log("❌ Login may have failed");
        
        // Create a session ID even for failed login attempts to track the attempt
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Save the failed login status to database
        try {
          await this.saveLoginStatus(sessionId, email, "Inactive");
        } catch (dbError) {
          console.error("⚠️ Failed to save login failure status to database:", dbError.message);
        }
        
        return {
          success: false,
          url: currentUrl,
          message: errorMessage,
          sessionId: sessionId
        };
      }
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      
      // Create a session ID even for failed login attempts to track the attempt
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save the failed login status to database
      try {
        await this.saveLoginStatus(sessionId, email, "Inactive");
      } catch (dbError) {
        console.error("⚠️ Failed to save login failure status to database:", dbError.message);
      }
      
      return {
        success: false,
        error: error.message,
        url: this.page ? this.page.url() : "unknown",
        sessionId: sessionId
      };
    }
  }

  async getCookies() {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }
    return await this.page.cookies();
  }

  async getLocalStorage() {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }
    return await this.page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      return storage;
    });
  }

  async takeScreenshot(path = "login-screenshot.png") {
    if (!this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved to ${path}`);
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
  }
}

// Main execution function
async function main() {
  const automator = new LoginAutomator({
    headless: process.argv.includes("--headless"),
    slowMo: process.argv.includes("--slow") ? 250 : 100,
    persistentProfile: !process.argv.includes("--no-profile"), // Allow disabling profile persistence
  });

  try {
    await automator.launch();

    // Check if already logged in when using persistent profile
    if (automator.options.persistentProfile) {
      const loginStatus = await automator.checkIfLoggedIn();

      if (loginStatus.loggedIn) {
        console.log("🎉 Already logged in with persistent profile!");
        
        // Get the latest session status from database to confirm
        try {
          const dbStatus = await automator.getLoginStatus();
          if (dbStatus) {
            console.log(`📊 Database shows session ${dbStatus.session_id} is ${dbStatus.status}`);
          }
        } catch (dbError) {
          console.error("⚠️ Could not get database status:", dbError.message);
        }

        // Optionally get and save current session data
        if (process.argv.includes("--get-data")) {
          console.log("\n📊 Getting current session data...");
          const cookies = await automator.getCookies();
          const localStorage = await automator.getLocalStorage();

          console.log("\n🍪 Cookies:");
          cookies.forEach((cookie) => {
            console.log(`${cookie.name}: ${cookie.value}`);
          });

          console.log("\n💾 LocalStorage:");
          console.log(JSON.stringify(localStorage, null, 2));

          // Save to database if requested
          if (process.argv.includes("--save-session")) {
            console.log("💾 Saving current session data to database...");
            const sessionId = `persistent_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await automator.saveCookiesToDatabase(cookies, sessionId);
            await automator.saveLocalStorageToDatabase(localStorage, sessionId);
            
            // Since we're creating a new session ID when saving, we create a new status record
            // Get the email from the most recent status record to associate with this new session
            const latestStatus = await automator.getLoginStatus();
            const emailFromStatus = latestStatus ? latestStatus.email : "unknown";
            await automator.saveLoginStatus(sessionId, emailFromStatus, "Active");
            console.log(`📊 Session data saved with ID: ${sessionId}`);
          }
        }

        // Take screenshot if requested
        if (process.argv.includes("--screenshot")) {
          await automator.takeScreenshot("already-logged-in.png");
        }

        return;
      }
    }

    // Get credentials from environment or command line
    const email = process.env.LOGIN_EMAIL || process.argv[2];
    const password = process.env.LOGIN_PASSWORD || process.argv[3];

    if (!email || !password) {
      console.error("❌ Please provide email and password");
      console.log("Usage: node login.js <email> <password>");
      console.log("Or set LOGIN_EMAIL and LOGIN_PASSWORD environment variables");
      console.log("\nOptions:");
      console.log("  --headless       Run in headless mode");
      console.log("  --slow           Add extra delays");
      console.log("  --no-profile     Disable persistent profile");
      console.log("  --get-data       Display session data");
      console.log("  --save-session   Save session to database (with --get-data)");
      console.log("  --screenshot     Take screenshot");
      process.exit(1);
    }

    console.log("🔐 Attempting to login...");
    const result = await automator.login(email, password);

    if (result.success) {
      console.log("🎉 Login successful!");

      if (result.sessionId) {
        console.log(`📊 Session ID: ${result.sessionId}`);
        console.log("💾 Session data automatically saved to SQLite database");
      }

      if (automator.options.persistentProfile) {
        console.log("📁 Session saved to persistent Chrome profile");
      }

      // Optionally get cookies and localStorage for future API calls
      if (process.argv.includes("--get-data")) {
        console.log("\n📊 Getting session data...");

        if (result.cookies && result.localStorage) {
          console.log("\n🍪 Cookies:");
          result.cookies.forEach((cookie) => {
            console.log(`${cookie.name}: ${cookie.value}`);
          });

          console.log("\n💾 LocalStorage:");
          console.log(JSON.stringify(result.localStorage, null, 2));
        } else {
          const cookies = await automator.getCookies();
          const localStorage = await automator.getLocalStorage();

          console.log("\n🍪 Cookies:");
          cookies.forEach((cookie) => {
            console.log(`${cookie.name}: ${cookie.value}`);
          });

          console.log("\n💾 LocalStorage:");
          console.log(JSON.stringify(localStorage, null, 2));
        }
      }

      // Take screenshot if requested
      if (process.argv.includes("--screenshot")) {
        await automator.takeScreenshot("login-success.png");
      }
    } else {
      console.error("❌ Login failed:", result.message);

      // Take screenshot on failure for debugging
      await automator.takeScreenshot("login-failed.png");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  } finally {
    await automator.close();
  }
}

// Export for use as a module
module.exports = LoginAutomator;

// Run if this file is executed directly
if (require.main === module) {
  main();
}
