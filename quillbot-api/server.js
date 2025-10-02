const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const HumanizerQueue = require('./queue/HumanizerQueue');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Initialize the humanizer queue
const humanizerQueue = new HumanizerQueue({
  concurrency: 2, // Number of concurrent browser instances
  browserOptions: {
    headless: true,
    persistentProfile: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queue: {
      waiting: humanizerQueue.getWaitingCount(),
      active: humanizerQueue.getActiveCount(),
      completed: humanizerQueue.getCompletedCount(),
      failed: humanizerQueue.getFailedCount()
    }
  });
});

// Submit humanization job
app.post('/api/humanize', async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text field is required and must be a string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be less than 10,000 characters'
      });
    }

    const jobId = uuidv4();
    
    // Add job to queue
    const job = await humanizerQueue.add({
      jobId,
      text,
      options: {
        includeThesaurus: options.includeThesaurus !== false,
        timeout: options.timeout || 60000,
        ...options
      },
      clientInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }
    });

    console.log(`📋 New humanization job queued: ${jobId}`);

    res.json({
      success: true,
      jobId,
      message: 'Job queued successfully',
      estimatedWaitTime: humanizerQueue.getEstimatedWaitTime(),
      position: await humanizerQueue.getJobPosition(job.id)
    });

  } catch (error) {
    console.error('❌ Error queuing job:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to queue humanization job'
    });
  }
});

// Get job status
app.get('/api/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = await humanizerQueue.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID: ${jobId}`
      });
    }

    res.json(jobStatus);

  } catch (error) {
    console.error('❌ Error getting job status:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve job status'
    });
  }
});

// Get job result
app.get('/api/result/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await humanizerQueue.getJobResult(jobId);

    if (!result) {
      return res.status(404).json({
        error: 'Result not found',
        message: `No result found for job ID: ${jobId}`
      });
    }

    if (result.status === 'failed') {
      return res.status(400).json({
        error: 'Job failed',
        message: result.error || 'Job processing failed',
        jobId
      });
    }

    if (result.status !== 'completed') {
      return res.status(202).json({
        message: 'Job still processing',
        status: result.status,
        jobId
      });
    }

    res.json({
      success: true,
      jobId,
      data: result.data,
      completedAt: result.completedAt,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('❌ Error getting job result:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve job result'
    });
  }
});

// Get queue statistics
app.get('/api/queue/stats', (req, res) => {
  try {
    const stats = humanizerQueue.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting queue stats:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve queue statistics'
    });
  }
});

// Cancel a job
app.delete('/api/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = await humanizerQueue.cancelJob(jobId);

    if (cancelled) {
      res.json({
        success: true,
        message: `Job ${jobId} cancelled successfully`
      });
    } else {
      res.status(404).json({
        error: 'Job not found or cannot be cancelled',
        message: `Job ${jobId} not found or already completed`
      });
    }

  } catch (error) {
    console.error('❌ Error cancelling job:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel job'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  
  try {
    await humanizerQueue.close();
    console.log('✅ Queue closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  
  try {
    await humanizerQueue.close();
    console.log('✅ Queue closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Humanizer API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`⚡ Queue concurrency: ${humanizerQueue.concurrency} browsers`);
});

module.exports = app;