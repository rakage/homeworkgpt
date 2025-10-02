const path = require('path');
const AIHumanizer = require(path.join(__dirname, '..', 'humanizer'));
const EventEmitter = require('events');

class HumanizerQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.concurrency = options.concurrency || 2;
    this.browserOptions = options.browserOptions || {};
    this.maxRetries = options.maxRetries || 3;
    this.jobTimeout = options.jobTimeout || 120000; // 2 minutes
    
    // Queue management
    this.jobs = new Map(); // jobId -> job data
    this.waitingQueue = []; // Array of job IDs waiting to be processed
    this.activeJobs = new Map(); // jobId -> { worker, startTime }
    this.completedJobs = new Map(); // jobId -> result (kept for 1 hour)
    this.failedJobs = new Map(); // jobId -> error info
    
    // Browser pool management
    this.browserPool = [];
    this.activeBrowsers = new Set();
    this.browserPoolSize = this.concurrency;
    
    // Stats
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0
    };
    
    // Initialize browser pool
    this.initializeBrowserPool();
    
    // Start queue processor
    this.startQueueProcessor();
    
    // Clean up completed jobs every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 3600000); // 1 hour
  }

  async initializeBrowserPool() {
    console.log(`🏊 Initializing browser pool with ${this.browserPoolSize} browsers...`);
    
    for (let i = 0; i < this.browserPoolSize; i++) {
      try {
        const humanizer = new AIHumanizer({
          ...this.browserOptions,
          profilePath: path.join(__dirname, '..', 'chrome_profile') // Use single shared profile
        });
        
        this.browserPool.push(humanizer);
        console.log(`✅ Browser ${i + 1}/${this.browserPoolSize} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize browser ${i + 1}:`, error.message);
      }
    }
    
    console.log(`🏊 Browser pool initialized with ${this.browserPool.length} browsers`);
  }

  async add(jobData) {
    const { jobId, text, options, clientInfo } = jobData;
    
    const job = {
      id: jobId,
      text,
      options,
      clientInfo,
      status: 'waiting',
      createdAt: new Date(),
      retryCount: 0
    };
    
    this.jobs.set(jobId, job);
    this.waitingQueue.push(jobId);
    this.stats.totalJobs++;
    
    console.log(`📋 Job ${jobId} added to queue. Position: ${this.waitingQueue.length}`);
    
    this.emit('jobQueued', job);
    
    return { id: jobId };
  }

  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 1000); // Check every second
  }

  async processQueue() {
    // Process waiting jobs if we have available browsers
    while (
      this.waitingQueue.length > 0 && 
      this.activeJobs.size < this.concurrency &&
      this.browserPool.length > this.activeBrowsers.size
    ) {
      const jobId = this.waitingQueue.shift();
      const job = this.jobs.get(jobId);
      
      if (!job) continue;
      
      await this.processJob(jobId);
    }
  }

  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    // Get available browser
    const humanizer = await this.getBrowser();
    if (!humanizer) {
      // No browser available, put job back in queue
      this.waitingQueue.unshift(jobId);
      return;
    }
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    const activeJob = {
      humanizer,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        this.timeoutJob(jobId);
      }, this.jobTimeout)
    };
    
    this.activeJobs.set(jobId, activeJob);
    
    console.log(`🔄 Processing job ${jobId}...`);
    this.emit('jobStarted', job);
    
    try {
      // Check login status first
      const loginStatus = await humanizer.checkIfLoggedIn();
      
      if (!loginStatus.loggedIn) {
        throw new Error('Not logged in. Please ensure valid session exists.');
      }
      
      // Launch browser if not already launched
      if (!humanizer.browser) {
        await humanizer.launch();
      }
      
      // Process the humanization
      const result = await humanizer.humanizeText(job.text);
      
      await this.completeJob(jobId, result);
      
    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error.message);
      await this.failJob(jobId, error);
    } finally {
      // Clear timeout
      if (activeJob.timeout) {
        clearTimeout(activeJob.timeout);
      }
      
      // Return browser to pool
      this.returnBrowser(humanizer);
      this.activeJobs.delete(jobId);
    }
  }

  async completeJob(jobId, result) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    const completedAt = new Date();
    const processingTime = completedAt - job.startedAt;
    
    const completedJob = {
      ...job,
      status: 'completed',
      completedAt,
      processingTime,
      data: result.success ? result.data : null,
      success: result.success,
      error: result.success ? null : result.error
    };
    
    this.jobs.set(jobId, completedJob);
    this.completedJobs.set(jobId, completedJob);
    
    this.stats.completedJobs++;
    this.updateAverageProcessingTime(processingTime);
    
    console.log(`✅ Job ${jobId} completed in ${processingTime}ms`);
    this.emit('jobCompleted', completedJob);
  }

  async failJob(jobId, error) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.retryCount++;
    
    // Retry if under limit
    if (job.retryCount < this.maxRetries) {
      console.log(`🔄 Retrying job ${jobId} (attempt ${job.retryCount + 1}/${this.maxRetries})`);
      job.status = 'waiting';
      this.waitingQueue.push(jobId);
      return;
    }
    
    // Job failed permanently
    const failedAt = new Date();
    const failedJob = {
      ...job,
      status: 'failed',
      failedAt,
      error: error.message,
      processingTime: failedAt - job.startedAt
    };
    
    this.jobs.set(jobId, failedJob);
    this.failedJobs.set(jobId, failedJob);
    
    this.stats.failedJobs++;
    
    console.log(`❌ Job ${jobId} failed permanently: ${error.message}`);
    this.emit('jobFailed', failedJob);
  }

  timeoutJob(jobId) {
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      console.log(`⏰ Job ${jobId} timed out`);
      this.failJob(jobId, new Error('Job timeout'));
    }
  }

  async getBrowser() {
    // Find available browser
    for (const humanizer of this.browserPool) {
      if (!this.activeBrowsers.has(humanizer)) {
        this.activeBrowsers.add(humanizer);
        return humanizer;
      }
    }
    return null;
  }

  returnBrowser(humanizer) {
    this.activeBrowsers.delete(humanizer);
  }

  // Public API methods
  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    
    const status = {
      jobId,
      status: job.status,
      createdAt: job.createdAt,
      processingTime: job.startedAt ? Date.now() - job.startedAt : null
    };
    
    if (job.status === 'waiting') {
      status.position = this.waitingQueue.indexOf(jobId) + 1;
      status.estimatedWaitTime = this.getEstimatedWaitTime(status.position);
    }
    
    return status;
  }

  async getJobResult(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async getJobPosition(bullJobId) {
    // For our simple implementation, we don't have bull job IDs
    // This would need to be adapted if using Bull queue
    return 1;
  }

  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'waiting') {
      const index = this.waitingQueue.indexOf(jobId);
      if (index > -1) {
        this.waitingQueue.splice(index, 1);
        job.status = 'cancelled';
        return true;
      }
    }
    
    return false;
  }

  getEstimatedWaitTime(position = null) {
    const queuePosition = position || this.waitingQueue.length;
    const avgProcessingTime = this.stats.averageProcessingTime || 30000; // 30 seconds default
    const concurrentJobs = Math.min(this.concurrency, queuePosition);
    
    return Math.ceil((queuePosition / concurrentJobs) * avgProcessingTime);
  }

  getWaitingCount() {
    return this.waitingQueue.length;
  }

  getActiveCount() {
    return this.activeJobs.size;
  }

  getCompletedCount() {
    return this.stats.completedJobs;
  }

  getFailedCount() {
    return this.stats.failedJobs;
  }

  getStats() {
    return {
      ...this.stats,
      waiting: this.getWaitingCount(),
      active: this.getActiveCount(),
      browserPool: {
        total: this.browserPool.length,
        active: this.activeBrowsers.size,
        available: this.browserPool.length - this.activeBrowsers.size
      },
      queue: {
        concurrency: this.concurrency,
        averageWaitTime: this.getEstimatedWaitTime()
      }
    };
  }

  updateAverageProcessingTime(processingTime) {
    if (this.stats.completedJobs === 1) {
      this.stats.averageProcessingTime = processingTime;
    } else {
      // Moving average
      const weight = 0.1; // Give more weight to recent times
      this.stats.averageProcessingTime = 
        (1 - weight) * this.stats.averageProcessingTime + weight * processingTime;
    }
  }

  cleanupCompletedJobs() {
    const cutoff = new Date(Date.now() - 3600000); // 1 hour ago
    
    for (const [jobId, job] of this.completedJobs.entries()) {
      if (job.completedAt < cutoff) {
        this.completedJobs.delete(jobId);
        this.jobs.delete(jobId);
      }
    }
    
    for (const [jobId, job] of this.failedJobs.entries()) {
      if (job.failedAt < cutoff) {
        this.failedJobs.delete(jobId);
        this.jobs.delete(jobId);
      }
    }
    
    console.log('🧹 Cleaned up old completed/failed jobs');
  }

  async close() {
    console.log('🔒 Closing HumanizerQueue...');
    
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Close all browsers
    for (const humanizer of this.browserPool) {
      try {
        await humanizer.close();
      } catch (error) {
        console.error('❌ Error closing browser:', error.message);
      }
    }
    
    // Clear active job timeouts
    for (const activeJob of this.activeJobs.values()) {
      if (activeJob.timeout) {
        clearTimeout(activeJob.timeout);
      }
    }
    
    console.log('✅ HumanizerQueue closed');
  }
}

module.exports = HumanizerQueue;