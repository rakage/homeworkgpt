# Humanizer API Documentation

A scalable REST API for text humanization using QuillBot with job queue management and browser pooling.

## Base URL
```
http://localhost:3001
```

## Features
- ✅ Queue-based job processing
- ✅ Browser pooling for concurrent requests
- ✅ Database-based login verification
- ✅ Automatic retry mechanism
- ✅ Job status tracking
- ✅ Request rate limiting through queue
- ✅ Comprehensive error handling

---

## API Endpoints

### 1. Health Check
**GET** `/health`

Returns the current health status of the API server and queue statistics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T13:06:26.000Z",
  "uptime": 123.456,
  "queue": {
    "waiting": 2,
    "active": 1,
    "completed": 15,
    "failed": 0
  }
}
```

---

### 2. Submit Humanization Job
**POST** `/api/humanize`

Submits a text for humanization and returns a job ID for tracking.

**Request Body:**
```json
{
  "text": "Your text to be humanized goes here",
  "options": {
    "includeThesaurus": true,
    "timeout": 60000
  }
}
```

**Parameters:**
- `text` (string, required): Text to humanize (max 10,000 characters)
- `options` (object, optional):
  - `includeThesaurus` (boolean): Include thesaurus data (default: true)
  - `timeout` (number): Job timeout in milliseconds (default: 60000)

**Response:**
```json
{
  "success": true,
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Job queued successfully",
  "estimatedWaitTime": 30000,
  "position": 3
}
```

**Error Responses:**
- `400`: Invalid input (missing text, text too long)
- `500`: Internal server error

---

### 3. Check Job Status
**GET** `/api/status/:jobId`

Returns the current status of a submitted job.

**Response:**
```json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "processing",
  "createdAt": "2025-09-30T13:06:26.000Z",
  "processingTime": 15000
}
```

**Status Values:**
- `waiting`: Job is queued and waiting to be processed
- `processing`: Job is currently being processed
- `completed`: Job completed successfully
- `failed`: Job failed after retries
- `cancelled`: Job was cancelled

**For waiting jobs:**
```json
{
  "jobId": "...",
  "status": "waiting",
  "createdAt": "...",
  "position": 2,
  "estimatedWaitTime": 45000
}
```

---

### 4. Get Job Result
**GET** `/api/result/:jobId`

Retrieves the result of a completed job.

**Response (Success):**
```json
{
  "success": true,
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "data": {
    "text": "Humanized version of your text",
    "thesaurus": {
      "example": ["example", "instance", "sample", "illustration"],
      "text": ["text", "content", "writing", "document"]
    }
  },
  "completedAt": "2025-09-30T13:07:26.000Z",
  "processingTime": 45000
}
```

**Response (Still Processing):**
```json
{
  "message": "Job still processing",
  "status": "processing",
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response (Failed):**
```json
{
  "error": "Job failed",
  "message": "Not logged in. Please ensure valid session exists.",
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error Responses:**
- `404`: Job not found
- `400`: Job failed
- `202`: Job still processing

---

### 5. Cancel Job
**DELETE** `/api/job/:jobId`

Cancels a waiting job (cannot cancel jobs that are already processing).

**Response (Success):**
```json
{
  "success": true,
  "message": "Job a1b2c3d4-e5f6-7890-abcd-ef1234567890 cancelled successfully"
}
```

**Response (Error):**
```json
{
  "error": "Job not found or cannot be cancelled",
  "message": "Job a1b2c3d4-e5f6-7890-abcd-ef1234567890 not found or already completed"
}
```

---

### 6. Queue Statistics
**GET** `/api/queue/stats`

Returns detailed statistics about the queue and browser pool.

**Response:**
```json
{
  "totalJobs": 25,
  "completedJobs": 20,
  "failedJobs": 2,
  "averageProcessingTime": 35000,
  "waiting": 2,
  "active": 1,
  "browserPool": {
    "total": 2,
    "active": 1,
    "available": 1
  },
  "queue": {
    "concurrency": 2,
    "averageWaitTime": 30000
  }
}
```

---

## Usage Examples

### Using cURL

**1. Submit a job:**
```bash
curl -X POST http://localhost:3001/api/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is AI-generated content that needs to be humanized",
    "options": {
      "includeThesaurus": true
    }
  }'
```

**2. Check job status:**
```bash
curl http://localhost:3001/api/status/YOUR_JOB_ID
```

**3. Get job result:**
```bash
curl http://localhost:3001/api/result/YOUR_JOB_ID
```

**4. Check health:**
```bash
curl http://localhost:3001/health
```

### Using JavaScript/Fetch

```javascript
// Submit job
const response = await fetch('http://localhost:3001/api/humanize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Your text to humanize',
    options: {
      includeThesaurus: true
    }
  })
});
const { jobId } = await response.json();

// Poll for completion
const pollResult = async (jobId) => {
  while (true) {
    const statusResponse = await fetch(`http://localhost:3001/api/status/${jobId}`);
    const status = await statusResponse.json();
    
    if (status.status === 'completed') {
      const resultResponse = await fetch(`http://localhost:3001/api/result/${jobId}`);
      return await resultResponse.json();
    } else if (status.status === 'failed') {
      throw new Error('Job failed');
    }
    
    // Wait 2 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

const result = await pollResult(jobId);
console.log('Humanized text:', result.data.text);
```

---

## Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
PORT=3001
NODE_ENV=production
```

### Server Configuration
Edit `server.js` to modify:
- `concurrency`: Number of concurrent browser instances (default: 2)
- `jobTimeout`: Maximum time for job processing (default: 2 minutes)
- `maxRetries`: Number of retry attempts (default: 3)

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input or job failed |
| 404  | Not Found - Job or endpoint not found |
| 500  | Internal Server Error - Server-side error |
| 202  | Accepted - Job still processing |

---

## Rate Limiting

The API uses queue-based rate limiting:
- Maximum concurrent jobs: Configurable (default: 2)
- Jobs are processed in FIFO order
- Failed jobs are automatically retried up to 3 times
- Job results are kept for 1 hour after completion

---

## Monitoring

### Health Endpoint
Monitor the `/health` endpoint for:
- Server uptime
- Queue statistics
- Browser pool status

### Logs
The server provides detailed logging for:
- Job submissions and completions
- Browser pool management
- Error tracking and debugging

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3001/health
   ```

4. **Submit your first job:**
   ```bash
   curl -X POST http://localhost:3001/api/humanize \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world, this is a test."}'
   ```