import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getHumanizerQueue } from '@/lib/humanizer-queue-singleton';

// POST /api/humanize - Submit humanization job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, options = {} } = body;

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'Text field is required and must be a string'
        },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        {
          error: 'Text too long',
          message: 'Text must be less than 10,000 characters'
        },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const humanizerQueue = await getHumanizerQueue();

    // Add job to queue
    const job = await humanizerQueue.add({
      jobId,
      text,
      options: {
        includeThesaurus: options.includeThesaurus !== false,
        timeout: options.timeout || 60000,
        ...options
      },
      clientInfo: {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }
    });

    console.log(`📋 New humanization job queued: ${jobId}`);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job queued successfully',
      estimatedWaitTime: humanizerQueue.getEstimatedWaitTime(),
      position: await humanizerQueue.getJobPosition(job.id)
    });

  } catch (error: any) {
    console.error('❌ Error queuing job:', error?.message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to queue humanization job'
      },
      { status: 500 }
    );
  }
}
