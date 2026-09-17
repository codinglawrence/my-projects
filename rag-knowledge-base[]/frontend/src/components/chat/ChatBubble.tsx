import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, Typography, Space } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { Citation } from '../../api/sessions';

const { Text } = Typography;

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[] | string | null;
  isStreaming?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content, citations, isStreaming }) => {
  const isUser = role === 'user';

  const parseCitations = (): Citation[] => {
    if (!citations) return [];
    if (typeof citations === 'string') {
      try {
        return JSON.parse(citations);
      } catch {
        return [];
      }
    }
    return citations;
  };

  const citationList = parseCitations();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <Card
        size="small"
        style={{
          maxWidth: '75%',
          backgroundColor: isUser ? '#EFF6FF' : '#FFFFFF',
          borderColor: isUser ? '#BFDBFE' : '#E5E7EB',
        }}
        styles={{ body: { padding: '12px 14px' } }}
      >
        <div style={{ marginBottom: 6 }}>
          <Space size={6}>
            {isUser ? <UserOutlined style={{ color: '#6B7280' }} /> : <RobotOutlined style={{ color: '#1677ff' }} />}
            <Text strong style={{ fontSize: 12, color: '#6B7280' }}>
              {isUser ? '我' : '知识库助手'}
            </Text>
          </Space>
        </div>
        <div style={{ lineHeight: 1.7, color: '#111827' }}>
          {isUser ? (
            <Text>{content}</Text>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
          {isStreaming && !isUser && (
            <span
              className="cursor-blink"
              style={{
                display: 'inline-block',
                width: 2,
                height: 16,
                backgroundColor: '#1677ff',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </div>
        {citationList.length > 0 && !isStreaming && (
          <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              引用来源：
            </Text>
            {citationList.map((c) => (
              <div key={c.index} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }}>
                  [{c.index}] {c.content.length > 100 ? c.content.slice(0, 100) + '...' : c.content}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatBubble;
