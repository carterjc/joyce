const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Transcription {
  id: string;
  filename: string;
  text: string;
  created_at: string;
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
    options: RequestInit = {}
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

    return response.json();
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

    return response.json();
  }

  async getTranscriptions(): Promise<Transcription[]> {
    return this.request<Transcription[]>('/transcriptions');
  }

  async getTranscription(id: string): Promise<Transcription> {
    return this.request<Transcription>(`/transcriptions/${id}`);
  }

  async summarizeTranscription(id: string): Promise<Summary> {
    return this.request<Summary>(`/summarize/${id}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();