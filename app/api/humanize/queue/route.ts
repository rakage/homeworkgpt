import { NextRequest, NextResponse } from 'next/server';
import { getHumanizerQueue } from '@/lib/humanizer-queue-singleton';

// GET /api/humanize/queue - Get queue statistics
export async function GET(request: NextRequest) {
  try {
    const humanizerQueue = await getHumanizerQueue();
    const stats = humanizerQueue.getStats();
    
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('❌ Error getting queue stats:', error?.message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve queue statistics'
      },
      { status: 500 }
    );
  }
}
