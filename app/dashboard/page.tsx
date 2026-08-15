"use client";

import { useAuth } from "@/context/auth-context";
import { exportLeadsToCSV } from "@/lib/utils";
import {
  Radar,
  Activity,
  Clock,
  TrendingUp,
  CheckCircle2,
  Package,
  Briefcase,
  ChevronRight,
  AlertCircle,
  Sparkles,
  UserCheck,
  Bookmark,
  Send,
  XCircle,
  Loader2,
  Download,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LeadCard,
  type LeadCardData,
  type LeadStatus,
} from "@/components/dashboard/lead-card";
import { API_URL } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "ALL" | "NEW" | "QUALIFIED" | "SAVED" | "CONTACTED" | "CONVERTED" | "DISMISSED";

interface ProductSummary {
  id: string;
  name: string;
  isActive: boolean;
  config?: {
    productType?: 'product' | 'service';
    [key: string]: any;
  } | null;
  _count?: { leads: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<LeadCardData[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [isPending, startTransition] = useTransition();
  const [draftingLeadId, setDraftingLeadId] = useState<string | null>(null);
  const [draftedReplies, setDraftedReplies] = useState<Record<string, string>>(
    {},
  );
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [llmUsage, setLlmUsage] = useState<{
    totals: { requestCount: number };
  } | null>(null);

  const hasFetched = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, productsRes, llmRes] = await Promise.all([
        fetch(`${API_URL}/leads`, { credentials: "include" }),
        fetch(`${API_URL}/products`, { credentials: "include" }),
        fetch(`${API_URL}/analytics/llm`, { credentials: "include" }),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        const fetched = (data.leads ?? []) as LeadCardData[];
        setLeads(fetched);
        const drafts: Record<string, string> = {};
        fetched.forEach((l) => {
          if (l.replies?.length) drafts[l.id] = l.replies[0]!.generatedText;
        });
        setDraftedReplies(drafts);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products ?? []);
      }

      if (llmRes.ok) {
        const data = await llmRes.json();
        if (data.success) setLlmUsage(data.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (hasFetched.current && lastUserId.current === user.id) return;
    hasFetched.current = true;
    lastUserId.current = user.id;
    fetchAll();
  }, [user, authLoading, fetchAll]);

  // ─── Lead actions ─────────────────────────────────────────────────────────

  const handleDraftReply = async (leadId: string) => {
    setDraftingLeadId(leadId);
    try {
      const res = await fetch(
        `${API_URL}/leads/${leadId}/reply`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDraftedReplies((prev) => ({ ...prev, [leadId]: data.generatedText }));
      setExpandedReplies((prev) => ({ ...prev, [leadId]: true }));
      toast.success("Your AI reply draft is ready!");
    } catch (e) {
      toast.error(
        "We could not generate a draft reply right now. Please try again.",
      );
    } finally {
      setDraftingLeadId(null);
    }
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l)),
    );
    await fetch(`${API_URL}/leads/${leadId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const handleNotesChange = async (leadId: string, notes: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, notes } : l)),
    );
    await fetch(`${API_URL}/leads/${leadId}/notes`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
  };

  const handleFeedbackChange = async (leadId: string, feedback: number) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, feedback } : l)),
    );
    await fetch(`${API_URL}/leads/${leadId}/feedback`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    }).catch(() => {});
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success("Lead deleted successfully.");
    } catch (e: any) {
      toast.error("We could not delete the lead. Please try again.");
    }
  };

  const handleExportCSV = useCallback(() => {
    const isPro = user?.plan?.toUpperCase() === "PRO";
    const success = exportLeadsToCSV(leads, "all_leads.csv", isPro);
    if (success) {
      toast.success("Successfully exported all leads to CSV");
    } else {
      toast.error("No leads to export.");
    }
  }, [leads, user?.plan]);

  const handleTabSelect = (tab: FilterTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // ─── Derived metrics (Memoized) ──────────────────────────────────────────

  const { total, highIntent, last24h, converted, avgScore, saved } = useMemo(() => {
    const total = leads.length;
    let highIntent = 0;
    let last24h = 0;
    let converted = 0;
    let totalScore = 0;
    let saved = 0;

    const now = Date.now();
    for (const l of leads) {
      if (l.intentScore >= 80) highIntent++;
      if (now - new Date(l.createdAt).getTime() < 86_400_000) last24h++;
      if (l.status === "CONVERTED") converted++;
      if (l.status === "SAVED") saved++;
      totalScore += l.intentScore;
    }

    return {
      total,
      highIntent,
      last24h,
      converted,
      avgScore: total > 0 ? Math.round(totalScore / total) : 0,
      saved,
    };
  }, [leads]);

  // ─── Tabs & filtering ─────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string; count: number; icon: React.ComponentType<any> }[] = useMemo(() => [
    { key: "ALL", label: "All Active", count: leads.filter(l => l.status !== 'DISMISSED').length, icon: Activity },
    { key: "NEW", label: "New", count: leads.filter(l => l.status === 'NEW').length, icon: Sparkles },
    { key: "QUALIFIED", label: "Qualified", count: leads.filter(l => l.status === 'QUALIFIED').length, icon: Target },
    { key: "SAVED", label: "Saved", count: leads.filter(l => l.status === 'SAVED').length, icon: Bookmark },
    { key: "CONTACTED", label: "Contacted", count: leads.filter(l => l.status === 'CONTACTED').length, icon: Send },
    { key: "CONVERTED", label: "Converted", count: leads.filter(l => l.status === 'CONVERTED').length, icon: CheckCircle2 },
    { key: "DISMISSED", label: "Dismissed", count: leads.filter(l => l.status === 'DISMISSED').length, icon: XCircle },
  ], [leads]);

  const filteredLeads = useMemo(() => {
    if (activeTab === "ALL") return leads.filter((l) => l.status !== "DISMISSED");
    return leads.filter((l) => l.status === activeTab);
  }, [leads, activeTab]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="xl:h-full flex flex-col space-y-4 xl:overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <h2 className="text-xl font-black tracking-tight text-foreground border-b border-border/40 pb-4 shrink-0">
        Dashboard
      </h2>
      {/* ── Two column: sidebar + lead stream ─────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col xl:grid xl:grid-cols-[350px_1fr] gap-6 xl:overflow-hidden">
        {/* ── Left sidebar: Flat Layout (No Cards) ─────────────────────────────── */}
        <aside className="w-full shrink-0 xl:overflow-y-auto pr-2 custom-scrollbar space-y-10">
          {/* Section 1: Live Intelligence Stats */}
          <div className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Intelligence
            </h3>
            <div className="space-y-1">
              {[
                {
                  label: "Total Leads",
                  value: total,
                  icon: Activity,
                  color: "text-foreground",
                },
                {
                  label: "High Intent",
                  value: highIntent,
                  icon: TrendingUp,
                  color: "text-primary",
                },
                {
                  label: "Qualified Leads",
                  value: leads.filter((l) => l.status === "QUALIFIED").length,
                  icon: UserCheck,
                  color: "text-emerald-500",
                },
                {
                  label: "Saved Leads",
                  value: leads.filter((l) => l.status === "SAVED").length,
                  icon: Bookmark,
                  color: "text-sky-500",
                },
                {
                  label: "Converted Leads",
                  value: leads.filter((l) => l.status === "CONVERTED").length,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                },
                {
                  label: "Recent 24h",
                  value: last24h,
                  icon: Clock,
                  color: "text-indigo-500",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${color} opacity-80`} />
                    <span className="text-sm font-semibold text-muted-foreground/90">
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-black tracking-tight tabular-nums ${color}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1.5: Status Pipeline */}
          <div className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Radar className="w-4 h-4 text-primary" /> Status Pipeline
            </h3>
            <div className="space-y-1">
              {[
                {
                  label: "New",
                  value: leads.filter((l) => l.status === "NEW").length,
                  icon: Sparkles,
                  color: "text-muted-foreground",
                },
                {
                  label: "Qualified",
                  value: leads.filter((l) => l.status === "QUALIFIED").length,
                  icon: UserCheck,
                  color: "text-primary",
                },
                {
                  label: "Saved",
                  value: leads.filter((l) => l.status === "SAVED").length,
                  icon: Bookmark,
                  color: "text-sky-500",
                },
                {
                  label: "Contacted",
                  value: leads.filter((l) => l.status === "CONTACTED").length,
                  icon: Send,
                  color: "text-indigo-500",
                },
                {
                  label: "Converted",
                  value: leads.filter((l) => l.status === "CONVERTED").length,
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                },
                {
                  label: "Dismissed",
                  value: leads.filter((l) => l.status === "DISMISSED").length,
                  icon: XCircle,
                  color: "text-destructive",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${color} opacity-80`} />
                    <span className="text-sm font-semibold text-muted-foreground/90">
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-black tracking-tight tabular-nums ${color}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Active Radar (Offerings) */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Radar className="w-4 h-4 text-primary" /> Active Radar
              </h3>
              <button
                onClick={() => router.push("/dashboard/products")}
                className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all flex items-center gap-0.5"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest py-2">
                  No Active Radar
                </p>
              ) : (
                products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="w-full text-left py-2 px-2 hover:bg-muted/40 rounded-xl transition-all group flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${p.isActive ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-muted-foreground/30"}`}
                      />
                      {p.config?.productType === 'service' ? (
                        <Briefcase className="w-3.5 h-3.5 text-teal-500/80 group-hover:text-primary transition-colors shrink-0" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-blue-500/80 group-hover:text-primary transition-colors shrink-0" />
                      )}
                      <span className="font-bold text-muted-foreground/90 group-hover:text-primary transition-colors truncate">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 group-hover:border-primary/20 transition-all">
                      {p._count?.leads ?? 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Platform Origins */}
          {total > 0 && (
            <div className="space-y-5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Platform Origins
              </h3>
              <div className="space-y-3">
                {(["REDDIT", "HACKERNEWS", "TWITTER", "GITHUB", "BLUESKY"] as const).map((p) => {
                  const count = leads.filter((l) => l.platform === p).length;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={p} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-muted-foreground/60 w-24 truncate">
                        {p === "HACKERNEWS"
                          ? "HackerNews"
                          : p === "GITHUB"
                            ? "GitHub"
                            : p === "BLUESKY"
                              ? "Bluesky"
                              : p.charAt(0) + p.slice(1).toLowerCase()}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            p === "REDDIT"
                              ? "bg-orange-500"
                              : p === "HACKERNEWS"
                                ? "bg-amber-500"
                                : p === "GITHUB"
                                  ? "bg-neutral-500"
                                  : p === "BLUESKY"
                                    ? "bg-sky-400"
                                    : "bg-sky-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-foreground/80 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ── Lead stream ───────────────────────────────────────────────── */}
        <main className="min-w-0 flex flex-col xl:overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/40 bg-card overflow-hidden shadow-xl shadow-black/5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/5 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Radar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground leading-tight">
                    Live Detection Stream
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Real-time keyword and competitor leads
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {last24h > 0 && (
                  <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    +{last24h} Today
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-auto py-1.5 px-3 font-black text-xs uppercase tracking-widest rounded-lg shadow-sm border-border hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-5 py-3 border-b border-border/40 bg-card overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabSelect(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all rounded-lg border cursor-pointer active:scale-95 ${
                      activeTab === tab.key
                        ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-transparent border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-mono ${activeTab === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20"}`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-4 bg-muted/5 min-h-0 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="p-12 text-center min-h-96 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-destructive font-black tracking-widest uppercase">
                    System Error
                  </p>
                  <p className="text-muted-foreground mt-2">{error}</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 min-h-96">
                  <div className="w-20 h-20 bg-card border border-border/50 rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Radar className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-xl font-black text-foreground">
                    No leads detected
                  </p>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm text-center">
                    Adjust your filters or wait for the next AI scan cycle.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      draftingLeadId={draftingLeadId}
                      draftedReply={draftedReplies[lead.id]}
                      isExpanded={expandedReplies[lead.id]}
                      isFreePlan={user?.plan?.toUpperCase() !== "PRO"}
                      onDraftReply={handleDraftReply}
                      onToggleExpand={(id) =>
                        setExpandedReplies((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                      onFeedbackChange={handleFeedbackChange}
                      onDelete={handleDeleteLead}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
