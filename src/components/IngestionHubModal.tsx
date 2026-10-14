import React, { useState } from 'react';
import { X, Webhook, RefreshCw, Download, Upload, Copy, Check, Play, Terminal, Database, CheckCircle2 } from 'lucide-react';
import { ResourceRecord } from '../types';
import { saoAudio } from '../utils/saoAudio';

interface IngestionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordsIngested: (records: ResourceRecord[]) => void;
  allRecords: ResourceRecord[];
  hudOpacity?: number;
}

export const IngestionHubModal: React.FC<IngestionHubModalProps> = ({
  isOpen,
  onClose,
  onRecordsIngested,
  allRecords,
  hudOpacity = 0.65
}) => {
  const [activeTab, setActiveTab] = useState<'webhook' | 'cloud' | 'export'>('webhook');
  const [curlCopied, setCurlCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // Webhook Simulator State
  const [botSource, setBotSource] = useState('feishu_bot');
  const [botMessage, setBotMessage] = useState('https://github.com/vllm-project/vllm 高吞吐低延迟 LLM 推理引擎开源库');

  // Cloud Sync State
  const [cloudProvider, setCloudProvider] = useState('feishu_bitable');
  const [tableName, setTableName] = useState('个人知识库_收件箱');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  if (!isOpen) return null;

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/incoming`
    : 'http://localhost:3000/api/webhook/incoming';

  const curlCommand = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"sender": "TelegramBot", "source": "telegram", "content": "https://cursor.com 最新 AI 编码助手测评"}'`;

  const copyCurl = () => {
    saoAudio.playSelect();
    navigator.clipboard.writeText(curlCommand);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    if (!botMessage.trim()) return;
    saoAudio.playSelect();
    setIsSimulating(true);
    const newLog = [...simulationLog, `[${new Date().toLocaleTimeString()}] 正在模拟发送来自 ${botSource} 的 Webhook...`];
    setSimulationLog(newLog);

    try {
      const res = await fetch('/api/webhook/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: botSource,
          sender: botSource === 'feishu_bot' ? '飞书智能助理' : 'Telegram 频道机器人',
          content: botMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        saoAudio.playIngest();
        setSimulationLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 成功摄取并分类: "${data.record.title}" -> [${data.record.l1_name} / ${data.record.l2_name}]`
        ]);
        onRecordsIngested([data.record]);
      }
    } catch (e: any) {
      setSimulationLog(prev => [...prev, `[ERROR] 发送失败: ${e.message}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTriggerCloudSync = async () => {
    saoAudio.playSelect();
    setIsSyncing(true);
    setSyncStatusMsg('正在向云端多维表格建立连接并比对增量记录...');

    try {
      const res = await fetch('/api/sync/cloud-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: cloudProvider,
          table_name: tableName
        })
      });

      if (res.ok) {
        const data = await res.json();
        saoAudio.playIngest();
        setSyncStatusMsg(`同步完成！从 [${tableName}] 成功拉取 ${data.pulled_count} 条增量待归档资源。`);
        onRecordsIngested(data.records);
      }
    } catch (e) {
      setSyncStatusMsg('同步失败，请检查网络连接');
    } finally {
      setIsSyncing(false);
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
    const lines = allRecords.map(r => {
      return `### [${r.title}](${r.url || '#'})
- **场景**: ${r.l1_name} / ${r.l2_name}
- **形态**: ${r.format_tag_name} (${r.media_type})
- **标签**: ${r.tags.map(t => `#${t}`).join(' ')}
- **摘要**: ${r.snippet}
`;
    });
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
        className="w-full max-w-3xl border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pixel-box font-mono"
        style={{
          backgroundColor: `rgba(28, 25, 23, ${Math.max(0.4, hudOpacity)})`,
          backdropFilter: 'blur(16px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-100">
                多源摄取管线与数据中枢
              </h3>
              <p className="text-[11px] text-stone-400">
                支持外部机器人 Webhook 监听、云端多维表格定时轮询与数据备份
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saoAudio.playDismiss();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            onClick={() => {
              saoAudio.playSelect();
              setActiveTab('webhook');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'webhook'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook 接收器 (Axum API)</span>
          </button>

          <button
            onClick={() => {
              saoAudio.playSelect();
              setActiveTab('cloud');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cloud'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>多维表格定时轮询器 (Cron Sync)</span>
          </button>

          <button
            onClick={() => {
              saoAudio.playSelect();
              setActiveTab('export');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>数据备份与导出</span>
          </button>
        </div>

        {/* Tab 1: Webhook */}
        {activeTab === 'webhook' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                实时接收地址 (Live Endpoint):
              </span>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-indigo-300 font-mono"
                />
                <button
                  onClick={copyCurl}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shrink-0"
                >
                  {curlCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{curlCopied ? '已复制 curl' : '复制调用命令'}</span>
                </button>
              </div>
            </div>

            {/* Testbench */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>交互式 Bot 消息推送测试台</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">模拟发送来源:</label>
                  <select
                    value={botSource}
                    onChange={e => setBotSource(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="feishu_bot">飞书自建机器人 (Feishu Bot)</option>
                    <option value="telegram_bot">Telegram 收藏机器人 (TG Webhook)</option>
                    <option value="dingtalk_bot">钉钉群聊小助手 (DingTalk)</option>
                    <option value="wechat_bot">微信助手快捷指令</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">预设快速模板:</label>
                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setBotMessage('https://suno.com 最新 V3.5 音乐生成模型与分轨技巧')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      Suno音频
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotMessage('https://cursor.com 全栈开发规则配置与自动化测试')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      Cursor工作流
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotMessage('分享一个出海独立开发冷启动案例，首月 $3k MRR')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      商业出海
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">推送文本或 URL:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={botMessage}
                    onChange={e => setBotMessage(e.target.value)}
                    placeholder="输入要从群聊或机器人转发的信息..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={handleSimulateWebhook}
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSimulating ? '发送中...' : '模拟推送到 AetherHUD'}</span>
                  </button>
                </div>
              </div>

              {simulationLog.length > 0 && (
                <div className="mt-3 p-2.5 rounded bg-slate-900 font-mono text-[11px] text-slate-400 space-y-1 max-h-32 overflow-y-auto border border-slate-800">
                  {simulationLog.map((log, i) => (
                    <div key={i} className="leading-relaxed text-indigo-300">{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cloud Docs */}
        {activeTab === 'cloud' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>多维表格定时轮询配置 (Bitable Poller)</span>
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                后台 Cron 任务每隔固定时间轮询指定的云端表格，拉取状态为「待归档」的记录并自动调用 Jev / Gemini 模型完成 L1/L2/L3 智能归档。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">云服务提供商:</label>
                  <select
                    value={cloudProvider}
                    onChange={e => setCloudProvider(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="feishu_bitable">飞书多维表格 (Feishu Bitable)</option>
                    <option value="tencent_docs">腾讯文档智能表格</option>
                    <option value="google_sheets">Google Sheets (Workplace)</option>
                    <option value="notion_db">Notion Database</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">监控数据表名称:</label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  自动同步频率: 每 5 分钟 (增量模式)
                </span>
                <button
                  onClick={handleTriggerCloudSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '正在拉取...' : '立即执行增量拉取'}</span>
                </button>
              </div>

              {syncStatusMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncStatusMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Export */}
        {activeTab === 'export' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">
                知识中枢数据全量导出
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                当前本地索引库共存储 <span className="text-cyan-400 font-bold font-mono">{allRecords.length}</span> 条资源。支持导出为结构化 JSON 完整备份，或带分类 Markdown 列表导入 Obsidian / Notion。
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={exportJson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>导出为 JSON 备份文件</span>
                </button>

                <button
                  onClick={exportMarkdown}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>导出为 Markdown 知识清单</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              saoAudio.playDismiss();
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
