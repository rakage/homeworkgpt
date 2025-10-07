import { NextRequest, NextResponse } from 'next/server';
import { getHumanizerQueue } from '@/lib/humanizer-queue-singleton';

// DELETE /api/humanize/job/:jobId - Cancel a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const humanizerQueue = await getHumanizerQueue();
    const cancelled = await humanizerQueue.cancelJob(jobId);

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: `Job ${jobId} cancelled successfully`
      });
    } else {
      return NextResponse.json(
        {
          error: 'Job not found or cannot be cancelled',
          message: `Job ${jobId} not found or already completed`
        },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error cancelling job:', error?.message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to cancel job'
      },
      { status: 500 }
    );
  }
}
