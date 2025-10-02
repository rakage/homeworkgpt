// Configuration example for login automation
module.exports = {
  // Login credentials
  credentials: {
    email: "your-email@example.com",
    password: "your-password",
  },

  // Login URL
  loginUrl: "https://quillbot.com/login",

  // Puppeteer options
  puppeteerOptions: {
    headless: true, // Set to false for debugging
    slowMo: 100, // Delay between actions in ms
    timeout: 30000, // Timeout for operations in ms
    waitForNavigation: true, // Wait for navigation after login
  },

  // Selectors (update if the website changes)
  selectors: {
    emailInput: 'input[name="username"][type="email"]#mui-5',
    passwordInput: 'input[type="password"]', // You may need to update this
    loginButton: 'button[data-testid="login-btn"]',
  },

  // Output options
  output: {
    takeScreenshots: true,
    saveSessionData: true,
    logLevel: "info", // 'debug', 'info', 'warn', 'error'
  },
};
