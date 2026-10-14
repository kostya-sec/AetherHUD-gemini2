import React, { useState } from 'react';
import { Check, SlidersHorizontal, ChevronDown, ChevronUp, Layers, HelpCircle, RotateCcw } from 'lucide-react';
import { GlobalFormatTag, GlobalMediaType, FilterLogic } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface TagFilterBarProps {
  formatTags: GlobalFormatTag[];
  mediaTypes: GlobalMediaType[];
  availableFeatureTags: string[];
  selectedFormatTags: string[];
  selectedMediaTypes: string[];
  selectedFeatureTags: string[];
  filterLogic: FilterLogic;
  onToggleFormatTag: (tagId: string) => void;
  onToggleMediaType: (typeId: string) => void;
  onToggleFeatureTag: (tag: string) => void;
  onToggleFilterLogic: () => void;
  onClearAllFilters: () => void;
  hudOpacity?: number;
  defaultExpanded?: boolean;
}

// Earth tone high-contrast palette mapping for format tags
const EARTH_FORMAT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  tag_tool: { bg: 'bg-amber-950/85', border: 'border-amber-500', text: 'text-amber-100', dot: '#f59e0b' },
  tag_tutorial: { bg: 'bg-emerald-950/85', border: 'border-emerald-500', text: 'text-emerald-100', dot: '#10b981' },
  tag_prompt: { bg: 'bg-stone-800/90', border: 'border-amber-400', text: 'text-amber-50', dot: '#fbbf24' },
  tag_workflow: { bg: 'bg-orange-950/85', border: 'border-orange-500', text: 'text-orange-100', dot: '#f97316' },
  tag_asset: { bg: 'bg-yellow-950/85', border: 'border-yellow-500', text: 'text-yellow-100', dot: '#eab308' }
};

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  formatTags,
  mediaTypes,
  availableFeatureTags,
  selectedFormatTags,
  selectedMediaTypes,
  selectedFeatureTags,
  filterLogic,
  onToggleFormatTag,
  onToggleMediaType,
  onToggleFeatureTag,
  onToggleFilterLogic,
  onClearAllFilters,
  hudOpacity = 0.65,
  defaultExpanded = false
}) => {
  // L3 is folded by default as requested
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const totalActiveFilters = selectedFormatTags.length + selectedMediaTypes.length + selectedFeatureTags.length;

  return (
    <div
      className="border border-stone-700/80 rounded-xl overflow-hidden select-none pixel-box transition-all duration-200"
      style={{
        backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
        backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
      }}
    >
      {/* L3 Compact Header / Toggle Bar with full hudOpacity support */}
      <div
        style={{
          backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`
        }}
        className="flex items-center justify-between px-3 py-1.5 border-b border-stone-800/80"
      >
        <button
          onClick={() => {
            saoAudio.playSelect();
            setIsExpanded(prev => !prev);
          }}
          onMouseEnter={() => saoAudio.playHover()}
          className="flex items-center gap-2 text-xs font-mono font-bold text-stone-200 hover:text-amber-300 transition-colors group flex-1 text-left"
        >
          <div className="w-4 h-4 rounded bg-stone-800/80 border border-stone-600 flex items-center justify-center text-amber-400 group-hover:border-amber-400">
            <Layers className="w-2.5 h-2.5" />
          </div>
          <span className="text-stone-100 font-extrabold tracking-wide">
            L3 细粒度标签筛选
          </span>

          {totalActiveFilters > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/60 font-mono font-bold">
              已激活 {totalActiveFilters} 项
            </span>
          ) : (
            <span className="text-[11px] text-stone-400 font-normal">
              (形态/媒介 + 特征标签)
            </span>
          )}

          <span className="text-[11px] text-amber-400/90 ml-auto flex items-center gap-1 font-mono font-semibold">
            {isExpanded ? '收起 L3' : '点击展开 L3'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {/* Quick Clear Icon with hover tooltip */}
        {totalActiveFilters > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              saoAudio.playSelect();
              onClearAllFilters();
            }}
            title="清空当前所有筛选条件"
            className="p-1 rounded text-stone-400 hover:text-amber-300 hover:bg-stone-800/60 ml-2 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded L3 Content */}
      {isExpanded && (
        <div className="p-2.5 space-y-2 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Row 1: 形态与媒介 + 最右侧逻辑按钮 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-[11px] text-amber-300 font-bold tracking-wider mr-1 shrink-0">
                形态与媒介:
              </span>

              {formatTags.map(fmt => {
                const isSelected = selectedFormatTags.includes(fmt.id);
                const style = EARTH_FORMAT_COLORS[fmt.id] || {
                  bg: 'bg-stone-800/90',
                  border: 'border-stone-600',
                  text: 'text-stone-100',
                  dot: fmt.color
                };

                return (
                  <button
                    key={fmt.id}
                    onClick={() => {
                      saoAudio.playSelect();
                      onToggleFormatTag(fmt.id);
                    }}
                    onMouseEnter={() => saoAudio.playHover()}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors border pixel-box-sm ${
                      isSelected
                        ? `${style.bg} ${style.border} ${style.text} font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]`
                        : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:border-amber-500/70 hover:text-white hover:bg-stone-850'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: style.dot }}
                    />
                    <span className="font-medium">{fmt.name}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 ml-0.5" />}
                  </button>
                );
              })}

              <div className="h-3 w-[1px] bg-stone-700 mx-0.5 hidden sm:block" />

              {mediaTypes.map(med => {
                const isSelected = selectedMediaTypes.includes(med.id);
                return (
                  <button
                    key={med.id}
                    onClick={() => {
                      saoAudio.playSelect();
                      onToggleMediaType(med.id);
                    }}
                    onMouseEnter={() => saoAudio.playHover()}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors border pixel-box-sm font-medium ${
                      isSelected
                        ? 'bg-amber-950/90 text-amber-100 border-amber-500 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:border-amber-500/70 hover:text-white'
                    }`}
                  >
                    <span>{med.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 最右侧单图标逻辑切换按钮 + 提示说明 */}
            <div className="relative group shrink-0">
              <button
                onClick={() => {
                  saoAudio.playSelect();
                  onToggleFilterLogic();
                }}
                onMouseEnter={() => saoAudio.playHover()}
                title={`当前匹配逻辑: ${filterLogic === 'AND' ? 'AND (全部满足: 条目须同时满足所有已选标签)' : 'OR (任一满足: 条目满足任意一个已选标签即可)'} - 点击切换`}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-center pixel-box-sm ${
                  filterLogic === 'AND'
                    ? 'bg-amber-600/30 text-amber-200 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                    : 'bg-stone-800 text-stone-200 border-stone-600 hover:text-white hover:border-stone-500'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* 增强型悬停提示说明卡片 */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2.5 py-1.5 rounded-lg shadow-2xl text-[11px] text-stone-200 pixel-box">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-0.5">
                  <HelpCircle className="w-3 h-3 text-amber-400" />
                  <span>匹配逻辑切换</span>
                </div>
                <div className="text-[10px] text-stone-300">
                  当前为: <span className="text-amber-400 font-bold">{filterLogic === 'AND' ? 'AND (与逻辑)' : 'OR (或逻辑)'}</span>
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">
                  {filterLogic === 'AND'
                    ? '规则: 条目必须同时满足所有已选中的形态与特征标签'
                    : '规则: 条目只要命中任意一个选中的形态或特征标签即可显示'}
                </div>
                <div className="text-[9px] text-amber-400/80 mt-1 font-mono">
                  [点击按钮即可即时切换]
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 特征标签 */}
          {availableFeatureTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-stone-800">
              <span className="text-[11px] text-amber-300 font-bold tracking-wider mr-1 shrink-0">
                特征标签:
              </span>
              {availableFeatureTags.map(tag => {
                const isSelected = selectedFeatureTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      saoAudio.playSelect();
                      onToggleFeatureTag(tag);
                    }}
                    onMouseEnter={() => saoAudio.playHover()}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors border pixel-box-sm flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-900/80 text-amber-100 border-amber-500 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-stone-900/90 text-stone-200 border-stone-700/80 hover:border-amber-500/70 hover:text-white'
                    }`}
                  >
                    <span className="text-amber-500 font-bold text-[10px]">#</span>
                    <span className="font-medium">{tag}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 ml-0.5 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
