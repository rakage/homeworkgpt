# QuillBot Authentication Setup for Humanizer API

## The Issue You Encountered

Your humanizer jobs were failing with:
```
❌ Session found but expired. Last updated: 2025-10-02 01:54:55 (128.9 hours ago)
❌ Job failed: Not logged in. Please ensure valid session exists.
```

This means your QuillBot session expired and needs to be refreshed.

## Solution: Authentication Management

I've added an authentication API that allows you to check and manage your QuillBot login status.

## Quick Fix (Right Now)

### Option 1: Using the Helper Script (Easiest)

```bash
# 1. Check if logged in
node check-humanizer-auth.js

# 2. Login if needed
node check-humanizer-auth.js login your@email.com yourpassword
```

### Option 2: Using the API Directly

```bash
# Check status
curl http://localhost:3000/api/humanize/auth

# Login
curl -X POST http://localhost:3000/api/humanize/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### Option 3: Using the Original Script

```bash
cd quillbot-api
node login.js your@email.com yourpassword
```

## What Was Added

### 1. Authentication API Endpoint
**Location:** `app/api/humanize/auth/route.ts`

**Endpoints:**
- `GET /api/humanize/auth` - Check if logged in
- `POST /api/humanize/auth` - Login with credentials

### 2. Helper Script
**Location:** `check-humanizer-auth.js`

A convenient script to check and manage authentication from the command line.

### 3. Updated Documentation
- `HUMANIZER_QUICK_START.md` - Added auth section
- `HUMANIZER_AUTH_SETUP.md` - This file

## How It Works

1. **Session Storage**: Login sessions are stored in `quillbot-api/session_data.db`
2. **Browser Profile**: Chrome profile is stored in `quillbot-api/chrome_profile`
3. **Session Validation**: The system checks if the session is still valid before processing jobs
4. **Auto-Refresh**: You can manually refresh the session when it expires

## Environment Variables (Optional)

Add to `.env.local` for automated login:

```env
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword
```

Then you can login without providing credentials:
```bash
node check-humanizer-auth.js login
```

## Session Expiry

QuillBot sessions typically expire after:
- **~24-48 hours** of inactivity
- Logging out from the website
- Clearing browser data

## Best Practices

### 1. Check Before Use
Always check auth status before humanizing:
```bash
node check-humanizer-auth.js
```

### 2. Monitor in Production
Set up a cron job or scheduled task to check auth status:
```bash
# Check every 6 hours
0 */6 * * * node /path/to/check-humanizer-auth.js
```

### 3. Handle Auth Errors
In your application, catch authentication errors and prompt for re-login:

```typescript
try {
  const result = await fetch('/api/humanize', {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  
  const data = await result.json();
  
  if (data.error?.includes('Not logged in')) {
    // Redirect to login or show auth prompt
    console.log('Please login first');
  }
} catch (error) {
  // Handle error
}
```

### 4. Automated Re-Login
You can create a middleware that auto-refreshes the session:

```typescript
async function ensureAuthenticated() {
  const status = await fetch('/api/humanize/auth');
  const data = await status.json();
  
  if (!data.loggedIn && process.env.LOGIN_EMAIL) {
    // Auto-login
    await fetch('/api/humanize/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.LOGIN_EMAIL,
        password: process.env.LOGIN_PASSWORD
      })
    });
  }
}
```

## Troubleshooting

### "Not logged in" errors
**Solution:** Run the login command
```bash
node check-humanizer-auth.js login your@email.com yourpassword
```

### "Session expired" errors
**Solution:** Same as above - login again to refresh the session

### Login fails
**Causes:**
1. Wrong email/password
2. QuillBot website is down
3. QuillBot changed their login page structure

**Solutions:**
1. Verify credentials
2. Try with headless mode disabled: `HUMANIZER_HEADLESS=false`
3. Check `login-failed.png` screenshot in the quillbot-api folder
4. Update the login selectors in `quillbot-api/login.js`

### Can't access the API
**Solution:** Make sure Next.js is running:
```bash
npm run dev
```

## API Response Examples

### Successful Login Check (Logged In)
```json
{
  "success": true,
  "loggedIn": true,
  "message": "User is already logged in - Change password option found on settings page",
  "url": "https://quillbot.com/settings"
}
```

### Successful Login Check (Not Logged In)
```json
{
  "success": true,
  "loggedIn": false,
  "message": "User was redirected to login page when accessing settings",
  "url": "https://quillbot.com/login"
}
```

### Successful Login
```json
{
  "success": true,
  "message": "Login successful",
  "sessionId": "session_1234567890_abc123",
  "url": "https://quillbot.com/"
}
```

### Failed Login
```json
{
  "success": false,
  "error": "Login failed",
  "message": "Invalid credentials"
}
```

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for credentials in production
3. **Secure your .env files** with proper file permissions
4. **Don't expose the auth endpoint** publicly without rate limiting
5. **Consider adding authentication** to the auth endpoint itself

## Quick Reference

| Task | Command |
|------|---------|
| Check status | `node check-humanizer-auth.js` |
| Login | `node check-humanizer-auth.js login <email> <password>` |
| Check via API | `curl http://localhost:3000/api/humanize/auth` |
| Login via API | `curl -X POST http://localhost:3000/api/humanize/auth -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'` |

## Next Steps

1. **Login now** to refresh your session:
   ```bash
   node check-humanizer-auth.js login your@email.com yourpassword
   ```

2. **Test the humanizer** after logging in:
   ```bash
   node test-humanizer-integration.js
   ```

3. **Set up monitoring** to catch expired sessions early

4. **Add error handling** in your application for auth failures

---

**Your humanizer is now ready to use!** 🚀

After logging in, try submitting a humanization job again and it should work.
