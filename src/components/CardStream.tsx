import React, { useState } from 'react';
import { ExternalLink, Star, Copy, Check, Trash2, Edit3, Globe, Video, FileText, CornerDownRight, Tag } from 'lucide-react';
import { ResourceRecord, GlobalFormatTag } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface CardStreamProps {
  records: ResourceRecord[];
  formatTags: GlobalFormatTag[];
  searchQuery: string;
  onTogglePin: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onOpenDetail: (record: ResourceRecord) => void;
  onTagClick: (tag: string) => void;
}

export const CardStream: React.FC<CardStreamProps> = ({
  records,
  formatTags,
  searchQuery,
  onTogglePin,
  onDeleteRecord,
  onOpenDetail,
  onTagClick
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getFormatTagColor = (fmtId: string) => {
    const found = formatTags.find(f => f.id === fmtId);
    return found ? found.color : '#3B82F6';
  };

  const copyMarkdown = (record: ResourceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    saoAudio.playSelect();
    const md = `[${record.title}](${record.url || '#'}) - ${record.snippet}`;
    navigator.clipboard.writeText(md);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 3600));
      const diffDays = Math.floor(diffMs / (1000 * 86400));

      if (diffMins < 5) return '刚刚';
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      return `${diffDays} 天前`;
    } catch {
      return '近期';
    }
  };

  const getHostname = (urlStr?: string) => {
    if (!urlStr) return '';
    try {
      return new URL(urlStr).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3 border border-slate-700">
          <Tag className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-200 mb-1">
          {searchQuery ? '未找到匹配的资源条目' : '当前筛选条件下暂无收纳资源'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          {searchQuery
            ? '尝试调整检索词或放宽 L3 标签筛选条件。'
            : '可通过顶部快速输入框或按快捷键 Alt+Space 录入第一条资源。'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const fmtColor = getFormatTagColor(record.format_tag);
        const host = getHostname(record.url);

        return (
          <div
            key={record.id}
            onClick={() => {
              saoAudio.playSelect();
              onOpenDetail(record);
            }}
            onMouseEnter={() => saoAudio.playHover()}
            className={`group bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-md border rounded-xl p-4 transition-all cursor-pointer relative ${
              record.pinned
                ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
            }`}
          >
            {/* Top metadata line: Clean unboxed metadata with typographic separators */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2">
              <div className="flex items-center gap-2 truncate">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: fmtColor }}
                  />
                  <span>{record.format_tag_name}</span>
                </span>

                <span aria-hidden="true" className="text-slate-600">/</span>

                <span className="text-cyan-400/90 font-medium">{record.l1_name}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-indigo-300">{record.l2_name}</span>

                {host && (
                  <>
                    <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate hidden sm:inline">
                      {host}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {formatTimeAgo(record.created_at)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saoAudio.playSelect();
                    onTogglePin(record.id);
                  }}
                  title={record.pinned ? '取消置顶' : '置顶本条'}
                  className={`p-1 rounded transition-colors ${
                    record.pinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400 opacity-60 group-hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${record.pinned ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Title */}
            <h4 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug mb-1.5 flex items-start justify-between gap-2">
              <span>{record.title}</span>
              {record.url && (
                <a
                  href={record.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="在新窗口打开源链接"
                  className="text-slate-500 hover:text-cyan-400 shrink-0 p-0.5 rounded transition-colors mt-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </h4>

            {/* Snippet / Abstract */}
            {record.snippet && (
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {record.snippet}
              </p>
            )}

            {/* Bottom Row: L3 Tags + Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                {record.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      saoAudio.playSelect();
                      onTagClick(tag);
                    }}
                    className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => copyMarkdown(record, e)}
                  title="复制 Markdown 引用格式"
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {copiedId === record.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>MD 引用</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saoAudio.playDismiss();
                    onDeleteRecord(record.id);
                  }}
                  title="删除此记录"
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
