import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Globe, Video, FileText, ArrowRight, Loader2, Check, Plus, FolderPlus, Tag } from 'lucide-react';
import { TaxonomyCategory, TaxonomySubCategory, GlobalFormatTag, GlobalMediaType, ResourceRecord } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface QuickInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy: TaxonomyCategory[];
  formatTags: GlobalFormatTag[];
  mediaTypes: GlobalMediaType[];
  onIngestSuccess: (record: ResourceRecord) => void;
  onAddNewL1?: (newCat: TaxonomyCategory) => void;
  onAddNewL2?: (l1Id: string, newSub: TaxonomySubCategory) => void;
  hudOpacity?: number;
}

export const QuickInputModal: React.FC<QuickInputModalProps> = ({
  isOpen,
  onClose,
  taxonomy,
  formatTags,
  mediaTypes,
  onIngestSuccess,
  onAddNewL1,
  onAddNewL2,
  hudOpacity = 0.65
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationStep, setClassificationStep] = useState<string>('');

  // Structured Draft State
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [url, setUrl] = useState('');
  const [l1, setL1] = useState(taxonomy[0]?.id || 'l1_content');
  const [l2, setL2] = useState(taxonomy[0]?.children[0]?.id || 'l2_writing');
  const [formatTag, setFormatTag] = useState('tag_tool');
  const [mediaType, setMediaType] = useState('type_link');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Add new L1 / L2 forms state
  const [showAddL1, setShowAddL1] = useState(false);
  const [newL1Name, setNewL1Name] = useState('');
  const [showAddL2, setShowAddL2] = useState(false);
  const [newL2Name, setNewL2Name] = useState('');

  // Update L2 when L1 changes
  const handleL1Change = (newL1Id: string) => {
    setL1(newL1Id);
    const cat = taxonomy.find(c => c.id === newL1Id);
    if (cat && cat.children.length > 0) {
      setL2(cat.children[0].id);
    }
  };

  const currentCategory = taxonomy.find(c => c.id === l1);
  const currentSubCategory = currentCategory?.children.find(s => s.id === l2);

  // Auto-detect URL on paste or input change
  useEffect(() => {
    const urlMatch = inputVal.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      setUrl(urlMatch[0]);
      if (urlMatch[0].includes('bilibili.com') || urlMatch[0].includes('youtube.com') || urlMatch[0].includes('youtu.be')) {
        setMediaType('type_video');
      } else {
        setMediaType('type_link');
      }
    }
  }, [inputVal]);

  if (!isOpen) return null;

  // AI Classification Trigger
  const handleAutoClassify = async () => {
    if (!inputVal.trim()) return;
    saoAudio.playSelect();
    setIsClassifying(true);
    setClassificationStep('正在解析目标正文 & 元数据...');

    try {
      let pageTitle = '';
      let pageSnippet = '';
      const detectedUrl = url || (inputVal.match(/https?:\/\/[^\s]+/) ? inputVal.match(/https?:\/\/[^\s]+/)![0] : '');

      if (detectedUrl) {
        try {
          setClassificationStep('通过 Jina Reader 提取上下文...');
          const parseRes = await fetch('/api/parse-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: detectedUrl })
          });
          if (parseRes.ok) {
            const data = await parseRes.json();
            pageTitle = data.title;
            pageSnippet = data.snippet;
            if (data.media_type) setMediaType(data.media_type);
          }
        } catch (e) {
          console.warn('URL parse step error:', e);
        }
      }

      setClassificationStep('Jev / Gemini 智能决策模型收敛分类中...');
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputVal,
          url: detectedUrl,
          title: pageTitle,
          snippet: pageSnippet
        })
      });

      if (classifyRes.ok) {
        const classified = await classifyRes.json();
        if (classified.title) setTitle(classified.title);
        if (classified.snippet) setSnippet(classified.snippet);
        if (classified.l1) setL1(classified.l1);
        if (classified.l2) setL2(classified.l2);
        if (classified.format_tag) setFormatTag(classified.format_tag);
        if (classified.media_type) setMediaType(classified.media_type);
        if (Array.isArray(classified.tags)) setTags(classified.tags);
        saoAudio.playSuccess();
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setIsClassifying(false);
      setClassificationStep('');
    }
  };

  // Create new L1 Category
  const handleCreateL1 = () => {
    if (!newL1Name.trim()) return;
    saoAudio.playSelect();
    const newId = `l1_custom_${Date.now()}`;
    const newCategory: TaxonomyCategory = {
      id: newId,
      name: newL1Name.trim(),
      icon: 'palette',
      children: [
        {
          id: `l2_custom_${Date.now()}`,
          name: '默认分类',
          l3_preset_tags: ['默认']
        }
      ]
    };

    onAddNewL1?.(newCategory);
    setL1(newId);
    setL2(newCategory.children[0].id);
    setNewL1Name('');
    setShowAddL1(false);
  };

  // Create new L2 Subcategory under current L1
  const handleCreateL2 = () => {
    if (!newL2Name.trim() || !currentCategory) return;
    saoAudio.playSelect();
    const newSub: TaxonomySubCategory = {
      id: `l2_custom_${Date.now()}`,
      name: newL2Name.trim(),
      l3_preset_tags: [newL2Name.trim()]
    };

    onAddNewL2?.(currentCategory.id, newSub);
    setL2(newSub.id);
    setNewL2Name('');
    setShowAddL2(false);
  };

  // Submit record to database / server
  const handleSave = async () => {
    const finalTitle = title.trim() || inputVal.slice(0, 30).trim() || '未命名速记';
    const finalL1Obj = taxonomy.find(c => c.id === l1);
    const finalL2Obj = finalL1Obj?.children.find(s => s.id === l2);
    const finalFormatTagObj = formatTags.find(f => f.id === formatTag);

    const payload = {
      title: finalTitle,
      url: url.trim(),
      snippet: snippet.trim() || inputVal.slice(0, 150).trim(),
      l1,
      l1_name: finalL1Obj?.name || '01 内容与表达',
      l2,
      l2_name: finalL2Obj?.name || '文本与写作',
      format_tag: formatTag,
      format_tag_name: finalFormatTagObj?.name || '工具',
      media_type: mediaType,
      tags: tags.length > 0 ? tags : (currentSubCategory?.l3_preset_tags.slice(0, 2) || ['速记']),
      source: 'shortcut'
    };

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        saoAudio.playIngest();
        onIngestSuccess(data.record);
        handleReset();
        onClose();
      }
    } catch (err) {
      console.error('Failed to save record:', err);
    }
  };

  const handleReset = () => {
    setInputVal('');
    setTitle('');
    setSnippet('');
    setUrl('');
    setTags([]);
  };

  const addTag = (tag: string) => {
    if (!tag.trim() || tags.includes(tag.trim())) return;
    setTags([...tags, tag.trim()]);
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
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
        {/* Header with SAO Earth Accents */}
        <div className="px-6 py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b] animate-pulse" />
            <h3 className="text-base font-bold text-stone-100 tracking-wide flex items-center gap-2">
              <span>AetherHUD 极速摄入收件箱</span>
              <span className="text-[11px] font-mono font-normal text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-700/80 pixel-box-sm">
                ⌥+Space 唤出
              </span>
            </h3>
          </div>
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Main quick input */}
          <div>
            <label className="block text-xs font-semibold text-stone-200 mb-1.5 flex items-center justify-between">
              <span>随手输入 URL、图文、视频链接或文本草稿:</span>
              <span className="text-[11px] font-normal text-stone-400">支持直接粘贴任何网页/B站/YouTube/Twitter</span>
            </label>
            <div className="relative">
              <textarea
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="例如: https://github.com/dify-ai/dify 或 推荐一款超棒的 Midjourney 风格提示词库..."
                rows={3}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors pixel-box-sm"
              />
            </div>
          </div>

          {/* AI One-Click Classify Action */}
          <div className="flex items-center justify-between bg-stone-950/80 p-3 rounded-xl border border-stone-800 pixel-box-sm">
            <div className="flex items-center gap-2 text-xs text-stone-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {classificationStep || '点击右侧按钮，由 Jev / 配置的 LLM 一键自动收敛 L1/L2 与提取 L3 标签'}
              </span>
            </div>
            <button
              onClick={handleAutoClassify}
              disabled={isClassifying || !inputVal.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 transition-all shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 pixel-box"
            >
              {isClassifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>极速决策中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI 智能秒分</span>
                </>
              )}
            </button>
          </div>

          {/* Classification details adjustment */}
          <div className="border border-stone-800 rounded-xl p-4 bg-stone-950/60 space-y-3.5 pixel-box-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  提炼标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="标题..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  目标链接 (URL)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                一句话摘要 / 笔记
              </label>
              <input
                type="text"
                value={snippet}
                onChange={e => setSnippet(e.target.value)}
                placeholder="该资源的核心价值点..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* L1 & L2 Hierarchy Pickers with Dynamic Creation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-cyan-400">
                    L1 场景 (单选)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddL1(!showAddL1)}
                    className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>新增 L1</span>
                  </button>
                </div>

                {showAddL1 ? (
                  <div className="flex gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={newL1Name}
                      onChange={e => setNewL1Name(e.target.value)}
                      placeholder="新 L1 名称 (如: 05 游戏设计)"
                      className="flex-1 bg-slate-900 border border-cyan-400/70 rounded px-2 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateL1}
                      className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded text-xs"
                    >
                      添加
                    </button>
                  </div>
                ) : (
                  <select
                    value={l1}
                    onChange={e => handleL1Change(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    {taxonomy.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-indigo-400">
                    L2 二级类别 (单选)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddL2(!showAddL2)}
                    className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>新增 L2</span>
                  </button>
                </div>

                {showAddL2 ? (
                  <div className="flex gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={newL2Name}
                      onChange={e => setNewL2Name(e.target.value)}
                      placeholder="新 L2 名称 (如: 虚幻引擎)"
                      className="flex-1 bg-slate-900 border border-indigo-400/70 rounded px-2 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateL2}
                      className="px-2 py-1 bg-indigo-500 text-white font-bold rounded text-xs"
                    >
                      添加
                    </button>
                  </div>
                ) : (
                  <select
                    value={l2}
                    onChange={e => setL2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                  >
                    {currentCategory?.children.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* L3 Format & Media Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  L3 形态标签
                </label>
                <div className="flex flex-wrap gap-1">
                  {formatTags.map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormatTag(fmt.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        formatTag === fmt.id
                          ? 'bg-slate-700 text-white border font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                      style={{
                        borderColor: formatTag === fmt.id ? fmt.color : undefined
                      }}
                    >
                      {fmt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  媒介类型
                </label>
                <div className="flex gap-1.5">
                  {mediaTypes.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMediaType(m.id)}
                      className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                        mediaType === m.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* L3 Feature tags & Quick Presets */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center justify-between">
                <span>L3 特征标签 (可任意新增与自定义)</span>
                <span className="text-[10px] text-stone-400 font-normal">支持直接打回车增加</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/70 text-amber-200 border border-amber-600/70 text-xs pixel-box-sm"
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
                    placeholder="+ 回车自定义新L3"
                    className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs text-stone-200 w-32 focus:outline-none focus:border-amber-400 pixel-box-sm"
                  />
                </div>
              </div>

              {/* L2 Preset recommendations */}
              {currentSubCategory?.l3_preset_tags && (
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-400">
                  <span className="text-amber-400 font-bold">推荐特征:</span>
                  {currentSubCategory.l3_preset_tags.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addTag(preset)}
                      className="px-1.5 py-0.5 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-mono">
            ESC 或点击外部取消
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                saoAudio.playDismiss();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-xs text-stone-300 hover:text-white hover:bg-stone-800 transition-colors border border-stone-700 pixel-box-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] pixel-box"
            >
              <Send className="w-3.5 h-3.5" />
              <span>确认入库 (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
