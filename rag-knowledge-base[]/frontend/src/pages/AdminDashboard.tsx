import React, { useState, useEffect } from 'react';
import { Card, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/dashboard/StatsCards';
import { dashboardApi, type DashboardStats } from '../api/dashboard';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch {
        message.error('获取统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={4}>系统仪表盘</Title>
        <StatsCards stats={stats} loading={loading} />
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <a onClick={() => navigate('/chat')}>← 返回对话</a>
          <a onClick={() => navigate('/admin/knowledge')}>知识库管理 →</a>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
