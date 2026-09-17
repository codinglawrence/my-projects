import request from '../utils/request';

export interface DocumentItem {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  uploaded_at: string;
  content?: string;
  chunks?: ChunkItem[];
}

export interface ChunkItem {
  id: number;
  chunk_index: number;
  content: string;
  vector_id: string | null;
}

export const knowledgeApi = {
  listDocuments: (page: number = 1, size: number = 20, keyword?: string) =>
    request.get<any, { data: { items: DocumentItem[]; total: number } }>('/knowledge/documents', {
      params: { page, size, keyword },
    }),

  getDocument: (id: number) =>
    request.get<any, { data: DocumentItem }>(`/knowledge/documents/${id}`),

  uploadDocument: (file: File, title: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    return request.post<any, { data: DocumentItem }>('/knowledge/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addTextEntry: (title: string, content: string) =>
    request.post<any, { data: DocumentItem }>('/knowledge/documents/text', { title, content }),

  deleteDocument: (id: number) =>
    request.delete(`/knowledge/documents/${id}`),

  rebuildIndex: () =>
    request.post<any, { data: { document_count: number; chunk_count: number } }>('/knowledge/rebuild'),
};
