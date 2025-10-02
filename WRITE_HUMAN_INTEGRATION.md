# Write Human Integration Guide

This document explains the Write Human feature integration with the QuillBot API.

## Overview

The Write Human feature transforms AI-generated text into natural, human-like content using the QuillBot API. It includes:

- **Split Input/Output View**: Text box splits into two panels after clicking "Write Human"
- **Thesaurus Integration**: Click on underlined words to see synonym options
- **Real-time Processing**: Shows job status and progress
- **Interactive Word Replacement**: Select synonyms from dropdown to replace words

## Architecture

### Components

1. **Frontend Component** (`components/write-human.tsx`)
   - React component with split-panel interface
   - Input textarea for original text
   - Output panel with interactive thesaurus
   - Progress tracking and status display

2. **Service Layer** (`lib/services/humanizer.service.ts`)
   - API client for QuillBot humanizer service
   - Job submission and polling
   - Status tracking and result retrieval

3. **Backend API** (`quillbot-api/server.js`)
   - Express server with job queue
   - Browser automation for QuillBot interaction
   - Concurrent request handling

### Data Flow

```
User Input → WriteHuman Component → HumanizerService → QuillBot API
                                          ↓
                                    Job Queue
                                          ↓
                                    Browser Pool
                                          ↓
User Output ← WriteHuman Component ← Job Result ← QuillBot Processing
```

## API Endpoints

### Submit Job
```
POST http://localhost:3001/api/humanize
Body: {
  "text": "Your text here",
  "options": {
    "includeThesaurus": true,
    "timeout": 60000
  }
}
```

### Check Status
```
GET http://localhost:3001/api/status/:jobId
```

### Get Result
```
GET http://localhost:3001/api/result/:jobId
```

## Features

### 1. Split Input/Output View

When user clicks "Write Human":
- Input panel stays on the left
- Output panel appears on the right
- Both panels are visible simultaneously
- Responsive design adapts for mobile

### 2. Thesaurus Dropdown

- Words with thesaurus data are underlined with blue dotted line
- Hover shows chevron icon
- Click opens dropdown with up to 8 synonyms
- Select synonym to replace word in output
- Instant replacement with toast notification

### 3. Progress Tracking

- Shows job submission status
- Displays queue position when waiting
- Progress bar with percentage
- Real-time status updates via polling

### 4. Error Handling

- Network error detection
- Job failure messages
- Timeout handling
- Retry mechanism in backend

## Usage

### For Users

1. Navigate to `/dashboard/write-human`
2. Paste AI-generated text in the input box
3. Click "Humanize Text" button
4. Wait for processing (status shown)
5. View humanized output on the right
6. Click underlined words to see synonyms
7. Select synonyms to replace words
8. Copy final result using copy button

### For Developers

#### Starting the Services

1. Start QuillBot API:
```bash
cd quillbot-api
npm start
# Runs on http://localhost:3001
```

2. Start Next.js App:
```bash
npm run dev
# Runs on http://localhost:3000
```

#### Configuration

Set in `.env`:
```env
NEXT_PUBLIC_HUMANIZER_API_URL=http://localhost:3001
```

## Component Props & API

### WriteHuman Component

No props required - fully self-contained component.

### HumanizerService Methods

```typescript
// Submit text for humanization
HumanizerService.submitJob(text: string, options?: HumanizeOptions)
  → Promise<HumanizeJobResponse>

// Get job status
HumanizerService.getJobStatus(jobId: string)
  → Promise<JobStatus>

// Get job result
HumanizerService.getJobResult(jobId: string)
  → Promise<HumanizeResult>

// Poll for result with progress callback
HumanizerService.pollForResult(
  jobId: string,
  onProgress?: (status: JobStatus) => void,
  pollInterval?: number
) → Promise<HumanizeResult>

// Cancel job
HumanizerService.cancelJob(jobId: string)
  → Promise<{ success: boolean; message: string }>
```

## Type Definitions

```typescript
interface HumanizeOptions {
  includeThesaurus?: boolean;
  timeout?: number;
}

interface HumanizeJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedWaitTime: number;
  position: number;
}

interface JobStatus {
  jobId: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  processingTime?: number;
  position?: number;
  estimatedWaitTime?: number;
}

interface HumanizeResult {
  success: boolean;
  jobId: string;
  data: {
    text: string;
    thesaurus: Record<string, string[]>;
  };
  completedAt: string;
  processingTime: number;
}
```

## Testing

### Manual Testing

1. **Basic Flow**:
   - Enter text → Click humanize → Wait → See output
   
2. **Thesaurus**:
   - Click underlined words → Verify dropdown shows
   - Select synonym → Verify replacement works

3. **Error Cases**:
   - Empty text → Should show error
   - Text > 10,000 chars → Should show error
   - Backend down → Should show connection error

### Test Endpoints

```bash
# Test health
curl http://localhost:3001/health

# Test humanize
curl -X POST http://localhost:3001/api/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test"}'

# Test status
curl http://localhost:3001/api/status/YOUR_JOB_ID
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if QuillBot API is running on port 3001
   - Verify `NEXT_PUBLIC_HUMANIZER_API_URL` in `.env`

2. **Jobs Stuck in Processing**
   - Check browser pool in QuillBot API logs
   - Restart QuillBot API service
   - Check `/health` endpoint for queue stats

3. **Thesaurus Not Working**
   - Ensure `includeThesaurus: true` in options
   - Check result data structure in browser console
   - Verify thesaurus data in API response

4. **CORS Issues**
   - Ensure QuillBot API has CORS enabled
   - Check browser console for CORS errors

## Performance

- **Concurrent Jobs**: 2 browser instances by default
- **Average Processing Time**: 30-45 seconds per job
- **Job Timeout**: 60 seconds (configurable)
- **Polling Interval**: 2 seconds
- **Max Text Length**: 10,000 characters

## Future Enhancements

- [ ] Batch processing multiple texts
- [ ] Save/load drafts
- [ ] History of humanized texts
- [ ] Export to different formats
- [ ] Advanced thesaurus filters (by word type, formality)
- [ ] Side-by-side diff view
- [ ] Keyboard shortcuts for word replacement
- [ ] Custom synonym preferences

## Support

For issues or questions:
1. Check API logs: `quillbot-api/logs`
2. Check browser console for frontend errors
3. Test API directly using curl
4. Review API documentation: `quillbot-api/API_DOCUMENTATION.md`
