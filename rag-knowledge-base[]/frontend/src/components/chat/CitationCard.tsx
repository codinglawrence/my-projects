import React, { useState } from 'react';
import { Card, Typography, Collapse } from 'antd';
import type { Citation } from '../../api/sessions';

const { Text, Paragraph } = Typography;

interface CitationCardProps {
  citations: Citation[];
}

const CitationCard: React.FC<CitationCardProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  const items = citations.map((c) => ({
    key: String(c.index),
    label: `[${c.index}] ${c.content.slice(0, 60)}...`,
    children: (
      <>
        <Text type="secondary" style={{ fontSize: 12 }}>
          来源文档 ID: {c.source} | 切片 #{c.chunk_index}
        </Text>
        <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {c.content}
        </Paragraph>
      </>
    ),
  }));

  return (
    <Card size="small" title="引用来源" style={{ marginTop: 8 }}>
      <Collapse items={items} size="small" />
    </Card>
  );
};

export default CitationCard;
