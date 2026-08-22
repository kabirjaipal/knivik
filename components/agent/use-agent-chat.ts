"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: 'calling' | 'result';
  result?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  createdAt: Date;
  toolInvocations?: ToolInvocation[];
}

const CHAT_STORAGE_KEY = "knivik_agent_chat_history";
const THINKING_MODE_KEY = "knivik_enable_thinking";

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [enableThinking, setEnableThinking] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore chat history & thinking preference from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((m: any) => ({
              ...m,
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            }))
          );
        }
      }

      const savedThinking = localStorage.getItem(THINKING_MODE_KEY);
      if (savedThinking !== null) {
        setEnableThinking(savedThinking === "true");
      }
    } catch (_) {}
    setIsHydrated(true);
  }, []);

  // Save thinking preference
  const toggleThinking = useCallback((value?: boolean) => {
    setEnableThinking((prev) => {
      const next = value !== undefined ? value : !prev;
      try {
        localStorage.setItem(THINKING_MODE_KEY, String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (_) {}
  }, [messages, isHydrated]);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || isLoading) return;

      const userMessageId = `user_${Date.now()}`;
      const assistantMessageId = `assistant_${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: query,
        createdAt: new Date(),
      };

      const updatedMessages = [...messages, userMessage];

      const initialAssistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        toolInvocations: [],
      };

      setMessages([...updatedMessages, initialAssistantMessage]);
      setInput("");
      setIsLoading(true);
      setActiveTool(null);

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enableThinking,
            // Keep last 8 turns to prevent token explosion and stay well within Groq TPM limits
            messages: updatedMessages.slice(-8).map((m) => {
              let textContent = m.content || "";
              // Only append lightweight summary if assistant message has no text yet
              if (!textContent && m.role === "assistant" && m.toolInvocations && m.toolInvocations.length > 0) {
                const toolOutputs = m.toolInvocations
                  .filter((t) => t.state === "result" && t.result)
                  .map((t) => `[Executed ${t.toolName}: ${t.result.message || (t.result.success ? "Success" : "Failed")}]`)
                  .join("\n");
                textContent = toolOutputs || "Completed step.";
              }
              return {
                role: m.role,
                content: textContent || (m.role === "assistant" ? "Completed analysis." : ""),
              };
            }),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with status ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        let accumulatedText = "";
        let accumulatedReasoning = "";
        const toolInvocationsMap = new Map<string, ToolInvocation>();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const part = JSON.parse(line);

              if (part.type === "reasoning-delta" && part.text) {
                accumulatedReasoning += part.text;
              } else if (part.type === "text-delta" && part.text) {
                accumulatedText += part.text;
              } else if (part.type === "tool-call") {
                const callId = part.toolCallId || part.id || `call_${Date.now()}`;
                const toolName = part.toolName || "tool";
                setActiveTool(toolName);
                toolInvocationsMap.set(callId, {
                  toolCallId: callId,
                  toolName,
                  args: part.args || part.input || {},
                  state: "calling",
                });
              } else if (part.type === "tool-result") {
                const callId = part.toolCallId || part.id;
                const resultData = part.result || part.output;
                const existing: ToolInvocation = toolInvocationsMap.get(callId) || {
                  toolCallId: callId,
                  toolName: part.toolName || "tool",
                  args: part.args || {},
                  state: "result",
                  result: resultData,
                };
                existing.state = "result";
                existing.result = resultData;
                toolInvocationsMap.set(callId, { ...existing });
                setActiveTool(null);
              } else if (part.type === "error") {
                const errorStr = typeof part.error === "object"
                  ? (part.error?.message || JSON.stringify(part.error))
                  : String(part.error || "Agent encountered an unexpected issue");
                accumulatedText = accumulatedText
                  ? `${accumulatedText}\n\n⚠️ **Error:** ${errorStr}`
                  : `⚠️ **Error:** ${errorStr}`;
                toast.error(errorStr);
              }
            } catch (_) {}
          }

          // Update assistant message in state during streaming
          setMessages((prev) => {
            return prev.map((msg) => {
              if (msg.id === assistantMessageId) {
                return {
                  ...msg,
                  content: accumulatedText,
                  reasoning: accumulatedReasoning,
                  toolInvocations: Array.from(toolInvocationsMap.values()),
                };
              }
              return msg;
            });
          });
        }

        // After stream completely finishes, if no text was generated at all, show fallback
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === assistantMessageId && !msg.content.trim()) {
              return {
                ...msg,
                content: toolInvocationsMap.size > 0
                  ? "Completed step execution."
                  : "⚠️ I encountered an unexpected issue while processing your request. Please try again or rephrase.",
              };
            }
            return msg;
          });
        });
      } catch (err: any) {
        if (err.name === "AbortError") {
          toast.info("Generation stopped");
        } else {
          const errMsg = typeof err === "object"
            ? (err?.message || JSON.stringify(err))
            : String(err || "Failed to reach Cortex AI");
          toast.error(errMsg);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `⚠️ **Error:** ${errMsg}. Please try again.`,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsLoading(false);
        setActiveTool(null);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, messages]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setActiveTool(null);
    }
  }, []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (_) {}
  }, [stop]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    activeTool,
    enableThinking,
    setEnableThinking,
    toggleThinking,
    stop,
    clearChat,
  };
}
