import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  Copy, 
  Edit2, 
  Trash2, 
  Star, 
  Sparkles, 
  LogOut, 
  LogIn, 
  ChevronRight, 
  X,
  Check,
  LayoutGrid,
  List,
  FilterX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import type { Prompt, UserProfile } from './types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// API Helpers
const API_BASE = '/api';

const fetchPrompts = async (authorId: string) => {
  const res = await fetch(`${API_BASE}/prompts?authorId=${authorId}`);
  return res.json();
};

const savePrompt = async (prompt: any) => {
  const res = await fetch(`${API_BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  });
  return res.json();
};

const updatePrompt = async (id: string, prompt: any) => {
  const res = await fetch(`${API_BASE}/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  });
  return res.json();
};

const deletePromptApi = async (id: string) => {
  const res = await fetch(`${API_BASE}/prompts/${id}`, {
    method: 'DELETE'
  });
  return res.json();
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Local Storage Auth (Simulated Anonymous Login)
  useEffect(() => {
    const storedUser = localStorage.getItem('prompt_master_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Prompts Fetcher
  const refreshPrompts = async () => {
    if (!user) return;
    try {
      const data = await fetchPrompts(user.uid);
      setPrompts(data);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshPrompts();
    } else {
      setPrompts([]);
    }
  }, [user]);

  // Derived Data
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    prompts.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || p.tags?.includes(selectedTag);
      const matchesFavorite = !showFavoritesOnly || p.isFavorite;
      return matchesSearch && matchesTag && matchesFavorite;
    });
  }, [prompts, searchQuery, selectedTag, showFavoritesOnly]);

  // Actions
  const handleLogin = () => {
    const uid = 'anon_' + Math.random().toString(36).substring(2, 15);
    const newUser: UserProfile = {
      uid,
      displayName: '游客用户',
      email: null,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
      role: 'user'
    };
    localStorage.setItem('prompt_master_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('prompt_master_user');
    setUser(null);
  };

  const toggleFavorite = async (prompt: Prompt) => {
    try {
      await updatePrompt(prompt.id, {
        ...prompt,
        isFavorite: !prompt.isFavorite
      });
      refreshPrompts();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const deletePrompt = async (id: string) => {
    if (confirm('确定要删除这个提示词吗？')) {
      await deletePromptApi(id);
      refreshPrompts();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setShowFavoritesOnly(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PromptMaster</h1>
          <p className="text-gray-600 mb-8">智能提示词管理器，让你的 AI 交互更高效。</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <LogIn className="w-5 h-5" />
            开始使用
          </button>
          <p className="mt-4 text-xs text-gray-400">本地存储，即刻体验</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">PromptMaster</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={<LayoutGrid className="w-4 h-4" />} 
              label="全部提示词" 
              active={!showFavoritesOnly && !selectedTag}
              onClick={() => { setShowFavoritesOnly(false); setSelectedTag(null); }}
            />
            <SidebarItem 
              icon={<Star className="w-4 h-4" />} 
              label="我的收藏" 
              active={showFavoritesOnly}
              onClick={() => { setShowFavoritesOnly(true); setSelectedTag(null); }}
            />
          </nav>

          <div className="mt-8">
            <div className="flex items-center justify-between px-3 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                标签过滤
              </h3>
              {selectedTag && (
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-indigo-600 hover:underline"
                >
                  清除
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {allTags.map(tag => (
                <SidebarItem 
                  key={tag}
                  icon={<Tag className="w-4 h-4" />} 
                  label={tag} 
                  active={selectedTag === tag}
                  onClick={() => { setSelectedTag(tag); setShowFavoritesOnly(false); }}
                />
              ))}
              {allTags.length === 0 && (
                <p className="px-3 text-sm text-gray-400 italic">暂无标签</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-3">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="搜索标题或内容关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 rounded-lg text-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {(searchQuery || selectedTag || showFavoritesOnly) && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  重置筛选
                </button>
              )}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => { setEditingPrompt(null); setIsEditorOpen(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                新建提示词
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Active Filters Bar */}
            {(searchQuery || selectedTag || showFavoritesOnly) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 mr-2">正在筛选:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md flex items-center gap-1">
                    关键词: "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </span>
                )}
                {selectedTag && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md flex items-center gap-1">
                    标签: {selectedTag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTag(null)} />
                  </span>
                )}
                {showFavoritesOnly && (
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md flex items-center gap-1">
                    仅收藏
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setShowFavoritesOnly(false)} />
                  </span>
                )}
              </div>
            )}

            {filteredPrompts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">未找到匹配的提示词</h3>
                <p className="text-gray-500 mb-6">尝试更改搜索词或标签过滤。</p>
                <button 
                  onClick={clearFilters}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  清除所有筛选条件
                </button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredPrompts.map(prompt => (
                    <PromptCard 
                      key={prompt.id} 
                      prompt={prompt} 
                      viewMode={viewMode}
                      onEdit={() => { setEditingPrompt(prompt); setIsEditorOpen(true); }}
                      onDelete={() => deletePrompt(prompt.id)}
                      onToggleFavorite={() => toggleFavorite(prompt)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <PromptEditor 
            prompt={editingPrompt} 
            onClose={() => setIsEditorOpen(false)} 
            userId={user.uid}
            onSave={refreshPrompts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4" />}
    </button>
  );
}

function PromptCard({ prompt, viewMode, onEdit, onDelete, onToggleFavorite }: { 
  prompt: Prompt, 
  viewMode: 'grid' | 'list',
  onEdit: () => void,
  onDelete: () => void,
  onToggleFavorite: () => void
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col",
        viewMode === 'list' && "flex-row items-center p-4 gap-4"
      )}
    >
      <div className={cn("p-5 flex-1", viewMode === 'list' && "p-0")}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">{prompt.title}</h3>
          <button 
            onClick={onToggleFavorite}
            className={cn("p-1 rounded-md transition-colors", prompt.isFavorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400")}
          >
            <Star className={cn("w-4 h-4", prompt.isFavorite && "fill-current")} />
          </button>
        </div>
        
        <div className={cn(
          "text-sm text-gray-600 mb-4 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100",
          viewMode === 'grid' ? "line-clamp-4 h-24" : "line-clamp-2"
        )}>
          {prompt.content}
        </div>

        <div className="flex flex-wrap gap-2">
          {prompt.tags?.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={cn(
        "px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity",
        viewMode === 'list' && "opacity-100 bg-transparent border-none p-0"
      )}>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <button 
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            copied ? "bg-green-100 text-green-700" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          )}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? '已复制' : '复制内容'}
        </button>
      </div>
    </motion.div>
  );
}

function PromptEditor({ prompt, onClose, userId, onSave }: { prompt: Prompt | null, onClose: () => void, userId: string, onSave: () => void }) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(prompt?.tags || []);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect variables
  const variables = useMemo(() => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))) : [];
  }, [content]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleOptimize = async () => {
    if (!content.trim()) return;
    setIsOptimizing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `你是一个专业的 Prompt 工程师。请优化以下提示词，使其结构更清晰、指令更明确，并保留其中的变量（如果有）。
        
        原始提示词：
        ${content}
        
        请直接输出优化后的提示词内容，不要包含任何解释。`,
      });
      if (response.text) {
        setContent(response.text.trim());
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        id: prompt?.id || 'p_' + Math.random().toString(36).substring(2, 15),
        title,
        content,
        tags,
        variables,
        authorId: userId,
        isFavorite: prompt?.isFavorite || false
      };

      if (prompt) {
        await updatePrompt(prompt.id, data);
      } else {
        await savePrompt(data);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{prompt ? '编辑提示词' : '新建提示词'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">标题</label>
            <input 
              type="text" 
              placeholder="给你的提示词起个名字..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">内容</label>
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing || !content.trim()}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className={cn("w-3 h-3", isOptimizing && "animate-pulse")} />
                {isOptimizing ? 'AI 优化中...' : 'AI 智能优化'}
              </button>
            </div>
            <textarea 
              placeholder="输入提示词内容。使用 {{变量名}} 来定义变量。"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono text-sm resize-none"
            />
            {variables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">检测到变量:</span>
                {variables.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded border border-amber-100">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">标签</label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input 
                type="text" 
                placeholder="输入标签并按回车..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Check className="w-4 h-4" />}
            保存提示词
          </button>
        </div>
      </motion.div>
    </div>
  );
}
