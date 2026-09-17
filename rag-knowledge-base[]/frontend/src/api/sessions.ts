import request from '../utils/request';

export interface SessionItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export const sessionsApi = {
  list: () =>
    request.get<any, { data: { items: SessionItem[]; total: number } }>('/sessions'),

  create: (title?: string) =>
    request.post<any, { data: SessionItem }>('/sessions', title ? { title } : {}),

  delete: (id: number) =>
    request.delete(`/sessions/${id}`),

  getMessages: (sessionId: number, page: number = 1, size: number = 50) =>
    request.get<any, { data: { items: MessageItem[]; total: number } }>(
      `/sessions/${sessionId}/messages`,
      { params: { page, size } }
    ),

  getSuggestions: (sessionId: number) =>
    request.get<any, { data: { suggestions: string[] } }>(`/sessions/${sessionId}/suggestions`),
};

export interface MessageItem {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  citations: string | null;
  created_at: string;
}

export interface Citation {
  index: number;
  content: string;
  source: string;
  chunk_index: string;
}
