import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.username, values.password);
      login(res.data.token, res.data.user);
      message.success('登录成功');
      navigate('/chat', { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <div style={{ width: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space align="center" size={8}>
            <BookOutlined style={{ fontSize: 28, color: '#1677ff' }} />
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
              知识库问答系统
            </Title>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">基于 LangChain + RAG 的企业级智能问答平台</Text>
          </div>
        </div>

        <Card
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            borderRadius: 8,
          }}
        >
          <Title level={4} style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>
            账号登录
          </Title>

          <Form name="login" onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="用户名"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ margin: '16px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>还没有账号？</Text>
          </Divider>
          <Link to="/register">
            <Button block>创建新账号</Button>
          </Link>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            毕设项目 · 2026
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
