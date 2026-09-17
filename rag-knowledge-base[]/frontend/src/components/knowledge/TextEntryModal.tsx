import React, { useState } from 'react';
import { Modal, Form, Input, App } from 'antd';
import { knowledgeApi } from '../../api/knowledge';

interface TextEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TextEntryModal: React.FC<TextEntryModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await knowledgeApi.addTextEntry(values.title, values.content);
      message.success('录入成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        message.error(err.response.data.detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="手动录入文本"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="请输入文档标题" />
        </Form.Item>
        <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
          <Input.TextArea rows={12} placeholder="请输入商品信息文本内容" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TextEntryModal;
