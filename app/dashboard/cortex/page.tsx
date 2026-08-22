"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAgentChat } from "@/components/agent/use-agent-chat";
import { MarkdownContent } from "@/components/agent/markdown-content";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Square,
  Trash2,
  Flame,
  Search,
  Bot,
  User,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Package,
  Globe,
  Zap,
  Brain,
  Copy,
  Check,
} from "lucide-react";

interface UsageData {
  plan: string;
  isPro: boolean;
  dailyUsage: number;
  dailyLimit: number | null;
  remaining: number | null;
}

const QUICK_PROMPTS = [
  {
    icon: Flame,
    title: "High-Intent Pipeline Audit",
    prompt: "Analyze my captured leads with buying intent score > 75, compare their urgency, and rank the top deals to prioritize.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Search,
    title: "Live Social Intent Discovery",
    prompt: "Search Reddit and HackerNews right now for people actively seeking tool recommendations, migrations, or software alternatives.",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
];

// ChatGPT / Perplexity Style Search & Reasoning Pill
function ChatGPTLoadingPill({ activeTool, enableThinking = true }: { activeTool: string | null; enableThinking?: boolean }) {
  let icon = <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
  let label = "Searching online discussions...";

  if (activeTool === "querySystemLeads") {
    icon = <Search className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
    label = "Scanning captured leads in workspace...";
  } else if (activeTool === "liveSocialDiscovery") {
    icon = <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin" />;
    label = "Searching Reddit, HackerNews & Twitter live...";
  } else if (activeTool === "createProduct") {
    icon = <Package className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
    label = "Registering new product / service offering...";
  } else if (activeTool === "addLeadToProduct") {
    icon = <Package className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
    label = "Saving lead into product database...";
  } else if (activeTool === "getProductsAndServices") {
    icon = <Package className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
    label = "Loading configured workspace products...";
  } else if (activeTool === "getWorkspaceStats") {
    icon = <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />;
    label = "Computing pipeline metrics & score breakdown...";
  } else if (!activeTool) {
    icon = <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />;
    label = enableThinking ? "Thinking & analyzing strategy..." : "Analyzing request...";
  }

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-card/80 border border-border/60 text-xs text-foreground/90 shadow-xs backdrop-blur-md transition-all">
      {icon}
      <span className="font-medium text-xs tracking-tight">{label}</span>
      <div className="flex gap-1 items-center ml-0.5">
        <span className="w-1 h-1 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1 h-1 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1 h-1 rounded-full bg-primary/80 animate-bounce" />
      </div>
    </div>
  );
}

function formatMessageTime(dateInput?: Date | string) {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-muted/40"
      title="Copy response"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

// Modern Groq/DeepSeek-style auto-scrolling real-time reasoning view
function ThoughtAccordion({ reasoning, isThinking }: { reasoning?: string; isThinking: boolean }) {
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // During active thinking, default open unless user explicitly closed it; once done, collapse unless user explicitly opened it
  const isOpen = userToggled !== null ? userToggled : isThinking;

  // Auto-scroll reasoning container to bottom as tokens arrive (like Groq Chat)
  useEffect(() => {
    if (isThinking && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoning, isThinking]);

  if (!reasoning && !isThinking) return null;

  return (
    <div className="my-1 text-xs">
      <button
        onClick={() => setUserToggled(!isOpen)}
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer bg-muted/20 hover:bg-muted/40 font-mono text-xs border border-border/30"
      >
        <Brain className={`w-3.5 h-3.5 text-primary ${isThinking ? "animate-pulse" : ""}`} />
        <span>{isThinking ? "Thinking & analyzing..." : "Thought process"}</span>
        {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1 text-muted-foreground/60" />}
      </button>

      {isOpen && (
        <div
          ref={scrollRef}
          className="mt-1.5 p-3 rounded-lg bg-card/30 border border-border/30 max-h-60 overflow-y-auto font-mono text-xs text-muted-foreground/80 leading-relaxed whitespace-pre-wrap selection:bg-primary/20 max-w-3xl custom-scrollbar"
        >
          {reasoning || (
            <div className="flex items-center gap-2 text-muted-foreground/50 italic">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span>Analyzing context & strategy...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CortexDashboardPage() {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    activeTool,
    enableThinking,
    toggleThinking,
    stop,
    clearChat,
  } = useAgentChat();

  const [usage, setUsage] = useState<UsageData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/usage");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsage(data);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Auto-focus textarea on page mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Global typing listener: automatically focus textarea when typing anywhere on the page (ChatGPT-style)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select" || isEditable) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" || e.key === "Tab" || e.key.startsWith("F")) return;

      if (e.key.length === 1) {
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTool, isLoading]);

  const handleSendMessage = async (text?: string) => {
    await sendMessage(text);
    fetchUsage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.2rem)] w-full max-w-full px-2 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-3 border-b border-border/40 flex-shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Cortex
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                Autonomous Copilot
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Autonomous sales strategist, lead hunter, and buying intent copilot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Plan Quota Badge */}
          {usage && (
            usage.isPro ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                <Zap className="w-3 h-3 fill-current" />
                <span>
                  <strong className="text-emerald-300 font-semibold">{usage.remaining ?? 50}</strong> / {usage.dailyLimit ?? 50} Pro queries left today
                </span>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs ${
                usage.remaining === 0 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  : "bg-muted/40 border-border/50 text-muted-foreground"
              }`}>
                <span>
                  {usage.remaining === 0 ? (
                    <strong className="font-semibold text-rose-400">0 left (5/5 used today)</strong>
                  ) : (
                    <>
                      <strong className="text-foreground font-semibold">{usage.remaining} left</strong> ({usage.dailyUsage}/5 used today)
                    </>
                  )}
                </span>
                <Link
                  href="/dashboard/billing"
                  className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-colors ml-0.5"
                >
                  Upgrade
                </Link>
              </div>
            )
          )}

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Conversational Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6 min-h-0">
        {messages.length === 0 ? (
          /* Empty State / Welcome Guide */
          <div className="h-full flex flex-col justify-center max-w-3xl mx-auto space-y-8 py-8">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cortex Autonomous Intelligence</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                How can Cortex assist your pipeline today?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                I can hunt for fresh buying intent across social networks in real-time, search your captured
                leads, compare prospect intent scores, or analyze workspace conversion metrics.
              </p>
            </div>

            {/* Quick Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {QUICK_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(item.prompt)}
                    className="p-4 rounded-xl text-left border border-border/40 hover:border-primary/40 bg-card/30 hover:bg-card/70 transition-all duration-200 group cursor-pointer space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Stream - Pure Markdown View */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`space-y-2.5 ${
                  msg.role === "user"
                    ? "max-w-[85%] sm:max-w-[75%] bg-muted/90 text-foreground border border-border/50 px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-normal leading-relaxed shadow-xs"
                    : "w-full max-w-full text-foreground"
                }`}
              >
                {/* User Message */}
                {msg.role === "user" && (
                  <div className="space-y-1">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-end text-[10px] text-muted-foreground/60 font-mono select-none pt-0.5">
                      <span>{formatMessageTime(msg.createdAt)}</span>
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {msg.role === "assistant" && (
                  <div className="space-y-2.5 w-full">
                    {/* Live DeepSeek / Claude 3.7-Style Thought Process Accordion */}
                    {(msg.reasoning || (enableThinking && isLoading && msg.id === messages[messages.length - 1]?.id && !msg.content && !activeTool)) && (
                      <ThoughtAccordion
                        reasoning={msg.reasoning}
                        isThinking={Boolean(enableThinking && isLoading && msg.id === messages[messages.length - 1]?.id && !msg.content)}
                      />
                    )}

                    {/* Live Search & Action Indicator Pill */}
                    {isLoading && msg.id === messages[messages.length - 1]?.id && (activeTool || !enableThinking || !msg.content) && (
                      <div className="py-0.5 animate-in fade-in duration-150">
                        <ChatGPTLoadingPill activeTool={activeTool} enableThinking={enableThinking} />
                      </div>
                    )}

                    {/* Streamed Primary Text Response with Rich Markdown & Tables */}
                    {msg.content ? (
                      <div className="space-y-2">
                        <MarkdownContent content={msg.content} className="max-w-4xl py-0.5" />
                        
                        {/* Assistant Message Footer Metadata */}
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/60 font-mono border-t border-border/20 select-none">
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          <span className="text-border/60">•</span>
                          <CopyMessageButton text={msg.content} />
                          <span className="text-border/60 hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-muted-foreground/50">Cortex Copilot</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-muted border border-border/40 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Premium Command Console Deck */}
      <div className="pt-2 pb-3 flex-shrink-0 w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative bg-card/40 hover:bg-card/60 focus-within:bg-card/90 border border-border/50 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 rounded-2xl p-3 shadow-xs transition-all w-full space-y-2.5"
        >
          {usage && !usage.isPro && usage.remaining === 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground">
                  You have reached your <strong>5 Free daily queries</strong>. Upgrade to <strong>Pro</strong> for 50 daily queries, live social discovery, and instant outreach drafting.
                </span>
              </div>
              <Link href="/dashboard/billing">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 rounded-xl flex-shrink-0 cursor-pointer shadow-xs">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Cortex anything (e.g. 'rank today's leads by deal urgency', 'hunt Reddit for CRM alternatives', 'analyze my pipeline')..."
              rows={2}
              disabled={isLoading}
              className="min-h-[52px] max-h-36 resize-none bg-transparent dark:bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 p-0 text-sm text-foreground placeholder:text-muted-foreground/50 custom-scrollbar w-full leading-relaxed shadow-none"
            />
          )}

          {/* Console Bottom Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/20 text-xs">
            {/* Left Status & Thinking Controls */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground/70 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${usage && !usage.isPro && usage.remaining === 0 ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                <span className="font-mono text-xs text-muted-foreground/80 hidden sm:inline">
                  {usage && !usage.isPro && usage.remaining === 0 ? 'Daily Limit Reached' : 'Cortex Active'}
                </span>
              </div>

              {/* Thinking Mode Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleThinking()}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                  enableThinking
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-xs'
                    : 'bg-muted/20 text-muted-foreground hover:text-foreground border-border/30 opacity-70'
                }`}
                title={enableThinking ? 'Thinking Mode enabled (Deep Reasoning ON)' : 'Thinking Mode disabled (Fast Responses)'}
              >
                <Brain className={`w-3 h-3 ${enableThinking ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs">Thinking</span>
                <span className={`text-[10px] px-1 rounded font-mono ${enableThinking ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
                  {enableThinking ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Right Action & Send Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="hidden sm:inline text-xs text-muted-foreground/50 font-mono">
                Shift + ↵ for line
              </span>

              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={stop}
                  className="h-8 px-3 rounded-xl text-xs gap-1.5 cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="h-8 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs gap-1.5 disabled:opacity-30 active:scale-95 shadow-xs transition-all cursor-pointer"
                  title="Send message"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
