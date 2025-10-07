/**
 * Check and manage QuillBot authentication for the Humanizer API
 * 
 * Usage:
 * - Check status: node check-humanizer-auth.js
 * - Login: node check-humanizer-auth.js login <email> <password>
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function checkAuthStatus() {
  console.log('\n🔍 Checking authentication status...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/humanize/auth`);
    const data = await response.json();
    
    if (data.success) {
      if (data.loggedIn) {
        console.log('✅ LOGGED IN');
        console.log(`📍 Status: ${data.message}`);
        console.log(`🌐 URL: ${data.url}`);
        console.log('\n✨ Ready to humanize text!\n');
        return true;
      } else {
        console.log('❌ NOT LOGGED IN');
        console.log(`📍 Status: ${data.message}`);
        console.log('\n⚠️  You need to login first:\n');
        console.log('   node check-humanizer-auth.js login <email> <password>\n');
        console.log('   OR set these environment variables:');
        console.log('   LOGIN_EMAIL=your@email.com');
        console.log('   LOGIN_PASSWORD=yourpassword\n');
        return false;
      }
    } else {
      console.log('❌ ERROR:', data.message);
      return false;
    }
  } catch (error) {
    console.error('💥 Error checking auth status:', error.message);
    console.log('\n⚠️  Make sure your Next.js server is running!');
    console.log('   Run: npm run dev\n');
    return false;
  }
}

async function login(email, password) {
  console.log('\n🔐 Attempting to login...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/humanize/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.alreadyLoggedIn) {
        console.log('✅ Already logged in!');
        console.log(`📍 URL: ${data.url}`);
      } else {
        console.log('✅ Login successful!');
        console.log(`📊 Session ID: ${data.sessionId}`);
        console.log(`📍 URL: ${data.url}`);
      }
      console.log('\n✨ Ready to humanize text!\n');
      return true;
    } else {
      console.log('❌ Login failed');
      console.log(`📍 Reason: ${data.message || data.error}`);
      console.log('\n💡 Tips:');
      console.log('   - Check your email and password');
      console.log('   - Make sure QuillBot website is accessible');
      console.log('   - Try with headless mode disabled: HUMANIZER_HEADLESS=false\n');
      return false;
    }
  } catch (error) {
    console.error('💥 Error during login:', error.message);
    console.log('\n⚠️  Make sure your Next.js server is running!');
    console.log('   Run: npm run dev\n');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🤖 QuillBot Humanizer Authentication Manager');
  console.log('='.repeat(50));
  
  if (args[0] === 'login') {
    // Login mode
    const email = args[1] || process.env.LOGIN_EMAIL;
    const password = args[2] || process.env.LOGIN_PASSWORD;
    
    if (!email || !password) {
      console.log('\n❌ Email and password required!\n');
      console.log('Usage: node check-humanizer-auth.js login <email> <password>');
      console.log('\nOr set environment variables:');
      console.log('   LOGIN_EMAIL=your@email.com');
      console.log('   LOGIN_PASSWORD=yourpassword');
      console.log('   node check-humanizer-auth.js login\n');
      process.exit(1);
    }
    
    const success = await login(email, password);
    process.exit(success ? 0 : 1);
  } else {
    // Check status mode
    const success = await checkAuthStatus();
    process.exit(success ? 0 : 1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error:', error.message);
  process.exit(1);
});

main();
