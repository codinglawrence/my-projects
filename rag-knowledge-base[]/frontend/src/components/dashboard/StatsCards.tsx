import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { DashboardStats } from '../../api/dashboard';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="用户总数"
            value={stats?.user_count ?? 0}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="文档总数"
            value={stats?.document_count ?? 0}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="会话总数"
            value={stats?.session_count ?? 0}
            prefix={<MessageOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={loading}>
          <Statistic
            title="今日问答数"
            value={stats?.today_qa_count ?? 0}
            prefix={<QuestionCircleOutlined />}
            suffix={`/ ${stats?.total_qa_count ?? 0} 总`}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
