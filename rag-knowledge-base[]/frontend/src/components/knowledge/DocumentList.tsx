import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, App } from 'antd';
import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { DocumentItem } from '../../api/knowledge';

interface DocumentListProps {
  dataSource: DocumentItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onPreview: (doc: DocumentItem) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ dataSource, loading, onDelete, onPreview }) => {
  const { message } = App.useApp();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (t: string) => <Tag>{t.toUpperCase()}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (v: number) => formatFileSize(v),
    },
    {
      title: '切片数',
      dataIndex: 'chunk_count',
      key: 'chunk_count',
      width: 80,
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: DocumentItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => onPreview(record)}
          >
            预览
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后对应向量数据也将被删除"
            onConfirm={() => onDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
    />
  );
};

export default DocumentList;
