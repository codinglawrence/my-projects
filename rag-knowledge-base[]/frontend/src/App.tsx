import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import KnowledgeManage from './pages/KnowledgeManage';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#16A34A',
          colorWarning: '#D97706',
          colorError: '#DC2626',
          colorTextBase: '#111827',
          colorTextSecondary: '#6B7280',
          colorBgBase: '#FFFFFF',
          borderRadius: 6,
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: 14,
          lineHeight: 1.6,
          paddingSM: 12,
          padding: 16,
          paddingLG: 24,
        },
        components: {
          Card: {
            borderRadiusLG: 8,
            paddingLG: 24,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
            fontWeight: 500,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Layout: {
            headerBg: '#1677ff',
            siderBg: '#FFFFFF',
          },
          Menu: {
            itemBorderRadius: 6,
          },
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/knowledge"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <KnowledgeManage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
