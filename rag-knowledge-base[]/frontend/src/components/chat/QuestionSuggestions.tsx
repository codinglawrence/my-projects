import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionSuggestionsProps {
  suggestions: string[];
  onSelect: (question: string) => void;
}

const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <BulbOutlined style={{ color: '#faad14' }} />
          <Text>建议问题</Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Space wrap>
        {suggestions.map((q, i) => (
          <Button key={i} size="small" onClick={() => onSelect(q)}>
            {q}
          </Button>
        ))}
      </Space>
    </Card>
  );
};

export default QuestionSuggestions;
