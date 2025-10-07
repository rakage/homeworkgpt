import { resolve } from 'path';

let queueInstance: any = null;

// Singleton instance that persists across hot reloads in development
const globalForQueue = global as unknown as { humanizerQueue: any };

// Declare webpack require for TypeScript
declare const __webpack_require__: any;

// Load the CommonJS module dynamically
function loadHumanizerQueue() {
  // Get absolute path to the module
  const modulePath = resolve(process.cwd(), 'quillbot-api', 'queue', 'HumanizerQueue.js');
  
  console.log('🔍 Loading HumanizerQueue from:', modulePath);
  
  // Use eval to bypass Next.js bundling and webpack warnings
  let requireFunc: any;
  try {
    // Check if we're in webpack bundled environment
    requireFunc = typeof __webpack_require__ !== 'undefined' 
      ? eval('require') 
      : require;
  } catch {
    // Fallback to regular require
    requireFunc = require;
  }
    
  try {
    const module = requireFunc(modulePath);
    console.log('✅ HumanizerQueue loaded successfully');
    return module;
  } catch (error: any) {
    console.error('❌ Failed to load HumanizerQueue:', error?.message);
    console.error('📍 Module path:', modulePath);
    console.error('🔧 Stack:', error?.stack);
    throw error;
  }
}

export async function getHumanizerQueue() {
  // Return existing instance if available
  if (globalForQueue.humanizerQueue) {
    return globalForQueue.humanizerQueue;
  }

  if (queueInstance) {
    return queueInstance;
  }

  // Load the HumanizerQueue class
  const HumanizerQueue = loadHumanizerQueue();

  // Initialize new queue instance
  const queue = new HumanizerQueue({
    concurrency: parseInt(process.env.HUMANIZER_CONCURRENCY || '2'),
    browserOptions: {
      headless: process.env.HUMANIZER_HEADLESS !== 'false',
      persistentProfile: true
    },
    maxRetries: parseInt(process.env.HUMANIZER_MAX_RETRIES || '3'),
    jobTimeout: parseInt(process.env.HUMANIZER_JOB_TIMEOUT || '120000')
  });

  // Store in global to persist across hot reloads in development
  if (process.env.NODE_ENV !== 'production') {
    globalForQueue.humanizerQueue = queue;
  }

  queueInstance = queue;

  // Setup graceful shutdown
  const cleanup = async () => {
    console.log('\n🛑 Shutting down humanizer queue...');
    try {
      await queue.close();
      console.log('✅ Humanizer queue closed successfully');
    } catch (error: any) {
      console.error('❌ Error closing humanizer queue:', error?.message);
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);

  return queue;
}

export function getQueueInstanceIfExists() {
  return globalForQueue.humanizerQueue || queueInstance;
}
