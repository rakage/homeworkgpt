import { NextRequest, NextResponse } from 'next/server';
import { getHumanizerQueue } from '@/lib/humanizer-queue-singleton';

// GET /api/humanize/result/:jobId - Get job result
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const humanizerQueue = await getHumanizerQueue();
    const result = await humanizerQueue.getJobResult(jobId);

    if (!result) {
      return NextResponse.json(
        {
          error: 'Result not found',
          message: `No result found for job ID: ${jobId}`
        },
        { status: 404 }
      );
    }

    if (result.status === 'failed') {
      return NextResponse.json(
        {
          error: 'Job failed',
          message: result.error || 'Job processing failed',
          jobId
        },
        { status: 400 }
      );
    }

    if (result.status !== 'completed') {
      return NextResponse.json(
        {
          message: 'Job still processing',
          status: result.status,
          jobId
        },
        { status: 202 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      data: result.data,
      completedAt: result.completedAt,
      processingTime: result.processingTime
    });

  } catch (error: any) {
    console.error('❌ Error getting job result:', error?.message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve job result'
      },
      { status: 500 }
    );
  }
}
