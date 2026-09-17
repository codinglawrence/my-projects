import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography } from 'antd';

interface StreamRendererProps {
  content: string;
  isStreaming: boolean;
}

const StreamRenderer: React.FC<StreamRendererProps> = ({ content, isStreaming }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  return (
    <div style={{ lineHeight: 1.8, padding: '4px 0' }}>
      <ReactMarkdown>{content}</ReactMarkdown>
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 18,
            backgroundColor: '#1677ff',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'blink 0.8s infinite',
          }}
        />
      )}
      <div ref={bottomRef} />
      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
    </div>
  );
};

export default StreamRenderer;
