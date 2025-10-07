// Use empty string to make requests to the same domain (Next.js API routes)
const HUMANIZER_API_URL = process.env.NEXT_PUBLIC_HUMANIZER_API_URL || '';

export interface HumanizeOptions {
  includeThesaurus?: boolean;
  timeout?: number;
}

export interface HumanizeJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedWaitTime: number;
  position: number;
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  processingTime?: number;
  position?: number;
  estimatedWaitTime?: number;
}

export interface HumanizeResult {
  success: boolean;
  jobId: string;
  data: {
    text: string;
    thesaurus: Record<string, string[]>;
  };
  completedAt: string;
  processingTime: number;
}

export class HumanizerService {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${HUMANIZER_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  static async submitJob(
    text: string,
    options: HumanizeOptions = {}
  ): Promise<HumanizeJobResponse> {
    return this.request<HumanizeJobResponse>('/api/humanize', {
      method: 'POST',
      body: JSON.stringify({
        text,
        options: {
          includeThesaurus: options.includeThesaurus !== false,
          timeout: options.timeout || 60000,
        },
      }),
    });
  }

  static async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.request<JobStatus>(`/api/humanize/status/${jobId}`);
  }

  static async getJobResult(jobId: string): Promise<HumanizeResult> {
    return this.request<HumanizeResult>(`/api/humanize/result/${jobId}`);
  }

  static async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/humanize/job/${jobId}`, {
      method: 'DELETE',
    });
  }

  static async pollForResult(
    jobId: string,
    onProgress?: (status: JobStatus) => void,
    pollInterval: number = 2000
  ): Promise<HumanizeResult> {
    while (true) {
      const status = await this.getJobStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        return await this.getJobResult(jobId);
      }

      if (status.status === 'failed') {
        throw new Error('Job failed during processing');
      }

      if (status.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
}
