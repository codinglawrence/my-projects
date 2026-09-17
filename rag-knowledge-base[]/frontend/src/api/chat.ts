import type { Citation } from './sessions';

export interface SSEChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  citations?: Citation[];
  full_answer?: string;
  message?: string;
}

export async function sendMessageSSE(
  sessionId: number,
  content: string,
  onChunk: (text: string) => void,
  onDone: (citations: Citation[], fullAnswer: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  const token = localStorage.getItem('rag_token');
  if (!token) {
    onError('未登录');
    return;
  }

  const response = await fetch(`/api/sessions/${sessionId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errText = await response.text();
    onError(`请求失败: ${response.status} ${errText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('无法读取响应流');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      if (trimmed === 'data: [DONE]') continue;

      try {
        const data: SSEChunk = JSON.parse(trimmed.slice(6));
        if (data.type === 'chunk' && data.content) {
          onChunk(data.content);
        } else if (data.type === 'done') {
          onDone(data.citations || [], data.full_answer || '');
        } else if (data.type === 'error') {
          onError(data.message || '未知错误');
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }
}
