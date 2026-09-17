import React from 'react';
import { List, Button, Typography, Popconfirm, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import type { SessionItem } from '../../api/sessions';

const { Text } = Typography;

interface SessionSidebarProps {
  sessions: SessionItem[];
  activeSessionId: number | null;
  onSelect: (session: SessionItem) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
}) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
          block
        >
          新建会话
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <List
          dataSource={sessions}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                cursor: 'pointer',
                padding: '10px 16px',
                backgroundColor: item.id === activeSessionId ? '#e6f4ff' : 'transparent',
                borderLeft: item.id === activeSessionId ? '3px solid #1677ff' : '3px solid transparent',
              }}
              actions={[
                <Popconfirm
                  key="delete"
                  title="确定删除此会话？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete(item.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<MessageOutlined style={{ color: '#1677ff' }} />}
                title={
                  <Text ellipsis style={{ maxWidth: 180 }}>
                    {item.title}
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(item.updated_at).toLocaleString('zh-CN')}
                  </Text>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无会话' }}
        />
      </div>
    </div>
  );
};

export default SessionSidebar;
