import { useState, useCallback, useRef } from 'react';
import { sendMessageSSE } from '../api/chat';
import type { Citation } from '../api/sessions';

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (sessionId: number, content: string): Promise<{ answer: string; citations: Citation[] }> => {
      abortRef.current = false;
      setIsStreaming(true);
      setStreamContent('');
      setCitations([]);

      return new Promise((resolve, reject) => {
        sendMessageSSE(
          sessionId,
          content,
          (text) => {
            if (!abortRef.current) {
              setStreamContent((prev) => prev + text);
            }
          },
          (cits, fullAnswer) => {
            if (!abortRef.current) {
              setCitations(cits);
              setIsStreaming(false);
              resolve({ answer: fullAnswer, citations: cits });
            }
          },
          (error) => {
            setIsStreaming(false);
            reject(new Error(error));
          },
        );
      });
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setStreamContent('');
    setCitations([]);
  }, []);

  return { sendMessage, isStreaming, streamContent, citations, reset };
}
