import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Save, Star, Trash2, Copy, Check, Tag } from 'lucide-react';
import { ResourceRecord, TaxonomyCategory, GlobalFormatTag, GlobalMediaType } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface RecordDetailModalProps {
  record: ResourceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  taxonomy: TaxonomyCategory[];
  formatTags: GlobalFormatTag[];
  mediaTypes: GlobalMediaType[];
  onUpdateRecord: (updated: ResourceRecord) => void;
  onDeleteRecord: (id: string) => void;
  hudOpacity?: number;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  taxonomy,
  formatTags,
  mediaTypes,
  onUpdateRecord,
  onDeleteRecord,
  hudOpacity = 0.65
}) => {
  if (!isOpen || !record) return null;

  const [title, setTitle] = useState(record.title);
  const [url, setUrl] = useState(record.url || '');
  const [snippet, setSnippet] = useState(record.snippet);
  const [l1, setL1] = useState(record.l1);
  const [l2, setL2] = useState(record.l2);
  const [formatTag, setFormatTag] = useState(record.format_tag);
  const [mediaType, setMediaType] = useState(record.media_type);
  const [tags, setTags] = useState<string[]>(record.tags);
  const [notes, setNotes] = useState(record.notes || '');
  const [newTagInput, setNewTagInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTitle(record.title);
    setUrl(record.url || '');
    setSnippet(record.snippet);
    setL1(record.l1);
    setL2(record.l2);
    setFormatTag(record.format_tag);
    setMediaType(record.media_type);
    setTags(record.tags);
    setNotes(record.notes || '');
  }, [record]);

  const currentCategory = taxonomy.find(c => c.id === l1);
  const currentSubCategory = currentCategory?.children.find(s => s.id === l2);

  const handleL1Change = (newL1Id: string) => {
    setL1(newL1Id);
    const cat = taxonomy.find(c => c.id === newL1Id);
    if (cat && cat.children.length > 0) {
      setL2(cat.children[0].id);
    }
  };

  const handleSave = async () => {
    saoAudio.playSelect();
    const finalL1Obj = taxonomy.find(c => c.id === l1);
    const finalL2Obj = finalL1Obj?.children.find(s => s.id === l2);
    const finalFmtObj = formatTags.find(f => f.id === formatTag);

    const updated: ResourceRecord = {
      ...record,
      title: title.trim() || record.title,
      url: url.trim(),
      snippet: snippet.trim(),
      l1,
      l1_name: finalL1Obj?.name || record.l1_name,
      l2,
      l2_name: finalL2Obj?.name || record.l2_name,
      format_tag: formatTag,
      format_tag_name: finalFmtObj?.name || record.format_tag_name,
      media_type: mediaType,
      tags,
      notes: notes.trim()
    };

    try {
      const res = await fetch(`/api/records/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        onUpdateRecord(updated);
        onClose();
      }
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const addTag = (tag: string) => {
    if (!tag.trim() || tags.includes(tag.trim())) return;
    setTags([...tags, tag.trim()]);
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150 select-none"
      style={{
        backgroundColor: `rgba(12, 10, 9, ${Math.min(0.95, Math.max(0.4, hudOpacity + 0.15))})`
      }}
    >
      <div
        className="w-full max-w-2xl border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pixel-box font-mono"
        style={{
          backgroundColor: `rgba(28, 25, 23, ${Math.max(0.4, hudOpacity)})`,
          backdropFilter: 'blur(16px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-stone-100">
              条目详情与分类调校
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors text-xs flex items-center gap-1 font-mono border border-stone-700 pixel-box-sm"
              title="复制 JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : 'JSON'}</span>
            </button>
            <button
              onClick={() => {
                saoAudio.playDismiss();
                onClose();
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-stone-300 font-semibold mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 pixel-box-sm"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">源链接</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              />
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg flex items-center gap-1 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>访问</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">摘要 / 正文简述</label>
            <textarea
              rows={3}
              value={snippet}
              onChange={e => setSnippet(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          {/* L1 & L2 select */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-cyan-400 font-semibold mb-1">L1 场景架构</label>
              <select
                value={l1}
                onChange={e => handleL1Change(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {taxonomy.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-indigo-400 font-semibold mb-1">L2 二级类别</label>
              <select
                value={l2}
                onChange={e => setL2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-400"
              >
                {currentCategory?.children.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* L3 Format & Media */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-emerald-400 font-semibold mb-1">L3 形态标签</label>
              <select
                value={formatTag}
                onChange={e => setFormatTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-400"
              >
                {formatTags.map(fmt => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">媒介属性</label>
              <select
                value={mediaType}
                onChange={e => setMediaType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-slate-500"
              >
                {mediaTypes.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* L3 Feature tags */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">L3 特征标签</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800 text-xs"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newTagInput);
                    }
                  }}
                  placeholder="+ 回车加标签"
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {currentSubCategory?.l3_preset_tags && (
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                <span>推荐特征:</span>
                {currentSubCategory.l3_preset_tags.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addTag(preset)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">个人笔记 / 深度批注</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="在此记录心得、复盘要点或工作流引用指南..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              saoAudio.playDismiss();
              onDeleteRecord(record.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>删除记录</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                saoAudio.playDismiss();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
