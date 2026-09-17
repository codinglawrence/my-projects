import React, { useState, useEffect, useCallback } from 'react';
import { Card, Space, Button, Input, Modal, App, Typography, Descriptions, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import DocumentList from '../components/knowledge/DocumentList';
import DocumentUploader from '../components/knowledge/DocumentUploader';
import TextEntryModal from '../components/knowledge/TextEntryModal';
import { knowledgeApi, type DocumentItem } from '../api/knowledge';

const { Title } = Typography;

const KnowledgeManage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [textEntryOpen, setTextEntryOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const { message, modal } = App.useApp();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await knowledgeApi.listDocuments(1, 100, keyword || undefined);
      setDocuments(res.data.items);
    } catch (err: any) {
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: number) => {
    try {
      await knowledgeApi.deleteDocument(id);
      message.success('删除成功');
      fetchDocuments();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '删除失败');
    }
  };

  const handleRebuild = () => {
    modal.confirm({
      title: '确认重建',
      content: '重建将清空所有向量索引并重新对全部文档进行切片和向量化，此操作不可撤销。',
      onOk: async () => {
        try {
          const res = await knowledgeApi.rebuildIndex();
          message.success(`重建完成：${res.data.document_count} 个文档，${res.data.chunk_count} 个切片`);
          fetchDocuments();
        } catch (err: any) {
          message.error('重建失败');
        }
      },
    });
  };

  const handlePreview = async (doc: DocumentItem) => {
    try {
      const res = await knowledgeApi.getDocument(doc.id);
      setPreviewDoc(res.data);
    } catch {
      message.error('获取文档详情失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>知识库管理</Title>
          <Space>
            <Input
              placeholder="搜索文档标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <DocumentUploader onSuccess={fetchDocuments} />
            <Button icon={<PlusOutlined />} onClick={() => setTextEntryOpen(true)}>
              手动录入
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDocuments} loading={loading}>
              刷新
            </Button>
            <Button danger onClick={handleRebuild}>
              重建索引
            </Button>
          </Space>
        </div>

        <DocumentList
          dataSource={documents}
          loading={loading}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
      </Card>

      <TextEntryModal
        open={textEntryOpen}
        onClose={() => setTextEntryOpen(false)}
        onSuccess={fetchDocuments}
      />

      <Modal
        title={`文档预览：${previewDoc?.title || ''}`}
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        footer={null}
        width={800}
      >
        {previewDoc && (
          <>
            <Descriptions column={3} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="类型">
                <Tag>{previewDoc.file_type.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="切片数">{previewDoc.chunk_count}</Descriptions.Item>
              <Descriptions.Item label="上传时间">
                {new Date(previewDoc.uploaded_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
            <Title level={5}>文档内容</Title>
            <pre style={{
              maxHeight: 300,
              overflow: 'auto',
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {previewDoc.content}
            </pre>
            {previewDoc.chunks && previewDoc.chunks.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>切片预览（前 5 条）</Title>
                {previewDoc.chunks.slice(0, 5).map((chunk) => (
                  <Card key={chunk.id} size="small" style={{ marginBottom: 8 }}>
                    <Tag color="blue">#{chunk.chunk_index + 1}</Tag>
                    {chunk.content.length > 200
                      ? chunk.content.slice(0, 200) + '...'
                      : chunk.content}
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default KnowledgeManage;
