# Frontend API Integration Fix

## Issue
The "Write Human" button was calling the old standalone Express server at `http://localhost:3001/api/humanize` instead of the new integrated Next.js API routes.

## What Was Fixed

### 1. Updated Humanizer Service
**File**: `lib/services/humanizer.service.ts`

**Changes**:
- Changed base URL from `http://localhost:3001` to empty string (uses same domain)
- Updated all endpoint paths to include `/api/humanize` prefix:
  - `/api/status/${jobId}` → `/api/humanize/status/${jobId}`
  - `/api/result/${jobId}` → `/api/humanize/result/${jobId}`
  - `/api/job/${jobId}` → `/api/humanize/job/${jobId}`

### 2. Removed Old Environment Variables
**Files**: `.env`, `.env.example`

Removed:
- `NEXT_PUBLIC_HUMANIZER_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_API_URL=...`

These are no longer needed since the API is now part of the Next.js app.

## How It Works Now

### Before (Separate Servers)
```
Frontend → http://localhost:3001/api/humanize (Express server)
```

### After (Integrated)
```
Frontend → /api/humanize (Next.js API route)
```

All API calls now go to the same domain/port as the Next.js app.

## Testing

After these changes:

1. **Rebuild the app**:
   ```bash
   npm run build
   ```

2. **Restart (if using PM2)**:
   ```bash
   pm2 restart homeworkgpt
   ```

3. **Test the Write Human button**:
   - Should now call `/api/humanize` (same domain)
   - Should use the integrated humanizer API
   - Should work without the old Express server running

## Endpoint Mapping

| Old Endpoint (Port 3001) | New Endpoint (Same Port) |
|--------------------------|--------------------------|
| POST /api/humanize | POST /api/humanize |
| GET /api/status/:jobId | GET /api/humanize/status/:jobId |
| GET /api/result/:jobId | GET /api/humanize/result/:jobId |
| DELETE /api/job/:jobId | DELETE /api/humanize/job/:jobId |
| GET /health | GET /api/humanize/health |
| GET /api/queue/stats | GET /api/humanize/queue |

## Benefits

1. ✅ **Single Server**: No need to run Express server separately
2. ✅ **Same Domain**: No CORS issues
3. ✅ **Simplified**: Fewer environment variables
4. ✅ **Consistent**: All APIs under `/api/*`

## For Deployment

On your Ubuntu server, after pulling these changes:

```bash
cd ~/homeworkgpt
git pull origin main

# Rebuild
npm run build

# Restart PM2
pm2 restart homeworkgpt

# The old Express server (port 3001) is no longer needed
# You can stop it if it's still running
```

## Verification

Test that it works:

```bash
# Should work (Next.js API)
curl http://localhost:3000/api/humanize/health

# Old endpoint no longer needed
# curl http://localhost:3001/api/humanize/health
```

---

**Your Write Human button should now work correctly!** 🎉
