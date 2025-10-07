import { NextRequest, NextResponse } from 'next/server';
import { getHumanizerQueue, getQueueInstanceIfExists } from '@/lib/humanizer-queue-singleton';

// GET /api/humanize/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Check if queue is already initialized
    const existingQueue = getQueueInstanceIfExists();
    
    if (!existingQueue) {
      return NextResponse.json({
        status: 'initializing',
        message: 'Queue not yet initialized',
        timestamp: new Date().toISOString()
      });
    }

    const queue = await getHumanizerQueue();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queue: {
        waiting: queue.getWaitingCount(),
        active: queue.getActiveCount(),
        completed: queue.getCompletedCount(),
        failed: queue.getFailedCount()
      }
    });
  } catch (error: any) {
    console.error('❌ Health check error:', error?.message);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
