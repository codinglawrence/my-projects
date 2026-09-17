import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, App, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import SessionSidebar from '../components/session/SessionSidebar';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import QuestionSuggestions from '../components/chat/QuestionSuggestions';
import StreamRenderer from '../components/chat/StreamRenderer';
import CitationCard from '../components/chat/CitationCard';
import { useAuth } from '../hooks/useAuth';
import { useSSE } from '../hooks/useSSE';
import { sessionsApi, type SessionItem, type MessageItem, type Citation } from '../api/sessions';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const ChatPageInner: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { message: antMsg } = App.useApp();
  const { sendMessage: sendSSE, isStreaming, streamContent, citations, reset } = useSSE();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [inited, setInited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await sessionsApi.list();
      const items = res.data.items;
      setSessions(items);
      return items;
    } catch {
      antMsg.error('获取会话列表失败');
      return [];
    }
  }, [antMsg]);

  const fetchMessages = useCallback(async (sessionId: number) => {
    try {
      const res = await sessionsApi.getMessages(sessionId);
      setMessages(res.data.items);
    } catch {
      antMsg.error('获取消息失败');
    }
  }, [antMsg]);

  const fetchSuggestions = useCallback(async (sessionId: number) => {
    try {
      const res = await sessionsApi.getSuggestions(sessionId);
      setSuggestions(res.data.suggestions);
    } catch {
      setSuggestions([]);
    }
  }, []);

  // Init: load sessions on first mount only (use ref to prevent StrictMode double-fire)
  const initStartedRef = useRef(false);
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const init = async () => {
      const items = await fetchSessions();
      if (items.length > 0) {
        setActiveSession(items[0]);
        await fetchMessages(items[0].id);
      } else {
        try {
          const res = await sessionsApi.create();
          setActiveSession(res.data);
          setSessions([res.data]);
        } catch {
          antMsg.error('创建会话失败');
        }
      }
      setInited(true);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When active session changes, load its messages & reset SSE
  useEffect(() => {
    if (!activeSession) return;
    fetchMessages(activeSession.id);
    fetchSuggestions(activeSession.id);
    reset();
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const handleSelectSession = useCallback((session: SessionItem) => {
    setActiveSession(session);
  }, []);

  const handleCreateSession = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);
    reset();
    try {
      const res = await sessionsApi.create();
      setSessions((prev) => [res.data, ...prev]);
      setActiveSession(res.data);
      setMessages([]);
      setSuggestions([]);
    } catch {
      antMsg.error('创建会话失败');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, reset, antMsg]);

  const handleDeleteSession = useCallback(async (id: number) => {
    try {
      await sessionsApi.delete(id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (activeSession?.id === id) {
          if (next.length > 0) {
            setActiveSession(next[0]);
          } else {
            setActiveSession(null);
            setMessages([]);
          }
        }
        return next;
      });
    } catch {
      antMsg.error('删除会话失败');
    }
  }, [activeSession?.id, antMsg]);

  const handleSend = useCallback(async (content: string) => {
    if (!activeSession) return;

    const tempId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: tempId as any,
      session_id: activeSession.id,
      role: 'user',
      content,
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSuggestions([]);

    try {
      const { answer, citations: cits } = await sendSSE(activeSession.id, content);

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}` as any,
        session_id: activeSession.id,
        role: 'assistant',
        content: answer,
        citations: JSON.stringify(cits),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-rename if default title
      if (activeSession.title === '新会话' && content) {
        const newTitle = content.slice(0, 20).replace(/\n/g, ' ').trim() || '新会话';
        setActiveSession((prev) => (prev ? { ...prev, title: newTitle } : prev));
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, title: newTitle } : s))
        );
      }

      fetchSessions();
    } catch (err: any) {
      antMsg.error(`发送失败: ${err.message || '未知错误'}`);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    }
  }, [activeSession, sendSSE, fetchSessions, antMsg]);

  const handleSuggestionClick = useCallback((question: string) => {
    handleSend(question);
  }, [handleSend]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1677ff',
          padding: '0 24px',
        }}
      >
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          知识库问答系统
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff' }}>{user?.username}</span>
          {user?.role === 'admin' && (
            <>
              <a style={{ color: '#fff' }} onClick={() => navigate('/admin/dashboard')}>
                管理后台
              </a>
              <a style={{ color: '#fff' }} onClick={() => navigate('/admin/knowledge')}>
                知识库
              </a>
            </>
          )}
          <a style={{ color: '#fff' }} onClick={handleLogout}>
            退出
          </a>
        </div>
      </Header>
      <Layout>
        <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSession?.id ?? null}
            onSelect={handleSelectSession}
            onCreate={handleCreateSession}
            onDelete={handleDeleteSession}
          />
        </Sider>
        <Content style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {messages.length === 0 && !isStreaming && (
              <div style={{ textAlign: 'center', marginTop: 80, marginBottom: 20 }}>
                <Title level={3} type="secondary">
                  智能知识库助手
                </Title>
                <p style={{ color: '#888' }}>
                  上传您的商品文档，开始提问。我会帮您查找最相关的信息！
                </p>
                <QuestionSuggestions suggestions={suggestions} onSelect={handleSuggestionClick} />
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
              />
            ))}

            {isStreaming && streamContent && (
              <div>
                <ChatBubble
                  role="assistant"
                  content=""
                  isStreaming={true}
                />
                <StreamRenderer content={streamContent} isStreaming={isStreaming} />
                {citations.length > 0 && <CitationCard citations={citations} />}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPageInner;