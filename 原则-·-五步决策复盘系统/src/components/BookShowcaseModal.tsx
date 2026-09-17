import React from 'react';
import { X, ExternalLink, ArrowRight, CheckCircle, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface BookShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookShowcaseModal: React.FC<BookShowcaseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="book-showcase-modal" 
        className="relative w-full max-w-4xl bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg shadow-2xl overflow-hidden my-8"
      >
        {/* Header bar */}
        <div className="bg-[#121316] text-[#FAF9F6] px-6 py-4 flex items-center justify-between border-b-2 border-[#C5221F]">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-[#C5221F]" />
            <div>
              <h2 className="font-serif text-lg font-bold tracking-tight">
                瑞·达利欧《原则》(Principles) 设计与思想溯源
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                RAY DALIO · LIFE & WORK · BRIDGEWATER METHODOLOGY
              </p>
            </div>
          </div>
          <button
            id="close-book-modal-btn"
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Top section: Book Cover Showcase & Design Philosophy */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Book Cover Image container */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative group max-w-[280px] rounded shadow-xl border border-stone-200 overflow-hidden bg-white">
                <img
                  src="/principles_book_cover.jpg"
                  alt="瑞·达利欧《原则》精选封面设计"
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized editorial representation if image load fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback styling placeholder in case image doesn't load */}
                <div className="p-6 text-center border-t-4 border-[#C5221F] bg-[#FAF9F6]">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
                    NEW YORK TIMES BESTSELLER
                  </p>
                  <h3 className="text-2xl font-serif font-black tracking-wider text-[#121316] my-2">
                    PRINCIPLES
                  </h3>
                  <p className="text-xs font-serif italic text-stone-600">LIFE & WORK</p>
                  <div className="w-12 h-0.5 bg-[#C5221F] mx-auto my-3"></div>
                  <p className="text-xs font-mono font-bold tracking-wider text-stone-800">RAY DALIO</p>
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-mono text-center">
                极简、克制、黑白与绯红几何线条的经典装帧美学
              </p>
            </div>

            {/* Book essence */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase bg-red-50 text-[#C5221F] px-2.5 py-1 rounded border border-red-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>系统化设计源流</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#121316] leading-snug">
                “做一个极度求真与极度透明的人，把失败视为不可多得的进化原料。”
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                全球最大对冲基金——桥水基金（Bridgewater Associates）创始人瑞·达利欧在经历过1982年墨西哥债务危机差点破产的惨痛教训后，顿悟出了这一套彻底改造人类思维的系统。
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                达利欧认为：人无法凭借单薄的意志力克服人性与生俱来的自负障碍（Ego Barrier）和思维盲点。唯一的出路是——将自己和生活当做一台机器来审视，把每次痛苦转变为系统化修正，并将原则算法化。
              </p>

              <div className="p-3.5 bg-stone-100 rounded border border-stone-200 font-mono text-xs text-stone-700 space-y-1">
                <div className="font-bold text-[#C5221F]">达利欧进化铁律：</div>
                <div className="text-sm font-serif">PAIN + REFLECTION = PROGRESS</div>
                <div className="text-[11px] text-stone-500">痛苦 + 反思 = 进步（回避痛苦等于拒绝进化）</div>
              </div>
            </div>
          </div>

          {/* Five Step Process Deep Dive */}
          <div className="border-t border-stone-200 pt-6">
            <h4 className="text-base font-serif font-bold text-[#121316] mb-4 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-[#C5221F] inline-block"></span>
              <span>达利欧五步循环决策法（The 5-Step Process）</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 font-mono">
                  <span>STEP 01</span>
                  <span className="text-[#C5221F] font-bold">1</span>
                </div>
                <div className="font-bold text-stone-900 font-serif text-sm">明确目标</div>
                <p className="text-stone-600 leading-normal">
                  设定清晰量化的终极追求，严密区分一阶欲望（诱惑）与高阶目标。
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 font-mono">
                  <span>STEP 02</span>
                  <span className="text-[#C5221F] font-bold">2</span>
                </div>
                <div className="font-bold text-stone-900 font-serif text-sm">暴露问题</div>
                <p className="text-stone-600 leading-normal">
                  决不容忍任何问题。精准定位阻碍达标的痛点，绝不粉饰太平。
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-stone-200 space-y-1.5 border-l-2 border-l-[#C5221F]">
                <div className="flex items-center justify-between text-stone-400 font-mono">
                  <span>STEP 03</span>
                  <span className="text-[#C5221F] font-bold">3</span>
                </div>
                <div className="font-bold text-stone-900 font-serif text-sm">诊断根因</div>
                <p className="text-stone-600 leading-normal">
                  穿透表面近因，直面自尊障碍，连问5个为什么，找到机器设计缺陷。
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 font-mono">
                  <span>STEP 04</span>
                  <span className="text-[#C5221F] font-bold">4</span>
                </div>
                <div className="font-bold text-stone-900 font-serif text-sm">规划方案</div>
                <p className="text-stone-600 leading-normal">
                  把方案转化为机制与防错流程，提炼为可复用的普适性个人准则。
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between text-stone-400 font-mono">
                  <span>STEP 05</span>
                  <span className="text-[#C5221F] font-bold">5</span>
                </div>
                <div className="font-bold text-stone-900 font-serif text-sm">坚决执行</div>
                <p className="text-stone-600 leading-normal">
                  把规划坚定落实到位，建立客观指标追踪，闭环螺旋上升进化。
                </p>
              </div>
            </div>
          </div>

          {/* Key Principles Checklist */}
          <div className="bg-stone-50 p-5 rounded border border-stone-200">
            <h5 className="font-serif font-bold text-stone-900 text-sm mb-3">
              达利欧《原则》实践三大致命陷阱
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-800">误将近因当根因：</strong>
                  <p>例如“我太忙所以没做”，表面是时间不够，本质是优先级排序混乱与拖延逃避。</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-800">把五步混为一谈：</strong>
                  <p>不要在诊断问题时急于提解决方案；必须先把根因彻底挖透，再从容设计机制。</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-800">缺乏原则沉淀：</strong>
                  <p>不总结通用原则等于白白受罪。唯有沉淀在清单中的原则，才能在未来自动触发。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-4 border-t border-stone-200 flex justify-end">
          <button
            id="book-modal-confirm-btn"
            onClick={onClose}
            className="px-5 py-2 bg-[#121316] hover:bg-stone-800 text-white text-xs font-medium tracking-wide rounded cursor-pointer transition-colors"
          >
            领悟并开始复盘
          </button>
        </div>
      </div>
    </div>
  );
};
