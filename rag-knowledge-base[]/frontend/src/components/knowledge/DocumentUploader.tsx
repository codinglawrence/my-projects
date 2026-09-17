import React, { useState } from 'react';
import { Upload, Button, Input, Space, App } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { knowledgeApi } from '../../api/knowledge';

interface DocumentUploaderProps {
  onSuccess: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const { message } = App.useApp();

  const uploadProps: UploadProps = {
    beforeUpload: async (file) => {
      setUploading(true);
      try {
        await knowledgeApi.uploadDocument(file, title || file.name);
        message.success('上传成功');
        setTitle('');
        onSuccess();
      } catch (err: any) {
        message.error(err?.response?.data?.detail || '上传失败');
      } finally {
        setUploading(false);
      }
      return false; // Prevent default upload
    },
    accept: '.txt,.md,.json',
    maxCount: 1,
    showUploadList: false,
  };

  return (
    <Space>
      <Input
        placeholder="文档标题（可选，默认使用文件名）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: 300 }}
      />
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          上传文档
        </Button>
      </Upload>
    </Space>
  );
};

export default DocumentUploader;
