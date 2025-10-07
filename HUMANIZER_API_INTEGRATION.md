# Humanizer API Integration

This document describes the integration of the QuillBot humanizer API into the Next.js application.

## Overview

The QuillBot humanizer service has been integrated into the Next.js application as API routes, eliminating the need for a separate Express server. The implementation uses a singleton pattern to maintain a persistent browser pool for handling multiple concurrent requests efficiently.

## Architecture

### Singleton Queue Manager
- **Location**: `lib/humanizer-queue-singleton.ts`
- **Purpose**: Manages a single instance of the HumanizerQueue across all API requests
- **Features**:
  - Browser pool persistence across requests
  - Automatic graceful shutdown
  - Development hot-reload support
  - Configurable via environment variables

### API Endpoints

All endpoints are prefixed with `/api/humanize`

#### 1. Submit Humanization Job
**POST** `/api/humanize`

Submit text for humanization.

**Request Body**:
```json
{
  "text": "Text to humanize (max 10,000 characters)",
  "options": {
    "includeThesaurus": true,
    "timeout": 60000
  }
}
```

**Response**:
```json
{
  "success": true,
  "jobId": "uuid-v4-string",
  "message": "Job queued successfully",
  "estimatedWaitTime": 30000,
  "position": 1
}
```

#### 2. Get Job Status
**GET** `/api/humanize/status/[jobId]`

Get the current status of a job.

**Response**:
```json
{
  "jobId": "uuid-v4-string",
  "status": "waiting|processing|completed|failed|cancelled",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "processingTime": 15000,
  "position": 1,
  "estimatedWaitTime": 15000
}
```

#### 3. Get Job Result
**GET** `/api/humanize/result/[jobId]`

Get the result of a completed job.

**Response (Success)**:
```json
{
  "success": true,
  "jobId": "uuid-v4-string",
  "data": {
    "originalText": "...",
    "humanizedText": "...",
    "changes": []
  },
  "completedAt": "2025-01-01T00:00:00.000Z",
  "processingTime": 15000
}
```

**Response (Still Processing)** - Status 202:
```json
{
  "message": "Job still processing",
  "status": "processing",
  "jobId": "uuid-v4-string"
}
```

#### 4. Get Queue Statistics
**GET** `/api/humanize/queue`

Get current queue statistics and health.

**Response**:
```json
{
  "totalJobs": 100,
  "completedJobs": 95,
  "failedJobs": 2,
  "averageProcessingTime": 25000,
  "waiting": 3,
  "active": 2,
  "browserPool": {
    "total": 2,
    "active": 2,
    "available": 0
  },
  "queue": {
    "concurrency": 2,
    "averageWaitTime": 45000
  }
}
```

#### 5. Cancel Job
**DELETE** `/api/humanize/job/[jobId]`

Cancel a waiting job (cannot cancel active jobs).

**Response**:
```json
{
  "success": true,
  "message": "Job uuid-v4-string cancelled successfully"
}
```

#### 6. Health Check
**GET** `/api/humanize/health`

Check the health status of the humanizer service.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "queue": {
    "waiting": 0,
    "active": 2,
    "completed": 95,
    "failed": 2
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` or `.env.local`:

```env
# Humanizer Queue Configuration
HUMANIZER_CONCURRENCY=2          # Number of concurrent browser instances
HUMANIZER_HEADLESS=true          # Run browsers in headless mode
HUMANIZER_MAX_RETRIES=3          # Maximum retry attempts per job
HUMANIZER_JOB_TIMEOUT=120000     # Job timeout in milliseconds (2 minutes)
```

### Concurrency and Heavy Traffic

The system is designed to handle heavy traffic efficiently:

1. **Browser Pool**: Maintains a pool of persistent browser instances
2. **Queue System**: Jobs are queued and processed with configurable concurrency
3. **Automatic Scaling**: Increase `HUMANIZER_CONCURRENCY` to handle more traffic
4. **Retry Logic**: Failed jobs are automatically retried up to max retries
5. **Timeout Protection**: Jobs that exceed timeout are automatically failed

#### Recommended Settings for Heavy Traffic:

```env
HUMANIZER_CONCURRENCY=4          # Increase for more parallel processing
HUMANIZER_HEADLESS=true          # Keep headless for performance
HUMANIZER_MAX_RETRIES=3          # Keep reasonable retry limit
HUMANIZER_JOB_TIMEOUT=180000     # Increase if jobs frequently timeout
```

**Note**: Each browser instance consumes ~200-500MB RAM. Monitor your server resources when increasing concurrency.

## Usage Example

### Client-Side Implementation

```typescript
// Submit job
const response = await fetch('/api/humanize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your text here',
    options: { includeThesaurus: true }
  })
});

const { jobId } = await response.json();

// Poll for result
const pollResult = async () => {
  const statusRes = await fetch(`/api/humanize/status/${jobId}`);
  const status = await statusRes.json();
  
  if (status.status === 'completed') {
    const resultRes = await fetch(`/api/humanize/result/${jobId}`);
    const result = await resultRes.json();
    return result.data;
  } else if (status.status === 'failed') {
    throw new Error('Job failed');
  } else {
    // Still processing, poll again
    await new Promise(resolve => setTimeout(resolve, 2000));
    return pollResult();
  }
};

const result = await pollResult();
console.log(result.humanizedText);
```

## Migration from Standalone Server

If you were previously running the standalone Express server on port 3001:

1. **Stop the standalone server** (if running)
2. **Update client code** to use new API endpoints:
   - Old: `http://localhost:3001/api/humanize`
   - New: `/api/humanize` (same domain as Next.js)
3. **Remove environment variables** related to the old server URL
4. **Update PM2 config** (if using PM2) to only run Next.js

## Performance Considerations

1. **Browser Pool Initialization**: First request may be slower as browsers initialize
2. **Memory Usage**: Each browser instance uses ~200-500MB RAM
3. **CPU Usage**: Headless browsers are CPU-intensive during processing
4. **Job Cleanup**: Completed jobs are automatically cleaned up after 1 hour
5. **Persistent Sessions**: Chrome profiles are stored in `quillbot-api/chrome_profile`

## Troubleshooting

### Jobs Timing Out
- Increase `HUMANIZER_JOB_TIMEOUT`
- Check if QuillBot website is accessible
- Verify login session is valid

### High Memory Usage
- Decrease `HUMANIZER_CONCURRENCY`
- Ensure jobs are being completed and cleaned up
- Monitor browser pool health via `/api/humanize/health`

### Jobs Failing
- Check browser logs in the server console
- Verify QuillBot selectors haven't changed
- Ensure stable internet connection
- Check if login credentials are valid

## Development vs Production

### Development
- Queue instance persists across hot reloads
- Lower concurrency to save resources
- Non-headless mode for debugging (`HUMANIZER_HEADLESS=false`)

### Production
- Always use headless mode
- Increase concurrency based on server resources
- Monitor queue health regularly
- Set up proper logging and error tracking

## Maintenance

### Updating QuillBot Integration
If QuillBot changes their website structure:
1. Update selectors in `quillbot-api/humanizer.js`
2. Test with debug mode enabled
3. No need to modify API routes

### Monitoring
Use the health check endpoint to monitor:
- Queue length and processing times
- Browser pool availability
- Success/failure rates
- System uptime

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Authentication**: Add authentication middleware if needed
3. **Input Validation**: Text is limited to 10,000 characters
4. **Error Messages**: Sensitive errors are not exposed to clients
5. **Browser Profiles**: Stored locally, ensure proper file permissions
