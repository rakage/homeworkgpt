# Humanizer API Quick Start

## 🚀 Get Started in 4 Steps

### 1. Configure Environment
Create or update `.env.local`:
```env
HUMANIZER_CONCURRENCY=2
HUMANIZER_HEADLESS=true
HUMANIZER_MAX_RETRIES=3
HUMANIZER_JOB_TIMEOUT=120000

# QuillBot Credentials (optional, for auto-login)
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword
```

### 2. Start Your Server
```bash
npm run dev
# or for production
npm run build && npm start
```

### 3. Login to QuillBot
```bash
# Check if already logged in
node check-humanizer-auth.js

# Login if needed
node check-humanizer-auth.js login your@email.com yourpassword
```

### 4. Use the API

**Submit a job:**
```bash
curl -X POST http://localhost:3000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'
```

**Check status:**
```bash
curl http://localhost:3000/api/humanize/status/{jobId}
```

**Get result:**
```bash
curl http://localhost:3000/api/humanize/result/{jobId}
```

## 📝 Frontend Example

```typescript
async function humanizeText(text: string) {
  // Submit job
  const response = await fetch('/api/humanize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  const { jobId } = await response.json();
  
  // Poll for result
  while (true) {
    const status = await fetch(`/api/humanize/status/${jobId}`).then(r => r.json());
    
    if (status.status === 'completed') {
      const result = await fetch(`/api/humanize/result/${jobId}`).then(r => r.json());
      return result.data.humanizedText;
    }
    
    if (status.status === 'failed') {
      throw new Error('Humanization failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## 🎯 React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useHumanizer(text: string | null) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function process() {
      try {
        // Submit job
        const res = await fetch('/api/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        const { jobId } = await res.json();

        // Poll for result
        while (!cancelled) {
          const statusRes = await fetch(`/api/humanize/status/${jobId}`);
          const status = await statusRes.json();

          if (status.status === 'completed') {
            const resultRes = await fetch(`/api/humanize/result/${jobId}`);
            const data = await resultRes.json();
            
            if (!cancelled) {
              setResult(data.data.humanizedText);
              setLoading(false);
            }
            break;
          } else if (status.status === 'failed') {
            throw new Error('Job failed');
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    process();

    return () => {
      cancelled = true;
    };
  }, [text]);

  return { result, loading, error };
}

// Usage
function MyComponent() {
  const [inputText, setInputText] = useState('');
  const [textToHumanize, setTextToHumanize] = useState<string | null>(null);
  const { result, loading, error } = useHumanizer(textToHumanize);

  return (
    <div>
      <textarea 
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button onClick={() => setTextToHumanize(inputText)}>
        Humanize
      </button>
      
      {loading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {result && <p>Result: {result}</p>}
    </div>
  );
}
```

## 🔍 Health Check

```bash
curl http://localhost:3000/api/humanize/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 42,
    "failed": 1
  }
}
```

## ⚙️ Configuration for Heavy Traffic

### Light Traffic (Default)
```env
HUMANIZER_CONCURRENCY=2
```
**Handles:** ~60 requests/hour

### Medium Traffic
```env
HUMANIZER_CONCURRENCY=4
```
**Handles:** ~120 requests/hour
**RAM:** ~1-2GB

### Heavy Traffic
```env
HUMANIZER_CONCURRENCY=8
```
**Handles:** ~240 requests/hour
**RAM:** ~2-4GB

> **Note:** Each browser uses ~200-500MB RAM. Monitor your server resources.

## 🧪 Test Your Setup

```bash
# Start Next.js
npm run dev

# Run test suite (in another terminal)
node test-humanizer-integration.js
```

## 📚 More Information

- **Full Documentation:** `HUMANIZER_API_INTEGRATION.md`
- **Migration Guide:** `MIGRATION_SUMMARY.md`
- **Test Script:** `test-humanizer-integration.js`

## 🔐 Authentication API

### Check Login Status
```bash
# Using curl
curl http://localhost:3000/api/humanize/auth

# Using the helper script
node check-humanizer-auth.js
```

### Login via API
```bash
# Using curl
curl -X POST http://localhost:3000/api/humanize/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Using the helper script
node check-humanizer-auth.js login your@email.com yourpassword
```

### Response Examples

**Logged In:**
```json
{
  "success": true,
  "loggedIn": true,
  "message": "User is already logged in",
  "url": "https://quillbot.com/settings"
}
```

**Not Logged In:**
```json
{
  "success": true,
  "loggedIn": false,
  "message": "Not logged in",
  "url": "https://quillbot.com/login"
}
```

## ⚠️ Important Notes

1. **Login Required**: You must be logged in to QuillBot before using the humanizer
2. **Check Auth First**: Run `node check-humanizer-auth.js` before humanizing
3. **Session Expiry**: Sessions expire after ~24-48 hours of inactivity
4. **First Request**: May take 2-3 seconds as browser pool initializes
5. **Browser Profile**: Stored in `quillbot-api/chrome_profile`
6. **Rate Limiting**: Consider adding if exposing publicly
7. **Job Cleanup**: Completed jobs auto-delete after 1 hour

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Queue not yet initialized" | Wait 2-3 seconds and retry |
| Jobs timing out | Increase `HUMANIZER_JOB_TIMEOUT` |
| High memory usage | Reduce `HUMANIZER_CONCURRENCY` |
| Jobs failing | Check QuillBot login session |

## 💡 Tips

1. **Development**: Use `HUMANIZER_HEADLESS=false` to see browser
2. **Production**: Always use `HUMANIZER_HEADLESS=true`
3. **Monitoring**: Poll `/api/humanize/health` regularly
4. **Scaling**: Increase concurrency based on server resources
5. **Caching**: Consider caching frequently humanized texts
