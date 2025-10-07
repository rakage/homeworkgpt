import { NextRequest, NextResponse } from 'next/server';
import { resolve } from 'path';

// Load LoginAutomator dynamically
function loadLoginAutomator() {
  const modulePath = resolve(process.cwd(), 'quillbot-api', 'login.js');
  const requireFunc = eval('require');
  return requireFunc(modulePath);
}

// GET /api/humanize/auth - Check login status
export async function GET(request: NextRequest) {
  try {
    const LoginAutomator = loadLoginAutomator();
    const automator = new LoginAutomator({
      headless: process.env.HUMANIZER_HEADLESS !== 'false',
      persistentProfile: true
    });

    await automator.launch();

    try {
      const loginStatus = await automator.checkIfLoggedIn();
      
      await automator.close();

      return NextResponse.json({
        success: true,
        loggedIn: loginStatus.loggedIn,
        message: loginStatus.message,
        url: loginStatus.url
      });
    } catch (error: any) {
      await automator.close();
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error checking auth status:', error?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check authentication status',
        message: error?.message
      },
      { status: 500 }
    );
  }
}

// POST /api/humanize/auth - Login with credentials
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    const LoginAutomator = loadLoginAutomator();
    const automator = new LoginAutomator({
      headless: process.env.HUMANIZER_HEADLESS !== 'false',
      persistentProfile: true
    });

    await automator.launch();

    try {
      // First check if already logged in
      const checkStatus = await automator.checkIfLoggedIn();
      
      if (checkStatus.loggedIn) {
        await automator.close();
        return NextResponse.json({
          success: true,
          message: 'Already logged in',
          alreadyLoggedIn: true,
          url: checkStatus.url
        });
      }

      // Perform login
      console.log('🔐 Attempting to login...');
      const result = await automator.login(email, password);

      await automator.close();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          sessionId: result.sessionId,
          url: result.url
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Login failed',
            message: result.message
          },
          { status: 401 }
        );
      }
    } catch (error: any) {
      await automator.close();
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Error during login:', error?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error?.message
      },
      { status: 500 }
    );
  }
}
