import React, { useState } from 'react';
import {
  Palette,
  Zap,
  Terminal,
  TrendingUp,
  Layers,
  Plus,
  Sliders,
  ChevronRight,
  GitBranch,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { TaxonomyCategory, ResourceRecord, GlobalFormatTag } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface SaoRadialMenuProps {
  taxonomy: TaxonomyCategory[];
  records: ResourceRecord[];
  formatTags: GlobalFormatTag[];
  selectedL1: string | null;
  selectedL2: string | null;
  onSelectL1: (l1Id: string | null) => void;
  onSelectL2: (l2Id: string | null) => void;
  onOpenQuickInput: () => void;
  onOpenSettings: () => void;
  onOpenRecordDetail: (record: ResourceRecord) => void;
  recordCounts: {
    total: number;
    byL1: Record<string, number>;
    byL2: Record<string, number>;
  };
  hudOpacity?: number;
}

// Earth Tone palette for L1 Orbs
const EARTH_ORBS: Record<string, { label: string; icon: React.ReactNode; activeBorder: string; activeText: string }> = {
  l1_content: {
    label: '内容与表达',
    icon: <Palette className="w-5 h-5" />,
    activeBorder: 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
    activeText: 'text-amber-300'
  },
  l1_productivity: {
    label: '效率与工作流',
    icon: <Zap className="w-5 h-5" />,
    activeBorder: 'border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    activeText: 'text-emerald-300'
  },
  l1_tech: {
    label: '技术与工程',
    icon: <Terminal className="w-5 h-5" />,
    activeBorder: 'border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    activeText: 'text-orange-300'
  },
  l1_biz: {
    label: '商业与认知',
    icon: <TrendingUp className="w-5 h-5" />,
    activeBorder: 'border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]',
    activeText: 'text-yellow-300'
  }
};

export const SaoRadialMenu: React.FC<SaoRadialMenuProps> = ({
  taxonomy,
  records,
  selectedL1,
  selectedL2,
  onSelectL1,
  onSelectL2,
  onOpenQuickInput,
  onOpenSettings,
  onOpenRecordDetail,
  recordCounts,
  hudOpacity = 0.65
}) => {
  const [hoveredOrb, setHoveredOrb] = useState<string | null>(null);
  const activeL1 = selectedL1 || hoveredOrb || taxonomy[0]?.id;
  const currentCategory = taxonomy.find(c => c.id === activeL1);

  // Filter records matching current tree branch
  const previewRecords = records
    .filter(r => {
      if (selectedL2) return r.l2 === selectedL2;
      if (selectedL1) return r.l1 === selectedL1;
      return true;
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 select-none w-full animate-in fade-in slide-in-from-top-6 duration-200">
      {/* 1. L1 Column: Earth-Tone Pixel Orbs with Dynamic HUD Background Opacity (can be 0) */}
      <div className="flex md:flex-col items-center gap-3 shrink-0 py-1">
        {/* All Records Orb */}
        <div className="relative group">
          <button
            onClick={() => {
              saoAudio.playSelect();
              onSelectL1(null);
              onSelectL2(null);
            }}
            onMouseEnter={() => {
              saoAudio.playHover();
              setHoveredOrb(null);
            }}
            style={{
              backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
              backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
            }}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors pixel-box ${
              selectedL1 === null
                ? 'border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'border-stone-700 text-stone-300 hover:border-amber-400 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>
          <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-950/95 border border-amber-500/80 px-2.5 py-1 rounded text-xs font-mono text-amber-300 shadow-xl z-30 pixel-box-sm">
            全部汇总 ({recordCounts.total})
          </div>
        </div>

        {/* Taxonomy L1 Orbs */}
        {taxonomy.map((cat) => {
          const cfg = EARTH_ORBS[cat.id] || {
            label: cat.name,
            icon: <Layers className="w-5 h-5" />,
            activeBorder: 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
            activeText: 'text-amber-300'
          };
          const isSelected = selectedL1 === cat.id;
          const isHovered = hoveredOrb === cat.id;
          const count = recordCounts.byL1[cat.id] || 0;

          return (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => {
                  saoAudio.playSelect();
                  onSelectL1(cat.id);
                  onSelectL2(null);
                }}
                onMouseEnter={() => {
                  saoAudio.playHover();
                  setHoveredOrb(cat.id);
                }}
                style={{
                  backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
                  backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
                }}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors pixel-box ${
                  isSelected || isHovered
                    ? `${cfg.activeBorder} ${cfg.activeText}`
                    : 'border-stone-700 text-stone-300 hover:border-amber-400 hover:text-white'
                }`}
              >
                {cfg.icon}
              </button>

              <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-950/95 border border-stone-600 px-2.5 py-1 rounded text-xs font-mono text-stone-200 shadow-xl z-30 flex items-center gap-1.5 pixel-box-sm">
                <span>{cat.name}</span>
                <span className="text-amber-400 font-bold tabular-nums">({count})</span>
              </div>
            </div>
          );
        })}

        {/* Quick Input Orb */}
        <div className="relative group pt-1">
          <button
            onClick={() => {
              saoAudio.playSummon();
              onOpenQuickInput();
            }}
            onMouseEnter={() => saoAudio.playHover()}
            title="快捷录入 (⌥+Space)"
            style={{
              backgroundColor: `rgba(69, 26, 3, ${Math.max(0, hudOpacity)})`,
              backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
            }}
            className="w-12 h-12 rounded-full border-2 border-amber-500/80 hover:border-amber-400 text-amber-300 flex items-center justify-center pixel-box transition-colors"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-950/95 border border-amber-500 px-2 py-1 rounded text-xs font-mono text-amber-300 shadow-xl z-30 pixel-box-sm">
            录入新条目 (⌥+Space)
          </div>
        </div>

        {/* Settings Orb */}
        <div className="relative group">
          <button
            onClick={() => {
              saoAudio.playSelect();
              onOpenSettings();
            }}
            onMouseEnter={() => saoAudio.playHover()}
            title="中枢系统设置"
            style={{
              backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
              backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
            }}
            className="w-12 h-12 rounded-full border-2 border-stone-700 hover:border-amber-400 text-stone-300 hover:text-amber-300 flex items-center justify-center pixel-box transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-950/95 border border-stone-600 px-2 py-1 rounded text-xs font-mono text-stone-300 shadow-xl z-30 pixel-box-sm">
            中枢设置
          </div>
        </div>
      </div>

      {/* 2. L2 Tree Branch: Floating L1 Title above L2 Rounded Rectangles with dynamic hudOpacity */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
        <div className="w-full md:w-56 space-y-1.5 shrink-0">
          {/* L1 Title Floating above L2 Subcategories */}
          <div className="flex items-center gap-1.5 px-1 text-xs font-mono font-bold text-amber-400">
            <GitBranch className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">{currentCategory ? currentCategory.name : '全部资源场景'}</span>
            <span className="text-[10px] text-stone-400 font-normal">
              ({currentCategory ? (recordCounts.byL1[currentCategory.id] || 0) : recordCounts.total})
            </span>
          </div>

          {/* L2 Rounded Rectangles */}
          <div className="space-y-1 pl-2.5 relative">
            <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-stone-700/80" />

            {/* All in current category */}
            <button
              onClick={() => {
                saoAudio.playSelect();
                onSelectL2(null);
              }}
              onMouseEnter={() => saoAudio.playHover()}
              style={{
                backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
                backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border pixel-box-sm flex items-center justify-between ${
                selectedL2 === null
                  ? 'border-amber-500 text-amber-200 font-bold shadow-sm'
                  : 'border-stone-700/80 text-stone-200 hover:border-amber-500/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedL2 === null ? 'bg-amber-400' : 'bg-stone-500'}`} />
                <span className="truncate">全部子类</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {currentCategory?.children.map(sub => {
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
                  style={{
                    backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
                    backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border pixel-box-sm flex items-center justify-between ${
                    isSubActive
                      ? 'border-amber-500 text-amber-200 font-bold shadow-sm'
                      : 'border-stone-700/80 text-stone-200 hover:border-amber-500/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-amber-400' : 'bg-stone-500'}`} />
                    <span className="truncate">{sub.name}</span>
                  </div>
                  <span className={`text-[11px] font-mono tabular-nums ${isSubActive ? 'text-amber-300 font-bold' : 'text-stone-400'}`}>
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. L3 Cascade to Content Stream & Inspector: 分支框背景支持 hudOpacity (包括为0) */}
        <div
          style={{
            backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
            backdropFilter: hudOpacity > 0 ? 'blur(10px)' : 'none'
          }}
          className="flex-1 rounded-xl p-3 border border-stone-700/90 flex flex-col justify-between max-h-[460px] overflow-hidden pixel-box"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-800 text-xs font-mono">
            <span className="text-stone-300 truncate">
              分支: <span className="text-amber-300 font-semibold">{currentCategory ? currentCategory.name : '全部'}</span>
              {selectedL2 && <span className="text-stone-200"> / {currentCategory?.children.find(s => s.id === selectedL2)?.name}</span>}
            </span>
            <span className="text-stone-400 text-[11px] tabular-nums shrink-0">
              共 {previewRecords.length} 项
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1">
            {previewRecords.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs font-mono">
                当前分支暂无资源，点击右下角按钮或按 ⌥+Space 极速录入
              </div>
            ) : (
              previewRecords.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => {
                    saoAudio.playSelect();
                    onOpenRecordDetail(rec);
                  }}
                  onMouseEnter={() => saoAudio.playHover()}
                  style={{
                    backgroundColor: `rgba(18, 16, 15, ${Math.max(0, hudOpacity)})`
                  }}
                  className="p-2 rounded-lg border border-stone-800 hover:border-amber-500/70 transition-colors cursor-pointer group pixel-box-sm"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400 mb-0.5 font-mono">
                    <span className="text-amber-400 truncate font-semibold">{rec.format_tag_name} · {rec.l2_name}</span>
                    <span className="text-stone-400 shrink-0">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-100 group-hover:text-amber-200 line-clamp-1 transition-colors">
                    {rec.title}
                  </h5>
                  <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5 font-mono">
                    {rec.snippet}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs font-mono">
            <span className="text-stone-400 text-[11px]">点击条目查看 / 调校分类</span>
            <button
              onClick={() => {
                saoAudio.playSummon();
                onOpenQuickInput();
              }}
              title="快速录入新条目 (⌥+Space)"
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-all pixel-box flex items-center justify-center hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
