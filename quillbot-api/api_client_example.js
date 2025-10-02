const axios = require('axios');

class QuillBotAPIClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async submitHumanization(text, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/api/humanize`, {
        text,
        options
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting humanization:', error.message);
      throw error;
    }
  }

  async getJobResult(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/result/${jobId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Job not found
      } else if (error.response?.status === 202) {
        return error.response.data; // Job still processing
      } else {
        console.error('❌ Error getting job result:', error.message);
        throw error;
      }
    }
  }

  async waitForJobCompletion(jobId, maxWaitTime = 120000, pollInterval = 2000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getJobResult(jobId);
      
      if (!result) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (result.status === 'completed') {
        return result.data; // Return the humanized text and thesaurus data
      }
      
      if (result.status === 'failed') {
        throw new Error(`Job ${jobId} failed: ${result.message || result.error}`);
      }

      // Job still processing, wait and try again
      console.log(`⏳ Job ${jobId} still processing... waiting ${pollInterval/1000}s`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for job ${jobId} to complete`);
  }

  async humanizeText(text, options = {}) {
    // Submit the job
    console.log('📤 Submitting humanization job...');
    const submissionResult = await this.submitHumanization(text, options);
    
    if (!submissionResult.success) {
      throw new Error(`Failed to submit job: ${submissionResult.message}`);
    }

    const jobId = submissionResult.jobId;
    console.log(`📋 Job submitted with ID: ${jobId}`);
    
    // Wait for completion and return the result
    console.log('⏳ Waiting for processing to complete...');
    const result = await this.waitForJobCompletion(jobId);
    
    console.log('✅ Humanization completed!');
    return result; // Contains { text: 'humanized text', thesaurus: {...} }
  }
}

// Example usage
async function main() {
  const client = new QuillBotAPIClient();

  const textToHumanize = "This is a test text that needs to be humanized. The AI will rewrite this content to sound more natural and human-like.";
  
  try {
    console.log('🤖 Starting humanization via API...');
    const result = await client.humanizeText(textToHumanize);
    
    console.log('\n📝 Original text:');
    console.log(textToHumanize);
    
    console.log('\n🤖 Humanized text:');
    console.log(result.text);
    
    console.log('\n📚 Thesaurus data:');
    console.log(JSON.stringify(result.thesaurus, null, 2));
    
    console.log('\n🎉 Success! Extracted the humanized text from the API.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = QuillBotAPIClient;