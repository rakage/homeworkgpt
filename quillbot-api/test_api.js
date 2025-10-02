const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

class HumanizerAPIClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }

  async submitJob(text, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/humanize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, options })
    });
    return await response.json();
  }

  async getJobStatus(jobId) {
    const response = await fetch(`${this.baseUrl}/api/status/${jobId}`);
    return await response.json();
  }

  async getJobResult(jobId) {
    const response = await fetch(`${this.baseUrl}/api/result/${jobId}`);
    return await response.json();
  }

  async cancelJob(jobId) {
    const response = await fetch(`${this.baseUrl}/api/job/${jobId}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  async getQueueStats() {
    const response = await fetch(`${this.baseUrl}/api/queue/stats`);
    return await response.json();
  }

  async pollForCompletion(jobId, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getJobStatus(jobId);
      
      console.log(`📊 Job ${jobId} status: ${status.status}`);
      
      if (status.status === 'completed') {
        return await this.getJobResult(jobId);
      } else if (status.status === 'failed') {
        const result = await this.getJobResult(jobId);
        throw new Error(`Job failed: ${result.message || result.error}`);
      }
      
      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Job polling timeout');
  }
}

async function runTests() {
  const client = new HumanizerAPIClient();
  
  console.log('🧪 Starting Humanizer API Tests...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await client.health();
    console.log('✅ Health check passed:', JSON.stringify(health, null, 2));
    console.log();

    // Test 2: Submit a job
    console.log('2️⃣ Submitting humanization job...');
    const testText = "This is an AI-generated text that needs to be humanized. It contains technical jargon and formal language that should be converted to more natural, human-like writing. The artificial intelligence system generated this content using advanced algorithms and machine learning techniques.";
    
    const jobResponse = await client.submitJob(testText, {
      includeThesaurus: true,
      timeout: 120000
    });
    
    console.log('✅ Job submitted:', JSON.stringify(jobResponse, null, 2));
    
    if (!jobResponse.success) {
      throw new Error('Failed to submit job');
    }
    
    const jobId = jobResponse.jobId;
    console.log();

    // Test 3: Check job status
    console.log('3️⃣ Checking job status...');
    const status = await client.getJobStatus(jobId);
    console.log('✅ Job status:', JSON.stringify(status, null, 2));
    console.log();

    // Test 4: Get queue stats
    console.log('4️⃣ Getting queue statistics...');
    const stats = await client.getQueueStats();
    console.log('✅ Queue stats:', JSON.stringify(stats, null, 2));
    console.log();

    // Test 5: Poll for completion
    console.log('5️⃣ Polling for job completion...');
    try {
      const result = await client.pollForCompletion(jobId);
      console.log('✅ Job completed successfully!');
      console.log('📝 Original text:', testText);
      console.log('🤖 Humanized text:', result.data.text);
      console.log('📚 Thesaurus data:', Object.keys(result.data.thesaurus || {}).length, 'words');
      console.log('⏱️ Processing time:', result.processingTime, 'ms');
    } catch (error) {
      console.error('❌ Job failed:', error.message);
    }
    console.log();

    // Test 6: Submit multiple jobs to test queue
    console.log('6️⃣ Testing queue with multiple jobs...');
    const multipleJobs = [];
    for (let i = 1; i <= 3; i++) {
      const jobResp = await client.submitJob(`Test job ${i}: This is a shorter text for testing the queue system.`);
      multipleJobs.push(jobResp.jobId);
      console.log(`✅ Job ${i} submitted: ${jobResp.jobId}`);
    }
    
    // Check queue status
    const queueStats = await client.getQueueStats();
    console.log('📊 Queue after submitting multiple jobs:', {
      waiting: queueStats.waiting,
      active: queueStats.active,
      total: queueStats.totalJobs
    });
    console.log();

    // Test 7: Cancel one of the waiting jobs
    console.log('7️⃣ Testing job cancellation...');
    if (multipleJobs.length > 0) {
      try {
        const cancelResult = await client.cancelJob(multipleJobs[2]);
        console.log('✅ Cancellation result:', JSON.stringify(cancelResult, null, 2));
      } catch (error) {
        console.log('⚠️ Cancellation failed (job may have already started):', error.message);
      }
    }
    console.log();

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Show additional error details if available
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', await error.response.text());
    }
  }
}

// Helper function to test without server running
async function testWithoutServer() {
  console.log('🔧 Testing API client without server (should show connection errors)...\n');
  
  const client = new HumanizerAPIClient();
  
  try {
    const health = await client.health();
    console.log('Unexpected: Server appears to be running');
  } catch (error) {
    console.log('✅ Expected error when server is not running:', error.code);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--no-server')) {
    await testWithoutServer();
  } else {
    await runTests();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HumanizerAPIClient;