/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Search,
  Plus,
  Webhook,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Monitor,
  LayoutGrid,
  FileCode,
  Sparkles,
  Command,
  Database,
  Info,
  CheckCircle2,
  Sliders,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SaoMenu } from './components/SaoMenu';
import { SaoRadialMenu } from './components/SaoRadialMenu';
import { TagFilterBar } from './components/TagFilterBar';
import { CardStream } from './components/CardStream';
import { QuickInputModal } from './components/QuickInputModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { IngestionHubModal } from './components/IngestionHubModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { SaoThreeBackground } from './components/SaoThreeBackground';
import {
  TaxonomyData,
  TaxonomyCategory,
  TaxonomySubCategory,
  ResourceRecord,
  FilterLogic,
  GlobalFormatTag,
  GlobalMediaType
} from './types';
import { saoAudio } from './utils/saoAudio';
import desktopBackdrop from './assets/images/sao_desktop_backdrop_1791942119176.jpg';

// Fallback taxonomy if fetch fails or initializing
const DEFAULT_TAXONOMY_DATA: TaxonomyData = {
  global_l3_tags: {
    format_tags: [
      { id: "tag_tool", name: "工具", color: "#3B82F6" },
      { id: "tag_tutorial", name: "教程", color: "#10B981" },
      { id: "tag_prompt", name: "提示词", color: "#8B5CF6" },
      { id: "tag_workflow", name: "工作流", color: "#EC4899" },
      { id: "tag_asset", name: "素材/资源", color: "#F59E0B" }
    ],
    media_types: [
      { id: "type_link", name: "链接" },
      { id: "type_video", name: "视频" },
      { id: "type_article", name: "图文" }
    ]
  },
  taxonomy: [
    {
      id: "l1_content",
      name: "01 内容与表达",
      icon: "palette",
      children: [
        { id: "l2_writing", name: "文本与写作", l3_preset_tags: ["文案", "长文", "小说", "翻译", "Prompt框架"] },
        { id: "l2_image", name: "图像与设计", l3_preset_tags: ["Midjourney", "StableDiffusion", "ComfyUI", "风格词", "修图", "UI设计"] },
        { id: "l2_video_audio", name: "视频与音频", l3_preset_tags: ["剪辑", "数字人", "AI配音", "Suno", "运镜脚本", "动效"] },
        { id: "l2_social_media", name: "社交媒体运营", l3_preset_tags: ["小红书", "Twitter/X", "公众号", "出海分发", "爆款拆解"] }
      ]
    },
    {
      id: "l1_productivity",
      name: "02 效率与工作流",
      icon: "zap",
      children: [
        { id: "l2_km", name: "信息与知识管理", l3_preset_tags: ["搜索", "笔记系统", "Obsidian", "Notion", "阅读批注"] },
        { id: "l2_automation", name: "流程与自动化", l3_preset_tags: ["Make", "Zapier", "飞书表格", "自动化脚本", "RPA"] },
        { id: "l2_personal_ops", name: "个人看板与管理", l3_preset_tags: ["待办清单", "时间管理", "复盘", "项目管理"] }
      ]
    },
    {
      id: "l1_tech",
      name: "03 技术与工程",
      icon: "terminal",
      children: [
        { id: "l2_prompt_agent", name: "提示工程与智能体", l3_preset_tags: ["Coze", "Dify", "Agent架构", "系统级Prompt", "FunctionCalling"] },
        { id: "l2_coding", name: "编程与低代码", l3_preset_tags: ["Cursor", "Python", "前端组件", "Rust", "API集成"] },
        { id: "l2_ops_infra", name: "部署与环境", l3_preset_tags: ["Docker", "NAS", "本地大模型", "Ollama", "开源项目"] }
      ]
    },
    {
      id: "l1_biz",
      name: "04 商业与认知",
      icon: "trending-up",
      children: [
        { id: "l2_biz_model", name: "商业模式与副业", l3_preset_tags: ["变现案例", "独立开发", "海外出海", "冷启动"] },
        { id: "l2_insight", name: "行业观察与研报", l3_preset_tags: ["AI趋势", "深度思考", "行业图谱", "财报分析"] }
      ]
    }
  ]
};

export default function App() {
  // Taxonomy & Records
  const [taxonomyData, setTaxonomyData] = useState<TaxonomyData>(DEFAULT_TAXONOMY_DATA);
  const [records, setRecords] = useState<ResourceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedL1, setSelectedL1] = useState<string | null>(null);
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [selectedFormatTags, setSelectedFormatTags] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [selectedFeatureTags, setSelectedFeatureTags] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');
  const [searchQuery, setSearchQuery] = useState('');

  // Customization: HUD Background Opacity & Three.js particles
  const [hudOpacity, setHudOpacity] = useState(() => {
    try {
      const saved = localStorage.getItem('sao_hud_opacity');
      return saved ? parseFloat(saved) : 0.65;
    } catch {
      return 0.65;
    }
  });

  const [threeParticlesOpacity, setThreeParticlesOpacity] = useState(() => {
    try {
      const saved = localStorage.getItem('sao_three_opacity');
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  // Modals
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [isIngestionHubOpen, setIsIngestionHubOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [activeDetailRecord, setActiveDetailRecord] = useState<ResourceRecord | null>(null);

  // UI Modes: 'console' (Full width workspace) | 'desktop-hud' (SAO Utils floating HUD simulation)
  const [viewMode, setViewMode] = useState<'console' | 'desktop-hud'>('desktop-hud');
  const [isHudSummoned, setIsHudSummoned] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Mouse / Trackpad Swipe Gesture Detection
  const dragStartYRef = useRef<number | null>(null);

  // Initialize sound settings & fetch data
  useEffect(() => {
    saoAudio.init();
    setIsMuted(saoAudio.isMuted());

    async function loadData() {
      try {
        const [taxRes, recRes] = await Promise.all([
          fetch('/api/taxonomy'),
          fetch('/api/records')
        ]);
        if (taxRes.ok) {
          const tData = await taxRes.json();
          if (tData && tData.taxonomy) setTaxonomyData(tData);
        }
        if (recRes.ok) {
          const rData = await recRes.json();
          if (Array.isArray(rData)) setRecords(rData);
        }
      } catch (err) {
        console.warn('Initial data load fallback:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update HUD opacity and persist
  const handleUpdateHudOpacity = (newOpacity: number) => {
    setHudOpacity(newOpacity);
    try {
      localStorage.setItem('sao_hud_opacity', newOpacity.toString());
    } catch {}
  };

  const handleUpdateThreeOpacity = (newOpacity: number) => {
    setThreeParticlesOpacity(newOpacity);
    try {
      localStorage.setItem('sao_three_opacity', newOpacity.toString());
    } catch {}
  };

  // Global hotkey listener: Alt+Space / Option+Space / Cmd+K to summon quick input or toggle HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // macOS Option+Space (altKey) or Windows Alt+Space or Cmd+K
      if ((e.altKey && e.code === 'Space') || (e.metaKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        saoAudio.playSummon();
        if (viewMode === 'desktop-hud') {
          setIsHudSummoned(prev => !prev);
        } else {
          setIsQuickInputOpen(true);
        }
      }

      // ESC to dismiss modals or HUD
      if (e.key === 'Escape') {
        if (isQuickInputOpen) {
          setIsQuickInputOpen(false);
          saoAudio.playDismiss();
        } else if (isIngestionHubOpen) {
          setIsIngestionHubOpen(false);
          saoAudio.playDismiss();
        } else if (isModelSettingsOpen) {
          setIsModelSettingsOpen(false);
          saoAudio.playDismiss();
        } else if (activeDetailRecord) {
          setActiveDetailRecord(null);
          saoAudio.playDismiss();
        } else if (viewMode === 'desktop-hud' && isHudSummoned) {
          setIsHudSummoned(false);
          saoAudio.playDismiss();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickInputOpen, isIngestionHubOpen, isModelSettingsOpen, activeDetailRecord, viewMode, isHudSummoned]);

  // Mouse gesture tracking for swipe-down summon & swipe-up dismiss
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, .no-swipe')) return;
    dragStartYRef.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    dragStartYRef.current = null;

    if (deltaY > 45) {
      if (!isHudSummoned) {
        saoAudio.playSummon();
        setIsHudSummoned(true);
      }
    } else if (deltaY < -45) {
      if (isHudSummoned) {
        saoAudio.playDismiss();
        setIsHudSummoned(false);
      }
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    saoAudio.setMuted(next);
    if (!next) saoAudio.playSelect();
  };

  // Add new L1 Category
  const handleAddNewL1 = (newCat: TaxonomyCategory) => {
    setTaxonomyData(prev => ({
      ...prev,
      taxonomy: [...prev.taxonomy, newCat]
    }));
  };

  // Add new L2 Subcategory under L1
  const handleAddNewL2 = (l1Id: string, newSub: TaxonomySubCategory) => {
    setTaxonomyData(prev => ({
      ...prev,
      taxonomy: prev.taxonomy.map(cat => {
        if (cat.id === l1Id) {
          return {
            ...cat,
            children: [...cat.children, newSub]
          };
        }
        return cat;
      })
    }));
  };

  // Record Counts by L1 and L2
  const recordCounts = useMemo(() => {
    const byL1: Record<string, number> = {};
    const byL2: Record<string, number> = {};

    records.forEach(r => {
      byL1[r.l1] = (byL1[r.l1] || 0) + 1;
      byL2[r.l2] = (byL2[r.l2] || 0) + 1;
    });

    return {
      total: records.length,
      byL1,
      byL2
    };
  }, [records]);

  // Extract available feature tags
  const availableFeatureTags = useMemo(() => {
    const tagSet = new Set<string>();

    if (selectedL2) {
      for (const cat of taxonomyData.taxonomy) {
        const sub = cat.children.find(c => c.id === selectedL2);
        if (sub) {
          sub.l3_preset_tags.forEach(t => tagSet.add(t));
        }
      }
    } else if (selectedL1) {
      const cat = taxonomyData.taxonomy.find(c => c.id === selectedL1);
      if (cat) {
        cat.children.forEach(sub => {
          sub.l3_preset_tags.forEach(t => tagSet.add(t));
        });
      }
    } else {
      records.forEach(r => {
        r.tags.forEach(t => tagSet.add(t));
      });
    }

    records.forEach(r => {
      if ((!selectedL1 || r.l1 === selectedL1) && (!selectedL2 || r.l2 === selectedL2)) {
        r.tags.forEach(t => tagSet.add(t));
      }
    });

    return Array.from(tagSet).slice(0, 24);
  }, [taxonomyData, selectedL1, selectedL2, records]);

  // Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedL1 && r.l1 !== selectedL1) return false;
      if (selectedL2 && r.l2 !== selectedL2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchSnippet = r.snippet.toLowerCase().includes(q);
        const matchUrl = (r.url || '').toLowerCase().includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        const matchTags = r.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSnippet && !matchUrl && !matchNotes && !matchTags) {
          return false;
        }
      }

      const hasFormatFilter = selectedFormatTags.length > 0;
      const hasMediaFilter = selectedMediaTypes.length > 0;
      const hasFeatureFilter = selectedFeatureTags.length > 0;

      if (!hasFormatFilter && !hasMediaFilter && !hasFeatureFilter) {
        return true;
      }

      if (filterLogic === 'AND') {
        if (hasFormatFilter && !selectedFormatTags.includes(r.format_tag)) return false;
        if (hasMediaFilter && !selectedMediaTypes.includes(r.media_type)) return false;
        if (hasFeatureFilter) {
          const matchesAllFeatureTags = selectedFeatureTags.every(ft => r.tags.includes(ft));
          if (!matchesAllFeatureTags) return false;
        }
        return true;
      } else {
        const matchFormat = hasFormatFilter && selectedFormatTags.includes(r.format_tag);
        const matchMedia = hasMediaFilter && selectedMediaTypes.includes(r.media_type);
        const matchFeature = hasFeatureFilter && selectedFeatureTags.some(ft => r.tags.includes(ft));
        return matchFormat || matchMedia || matchFeature;
      }
    });
  }, [
    records,
    selectedL1,
    selectedL2,
    searchQuery,
    selectedFormatTags,
    selectedMediaTypes,
    selectedFeatureTags,
    filterLogic
  ]);

  // Record actions
  const handleTogglePin = async (id: string) => {
    const item = records.find(r => r.id === id);
    if (!item) return;
    const updated = { ...item, pinned: !item.pinned };

    setRecords(records.map(r => (r.id === id ? updated : r)));
    try {
      await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Failed to update pin state:', e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setRecords(records.filter(r => r.id !== id));
    try {
      await fetch(`/api/records/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleUpdateRecord = (updated: ResourceRecord) => {
    setRecords(records.map(r => (r.id === updated.id ? updated : r)));
  };

  const handleIngestSuccess = (newRecord: ResourceRecord) => {
    setRecords([newRecord, ...records]);
  };

  const handleBatchIngested = (newRecords: ResourceRecord[]) => {
    setRecords([...newRecords, ...records]);
  };

  const handleToggleFormatTag = (tagId: string) => {
    setSelectedFormatTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleToggleMediaType = (typeId: string) => {
    setSelectedMediaTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleToggleFeatureTag = (tag: string) => {
    setSelectedFeatureTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedFormatTags([]);
    setSelectedMediaTypes([]);
    setSelectedFeatureTags([]);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 select-none relative"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Top Bar Contract: Brand zone (1 line) — Nav Links (whitespace-nowrap) — 1 Primary action */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                saoAudio.playSummon();
                setSelectedL1(null);
                setSelectedL2(null);
                handleClearAllFilters();
                setSearchQuery('');
              }}
              className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-stone-100 whitespace-nowrap group font-mono"
            >
              <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.3)] pixel-box-sm">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold tracking-wide">AetherHUD</span>
              <span className="text-[11px] font-mono text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/80 hidden sm:inline pixel-box-sm">
                SAO Visual Nexus
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links / Mode Switch (Clean icon-driven with tooltips) */}
          <nav className="flex items-center gap-3 text-xs font-medium text-stone-400 font-mono">
            {/* Desktop HUD Mode */}
            <div className="relative group">
              <button
                onClick={() => {
                  saoAudio.playSummon();
                  setViewMode('desktop-hud');
                  setIsHudSummoned(true);
                }}
                title="SAO 悬浮 HUD 模式 (快捷键: ⌥+Space / ⌘+K)"
                className={`p-2 rounded-lg border transition-all pixel-box-sm flex items-center justify-center ${
                  viewMode === 'desktop-hud'
                    ? 'bg-amber-950/70 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2 py-1 rounded text-[10px] text-amber-300 shadow-xl z-50 pixel-box">
                SAO 悬浮 HUD 模式
              </div>
            </div>

            {/* Console Workbench */}
            <div className="relative group">
              <button
                onClick={() => {
                  saoAudio.playSelect();
                  setViewMode('console');
                }}
                title="中枢全景工作台 (Console)"
                className={`p-2 rounded-lg border transition-all pixel-box-sm flex items-center justify-center ${
                  viewMode === 'console'
                    ? 'bg-amber-950/70 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2 py-1 rounded text-[10px] text-amber-300 shadow-xl z-50 pixel-box">
                中枢工作台 (Console)
              </div>
            </div>

            {/* Ingestion Hub */}
            <div className="relative group">
              <button
                onClick={() => {
                  saoAudio.playSelect();
                  setIsIngestionHubOpen(true);
                }}
                title="多源摄取管线 (Webhook / 云表格)"
                className="p-2 rounded-lg border border-stone-800 bg-stone-900/60 text-stone-400 hover:text-amber-300 hover:border-amber-500/60 transition-all pixel-box-sm flex items-center justify-center"
              >
                <Webhook className="w-4 h-4" />
              </button>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2 py-1 rounded text-[10px] text-amber-300 shadow-xl z-50 pixel-box">
                多源数据摄取管线
              </div>
            </div>

            {/* Settings */}
            <div className="relative group">
              <button
                onClick={() => {
                  saoAudio.playSelect();
                  setIsModelSettingsOpen(true);
                }}
                title="系统设置中枢 (LLM / 部署指南 / 分类管理 / 音效)"
                className="p-2 rounded-lg border border-stone-800 bg-stone-900/60 text-amber-400/90 hover:text-amber-300 hover:border-amber-500/80 transition-all pixel-box-sm flex items-center justify-center"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2 py-1 rounded text-[10px] text-amber-300 shadow-xl z-50 pixel-box">
                系统设置中枢
              </div>
            </div>

            {/* Mute/Sound */}
            <div className="relative group">
              <button
                onClick={toggleSound}
                title={isMuted ? '点击开启 SAO 晶体音效' : '点击静音'}
                className="p-2 rounded-lg border border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-all pixel-box-sm flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap bg-stone-950 border border-amber-500/80 px-2 py-1 rounded text-[10px] text-stone-300 shadow-xl z-50 pixel-box">
                {isMuted ? '当前已静音 (点击开启音效)' : 'SAO 晶体音效 (点击静音)'}
              </div>
            </div>
          </nav>

          {/* Zone 3: 1 Primary Action (Quick Input Summon) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                saoAudio.playSummon();
                setIsQuickInputOpen(true);
              }}
              title="快速录入新条目 (⌥+Space)"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.35)] whitespace-nowrap pixel-box hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">快速录入</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono bg-amber-950/60 text-amber-200 px-1.5 py-0.5 rounded border border-amber-800">
                ⌥+Space
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {viewMode === 'desktop-hud' ? (
        /* ================= SAO FLOATING HUD VISUAL MODE ================= */
        <div
          className="flex-1 relative flex flex-col justify-center items-center p-4 min-h-[calc(100vh-60px)] bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(${desktopBackdrop})` }}
        >
          {/* Three.js Ambient Holographic Particle & Geometric Ring Scene */}
          <SaoThreeBackground isHudActive={isHudSummoned} opacity={threeParticlesOpacity} />

          {/* Ambient Vignette Overlay */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-none" />

          {/* 1. Top Interactive Gesture Bar (Higher up, never overlapping HUD) */}
          <div
            className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 bg-stone-950/90 hover:bg-stone-900 backdrop-blur-md border border-amber-500/60 px-4 py-1.5 rounded-full text-xs text-stone-200 shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer transition-all hover:scale-105 pixel-box-sm font-mono"
            onClick={() => {
              if (isHudSummoned) {
                saoAudio.playDismiss();
                setIsHudSummoned(false);
              } else {
                saoAudio.playSummon();
                setIsHudSummoned(true);
              }
            }}
          >
            {isHudSummoned ? (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="font-semibold text-amber-300">向上拖动或点击折叠 HUD</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="font-semibold text-amber-300">向下拖动或点击呼出 SAO HUD</span>
              </>
            )}
            <span className="text-stone-600">|</span>
            <span className="text-[11px] font-mono text-stone-400">
              快捷键: <kbd className="text-amber-300 font-bold">⌥+Space</kbd> / <kbd className="text-amber-300 font-bold">⌘+K</kbd>
            </span>
          </div>

          {/* 2. Right-side Floating '<' / '>' Toggle Button Tab */}
          <button
            onClick={() => {
              if (isHudSummoned) {
                saoAudio.playDismiss();
                setIsHudSummoned(false);
              } else {
                saoAudio.playSummon();
                setIsHudSummoned(true);
              }
            }}
            title={isHudSummoned ? '收起 SAO HUD' : '呼出 SAO HUD (<)'}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-stone-950/95 hover:bg-amber-950 text-amber-300 border-l border-y border-amber-500/70 hover:border-amber-400 p-2.5 rounded-l-2xl shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:pr-4 flex items-center justify-center group pixel-box"
          >
            {isHudSummoned ? (
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:scale-125 transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:scale-125 transition-transform" />
            )}
          </button>

          {/* 3. Floating SAO HUD (Free-floating, unboxed, earth tone, drop-in from top) */}
          {isHudSummoned ? (
            <div
              className="relative z-20 w-full max-w-5xl space-y-3 animate-in fade-in slide-in-from-top-6 duration-200 mt-2 px-2"
              onClick={e => e.stopPropagation()}
            >
              {/* Fast Search Input with compact L3 Tags Directly Below */}
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索一分类的知识条目 (支持标题、摘要、标签或源 URL)..."
                    style={{
                      backgroundColor: `rgba(28, 25, 23, ${hudOpacity})`,
                      backdropFilter: hudOpacity > 0 ? 'blur(8px)' : 'none'
                    }}
                    className="w-full border border-stone-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-mono pixel-box shadow-inner"
                  />
                </div>

                {/* Compact L3 Tag Filter placed right under search bar (default folded) */}
                <TagFilterBar
                  formatTags={taxonomyData.global_l3_tags.format_tags}
                  mediaTypes={taxonomyData.global_l3_tags.media_types}
                  availableFeatureTags={availableFeatureTags}
                  selectedFormatTags={selectedFormatTags}
                  selectedMediaTypes={selectedMediaTypes}
                  selectedFeatureTags={selectedFeatureTags}
                  filterLogic={filterLogic}
                  onToggleFormatTag={handleToggleFormatTag}
                  onToggleMediaType={handleToggleMediaType}
                  onToggleFeatureTag={handleToggleFeatureTag}
                  onToggleFilterLogic={() =>
                    setFilterLogic(prev => (prev === 'AND' ? 'OR' : 'AND'))
                  }
                  onClearAllFilters={handleClearAllFilters}
                  hudOpacity={hudOpacity}
                  defaultExpanded={false}
                />
              </div>

              {/* SAO Tree Graph Layout: L1 Orbs -> L2 Rounded Rectangles -> L3 Preview */}
              <SaoRadialMenu
                taxonomy={taxonomyData.taxonomy}
                records={filteredRecords}
                formatTags={taxonomyData.global_l3_tags.format_tags}
                selectedL1={selectedL1}
                selectedL2={selectedL2}
                onSelectL1={setSelectedL1}
                onSelectL2={setSelectedL2}
                onOpenQuickInput={() => setIsQuickInputOpen(true)}
                onOpenSettings={() => setIsModelSettingsOpen(true)}
                onOpenRecordDetail={record => setActiveDetailRecord(record)}
                recordCounts={recordCounts}
                hudOpacity={hudOpacity}
              />
            </div>
          ) : (
            <div
              className="text-center space-y-3 z-10 cursor-pointer pointer-events-auto"
              onClick={() => {
                saoAudio.playSummon();
                setIsHudSummoned(true);
              }}
            >
              <div className="inline-block p-5 rounded-3xl bg-slate-950/80 border border-cyan-500/40 backdrop-blur-md text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform">
                <Command className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-mono font-bold text-white mb-0.5">SAO HUD 已就绪</p>
                <p className="text-[11px] text-cyan-400/80 mb-2">
                  在屏幕上按住鼠标<b>向下划动</b> 或 点击右侧 <kbd className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">&lt;</kbd> 呼出
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-400/40">
                  点击此处亦可呼出
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= CONSOLE WORKBENCH MODE ================= */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
                  <span>AetherHUD 资源中枢 (全景工作台)</span>
                  <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    2+1 维分类架构
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  L1/L2 树状场景互斥收敛，L3 正交细粒度筛选。
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="全文字符检索 (标题/摘要/标签/URL)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <section>
            <SaoMenu
              taxonomy={taxonomyData.taxonomy}
              selectedL1={selectedL1}
              selectedL2={selectedL2}
              onSelectL1={setSelectedL1}
              onSelectL2={setSelectedL2}
              recordCounts={recordCounts}
            />
          </section>

          <section>
            <TagFilterBar
              formatTags={taxonomyData.global_l3_tags.format_tags}
              mediaTypes={taxonomyData.global_l3_tags.media_types}
              availableFeatureTags={availableFeatureTags}
              selectedFormatTags={selectedFormatTags}
              selectedMediaTypes={selectedMediaTypes}
              selectedFeatureTags={selectedFeatureTags}
              filterLogic={filterLogic}
              onToggleFormatTag={handleToggleFormatTag}
              onToggleMediaType={handleToggleMediaType}
              onToggleFeatureTag={handleToggleFeatureTag}
              onToggleFilterLogic={() =>
                setFilterLogic(prev => (prev === 'AND' ? 'OR' : 'AND'))
              }
              onClearAllFilters={handleClearAllFilters}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
              <div className="flex items-center gap-2">
                <span>过滤结果流 (Stream):</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {filteredRecords.length}
                </span>
                <span>/ {records.length} 条</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModelSettingsOpen(true)}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-cyan-400/90"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>中枢设置</span>
                </button>
              </div>
            </div>

            <CardStream
              records={filteredRecords}
              formatTags={taxonomyData.global_l3_tags.format_tags}
              searchQuery={searchQuery}
              onTogglePin={handleTogglePin}
              onDeleteRecord={handleDeleteRecord}
              onOpenDetail={record => setActiveDetailRecord(record)}
              onTagClick={handleToggleFeatureTag}
            />
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">AetherHUD</span>
          <span aria-hidden="true">·</span>
          <span>SAO Utils Resource Nexus</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">HUD 透明度 {Math.round(hudOpacity * 100)}%</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => setIsModelSettingsOpen(true)}
            className="hover:text-cyan-300 transition-colors"
          >
            全局设置中枢
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => {
              saoAudio.playSummon();
              setIsQuickInputOpen(true);
            }}
            className="hover:text-cyan-300 transition-colors"
          >
            极速录入新条目
          </button>
        </div>
      </footer>

      {/* Modals */}
      <QuickInputModal
        isOpen={isQuickInputOpen}
        onClose={() => setIsQuickInputOpen(false)}
        taxonomy={taxonomyData.taxonomy}
        formatTags={taxonomyData.global_l3_tags.format_tags}
        mediaTypes={taxonomyData.global_l3_tags.media_types}
        onIngestSuccess={handleIngestSuccess}
        onAddNewL1={handleAddNewL1}
        onAddNewL2={handleAddNewL2}
        hudOpacity={hudOpacity}
      />

      <RecordDetailModal
        record={activeDetailRecord}
        isOpen={!!activeDetailRecord}
        onClose={() => setActiveDetailRecord(null)}
        taxonomy={taxonomyData.taxonomy}
        formatTags={taxonomyData.global_l3_tags.format_tags}
        mediaTypes={taxonomyData.global_l3_tags.media_types}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
        hudOpacity={hudOpacity}
      />

      <IngestionHubModal
        isOpen={isIngestionHubOpen}
        onClose={() => setIsIngestionHubOpen(false)}
        onRecordsIngested={handleBatchIngested}
        allRecords={records}
        hudOpacity={hudOpacity}
      />

      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        hudOpacity={hudOpacity}
        onUpdateHudOpacity={handleUpdateHudOpacity}
        threeParticlesOpacity={threeParticlesOpacity}
        onUpdateThreeOpacity={handleUpdateThreeOpacity}
        allRecords={records}
        onRecordsIngested={handleBatchIngested}
        taxonomyData={taxonomyData}
        onUpdateTaxonomy={setTaxonomyData}
      />
    </div>
  );
}
