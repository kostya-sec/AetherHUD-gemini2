import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Cpu,
  Video,
  Key,
  Activity,
  Apple,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  Zap,
  Terminal,
  Globe,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Webhook,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  RotateCcw,
  Layers,
  ChevronDown,
  Loader2,
  HelpCircle,
  FileCode,
  Shield,
  Trash2,
  Edit3,
  Plus,
  FolderPlus,
  Monitor,
  Check
} from 'lucide-react';
import { saoAudio, SoundAction } from '../utils/saoAudio';
import { ResourceRecord, TaxonomyData, TaxonomyCategory, TaxonomySubCategory } from '../types';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hudOpacity?: number;
  onUpdateHudOpacity?: (opacity: number) => void;
  threeParticlesOpacity?: number;
  onUpdateThreeOpacity?: (opacity: number) => void;
  allRecords?: ResourceRecord[];
  onRecordsIngested?: (records: ResourceRecord[]) => void;
  taxonomyData?: TaxonomyData;
  onUpdateTaxonomy?: (data: TaxonomyData) => void;
}

// Common Provider Presets
const PROVIDER_PRESETS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-3.8-flash',
    hint: 'AI Studio 原生支持，推荐超高速 3.8 Flash'
  },
  {
    id: 'openai',
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    hint: '支持 GPT-4o, GPT-4o-mini 等官方模型'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek 深度求索',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    hint: '极致高性价比推理与知识提取'
  },
  {
    id: 'ollama',
    name: 'Ollama 本地大模型',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    hint: '无需外部联网，完全本地隐私私有化运行'
  },
  {
    id: 'jev',
    name: 'Jev 决策模型 (Rust)',
    baseUrl: 'http://127.0.0.1:8000/v1',
    defaultModel: 'jev-fast-classifier',
    hint: '符合 AGENTS.md 规范的 sub-100ms 极速专有决策核心'
  },
  {
    id: 'custom',
    name: '自定义 OpenAI 兼容接口',
    baseUrl: '',
    defaultModel: '',
    hint: '支持任何 OneAPI, NewAPI, vLLM, 智谱, Moonshot 等第三方中转'
  }
];

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  hudOpacity = 0.65,
  onUpdateHudOpacity,
  threeParticlesOpacity = 0.8,
  onUpdateThreeOpacity,
  allRecords = [],
  onRecordsIngested,
  taxonomyData,
  onUpdateTaxonomy
}) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'video' | 'taxonomy' | 'display' | 'audio' | 'webhook' | 'cloud' | 'export' | 'guide'>('llm');

  // Standard LLM Configuration State
  const [selectedPreset, setSelectedPreset] = useState('gemini');
  const [baseUrl, setBaseUrl] = useState('https://generativelanguage.googleapis.com');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelId, setModelId] = useState('gemini-3.8-flash');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchMsg, setModelFetchMsg] = useState('');

  // Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    latency_ms: number;
    message: string;
    model?: string;
  } | null>(null);

  // Video Extraction Settings
  const [jinaReaderUrl, setJinaReaderUrl] = useState('https://r.jina.ai');
  const [jinaTimeoutMs, setJinaTimeoutMs] = useState(4000);
  const [videoUnderstandingMode, setVideoUnderstandingMode] = useState('hybrid');
  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const [videoTestResult, setVideoTestResult] = useState<{
    success: boolean;
    latency_ms: number;
    title?: string;
    message: string;
  } | null>(null);

  // Taxonomy Management State (Requirement 2)
  const [editingL1Id, setEditingL1Id] = useState<string | null>(null);
  const [editingL1Name, setEditingL1Name] = useState('');
  const [editingL2Id, setEditingL2Id] = useState<string | null>(null);
  const [editingL2Name, setEditingL2Name] = useState('');
  const [editingL2Tags, setEditingL2Tags] = useState('');
  const [importTaxonomyText, setImportTaxonomyText] = useState('');
  const [showImportTaxonomy, setShowImportTaxonomy] = useState(false);
  const [taxonomySuccessMsg, setTaxonomySuccessMsg] = useState('');

  // Webhook Configuration & AK/SK (Requirement 6)
  const [webhookAk, setWebhookAk] = useState('');
  const [webhookSk, setWebhookSk] = useState('');
  const [showWebhookSk, setShowWebhookSk] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    latency_ms: number;
    message: string;
  } | null>(null);
  const [showWebhookHelpModal, setShowWebhookHelpModal] = useState(false);

  // Cloud Sync Credentials & Test (Requirement 8)
  const [cloudProvider, setCloudProvider] = useState('feishu_bitable');
  const [cloudAppId, setCloudAppId] = useState('');
  const [cloudAppSecret, setCloudAppSecret] = useState('');
  const [showCloudSecret, setShowCloudSecret] = useState(false);
  const [tableName, setTableName] = useState('个人知识库_收件箱');
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudTestResult, setCloudTestResult] = useState<{
    success: boolean;
    latency_ms: number;
    message: string;
  } | null>(null);

  // Guide Sub-Tab (Requirement 1 & 7)
  const [guideSubTab, setGuideSubTab] = useState<'hotkeys' | 'macos' | 'windows'>('macos');

  // Audio State & Custom Uploads
  const [audioVolume, setAudioVolume] = useState(saoAudio.getVolume());
  const [isMuted, setIsMuted] = useState(saoAudio.isMuted());
  const [customAudioStatus, setCustomAudioStatus] = useState<Record<string, boolean>>({
    summon: saoAudio.hasCustomSound('summon'),
    select: saoAudio.hasCustomSound('select'),
    hover: saoAudio.hasCustomSound('hover'),
    dismiss: saoAudio.hasCustomSound('dismiss'),
    success: saoAudio.hasCustomSound('success')
  });

  // Save / Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Webhook Simulator State
  const [botSource, setBotSource] = useState('feishu_bot');
  const [botMessage, setBotMessage] = useState('https://cursor.com 最新全栈开发规则配置与自动化测试');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  // Cloud Sync Action State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState('');

  // Load existing settings
  useEffect(() => {
    if (!isOpen) return;
    setAudioVolume(saoAudio.getVolume());
    setIsMuted(saoAudio.isMuted());

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.llm_base_url) setBaseUrl(data.llm_base_url);
        if (data.llm_api_key) setApiKey(data.llm_api_key);
        if (data.llm_model_id) setModelId(data.llm_model_id);
        if (data.jina_reader_url) setJinaReaderUrl(data.jina_reader_url);
        if (data.jina_timeout_ms) setJinaTimeoutMs(data.jina_timeout_ms);
        if (data.video_understanding_mode) setVideoUnderstandingMode(data.video_understanding_mode);
        if (data.engine_provider) setSelectedPreset(data.engine_provider);
        if (data.webhook_ak) setWebhookAk(data.webhook_ak);
        if (data.webhook_sk) setWebhookSk(data.webhook_sk);
        if (data.cloud_app_id) setCloudAppId(data.cloud_app_id);
        if (data.cloud_app_secret) setCloudAppSecret(data.cloud_app_secret);
        if (data.cloud_table_name) setTableName(data.cloud_table_name);
      })
      .catch(e => console.warn('Failed to load settings:', e));
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset Selection Handler
  const handleApplyPreset = (presetId: string) => {
    saoAudio.playSelect();
    setSelectedPreset(presetId);
    const p = PROVIDER_PRESETS.find(item => item.id === presetId);
    if (p) {
      if (p.baseUrl) setBaseUrl(p.baseUrl);
      if (p.defaultModel) setModelId(p.defaultModel);
      setConnectionTestResult(null);
      setModelFetchMsg('');
    }
  };

  // Fetch Models from LLM Provider
  const handleFetchModels = async () => {
    saoAudio.playSelect();
    setIsFetchingModels(true);
    setModelFetchMsg('正在连接供应商获取可用模型...');
    try {
      const res = await fetch('/api/llm/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          provider: selectedPreset
        })
      });
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setAvailableModels(data.models);
        setModelFetchMsg(`成功获取到 ${data.models.length} 个模型！`);
        saoAudio.playSuccess();
        if (data.models.length > 0 && !data.models.some((m: any) => m.id === modelId)) {
          setModelId(data.models[0].id);
        }
      } else if (data.fallback_models) {
        setAvailableModels(data.fallback_models);
        setModelFetchMsg(`模型端点未开放列表接口，已加载常用模型候选。`);
      } else {
        setModelFetchMsg(`获取模型未返回列表: ${data.error || '请手动填写 Model ID'}`);
      }
    } catch (e: any) {
      setModelFetchMsg(`获取失败: ${e.message}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    saoAudio.playSelect();
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await fetch('/api/llm/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          modelId,
          provider: selectedPreset
        })
      });
      const data = await res.json();
      setConnectionTestResult(data);
      if (data.success) {
        saoAudio.playSuccess();
      } else {
        saoAudio.playDismiss();
      }
    } catch (e: any) {
      setConnectionTestResult({
        success: false,
        latency_ms: 0,
        message: `测试请求发生错误: ${e.message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Test Video Extraction
  const handleTestVideoScrape = async () => {
    saoAudio.playSelect();
    setIsTestingVideo(true);
    setVideoTestResult(null);
    try {
      const res = await fetch('/api/video/test-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reader_url: jinaReaderUrl,
          timeout_ms: jinaTimeoutMs
        })
      });
      const data = await res.json();
      setVideoTestResult(data);
      if (data.success) saoAudio.playSuccess();
    } catch (e: any) {
      setVideoTestResult({
        success: false,
        latency_ms: 0,
        message: `视频测试异常: ${e.message}`
      });
    } finally {
      setIsTestingVideo(false);
    }
  };

  // Test Webhook Connection (Requirement 6)
  const handleTestWebhookConnection = async () => {
    saoAudio.playSelect();
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: webhookAk,
          secret_key: webhookSk,
          source: 'aether_test'
        })
      });
      const data = await res.json();
      setWebhookTestResult(data);
      if (data.success) saoAudio.playSuccess();
    } catch (e: any) {
      setWebhookTestResult({
        success: false,
        latency_ms: 0,
        message: `Webhook 连通性测试异常: ${e.message}`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Test Cloud Sync Connection (Requirement 8)
  const handleTestCloudConnection = async () => {
    saoAudio.playSelect();
    setIsTestingCloud(true);
    setCloudTestResult(null);
    try {
      const res = await fetch('/api/sync/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: cloudProvider,
          app_id: cloudAppId,
          app_secret: cloudAppSecret,
          table_name: tableName
        })
      });
      const data = await res.json();
      setCloudTestResult(data);
      if (data.success) saoAudio.playSuccess();
    } catch (e: any) {
      setCloudTestResult({
        success: false,
        latency_ms: 0,
        message: `云文档连接测试异常: ${e.message}`
      });
    } finally {
      setIsTestingCloud(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    saoAudio.playSelect();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine_provider: selectedPreset,
          llm_base_url: baseUrl,
          llm_api_key: apiKey,
          llm_model_id: modelId,
          gemini_model: modelId,
          jina_reader_url: jinaReaderUrl,
          jina_timeout_ms: jinaTimeoutMs,
          video_understanding_mode: videoUnderstandingMode,
          webhook_ak: webhookAk,
          webhook_sk: webhookSk,
          cloud_app_id: cloudAppId,
          cloud_app_secret: cloudAppSecret,
          cloud_table_name: tableName
        })
      });
      if (res.ok) {
        saoAudio.playSuccess();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Taxonomy Management Actions (Requirement 2)
  const handleExportTaxonomy = () => {
    saoAudio.playSelect();
    if (!taxonomyData) return;
    const blob = new Blob([JSON.stringify(taxonomyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxonomy.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTaxonomySubmit = async () => {
    if (!importTaxonomyText.trim()) return;
    try {
      const parsed = JSON.parse(importTaxonomyText);
      if (!parsed.taxonomy || !Array.isArray(parsed.taxonomy)) {
        alert('JSON 必须包含有效的 taxonomy 数组节点');
        return;
      }
      saoAudio.playSuccess();
      onUpdateTaxonomy?.(parsed);
      await fetch('/api/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      setShowImportTaxonomy(false);
      setImportTaxonomyText('');
      setTaxonomySuccessMsg('分类体系已成功导入并持久化！');
      setTimeout(() => setTaxonomySuccessMsg(''), 3000);
    } catch (err: any) {
      alert(`导入 JSON 解析错误: ${err.message}`);
    }
  };

  const handleSaveL1Edit = async (catId: string) => {
    if (!taxonomyData || !editingL1Name.trim()) return;
    saoAudio.playSelect();
    const updated: TaxonomyData = {
      ...taxonomyData,
      taxonomy: taxonomyData.taxonomy.map(cat =>
        cat.id === catId ? { ...cat, name: editingL1Name.trim() } : cat
      )
    };
    onUpdateTaxonomy?.(updated);
    setEditingL1Id(null);
    await fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  const handleDeleteL1 = async (catId: string) => {
    if (!taxonomyData) return;
    if (!confirm('确认删除此 L1 分类场景及其所有子分类？')) return;
    saoAudio.playDismiss();
    const updated: TaxonomyData = {
      ...taxonomyData,
      taxonomy: taxonomyData.taxonomy.filter(cat => cat.id !== catId)
    };
    onUpdateTaxonomy?.(updated);
    await fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  const handleSaveL2Edit = async (l1Id: string, subId: string) => {
    if (!taxonomyData || !editingL2Name.trim()) return;
    saoAudio.playSelect();
    const updatedTags = editingL2Tags
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const updated: TaxonomyData = {
      ...taxonomyData,
      taxonomy: taxonomyData.taxonomy.map(cat => {
        if (cat.id !== l1Id) return cat;
        return {
          ...cat,
          children: cat.children.map(sub =>
            sub.id === subId
              ? { ...sub, name: editingL2Name.trim(), l3_preset_tags: updatedTags }
              : sub
          )
        };
      })
    };
    onUpdateTaxonomy?.(updated);
    setEditingL2Id(null);
    await fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  const handleDeleteL2 = async (l1Id: string, subId: string) => {
    if (!taxonomyData) return;
    if (!confirm('确认删除此 L2 子分类？')) return;
    saoAudio.playDismiss();
    const updated: TaxonomyData = {
      ...taxonomyData,
      taxonomy: taxonomyData.taxonomy.map(cat => {
        if (cat.id !== l1Id) return cat;
        return {
          ...cat,
          children: cat.children.filter(sub => sub.id !== subId)
        };
      })
    };
    onUpdateTaxonomy?.(updated);
    await fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  // Audio Customization
  const handleAudioFileUpload = (action: SoundAction, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      saoAudio.setCustomSound(action, dataUrl);
      setCustomAudioStatus(prev => ({ ...prev, [action]: true }));
      saoAudio.playSelect();
    };
    reader.readAsDataURL(file);
  };

  const handleResetAudioAction = (action: SoundAction) => {
    saoAudio.removeCustomSound(action);
    setCustomAudioStatus(prev => ({ ...prev, [action]: false }));
    saoAudio.playSelect();
  };

  const handlePlaySoundTest = (action: SoundAction) => {
    if (action === 'summon') saoAudio.playSummon();
    else if (action === 'select') saoAudio.playSelect();
    else if (action === 'hover') saoAudio.playHover();
    else if (action === 'dismiss') saoAudio.playDismiss();
    else if (action === 'success') saoAudio.playSuccess();
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/incoming`
    : 'http://localhost:3000/api/webhook/incoming';

  const copyCurl = () => {
    saoAudio.playSelect();
    const curl = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Aether-Access-Key: ${webhookAk || 'YOUR_AK'}" \\
  -d '{"content": "https://cursor.com 全栈开发规则"}'`;
    navigator.clipboard.writeText(curl);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    if (!botMessage.trim()) return;
    saoAudio.playSelect();
    setIsSimulatingWebhook(true);
    try {
      const res = await fetch('/api/webhook/incoming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Aether-Access-Key': webhookAk
        },
        body: JSON.stringify({
          source: botSource,
          sender: '飞书/Telegram Bot',
          content: botMessage
        })
      });
      if (res.ok) {
        const data = await res.json();
        saoAudio.playIngest();
        onRecordsIngested?.([data.record]);
      }
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleTriggerCloudSync = async () => {
    saoAudio.playSelect();
    setIsSyncingCloud(true);
    try {
      const res = await fetch('/api/sync/cloud-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: cloudProvider,
          app_id: cloudAppId,
          app_secret: cloudAppSecret,
          table_name: tableName
        })
      });
      if (res.ok) {
        const data = await res.json();
        saoAudio.playIngest();
        setCloudSyncMsg(`同步完成！拉取 ${data.pulled_count} 条记录。`);
        onRecordsIngested?.(data.records);
      }
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const exportJson = () => {
    saoAudio.playSelect();
    const blob = new Blob([JSON.stringify(allRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AetherHUD_Nexus_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    saoAudio.playSelect();
    const lines = allRecords.map(r => `### [${r.title}](${r.url || '#'})\n- **场景**: ${r.l1_name} / ${r.l2_name}\n- **形态**: ${r.format_tag_name} (${r.media_type})\n- **标签**: ${r.tags.map(t => `#${t}`).join(' ')}\n- **摘要**: ${r.snippet}\n`);
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AetherHUD_Export_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150 select-none"
      style={{
        backgroundColor: `rgba(12, 10, 9, ${Math.min(0.95, Math.max(0.4, hudOpacity + 0.15))})`
      }}
    >
      <div
        className="w-full max-w-4xl border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pixel-box font-mono"
        style={{
          backgroundColor: `rgba(28, 25, 23, ${Math.max(0.4, hudOpacity)})`,
          backdropFilter: 'blur(16px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Unified Earth Tone Pixel */}
        <div className="px-6 py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 pixel-box-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>AetherHUD 全局中枢配置</span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded pixel-box-sm">
                  System Settings
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                标准 LLM 供应器、视频抓取、分类体系、AK/SK Webhook 与 macOS/Windows 部署安装指南
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saoAudio.playDismiss();
              onClose();
            }}
            title="关闭设置 (ESC)"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip - Icon-Driven with Tooltips */}
        <div className="flex items-center gap-1 px-6 pt-2 bg-stone-950/60 border-b border-stone-800 overflow-x-auto">
          {[
            { id: 'llm', label: 'LLM 供应商', icon: <Cpu className="w-4 h-4" />, title: 'LLM 供应商与模型配置 (BaseUrl/ApiKey/ModelId)' },
            { id: 'video', label: '视频抓取', icon: <Video className="w-4 h-4" />, title: '视频多模态解析与 Jina Reader 抓取配置' },
            { id: 'taxonomy', label: '分类体系', icon: <FolderPlus className="w-4 h-4" />, title: 'L1/L2/L3 分类体系导入导出与描述管理' },
            { id: 'display', label: 'HUD 透明度', icon: <Sliders className="w-4 h-4" />, title: 'HUD 全局透明度与粒子渲染设置' },
            { id: 'audio', label: 'SAO 音效', icon: <Volume2 className="w-4 h-4" />, title: 'SAO 晶体音效与自定义音频文件上传' },
            { id: 'webhook', label: 'Bot Webhook', icon: <Webhook className="w-4 h-4" />, title: 'Bot Webhook 接收器与 AK/SK 鉴权' },
            { id: 'cloud', label: '云文档轮询', icon: <RefreshCw className="w-4 h-4" />, title: '飞书表格 / Google Sheets 增量同步' },
            { id: 'export', label: '备份导出', icon: <Download className="w-4 h-4" />, title: 'JSON 完整备份与 Markdown 格式导出' },
            { id: 'guide', label: '配置与部署说明', icon: <FileCode className="w-4 h-4" />, title: 'macOS/Windows 桌面原生快捷键与部署安装指南' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                saoAudio.playSelect();
                setActiveTab(tab.id as any);
              }}
              onMouseEnter={() => saoAudio.playHover()}
              title={tab.title}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                  : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* ================= TAB 1: LLM 供应商与模型 ================= */}
          {activeTab === 'llm' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-2">
                  1. 选择预设供应商架构 (或自定义):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROVIDER_PRESETS.map(preset => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        onMouseEnter={() => saoAudio.playHover()}
                        className={`text-left p-2.5 rounded-xl border transition-all pixel-box-sm ${
                          isSelected
                            ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : 'bg-stone-900/80 border-stone-700 text-stone-300 hover:border-amber-600/60 hover:text-white'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{preset.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1 line-clamp-1">
                          {preset.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Form: Base URL, API KEY, Model ID */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <span>供应商连接参数 (Base URL / API Key / Model ID)</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    由后端全托管代理请求，解决 CORS 跨域限制
                  </span>
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-200 mb-1">
                    Base URL (API 根地址):
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    placeholder="例如: https://api.openai.com/v1 或 https://api.deepseek.com/v1"
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-mono pixel-box-sm"
                  />
                </div>

                {/* API KEY */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-stone-200 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>API KEY (授权凭证):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      title={showApiKey ? '隐藏秘钥' : '显示秘钥'}
                      className="text-[10px] text-stone-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showApiKey ? '隐藏' : '显示'}</span>
                    </button>
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxx (若使用内置免密 Gemini 则留空)"
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-mono pixel-box-sm"
                  />
                </div>

                {/* Model ID + Fetch Models Action */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-stone-200">
                      Model ID (模型标识符):
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchModels}
                      disabled={isFetchingModels}
                      title="向供应商发起 /models 查询获取可用模型"
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-600/70 px-2 py-0.5 rounded transition-all flex items-center gap-1 pixel-box-sm hover:scale-105"
                    >
                      {isFetchingModels ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          <span>获取中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>获取可用模型列表</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={modelId}
                      onChange={e => setModelId(e.target.value)}
                      placeholder="例如: gemini-3.8-flash, gpt-4o-mini, deepseek-chat"
                      className="flex-1 bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-mono pixel-box-sm"
                    />

                    {/* Dropdown if models fetched */}
                    {availableModels.length > 0 && (
                      <select
                        onChange={e => setModelId(e.target.value)}
                        value={modelId}
                        className="bg-stone-900 border border-amber-600/80 rounded-lg px-2.5 py-2 text-xs text-amber-200 focus:outline-none font-mono pixel-box-sm"
                      >
                        <option value="">候选列表 ({availableModels.length})</option>
                        {availableModels.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {modelFetchMsg && (
                    <p className="text-[11px] text-amber-300/90 mt-1 font-mono">
                      {modelFetchMsg}
                    </p>
                  )}
                </div>

                {/* Action Buttons: Test Connection & Save */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    title="发送测试请求并计算网络延迟"
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-amber-500/80 hover:border-amber-400 rounded-lg font-bold flex items-center gap-1.5 transition-all pixel-box hover:scale-105"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>测速中...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>测试连通性</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    title="保存所有供应商配置到后端"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-lg flex items-center gap-1.5 transition-all pixel-box hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  >
                    <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isSaving ? '正在保存...' : '保存配置'}</span>
                  </button>

                  {savedSuccess && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      已生效并持久化存储！
                    </span>
                  )}
                </div>

                {/* Connection Test Banner Output */}
                {connectionTestResult && (
                  <div
                    className={`p-3 rounded-lg border pixel-box-sm text-xs font-mono animate-in fade-in duration-150 ${
                      connectionTestResult.success
                        ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        {connectionTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                        <span>{connectionTestResult.success ? '连通性验证成功 (Connected)' : '连通性测试未通过 (Error)'}</span>
                      </span>
                      {connectionTestResult.latency_ms > 0 && (
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-400">
                          {connectionTestResult.latency_ms} ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90">{connectionTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: 视频抓取配置 ================= */}
          {activeTab === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-500" />
                    <span>视频提取与多模态解析配置</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    针对 Bilibili、YouTube 等视频链接的智能解析流水线
                  </span>
                </div>

                <div>
                  <label className="block text-stone-200 font-bold mb-1">
                    Jina Reader API 根地址:
                  </label>
                  <input
                    type="text"
                    value={jinaReaderUrl}
                    onChange={e => setJinaReaderUrl(e.target.value)}
                    placeholder="https://r.jina.ai"
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-200 font-bold mb-1">
                    网络解析超时时间 (毫秒, 推荐 4000ms):
                  </label>
                  <input
                    type="number"
                    value={jinaTimeoutMs}
                    onChange={e => setJinaTimeoutMs(parseInt(e.target.value) || 4000)}
                    className="w-40 bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-200 font-bold mb-1">
                    视频理解策略:
                  </label>
                  <select
                    value={videoUnderstandingMode}
                    onChange={e => setVideoUnderstandingMode(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                  >
                    <option value="hybrid">混合模式 (优先视频元数据 + 网页上下文摘要提取)</option>
                    <option value="jina_only">仅使用 Jina Reader 文本提取</option>
                    <option value="direct_meta">直接抓取视频平台标题与简介</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestVideoScrape}
                    disabled={isTestingVideo}
                    title="发起一次视频测试抓取验证"
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-amber-500/80 rounded-lg font-bold flex items-center gap-1.5 pixel-box transition-all hover:scale-105"
                  >
                    {isTestingVideo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>测试视频抓取连通性</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-lg pixel-box transition-all hover:scale-105"
                  >
                    保存配置
                  </button>
                </div>

                {videoTestResult && (
                  <div
                    className={`p-3 rounded-lg border pixel-box-sm text-xs font-mono ${
                      videoTestResult.success
                        ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{videoTestResult.message}</span>
                      <span className="text-amber-400">{videoTestResult.latency_ms} ms</span>
                    </div>
                    {videoTestResult.title && (
                      <p className="text-[11px] text-stone-300">测试抓取结果: {videoTestResult.title}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: 分类体系管理 (Requirement 2) ================= */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div>
                    <h4 className="font-bold text-amber-400 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-amber-500" />
                      <span>2+1 维分类架构维护 (L1 / L2 / L3)</span>
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      支持导出与导入 `taxonomy.json`，修改和删除类别描述与预设标签
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportTaxonomy}
                      title="导出 taxonomy.json"
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 rounded-lg font-bold flex items-center gap-1 pixel-box-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>导出 JSON</span>
                    </button>
                    <button
                      onClick={() => setShowImportTaxonomy(true)}
                      title="导入 taxonomy.json"
                      className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/80 rounded-lg font-bold flex items-center gap-1 pixel-box-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>导入 JSON</span>
                    </button>
                  </div>
                </div>

                {taxonomySuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{taxonomySuccessMsg}</span>
                  </div>
                )}

                {/* Import Modal Overlay inside tab */}
                {showImportTaxonomy && (
                  <div className="p-3 bg-stone-900 border border-amber-500/80 rounded-xl space-y-2 pixel-box">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">粘贴或输入新的 taxonomy.json 内容:</span>
                      <button
                        onClick={() => setShowImportTaxonomy(false)}
                        className="text-stone-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={importTaxonomyText}
                      onChange={e => setImportTaxonomyText(e.target.value)}
                      placeholder='{ "taxonomy": [...], "global_l3_tags": {...} }'
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs font-mono text-stone-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowImportTaxonomy(false)}
                        className="px-3 py-1 text-stone-400 hover:text-white"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleImportTaxonomySubmit}
                        className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded"
                      >
                        确认导入并生效
                      </button>
                    </div>
                  </div>
                )}

                {/* Tree Inspector & Category Modifier */}
                <div className="space-y-3">
                  {taxonomyData?.taxonomy.map(cat => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-lg bg-stone-900/90 border border-stone-800 space-y-2 pixel-box-sm"
                    >
                      {/* L1 Header row */}
                      <div className="flex items-center justify-between gap-2">
                        {editingL1Id === cat.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingL1Name}
                              onChange={e => setEditingL1Name(e.target.value)}
                              className="bg-stone-950 border border-amber-500 rounded px-2 py-1 text-xs text-stone-100 font-bold flex-1"
                            />
                            <button
                              onClick={() => handleSaveL1Edit(cat.id)}
                              title="保存修改"
                              className="p-1 bg-emerald-900 text-emerald-200 rounded border border-emerald-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingL1Id(null)}
                              title="取消"
                              className="p-1 text-stone-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-300 text-xs">{cat.name}</span>
                            <span className="text-[10px] font-mono text-stone-500">({cat.id})</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingL1Id(cat.id);
                              setEditingL1Name(cat.name);
                            }}
                            title="修改 L1 类别名称"
                            className="p-1 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteL1(cat.id)}
                            title="删除该 L1 类别"
                            className="p-1 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* L2 Subcategories */}
                      <div className="pl-4 space-y-1.5 border-l-2 border-stone-800">
                        {cat.children.map(sub => (
                          <div
                            key={sub.id}
                            className="p-2 rounded bg-stone-950/60 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            {editingL2Id === sub.id ? (
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={editingL2Name}
                                  onChange={e => setEditingL2Name(e.target.value)}
                                  placeholder="L2 名称"
                                  className="w-full bg-stone-900 border border-amber-500 rounded px-2 py-0.5 text-xs text-stone-100 font-bold"
                                />
                                <input
                                  type="text"
                                  value={editingL2Tags}
                                  onChange={e => setEditingL2Tags(e.target.value)}
                                  placeholder="预设 L3 标签 (以逗号隔开)"
                                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-[11px] text-amber-300 font-mono"
                                />
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => handleSaveL2Edit(cat.id, sub.id)}
                                    className="px-2 py-0.5 bg-emerald-900 text-emerald-200 rounded text-[11px]"
                                  >
                                    保存 L2
                                  </button>
                                  <button
                                    onClick={() => setEditingL2Id(null)}
                                    className="px-2 py-0.5 text-stone-400 text-[11px]"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <div className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                                    <span>{sub.name}</span>
                                    <span className="text-[10px] font-mono text-stone-500">({sub.id})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sub.l3_preset_tags.map(t => (
                                      <span
                                        key={t}
                                        className="text-[10px] px-1.5 py-0.2 rounded bg-stone-900 text-amber-300 border border-stone-800"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingL2Id(sub.id);
                                      setEditingL2Name(sub.name);
                                      setEditingL2Tags(sub.l3_preset_tags.join(', '));
                                    }}
                                    title="修改 L2 与特征标签"
                                    className="p-1 text-stone-400 hover:text-amber-300 rounded"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteL2(cat.id, sub.id)}
                                    title="删除该 L2 子分类"
                                    className="p-1 text-stone-400 hover:text-rose-400 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: HUD 视觉透明度 (Requirement 5: 最低可以为 0) ================= */}
          {activeTab === 'display' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>HUD 全局透明度与背景渲染控制 (最低可调至 0% 完全透明)</span>
                  </span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {Math.round(hudOpacity * 100)}%
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-stone-200 font-bold">
                      悬浮 HUD 全局背景透明度 (含搜索框、L3标签栏收缩条、L1圆圈、L2圆角矩形、分支框):
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={hudOpacity}
                    onChange={e => onUpdateHudOpacity?.(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                    <span>0% (100% 全透明，直接展示壁纸)</span>
                    <span>50% (半透明 HUD)</span>
                    <span>100% (不透明硬朗黑褐背景)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-stone-200 font-bold">
                      Three.js 悬浮光粒子与全息环特效浓度:
                    </label>
                    <span className="text-amber-400 font-mono font-bold">
                      {Math.round(threeParticlesOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={threeParticlesOpacity}
                    onChange={e => onUpdateThreeOpacity?.(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: SAO 音效与上传自定义音频 ================= */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <span>SAO 音效控制与自定义音频上传</span>
                  </span>
                  <button
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      saoAudio.setMuted(next);
                    }}
                    title={isMuted ? '解除静音' : '开启静音'}
                    className="text-xs px-2.5 py-1 rounded border border-stone-700 bg-stone-900 text-stone-200 hover:text-white pixel-box-sm"
                  >
                    {isMuted ? '解除静音' : '静音模式'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-stone-200 font-bold mb-1">
                    <span>主音量大小:</span>
                    <span className="text-amber-400 font-mono">{Math.round(audioVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={audioVolume}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setAudioVolume(v);
                      saoAudio.setVolume(v);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Upload custom sounds for each action */}
                <div>
                  <label className="block text-stone-200 font-bold mb-2">
                    独立动作音频映射 (可上传你喜欢的 SAO 或科幻按键音效文件):
                  </label>
                  <div className="space-y-2">
                    {[
                      { action: 'summon' as SoundAction, name: '呼出/展开 HUD (Summon)', desc: '经典 SAO 从上往下渐近展开时的和弦晶体音' },
                      { action: 'select' as SoundAction, name: '点击选中 (Select)', desc: '点击 L1/L2、标签、确认时的清脆打击音' },
                      { action: 'hover' as SoundAction, name: '鼠标悬停 (Hover)', desc: '划过圆形图标或条目时的超微晶体滴答声' },
                      { action: 'dismiss' as SoundAction, name: '关闭/折叠 (Dismiss)', desc: '按 ESC 或收起 HUD 时的低沉消散音' },
                      { action: 'success' as SoundAction, name: '录入成功 (Success)', desc: '摄入收纳条目完成时的双和弦确认音' }
                    ].map(item => (
                      <div
                        key={item.action}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-stone-900/90 border border-stone-700/80 pixel-box-sm"
                      >
                        <div>
                          <div className="font-bold text-stone-100 flex items-center gap-2">
                            <span>{item.name}</span>
                            {customAudioStatus[item.action] ? (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-mono">
                                自定义音频
                              </span>
                            ) : (
                              <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-mono">
                                内置合成音
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400">{item.desc}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Play Test */}
                          <button
                            type="button"
                            onClick={() => handlePlaySoundTest(item.action)}
                            title="试听当前音频效果"
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 rounded text-[11px] pixel-box-sm flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* Upload File */}
                          <label
                            title="上传自定义音频文件 (.mp3 / .wav)"
                            className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-600/70 rounded text-[11px] cursor-pointer pixel-box-sm flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>上传音频</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={e => handleAudioFileUpload(item.action, e)}
                              className="hidden"
                            />
                          </label>

                          {/* Reset to Default */}
                          {customAudioStatus[item.action] && (
                            <button
                              type="button"
                              onClick={() => handleResetAudioAction(item.action)}
                              className="p-1 text-stone-400 hover:text-rose-400"
                              title="重置为默认合成音"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: Bot Webhook (Requirement 6) ================= */}
          {activeTab === 'webhook' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-400">
                      第三方 Bot Webhook 接收器 (Axum 兼容接口)
                    </span>
                    {/* Help Icon '?' (Requirement 6) */}
                    <button
                      type="button"
                      onClick={() => setShowWebhookHelpModal(true)}
                      title="点击查看使用说明：飞书/Telegram/钉钉如何配置与AK/SK鉴权"
                      className="p-1 rounded-full text-amber-400 hover:text-white bg-amber-950/80 border border-amber-600 hover:border-amber-400 transition-all"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    支持 AK/SK 加签防刷与鉴权
                  </span>
                </div>

                {/* Webhook URL Endpoint */}
                <div>
                  <label className="block text-stone-200 font-bold mb-1">
                    Webhook 监听端点:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 pixel-box-sm"
                    />
                    <button
                      onClick={copyCurl}
                      title="复制完整 cURL 示例"
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-stone-100 pixel-box-sm"
                    >
                      {curlCopied ? '已复制' : '复制 cURL'}
                    </button>
                  </div>
                </div>

                {/* AK & SK Inputs (Requirement 6) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-stone-200 font-bold mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>Access Key ID (AK):</span>
                    </label>
                    <input
                      type="text"
                      value={webhookAk}
                      onChange={e => setWebhookAk(e.target.value)}
                      placeholder="例如: ak_aether_8921"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-stone-200 font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>Secret Access Key (SK):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowWebhookSk(!showWebhookSk)}
                        title={showWebhookSk ? '隐藏秘钥' : '显示秘钥'}
                        className="text-[10px] text-stone-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {showWebhookSk ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showWebhookSk ? '隐藏' : '显示'}</span>
                      </button>
                    </div>
                    <input
                      type={showWebhookSk ? 'text' : 'password'}
                      value={webhookSk}
                      onChange={e => setWebhookSk(e.target.value)}
                      placeholder="sk_secret_xxxxxxxxxxxx"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Test Connection Button & Save (Requirement 6) */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestWebhookConnection}
                    disabled={isTestingWebhook}
                    title="发起一次 Webhook 连通性与 AK/SK 鉴权握手测试"
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-amber-500/80 rounded-lg font-bold flex items-center gap-1.5 pixel-box transition-all hover:scale-105"
                  >
                    {isTestingWebhook ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>测试 Webhook 连通性</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg pixel-box hover:scale-105"
                  >
                    保存 AK/SK
                  </button>
                </div>

                {webhookTestResult && (
                  <div
                    className={`p-3 rounded-lg border pixel-box-sm text-xs font-mono ${
                      webhookTestResult.success
                        ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{webhookTestResult.message}</span>
                      <span className="text-amber-400">{webhookTestResult.latency_ms} ms</span>
                    </div>
                  </div>
                )}

                {/* Simulation input */}
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <label className="block text-stone-200 font-bold">模拟消息推送测试:</label>
                  <textarea
                    rows={2}
                    value={botMessage}
                    onChange={e => setBotMessage(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2.5 text-xs text-stone-100 font-mono pixel-box-sm"
                  />
                  <button
                    onClick={handleSimulateWebhook}
                    disabled={isSimulatingWebhook}
                    className="px-4 py-1.5 bg-amber-600/30 text-amber-200 border border-amber-500/80 rounded-lg pixel-box flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSimulatingWebhook ? '正在推送...' : '模拟收到 Bot 消息并分类存盘'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: 云文档轮询 (Requirement 8: 配置测试连通性) ================= */}
          {activeTab === 'cloud' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-4 pixel-box">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-500" />
                    <span>飞书多维表格 / Google Sheets 定时增量同步</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    支持开放 API 凭证与连通性验证
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-200 font-bold mb-1">同步服务商:</label>
                    <select
                      value={cloudProvider}
                      onChange={e => setCloudProvider(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2 text-xs text-stone-100 pixel-box-sm focus:border-amber-500 font-mono"
                    >
                      <option value="feishu_bitable">飞书多维表格 (Feishu Bitable)</option>
                      <option value="google_sheets">Google Sheets 表格</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-200 font-bold mb-1">数据表名称 / Token:</label>
                    <input
                      type="text"
                      value={tableName}
                      onChange={e => setTableName(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-200 font-bold mb-1">App ID / Client ID:</label>
                    <input
                      type="text"
                      value={cloudAppId}
                      onChange={e => setCloudAppId(e.target.value)}
                      placeholder="cli_a1b2c3d4e5 (选填)"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-stone-200 font-bold">App Secret / Token:</label>
                      <button
                        type="button"
                        onClick={() => setShowCloudSecret(!showCloudSecret)}
                        title={showCloudSecret ? '隐藏秘钥' : '显示秘钥'}
                        className="text-[10px] text-stone-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {showCloudSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showCloudSecret ? '隐藏' : '显示'}</span>
                      </button>
                    </div>
                    <input
                      type={showCloudSecret ? 'text' : 'password'}
                      value={cloudAppSecret}
                      onChange={e => setCloudAppSecret(e.target.value)}
                      placeholder="sec_xxxxxxxxxxxxxxxx"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-lg p-2 text-xs text-stone-100 font-mono pixel-box-sm focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Test Connection Action (Requirement 8) */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestCloudConnection}
                    disabled={isTestingCloud}
                    title="发起一次云文档接口连通性握手验证"
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-amber-500/80 rounded-lg font-bold flex items-center gap-1.5 pixel-box transition-all hover:scale-105"
                  >
                    {isTestingCloud ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>测试云文档连通性</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerCloudSync}
                    disabled={isSyncingCloud}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg pixel-box flex items-center gap-1.5 hover:scale-105"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isSyncingCloud ? '正在同步...' : '立即同步一次'}</span>
                  </button>
                </div>

                {cloudTestResult && (
                  <div
                    className={`p-3 rounded-lg border pixel-box-sm text-xs font-mono ${
                      cloudTestResult.success
                        ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{cloudTestResult.message}</span>
                      <span className="text-amber-400">{cloudTestResult.latency_ms} ms</span>
                    </div>
                  </div>
                )}

                {cloudSyncMsg && (
                  <p className="text-emerald-400 font-bold text-[11px] font-mono">{cloudSyncMsg}</p>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 8: 备份导出 ================= */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-3 pixel-box">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>数据导出与格式化备份</span>
                </span>
                <p className="text-[11px] text-stone-400">
                  当前本地共收录 {allRecords.length} 条已分类资源条目，可导出备份或导入 Obsidian / Notion。
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={exportJson}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-stone-100 font-bold pixel-box"
                  >
                    导出完整 JSON 备份
                  </button>
                  <button
                    onClick={exportMarkdown}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg pixel-box"
                  >
                    导出 Markdown 格式清单
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 9: 配置与部署说明 (Requirements 1 & 7) ================= */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Guide Sub-Nav Buttons */}
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <button
                  onClick={() => setGuideSubTab('macos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    guideSubTab === 'macos'
                      ? 'bg-amber-500 text-stone-950 pixel-box'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>macOS 部署安装指南</span>
                </button>
                <button
                  onClick={() => setGuideSubTab('windows')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    guideSubTab === 'windows'
                      ? 'bg-amber-500 text-stone-950 pixel-box'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Windows 部署安装指南</span>
                </button>
                <button
                  onClick={() => setGuideSubTab('hotkeys')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    guideSubTab === 'hotkeys'
                      ? 'bg-amber-500 text-stone-950 pixel-box'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>桌面原生快捷键指南</span>
                </button>
              </div>

              {/* Guide 1: macOS 部署指南 */}
              {guideSubTab === 'macos' && (
                <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-3 pixel-box text-stone-200">
                  <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-stone-800 pb-2">
                    <Apple className="w-4 h-4" />
                    <span>macOS 原生客户端打包与部署指南 (Tauri v2 + Rust)</span>
                  </div>

                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <div className="font-bold text-stone-100">1. 环境准备 (Apple Silicon & Intel)</div>
                    <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-mono overflow-x-auto">
{`# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Rust 编译环境
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env`}
                    </pre>

                    <div className="font-bold text-stone-100 pt-1">2. 窗口透明与 Vibrancy 样式规范 (`tauri.conf.json`)</div>
                    <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-mono overflow-x-auto">
{`"app": {
  "windows": [{
    "title": "AetherHUD",
    "width": 1080, "height": 720,
    "transparent": true,
    "decorations": false,
    "shadow": false,
    "alwaysOnTop": true,
    "macosPrivateApi": true
  }]
}`}
                    </pre>

                    <div className="font-bold text-stone-100 pt-1">3. 辅助功能权限 (Accessibility Permissions)</div>
                    <p className="text-stone-400">
                      macOS 启用全局快捷键 (<kbd className="text-amber-300">Option+Space</kbd>) 时，首次启动需在 <b>【系统设置 -&gt; 隐私与安全性 -&gt; 辅助功能】</b> 中授予 AetherHUD 键盘监听权限。
                    </p>

                    <div className="font-bold text-stone-100 pt-1">4. 一键编译 Universal DMG 独立安装包</div>
                    <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-mono overflow-x-auto">
{`# 编译适用于 M 系列芯片与 Intel 处理器的通用安装包
npm run tauri build -- --target universal-apple-darwin

# 输出产物位于: src-tauri/target/universal-apple-darwin/release/bundle/dmg/`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Guide 2: Windows 部署指南 */}
              {guideSubTab === 'windows' && (
                <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-3 pixel-box text-stone-200">
                  <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-stone-800 pb-2">
                    <Monitor className="w-4 h-4" />
                    <span>Windows 原生桌面 HUD 打包与部署指南 (Tauri v2 + Rust)</span>
                  </div>

                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <div className="font-bold text-stone-100">1. 环境准备 (Windows 10 / 11)</div>
                    <ul className="list-disc pl-4 text-stone-400 space-y-0.5">
                      <li>安装 Visual Studio 2022 并勾选 <b>C++ 桌面开发生成工具</b> (MSVC)。</li>
                      <li>安装 Rust Windows 官方安装器 (`rustup-init.exe`)。</li>
                      <li>WebView2 运行时 (Windows 11 已经预装，Win10 如缺失可下载 Evergreen 引导程序)。</li>
                    </ul>

                    <div className="font-bold text-stone-100 pt-1">2. DWM 硬件级透明透穿设置 (`main.rs`)</div>
                    <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-mono overflow-x-auto">
{`// 启用 Windows DWM 透明合成与无边框悬浮穿透
window.set_decorations(false).unwrap();
window.set_always_on_top(true).unwrap();
window.set_skip_taskbar(true).unwrap();`}
                    </pre>

                    <div className="font-bold text-stone-100 pt-1">3. 全局唤醒热键注册</div>
                    <p className="text-stone-400">
                      通过 `tauri-plugin-global-shortcut` 监听 <kbd className="text-amber-300">Alt+Space</kbd>，按下时无缝调用 `window.show()` 与 `window.set_focus()`，按下 ESC 或点击外部失焦时自动隐藏。
                    </p>

                    <div className="font-bold text-stone-100 pt-1">4. 一键编译 MSI / NSIS 安装程序</div>
                    <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-mono overflow-x-auto">
{`npm run tauri build

# 输出产物位于: src-tauri/target/release/bundle/msi/ 或 /nsis/`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Guide 3: 快捷键速查 */}
              {guideSubTab === 'hotkeys' && (
                <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-3 pixel-box text-stone-200">
                  <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-stone-800 pb-2">
                    <Terminal className="w-4 h-4" />
                    <span>macOS / Windows 桌面原生快捷键指南</span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-900 border border-stone-800">
                      <span>macOS 呼出 / 隐匿快捷键:</span>
                      <kbd className="text-amber-300 font-bold bg-amber-950/70 border border-amber-700/80 px-2 py-0.5 rounded">Option + Space (⌥+Space) 或 ⌘+K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-900 border border-stone-800">
                      <span>Windows 呼出 / 隐匿快捷键:</span>
                      <kbd className="text-amber-300 font-bold bg-amber-950/70 border border-amber-700/80 px-2 py-0.5 rounded">Alt + Space 或 Ctrl + K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-900 border border-stone-800">
                      <span>触控板 / 鼠标下划手势:</span>
                      <span className="text-amber-400 font-semibold">屏幕任意区域向下划动即可渐近展开 HUD</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-900 border border-stone-800">
                      <span>触控板 / 鼠标上划手势:</span>
                      <span className="text-amber-400 font-semibold">向上划动立刻收回并隐藏 HUD</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-900 border border-stone-800">
                      <span>全局 Dismiss 按键:</span>
                      <kbd className="text-amber-300 font-bold bg-stone-800 px-2 py-0.5 rounded border border-stone-700">ESC (Escape)</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>AetherHUD • SAO Nexus Engine</span>
          <button
            onClick={() => {
              saoAudio.playDismiss();
              onClose();
            }}
            title="关闭面板 (ESC)"
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 pixel-box-sm"
          >
            关闭面板
          </button>
        </div>
      </div>

      {/* Webhook Help Modal Popup (Requirement 6) */}
      {showWebhookHelpModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowWebhookHelpModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-stone-950 border-2 border-amber-500 rounded-2xl p-6 space-y-4 pixel-box font-mono text-stone-200 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm">Webhook 配置指南与 AK/SK 鉴权规范</span>
              </div>
              <button
                onClick={() => setShowWebhookHelpModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-amber-300">1. 什么是 Webhook 接收器？</div>
              <p className="text-stone-300">
                AetherHUD 内置了一个微型 Webhook 服务，监听来自外部自建 Bot（飞书机器人、Telegram 机器人、钉钉或 Raycast 快捷指令）推送的数据。无论你在手机端还是其他工具上看到干货，只要向机器人发消息，条目就会被自动推送并秒速归类到 AetherHUD 收件箱。
              </p>

              <div className="font-bold text-amber-300 pt-1">2. AK / SK 签名鉴权机制</div>
              <p className="text-stone-300">
                为了防止未授权恶意推送，可在上方配置 <b>Access Key ID (AK)</b> 与 <b>Secret Access Key (SK)</b>。外部发起请求时在 Header 中携带：
              </p>
              <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 text-[11px] overflow-x-auto">
{`POST /api/webhook/incoming
Content-Type: application/json
X-Aether-Access-Key: <你的AK>
X-Aether-Signature: <HMAC-SHA256(timestamp + content, SK)>`}
              </pre>

              <div className="font-bold text-amber-300 pt-1">3. 飞书自定义机器人设置</div>
              <ol className="list-decimal pl-4 text-stone-300 space-y-1">
                <li>进入飞书群聊 -&gt; 【添加群机器人】 -&gt; 【自定义机器人】；</li>
                <li>在安全设置中勾选【签名校验】，将此处生成的 SK 填入秘钥；</li>
                <li>在事件订阅的 Request URL 中填写当前系统的 Webhook 地址。</li>
              </ol>

              <div className="font-bold text-amber-300 pt-1">4. 终端 cURL 快速测试示例</div>
              <pre className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-300 text-[11px] overflow-x-auto">
{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Aether-Access-Key: ${webhookAk || 'your_ak'}" \\
  -d '{"content": "https://midjourney.com 摄影级光影提示词"}'`}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWebhookHelpModal(false)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg pixel-box"
              >
                我已了解
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
