import React from 'react';
import { Palette, Zap, Terminal, TrendingUp, Layers, ChevronRight, Hash } from 'lucide-react';
import { TaxonomyCategory, TaxonomySubCategory } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface SaoMenuProps {
  taxonomy: TaxonomyCategory[];
  selectedL1: string | null;
  selectedL2: string | null;
  onSelectL1: (l1Id: string | null) => void;
  onSelectL2: (l2Id: string | null) => void;
  recordCounts: {
    total: number;
    byL1: Record<string, number>;
    byL2: Record<string, number>;
  };
}

const ICON_MAP: Record<string, React.ReactNode> = {
  palette: <Palette className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  terminal: <Terminal className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />
};

export const SaoMenu: React.FC<SaoMenuProps> = ({
  taxonomy,
  selectedL1,
  selectedL2,
  onSelectL1,
  onSelectL2,
  recordCounts
}) => {
  const currentCategory = taxonomy.find(c => c.id === selectedL1);

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {/* L1 Radial / Cascade Level */}
      <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl">
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 border-b border-slate-800/80 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-cyan-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            L1 场景收敛
          </span>
          <span className="text-slate-500 font-mono tabular-nums">共 {recordCounts.total} 项</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-1 gap-1.5">
          {/* All records button */}
          <button
            onClick={() => {
              saoAudio.playSelect();
              onSelectL1(null);
              onSelectL2(null);
            }}
            onMouseEnter={() => saoAudio.playHover()}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
              selectedL1 === null
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2 h-2 rounded-full ${selectedL1 === null ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600 group-hover:bg-slate-400'}`} />
              <span className="truncate">全部资源汇总</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 ml-2">
              {recordCounts.total}
            </span>
          </button>

          {taxonomy.map((cat) => {
            const isActive = selectedL1 === cat.id;
            const count = recordCounts.byL1[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  saoAudio.playSelect();
                  onSelectL1(cat.id);
                  onSelectL2(null);
                }}
                onMouseEnter={() => saoAudio.playHover()}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`p-1 rounded ${isActive ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {ICON_MAP[cat.icon] || <Layers className="w-4 h-4" />}
                  </div>
                  <span className="truncate tracking-wide">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'text-cyan-300 font-semibold' : 'text-slate-500'}`}>
                    {count}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* L2 Cascading Sub-scenes */}
      <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl">
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 border-b border-slate-800/80 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-indigo-400 font-mono">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            L2 二级分支 {currentCategory ? `· ${currentCategory.name}` : ''}
          </span>
          <span className="text-slate-500 text-[11px]">
            {selectedL2 ? '已锁定子项' : '全部子类'}
          </span>
        </div>

        {currentCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5">
            <button
              onClick={() => {
                saoAudio.playSelect();
                onSelectL2(null);
              }}
              onMouseEnter={() => saoAudio.playHover()}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                selectedL2 === null
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
              }`}
            >
              <span className="truncate">全部二级分类 ({currentCategory.name})</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {recordCounts.byL1[currentCategory.id] || 0}
              </span>
            </button>

            {currentCategory.children.map((sub: TaxonomySubCategory) => {
              const isSubActive = selectedL2 === sub.id;
              const subCount = recordCounts.byL2[sub.id] || 0;

              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    saoAudio.playSelect();
                    onSelectL2(sub.id);
                  }}
                  onMouseEnter={() => saoAudio.playHover()}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                    isSubActive
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-indigo-400 shadow-[0_0_6px_#818cf8]' : 'bg-slate-600'}`} />
                    <span className="truncate">{sub.name}</span>
                  </div>
                  <span className={`text-[11px] font-mono tabular-nums ${isSubActive ? 'text-indigo-300 font-semibold' : 'text-slate-500'}`}>
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-32">
            <span className="mb-1 text-slate-400">当前处于全局视图</span>
            <span className="text-[11px] text-slate-500">点击左侧 L1 场景可级联展开特定二级类别</span>
          </div>
        )}
      </div>
    </div>
  );
};
