import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Search, 
  Star, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Tag, 
  Sparkles 
} from 'lucide-react';
import { PersonalPrinciple, ReviewCategory } from '../types';

interface PrinciplesBankProps {
  principles: PersonalPrinciple[];
  onAddPrinciple: (principle: Partial<PersonalPrinciple>) => Promise<void>;
  onUpdatePrinciple: (id: string, principle: Partial<PersonalPrinciple>) => Promise<void>;
  onDeletePrinciple: (id: string) => Promise<void>;
}

export const PrinciplesBank: React.FC<PrinciplesBankProps> = ({
  principles,
  onAddPrinciple,
  onUpdatePrinciple,
  onDeletePrinciple,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<PersonalPrinciple | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ReviewCategory>('战略决策');
  const [formStatement, setFormStatement] = useState('');
  const [formRationale, setFormRationale] = useState('');

  const categories = ['全部', '工作事业', '战略决策', '个人成长', '团队协作', '健康生活'];

  const openNewModal = () => {
    setEditingPrinciple(null);
    setFormCode(`${principles.length + 1}.0`);
    setFormTitle('');
    setFormCategory('战略决策');
    setFormStatement('');
    setFormRationale('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PersonalPrinciple) => {
    setEditingPrinciple(p);
    setFormCode(p.code);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormStatement(p.statement);
    setFormRationale(p.rationale);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStatement.trim()) {
      alert('请填写原则标题与核心准则陈述');
      return;
    }

    if (editingPrinciple) {
      await onUpdatePrinciple(editingPrinciple.id, {
        code: formCode,
        title: formTitle,
        category: formCategory,
        statement: formStatement,
        rationale: formRationale,
      });
    } else {
      await onAddPrinciple({
        code: formCode,
        title: formTitle,
        category: formCategory,
        statement: formStatement,
        rationale: formRationale,
        applicationCount: 1,
        isFavorite: false,
      });
    }
    setIsModalOpen(false);
  };

  const handleCopy = (p: PersonalPrinciple) => {
    navigator.clipboard.writeText(`《原则 ${p.code}：${p.title}》\n${p.statement}\n—— 达利欧式个人原则库`);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = principles.filter((p) => {
    const matchesCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="principles-bank-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg p-6 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#C5221F] bg-red-50 px-2 py-0.5 rounded border border-red-100">
              <Bookmark className="w-3 h-3" />
              <span>CODIFIED PRINCIPLES REPOSITORY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#121316]">
              个人原则法则卡片库
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl font-sans">
              “原则是应对现实的有效方法。将每次碰壁得出的领悟系统化编号，做决策时像检索程序算法一样调取使用。”
            </p>
          </div>

          <button
            id="add-principle-btn"
            onClick={openNewModal}
            className="px-4 py-2 bg-[#C5221F] hover:bg-[#A81A18] text-white text-xs font-semibold rounded flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>沉淀新原则</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#121316] text-[#FAF9F6]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索原则编号、标题、准则..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded focus:bg-white focus:border-[#C5221F] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Principle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => {
          const isCopied = copiedId === p.id;
          return (
            <div
              key={p.id}
              className="bg-white rounded-lg border border-stone-200 p-5 space-y-3.5 shadow-2xs hover:border-stone-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-[#121316] text-[#FAF9F6] rounded">
                      原则 {p.code}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500 px-2 py-0.5 bg-stone-100 rounded">
                      {p.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdatePrinciple(p.id, { isFavorite: !p.isFavorite })}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        p.isFavorite ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500'
                      }`}
                      title="收藏原则"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleCopy(p)}
                      className="p-1 text-stone-400 hover:text-stone-800 rounded cursor-pointer transition-colors"
                      title="复制原则卡片"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-base text-[#121316]">
                  {p.title}
                </h3>

                <blockquote className="font-serif italic text-sm text-stone-800 bg-[#FAF9F6] p-3 rounded border-l-2 border-l-[#C5221F] border border-stone-200 leading-relaxed">
                  “{p.statement}”
                </blockquote>

                {p.rationale && (
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    <span className="font-bold text-stone-700">由来与教训：</span>
                    {p.rationale}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono text-[11px]">
                  践行/引用次数: <strong className="text-stone-700">{p.applicationCount || 1}</strong> 次
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1 text-stone-500 hover:text-stone-900 rounded cursor-pointer"
                    title="编辑原则"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除原则“${p.title}”吗？`)) {
                        onDeletePrinciple(p.id);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                    title="删除原则"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Principle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-[#121316] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C5221F]">
              <h3 className="font-serif font-bold text-base">
                {editingPrinciple ? '编辑个人原则' : '沉淀新个人原则'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-stone-500 mb-1">原则编号 (如 1.3)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-stone-500 mb-1">所属分类</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-300 rounded"
                  >
                    <option value="战略决策">战略决策</option>
                    <option value="工作事业">工作事业</option>
                    <option value="个人成长">个人成长</option>
                    <option value="团队协作">团队协作</option>
                    <option value="健康生活">健康生活</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">原则标题 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：极度求真与极度透明"
                  className="w-full p-2 bg-white border border-stone-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">核心准则陈述 (The Principle Rule) *</label>
                <textarea
                  rows={3}
                  value={formStatement}
                  onChange={(e) => setFormStatement(e.target.value)}
                  placeholder="例如：永远不要把直接诱因误当根本原因；面对痛苦时停下来深呼吸并写下真实根因..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded font-serif italic text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">由来、背景与教训 (Rationale)</label>
                <textarea
                  rows={2}
                  value={formRationale}
                  onChange={(e) => setFormRationale(e.target.value)}
                  placeholder="例如：在经历过架构交付延期的教训后悟出，依靠意志力防错注定失败..."
                  className="w-full p-2 bg-white border border-stone-300 rounded text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C5221F] text-white rounded font-medium hover:bg-[#A81A18] cursor-pointer"
                >
                  保存原则
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
