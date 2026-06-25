import type { AnalyzeResponse, ScoreResponse, TemplatesResponse, OptimizeResponse } from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export const api = {
  async analyze(prompt: string, signal?: AbortSignal): Promise<AnalyzeResponse> {
    return fetchJSON<AnalyzeResponse>(`${API_BASE}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal,
    });
  },

  async score(prompt: string, detailed = true, signal?: AbortSignal): Promise<ScoreResponse> {
    return fetchJSON<ScoreResponse>(`${API_BASE}/score`, {
      method: 'POST',
      body: JSON.stringify({ prompt, detailed }),
      signal,
    });
  },

  async templates(category?: string, search?: string): Promise<TemplatesResponse> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<TemplatesResponse>(`${API_BASE}/templates${query}`);
  },

  async optimize(prompt: string, targetComponents?: string[], provider = 'openai'): Promise<OptimizeResponse> {
    return fetchJSON<OptimizeResponse>(`${API_BASE}/optimize`, {
      method: 'POST',
      body: JSON.stringify({ 
        prompt, 
        target_components: targetComponents,
        provider 
      }),
    });
  },
};
