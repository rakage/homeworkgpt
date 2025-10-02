# QuillBot Humanizer API

A scalable REST API for text humanization using QuillBot with job queue management and browser pooling.

## Features

✅ **Queue-based Processing**: Handle multiple requests efficiently with automatic queuing  
✅ **Browser Pooling**: Concurrent processing with multiple browser instances  
✅ **Database Login Check**: Fast login verification using session database  
✅ **Automatic Retries**: Failed jobs are automatically retried up to 3 times  
✅ **Job Tracking**: Full status tracking and result retrieval  
✅ **Rate Limiting**: Built-in rate limiting through queue management  
✅ **Comprehensive API**: RESTful endpoints for all operations  
✅ **AI Humanizer automation**  
✅ **Database storage for results**  
✅ **Thesaurus integration**  
✅ **Chrome profile persistence**  
✅ **Screenshot capabilities**  
✅ **Comprehensive error handling**

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **Chrome/Chromium browser**
3. **Valid QuillBot account**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Ensure Login Session
Make sure you have a valid QuillBot session by running the login script first:
```bash
npm run login
# or
node login.js your-email@example.com your-password
```

### 3. Start the API Server
```bash
npm start
```

The server will start on `http://localhost:3001` by default.

### 4. Test the API
```bash
# Check health
curl http://localhost:3001/health

# Submit a job
curl -X POST http://localhost:3001/api/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test text that needs to be humanized."}'

# Run comprehensive tests
node test_api.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check and queue statistics |
| POST | `/api/humanize` | Submit text for humanization |
| GET | `/api/status/:jobId` | Check job status |
| GET | `/api/result/:jobId` | Get job result |
| DELETE | `/api/job/:jobId` | Cancel a waiting job |
| GET | `/api/queue/stats` | Get detailed queue statistics |

## Usage Examples

### REST API Usage

**Submit a job:**
```javascript
const response = await fetch('http://localhost:3001/api/humanize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your text to humanize',
    options: { includeThesaurus: true }
  })
});
const { jobId } = await response.json();
```

**Get result:**
```javascript
const result = await fetch(`http://localhost:3001/api/result/${jobId}`);
const data = await result.json();
console.log('Humanized text:', data.data.text);
```

### Direct Module Usage

```javascript
const AIHumanizer = require('./humanizer');

async function example() {
  const humanizer = new AIHumanizer({
    headless: true,
    persistentProfile: true
  });

  try {
    await humanizer.launch();
    
    // Check login status
    const loginStatus = await humanizer.checkIfLoggedIn();
    console.log('Logged in:', loginStatus.loggedIn);
    
    // Humanize text
    const result = await humanizer.humanizeText('Your text here');
    console.log('Result:', result.data);
    
  } finally {
    await humanizer.close();
  }
}
```

### Command Line Usage

```bash
# Basic humanization
node humanizer.js "Your text to humanize goes here"

# With options
node humanizer.js "Your text here" --headless --screenshot
```

## Configuration

### Environment Variables
Create a `.env` file:
```env
PORT=3001
NODE_ENV=production
```

### Server Settings
Edit `server.js` to modify:
- **Concurrency**: Number of concurrent browser instances (default: 2)
- **Job Timeout**: Maximum processing time (default: 2 minutes)
- **Max Retries**: Retry attempts for failed jobs (default: 3)

### Database

The system uses SQLite databases:

- `humanizer_data.db`: Stores humanization results
- `session_data.db`: Stores login session data
- `chrome_profile/`: Chrome profile data

## Queue System

The API uses an intelligent queue system:

- **FIFO Processing**: Jobs processed in first-in-first-out order
- **Browser Pool**: Multiple browser instances for concurrent processing
- **Auto Retry**: Failed jobs automatically retry with exponential backoff
- **Job Persistence**: Results kept for 1 hour after completion
- **Status Tracking**: Real-time job status and progress tracking

### Queue Statistics
Monitor queue performance via `/api/queue/stats`:
- Total jobs processed
- Current waiting/active jobs
- Average processing time
- Browser pool utilization

## Output Format

The humanizer returns data in this JSON format:

```json
{
  "success": true,
  "data": {
    "text": "Humanized version of your text",
    "thesaurus": {
      "word1": ["synonym1", "synonym2", "synonym3"],
      "word2": ["synonym1", "synonym2"]
    }
  },
  "originalText": "Your original text",
  "sessionId": "session_123456789",
  "completedAt": "2025-09-30T13:07:26.000Z",
  "processingTime": 45000
}
```

## Testing

Run the comprehensive test suite:
```bash
node test_api.js
```

Test without server (connection error test):
```bash
node test_api.js --no-server
```

## Troubleshooting

### Common Issues

**1. "Not logged in" errors**
- Run `npm run login` to establish a valid session
- Check that `session_data.db` contains active sessions
- Verify session hasn't expired (sessions expire after 24 hours)

**2. Queue not processing jobs**
- Check browser pool initialization in logs
- Verify sufficient system resources
- Ensure ports are not blocked

**3. Jobs timing out**
- Increase `jobTimeout` in server configuration
- Check network connectivity to QuillBot
- Monitor system resource usage

**4. Browser launch issues:**
- Ensure Chrome/Chromium is installed
- Try setting `CHROME_PATH` environment variable
- Check system resources (RAM, disk space)

### Debug Mode
Run with additional logging:
```bash
DEBUG=* npm start
```

### Session Management

To check session status:

```bash
# View session database
sqlite3 session_data.db "SELECT * FROM session_status;"

# Clear all sessions (forces re-login)
rm -rf chrome_profile/
rm session_data.db
```

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    API      │───▶│    Queue    │
│  Requests   │    │   Server    │    │   Manager   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                  │
                           ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  Database   │    │   Browser   │
                   │   Session   │    │    Pool     │
                   └─────────────┘    └─────────────┘
```

## Monitoring

### Health Monitoring
```bash
curl http://localhost:3001/health
```

### Queue Monitoring
```bash
curl http://localhost:3001/api/queue/stats
```

### Log Monitoring
The server provides detailed console logging for:
- Job lifecycle events
- Browser pool management
- Error tracking and debugging
- Performance metrics

## Performance Tips

- **Optimal Concurrency**: Start with 2 browsers, adjust based on system resources
- **Text Size**: Smaller texts (< 1000 chars) process faster
- **Queue Monitoring**: Use `/api/queue/stats` to monitor performance
- **Resource Management**: Monitor CPU/memory usage with multiple browsers
- Use `--headless` mode for better performance
- Enable persistent profiles to skip repeated logins
- Process shorter texts for faster results

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference with examples.

## Security Notes

- Credentials are not stored permanently
- Session data is encrypted in SQLite database
- Chrome profiles contain sensitive data - keep secure
- Use environment variables for production deployments

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the API server |
| `npm run login` | Run login script |
| `npm run dev` | Start server in development mode |
| `npm run humanize` | Run single humanization (command line) |
| `npm test` | Run login script with test flag |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.