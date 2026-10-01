import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  Globe,
  RotateCcw,
  Download,
  Copy,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Zap,
  Sliders,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Lock,
  Flame,
} from 'lucide-react';
import { AIChatMessage } from '../types/heatmap';
import { ComplianceIQLogo } from './ComplianceIQLogo';

interface AIComplianceCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const COMPLIANCE_ROLES = [
  {
    id: 'Senior MENAT Regulatory Compliance Officer',
    label: 'Chief Compliance Officer',
    desc: 'Holistic cross-border MENAT regulatory strategy, statutory enforcement, and board risk reporting.',
    icon: ShieldCheck,
  },
  {
    id: 'AI Governance & Ethics Auditor',
    label: 'AI & Algorithm Auditor',
    desc: 'Specialized in Saudi SDAIA AI Ethics, UAE AI Strategy, and foundation model safety audits.',
    icon: Cpu,
  },
  {
    id: 'Cybersecurity Architect (NCA ECC / UAE NESA / NIST)',
    label: 'Cybersecurity Architect',
    desc: 'Expert in NCA ECC-1:2018, CSCC, UAE NESA, Qatar NIA v2.0, and ISO/NIST crosswalks.',
    icon: Flame,
  },
  {
    id: 'Data Sovereignty & Cross-Border Transfer Legal Counsel',
    label: 'Data Sovereignty Counsel',
    desc: 'Focused on Saudi PDPL, UAE Law 45, Turkey KVKK, and sovereign cloud residency.',
    icon: Lock,
  },
];

const PRESET_QUERIES = [
  'Compare Saudi Arabia vs UAE regulatory density in Artificial Intelligence',
  'What are the mandatory NCA ECC-1:2018 controls for cloud data residency?',
  'Explain Qatar PDPPL financial penalty exposure and breach notification SLAs',
  'Summarize 2026-2027 statutory compliance deadlines across GCC jurisdictions',
  'What are the cross-border data transfer requirements under Saudi PDPL?',
];

const CHAT_STORAGE_KEY = 'menat_ai_copilot_chat_history';

export const AIComplianceCopilot: React.FC<AIComplianceCopilotProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    // Try new key, fall back to legacy key for migrated users
    const saved =
      localStorage.getItem(CHAT_STORAGE_KEY) ||
      localStorage.getItem('menat_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse errors
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `### Welcome to ComplianceIQ Copilot
**Middle East, North Africa & Türkiye Regulations & Controls**

I am your regulatory intelligence AI advisory assistant grounded in official MENAT statutory gazettes, national cybersecurity authorities (NCA, DESC, NCSA, USOM), and data protection frameworks (Saudi PDPL, UAE Law 45, Qatar PDPPL, Turkey KVKK).

**How I can assist your team today:**
- Benchmark regional regulatory density across AI, Cybersecurity, and Cloud Sovereignty.
- Map local mandates directly to **NIST CSF 2.0**, **ISO/IEC 27001**, or **CSA CCM v4**.
- Verify upcoming 2026-2027 statutory deadlines, penalty exposures, and executive liability rules.
- Search the web for the latest gazette releases via Tavily.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Amazon Nova Pro (AWS Bedrock)',
        groundingSources: [
          { title: 'Saudi NCA Regulations Portal', url: 'https://nca.gov.sa' },
          { title: 'SDAIA National Data & AI Framework', url: 'https://sdaia.gov.sa' },
        ],
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>(COMPLIANCE_ROLES[0].id);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota exceeded or private browsing
    }
  }, [messages]);

  // Handle passed initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Send message to AI server endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Pass only last 8 messages to keep context concise
      const apiMessages = newHistory.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          role: selectedRole,
          enableSearch: enableSearchGrounding,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error while generating response');
      }

      const assistantMessage: AIChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'No response returned from the model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || 'Amazon Nova Pro (AWS Bedrock)',
        groundingSources: data.groundingSources || [],
        searchQueries: data.searchQueries || [],
        rolePersona: selectedRole,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[AI Copilot Chat Error]', err);
      const errorMessage: AIChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `**Compliance Engine Alert**: Unable to connect with the AI service. Error: ${
          err?.message || 'Network failure'
        }.\n\nPlease ensure \`AWS_ACCESS_KEY_ID\`, \`AWS_SECRET_ACCESS_KEY\`, and \`AWS_REGION\` are configured in your \`.env\` file and that Bedrock model access is granted in your AWS account.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: err?.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your current regulatory chat history?')) {
      const initial: AIChatMessage = {
        id: `welcome-msg-${Date.now()}`,
        role: 'assistant',
        content: 'Chat history cleared. How can I assist with your MENAT compliance obligations?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Amazon Nova Pro (AWS Bedrock)',
      };
      setMessages([initial]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem('menat_gemini_chat_history'); // clear legacy key too
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? 'USER' : 'COMPLIANCEIQ COPILOT'}:\n${m.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MENAT_Compliance_Advisory_Transcript_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
      {/* Slide-out Drawer Panel */}
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Chat Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ComplianceIQLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-100 tracking-tight">
                  Compliance<span className="text-cyan-400">IQ</span> Copilot
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-mono">
                  AWS Bedrock · Nova Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Middle East, North Africa &amp; Türkiye Regulations &amp; Controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportTranscript}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Export Conversation (Markdown)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advisor Persona & Web Search Configuration Strip */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Persona selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Persona:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              {COMPLIANCE_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Web Search toggle (Tavily) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                enableSearchGrounding
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Enable or disable Tavily web search"
            >
              <Globe className="w-3 h-3" />
              <span>Web Search: {enableSearchGrounding ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Message Thread Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 mt-0.5">
                  <ComplianceIQLogo size={28} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Message Header (for Assistant) */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      ComplianceIQ Copilot
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && (
                        <span className="font-mono text-[10px] text-slate-500">{msg.modelUsed}</span>
                      )}
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy message content"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Markdown Message Body */}
                <div className="markdown-body leading-relaxed space-y-2 text-xs">
                  <Markdown>{msg.content}</Markdown>
                </div>

                {/* Web Search Sources (if Tavily returned results) */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="pt-2.5 mt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Web Search Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[10px] text-emerald-300 rounded transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs items-center text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 space-y-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing Compliance Intelligence...
                </span>
                <p className="text-[11px] text-slate-500">
                  Querying AWS Bedrock (Amazon Nova Pro) with MENAT statutory controls and web search context.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
          <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
            Suggested Compliance Queries:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-700/80 hover:text-white text-slate-300 border border-slate-700/60 rounded-full transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about AI ethics, NCA ECC controls, data privacy laws, or statutory deadlines..."
                rows={2}
                disabled={isLoading}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-60"
              />
              <span className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-500">
                Press Enter to send
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl shadow-md transition-all shrink-0"
              title="Submit Prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
            <span>AWS Bedrock · Amazon Nova Pro · 24 MENAT Official Legal Registries</span>
            <span className="font-mono">Role: {selectedRole.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
