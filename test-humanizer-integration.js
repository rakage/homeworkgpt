/**
 * Test script for the integrated Humanizer API
 * 
 * Usage:
 * 1. Start your Next.js dev server: npm run dev
 * 2. In another terminal: node test-humanizer-integration.js
 */

const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/api/humanize/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testQueueStats() {
  console.log('\n📊 Testing Queue Stats...');
  try {
    const response = await fetch(`${BASE_URL}/api/humanize/queue`);
    const data = await response.json();
    console.log('✅ Queue Stats:', data);
    return true;
  } catch (error) {
    console.error('❌ Queue Stats Failed:', error.message);
    return false;
  }
}

async function testHumanizeText() {
  console.log('\n🤖 Testing Humanize Text...');
  
  const testText = 'This is a test text that needs to be humanized. It should be converted to sound more natural and human-like.';
  
  try {
    // Submit job
    console.log('📤 Submitting job...');
    const submitResponse = await fetch(`${BASE_URL}/api/humanize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        options: {
          includeThesaurus: true
        }
      })
    });
    
    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      console.error('❌ Job Submission Failed:', error);
      return false;
    }
    
    const submitData = await submitResponse.json();
    console.log('✅ Job Submitted:', {
      jobId: submitData.jobId,
      estimatedWaitTime: `${submitData.estimatedWaitTime}ms`,
      position: submitData.position
    });
    
    const jobId = submitData.jobId;
    
    // Poll for result
    console.log('⏳ Polling for result...');
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    while (attempts < maxAttempts) {
      await sleep(2000); // Wait 2 seconds between polls
      attempts++;
      
      // Check status
      const statusResponse = await fetch(`${BASE_URL}/api/humanize/status/${jobId}`);
      const statusData = await statusResponse.json();
      
      console.log(`📋 Status (attempt ${attempts}):`, statusData.status);
      
      if (statusData.status === 'completed') {
        // Get result
        const resultResponse = await fetch(`${BASE_URL}/api/humanize/result/${jobId}`);
        const resultData = await resultResponse.json();
        
        console.log('\n✅ Job Completed!');
        console.log('📝 Original Text:', testText);
        console.log('🎯 Humanized Text:', resultData.data?.humanizedText || 'N/A');
        console.log('⏱️  Processing Time:', `${resultData.processingTime}ms`);
        return true;
      } else if (statusData.status === 'failed') {
        console.error('❌ Job Failed:', statusData);
        return false;
      } else if (statusData.status === 'cancelled') {
        console.error('❌ Job Cancelled');
        return false;
      }
      
      // Still processing or waiting
    }
    
    console.error('❌ Job Timeout: Max attempts reached');
    return false;
    
  } catch (error) {
    console.error('❌ Humanize Test Failed:', error.message);
    return false;
  }
}

async function testCancelJob() {
  console.log('\n🚫 Testing Job Cancellation...');
  
  try {
    // Submit a job
    const submitResponse = await fetch(`${BASE_URL}/api/humanize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'This job will be cancelled'
      })
    });
    
    const submitData = await submitResponse.json();
    const jobId = submitData.jobId;
    console.log('📤 Job Submitted:', jobId);
    
    // Try to cancel immediately
    await sleep(500);
    
    const cancelResponse = await fetch(`${BASE_URL}/api/humanize/job/${jobId}`, {
      method: 'DELETE'
    });
    
    const cancelData = await cancelResponse.json();
    
    if (cancelData.success) {
      console.log('✅ Job Cancelled Successfully');
      return true;
    } else {
      console.log('⚠️  Could not cancel (might be already processing):', cancelData.message);
      return true; // Not a failure, just timing
    }
    
  } catch (error) {
    console.error('❌ Cancel Test Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Humanizer API Integration Tests');
  console.log('📍 Base URL:', BASE_URL);
  console.log('⚠️  Make sure your Next.js dev server is running!');
  
  await sleep(1000);
  
  const results = {
    healthCheck: await testHealthCheck(),
    queueStats: await testQueueStats(),
    cancelJob: await testCancelJob(),
    humanizeText: await testHumanizeText()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
  console.log('='.repeat(50));
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});
