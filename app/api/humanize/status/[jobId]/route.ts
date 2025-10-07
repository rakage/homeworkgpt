import { NextRequest, NextResponse } from 'next/server';
import { getHumanizerQueue } from '@/lib/humanizer-queue-singleton';

// GET /api/humanize/status/:jobId - Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const humanizerQueue = await getHumanizerQueue();
    const jobStatus = await humanizerQueue.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        {
          error: 'Job not found',
          message: `No job found with ID: ${jobId}`
        },
        { status: 404 }
      );
    }

    return NextResponse.json(jobStatus);

  } catch (error: any) {
    console.error('❌ Error getting job status:', error?.message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve job status'
      },
      { status: 500 }
    );
  }
}
