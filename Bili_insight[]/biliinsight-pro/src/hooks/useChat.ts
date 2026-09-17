/**
 * useChat - AI 聊天逻辑 Hook
 * 管理对话消息、发送问题和流式响应
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { askQuestion } from '@/src/api/client';
import type { ChatMessage, ExtractionSession } from '@/src/types';

/**
 * AI 聊天 Hook
 * @param currentSession - 当前提取会话，提供上下文
 * @returns 聊天相关状态和方法
 */
export function useChat(currentSession: ExtractionSession | null) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /** 发送聊天问题 */
  const handleAsk = useCallback(async () => {
    if (!question.trim() || !currentSession) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: question },
    ];
    setChatMessages(newMessages);
    setQuestion('');
    setIsChatLoading(true);

    try {
      const context = '以下是UP主 ' + currentSession.uid + ' 的视频分析结果：\n' +
        currentSession.results.map(r => '标题: ' + r.title + '\n观点: ' + r.core_views.join(', ')).join('\n\n') +
        '\n\n整体总结: ' + currentSession.overall_summary;

      const data = await askQuestion(context, question);

      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: data.answer || '抱歉，我无法回答这个问题。' },
      ]);
    } catch (error) {
      console.error(error);
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后重试。' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [question, chatMessages, currentSession]);

  return {
    chatMessages, setChatMessages,
    question, setQuestion,
    isChatLoading,
    chatEndRef,
    handleAsk,
  };
}
