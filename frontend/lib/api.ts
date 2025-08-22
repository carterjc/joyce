const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Transcription {
  id: string;
  filename: string;
  text: string;
  created_at: string;
  has_summary: boolean;
}

export interface Summary {
  id: string;
  transcription_id: string;
  text: string;
  created_at: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {  
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();


    return data;
  }

  // Transcription endpoints
  async uploadAudio(file: File): Promise<Transcription> {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const transcription = await response.json();
    return transcription;
  }

  async getTranscriptions(): Promise<Transcription[]> {
    return this.request<Transcription[]>('/transcriptions', {});
  }

  async getTranscription(id: string): Promise<Transcription> {
    return this.request<Transcription>(`/transcriptions/${id}`, {});
  }

  async summarizeTranscription(id: string): Promise<Summary> {
    // Cache summaries for longer since they're expensive to generate (15 minutes)
    return this.request<Summary>(`/summarize/${id}`, {
      method: 'GET',
    });
  }

  // Utility method to force refresh data
  async refreshTranscriptions(): Promise<Transcription[]> {
    return this.getTranscriptions();
  }

  async refreshTranscription(id: string): Promise<Transcription> {
    return this.getTranscription(id);
  }

  async downloadAudio(id: string): Promise<{ filename: string; success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/transcriptions/${id}/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'audio_file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { filename, success: true };
    } catch (error) {
      console.error('Audio download failed:', error);
      throw error;
    }
  }
}


export const apiClient = new ApiClient();