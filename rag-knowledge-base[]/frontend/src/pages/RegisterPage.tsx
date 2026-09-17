import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      message.error('两次密码不一致');
      return;
    }
    if (values.password.length < 8) {
      message.error('密码长度至少 8 位');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(values.username, values.password);
      login(res.data.token, res.data.user);
      message.success('注册成功');
      navigate('/chat', { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '注册失败');
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
          <BookOutlined style={{ fontSize: 28, color: '#1677ff', marginBottom: 8 }} />
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            创建账号
          </Title>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">加入知识库问答平台</Text>
          </div>
        </div>

        <Card
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            borderRadius: 8,
          }}
        >
          <Form name="register" onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少 2 个字符' },
                { max: 50, message: '用户名最多 50 个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="用户名（2-50 个字符）"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码长度至少 8 位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="密码（至少 8 位）"
              />
            </Form.Item>
            <Form.Item
              name="confirm"
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="确认密码"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ margin: '16px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>已有账号？</Text>
          </Divider>
          <Link to="/login">
            <Button block>返回登录</Button>
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

export default RegisterPage;
