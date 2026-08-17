"use client";

import { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  Search,
  Sparkles,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Phone,
  MapPin,
  Star,
  Globe,
  SlidersHorizontal,
  Code2,
  Terminal,
  ShieldCheck,
  MessageSquare,
  Play,
  Activity,
  Server,
  Zap,
  CheckCircle,
  XCircle,
  ExternalLink,
  X,
  ArrowRight,
  History,
  Eye,
  RotateCcw,
  Trash2,
  Filter,
  FileText,
  AlertTriangle,
  Send,
  CheckSquare,
  Square,
  Table as TableIcon,
  LayoutGrid,
  CheckCheck
} from "lucide-react";
import { Lead, ProspectResult } from "@/lib/types";
import MiniLeadsMap from "@/components/MiniLeadsMap";

// Storage event synchronization helper
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("prospect_engine_storage_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("prospect_engine_storage_change", callback);
  };
}

function notifyStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("prospect_engine_storage_change"));
  }
}

// Custom hook to sync state with localStorage using useSyncExternalStore for hydration safety
function useLocalStorageStore<T>(
  key: string,
  initialValue: T
): [T, (valOrUpdater: T | ((prev: T) => T)) => void] {
  const serializedInitial = useMemo(() => JSON.stringify(initialValue), [initialValue]);

  const getSnapshot = useCallback(() => {
    try {
      if (typeof window === "undefined") return serializedInitial;
      return localStorage.getItem(key) ?? serializedInitial;
    } catch {
      return serializedInitial;
    }
  }, [key, serializedInitial]);

  const getServerSnapshot = useCallback(() => serializedInitial, [serializedInitial]);

  const rawJson = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  const parsedValue = useMemo(() => {
    try {
      return JSON.parse(rawJson) as T;
    } catch {
      return initialValue;
    }
  }, [rawJson, initialValue]);

  const setValue = useCallback(
    (valOrUpdater: T | ((prev: T) => T)) => {
      try {
        let nextVal: T;
        if (typeof valOrUpdater === "function") {
          const currentRaw = localStorage.getItem(key);
          const currentVal = currentRaw ? (JSON.parse(currentRaw) as T) : initialValue;
          nextVal = (valOrUpdater as (prev: T) => T)(currentVal);
        } else {
          nextVal = valOrUpdater;
        }
        localStorage.setItem(key, JSON.stringify(nextVal));
        notifyStorageChange();
      } catch (e) {
        console.error(`Erro ao sincronizar ${key}:`, e);
      }
    },
    [key, initialValue]
  );

  return [parsedValue, setValue];
}

export interface ExecutionHistoryItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  searchTerm: string;
  maxResults: number;
  status: "success" | "error";
  leadsCount: number;
  emailSent: boolean;
  executionTimeMs: number;
  errorMessage?: string;
  resultData?: ProspectResult;
}

interface TelemetryLog {
  id: string;
  time: string;
  action: "PLACES_SEARCH" | "FILTER_CHECK" | "GEMINI_GEN" | "RESEND_SMTP" | "CRON_DISPATCH";
  actionColor: string;
  message: string;
  status: "MATCHED" | "SKIPPED" | "GENERATED" | "SENT" | "INFO";
}

interface ToastNotification {
  id: string;
  type: "success" | "error";
  title: string;
  count: number;
  emailSent: boolean;
  timeMs: number;
  term: string;
}

const INITIAL_HISTORY: ExecutionHistoryItem[] = [
  {
    id: "hist_sample_1",
    timestamp: "2026-08-17T08:35:10.000Z",
    timeFormatted: "08:35:10",
    searchTerm: "Marmoraria em Cachoeiro de Itapemirim",
    maxResults: 6,
    status: "success",
    leadsCount: 4,
    emailSent: true,
    executionTimeMs: 1840,
    resultData: {
      success: true,
      searchTerm: "Marmoraria em Cachoeiro de Itapemirim",
      totalFound: 12,
      totalWithoutWebsite: 4,
      leads: [
        {
          id: "hist_lead_1",
          name: "Marmoraria Granito Nobre Cachoeiro",
          phone: "(28) 3522-1090",
          cleanPhone: "552835221090",
          rating: 4.8,
          userRatingsTotal: 34,
          address: "Av. Mauro Miranda Madureira, 450 - Coramara, Cachoeiro de Itapemirim - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá, tudo bem? Meu nome é Marcos.\n\nEstava pesquisando empresas do segmento na região e encontrei o perfil da Marmoraria Granito Nobre Cachoeiro no Google Maps. Quero parabenizar pelo trabalho: a nota de vocês (4.8 estrelas e 34 avaliações) mostra a confiança e a qualidade que vocês oferecem aos clientes.\n\nNotei, porém, um ponto de oportunidade comercial importante: o perfil de vocês ainda não possui um site oficial cadastrado.\n\nHoje, quem busca pedras e mármores no Google quer ver catálogo e tirar dúvidas rápido. Sem esse canal, vocês acabam perdendo orçamentos para concorrentes.\n\nEu desenvolvo páginas comerciais e hotsites rápidos, otimizados para celular e integrados direto ao WhatsApp.\n\nTeria 3 minutos nesta semana para eu te mostrar um modelo rápido para a Marmoraria Granito Nobre?\n\nUm abraço,\nMarcos | Consultoria de Presença Digital",
          whatsappUrl: "https://wa.me/552835221090",
        },
        {
          id: "hist_lead_2",
          name: "Pedras & Granitos Itapemirim",
          phone: "(28) 99981-4422",
          cleanPhone: "5528999814422",
          rating: 4.9,
          userRatingsTotal: 19,
          address: "Rod. Engenheiro Fabiano Vivacqua, 890 - Safra, Cachoeiro de Itapemirim - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá, tudo bem? Meu nome é Marcos.\n\nEstava pesquisando empresas na região e encontrei a Pedras & Granitos Itapemirim no Google Maps. Parabéns pela nota impecável de 4.9 estrelas!\n\nNotei que vocês ainda não possuem um site oficial cadastrado no perfil. Quando o cliente pesquisa e não encontra um link rápido, ele costuma cotar com o concorrente.\n\nCrio páginas comerciais ágeis e integradas ao WhatsApp para transformar buscas do Google em pedidos de orçamento.\n\nFaz sentido para você eu enviar um exemplo rápido de como ficaria a página de vocês?\n\nAbraço,\nMarcos | Consultoria de Presença Digital",
          whatsappUrl: "https://wa.me/5528999814422",
        },
        {
          id: "hist_lead_3",
          name: "Arte em Mármores Sul Capixaba",
          phone: "(28) 3511-7788",
          cleanPhone: "552835117788",
          rating: 4.7,
          userRatingsTotal: 28,
          address: "Rua Bernardo Horta, 120 - Guandu, Cachoeiro de Itapemirim - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá, tudo bem? Meu nome é Marcos.\n\nEncontrei o perfil da Arte em Mármores Sul Capixaba no Google Maps com excelente nota 4.7 estrelas. Parabéns pelo posicionamento!\n\nObservei que vocês ainda não têm um site ou hotsite cadastrado no perfil do Google. Desenvolvo páginas comerciais rápidas com botão direto para o WhatsApp para captar orçamentos de quem pesquisa na região.\n\nPosso te mostrar um modelo de demonstração sem custo nesta semana?\n\nAtenciosamente,\nMarcos | Consultoria de Presença Digital",
          whatsappUrl: "https://wa.me/552835117788",
        },
        {
          id: "hist_lead_4",
          name: "Marmoraria & Beneficiamento Vitória Stone",
          phone: "(28) 99912-3300",
          cleanPhone: "5528999123300",
          rating: 4.6,
          userRatingsTotal: 15,
          address: "Rua Projetada A, s/n - Aeroporto, Cachoeiro de Itapemirim - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá, tudo bem? Meu nome é Marcos.\n\nVi o perfil da Marmoraria & Beneficiamento Vitória Stone no Google Maps com excelente nota de 4.6 estrelas. Parabéns pelo trabalho!\n\nNotei que vocês ainda não têm um site oficial próprio linkado. Desenvolvo hotsites comerciais ágeis para converter as buscas do Google em conversas diretas no WhatsApp da sua equipe.\n\nTeria disponibilidade para dar uma olhada em uma prévia rápida?\n\nUm abraço,\nMarcos | Consultoria de Presença Digital",
          whatsappUrl: "https://wa.me/5528999123300",
        }
      ],
      emailSent: true,
      executionTimeMs: 1840,
      timestamp: "2026-08-17T08:35:10.000Z",
    }
  },
  {
    id: "hist_sample_2",
    timestamp: "2026-08-17T07:00:04.000Z",
    timeFormatted: "07:00:04",
    searchTerm: "Marcenaria em Vitória ES",
    maxResults: 4,
    status: "success",
    leadsCount: 2,
    emailSent: true,
    executionTimeMs: 2110,
    resultData: {
      success: true,
      searchTerm: "Marcenaria em Vitória ES",
      totalFound: 9,
      totalWithoutWebsite: 2,
      leads: [
        {
          id: "hist_lead_m1",
          name: "Marcenaria Planejada Bento Ferreira",
          phone: "(27) 3324-5500",
          cleanPhone: "552733245500",
          rating: 4.9,
          userRatingsTotal: 42,
          address: "Rua Amélia Tartuce Nasser, 180 - Bento Ferreira, Vitória - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá equipe da Marcenaria Planejada Bento Ferreira! Meus parabéns pela incrível nota 4.9 no Google Maps. Vi que vocês ainda não possuem um site institucional com portfólio de ambientes. Gostariam de ver um modelo sob medida para marcenarias?",
          whatsappUrl: "https://wa.me/552733245500",
        },
        {
          id: "hist_lead_m2",
          name: "Móveis Artesanais Jardim da Penha",
          phone: "(27) 99881-2299",
          cleanPhone: "5527998812299",
          rating: 4.7,
          userRatingsTotal: 22,
          address: "Av. Fernando Ferrari, 1100 - Jardim da Penha, Vitória - ES",
          website: null,
          hasWebsite: false,
          whatsappPitch: "Olá, acompanho o trabalho de móveis sob medida de vocês em Vitória! A nota de 4.7⭐ no Google é excelente. Notei que no Google Maps não há link para site próprio. Gostariam de conhecer nosso modelo de portfólio digital?",
          whatsappUrl: "https://wa.me/5527998812299",
        }
      ],
      emailSent: true,
      executionTimeMs: 2110,
      timestamp: "2026-08-17T07:00:04.000Z",
    }
  },
  {
    id: "hist_sample_3",
    timestamp: "2026-08-17T04:15:40.000Z",
    timeFormatted: "04:15:40",
    searchTerm: "Clínica Odontológica em Linhares ES",
    maxResults: 6,
    status: "error",
    leadsCount: 0,
    emailSent: false,
    executionTimeMs: 420,
    errorMessage: "Google Places API: Limite de requisições temporário atingido (RATE_LIMIT_EXCEEDED).",
  }
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("Marmoraria em Cachoeiro de Itapemirim");
  const [maxResults, setMaxResults] = useState(6);
  const [sendEmail, setSendEmail] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProspectResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "setup" | "architecture">("dashboard");
  const [editingPitchId, setEditingPitchId] = useState<string | null>(null);
  const [customPitches, setCustomPitches] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Execution history state with SSR-safe external store sync
  const [history, setHistoryStore] = useLocalStorageStore<ExecutionHistoryItem[]>(
    "prospect_engine_history_v1",
    INITIAL_HISTORY
  );
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ExecutionHistoryItem | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "success" | "error">("all");

  // Track leads contacted/sent via WhatsApp
  const [sentLeadIds, setSentLeadIds] = useLocalStorageStore<string[]>(
    "prospect_engine_sent_leads_v1",
    []
  );

  // View mode for leads tab: structured table vs cards
  const [leadsViewMode, setLeadsViewMode] = useState<"table" | "cards">("table");
  const [selectedMapLeadId, setSelectedMapLeadId] = useState<string | null>(null);

  // Active leads for map: current result or last history run
  const activeMapLeads = useMemo(() => {
    if (result?.leads && result.leads.length > 0) return result.leads;
    if (history.length > 0 && history[0].resultData?.leads) return history[0].resultData.leads;
    return [];
  }, [result, history]);

  // Toggle single lead sent status
  const toggleLeadSent = (leadId: string) => {
    setSentLeadIds((prev) => {
      return prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId];
    });
  };

  // Mark all current search leads as sent
  const markAllCurrentLeadsSent = (ids: string[]) => {
    setSentLeadIds((prev) => {
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  // Clear all sent marks for current leads
  const clearCurrentLeadsSent = (ids: string[]) => {
    setSentLeadIds((prev) => {
      return prev.filter((id) => !ids.includes(id));
    });
  };

  // Sync history updates to external store
  const updateHistory = (newItems: ExecutionHistoryItem[]) => {
    const capped = newItems.slice(0, 5);
    setHistoryStore(capped);
  };

  // Filtered history list
  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    return history.filter((item) => item.status === historyFilter);
  }, [history, historyFilter]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Dynamic telemetry logs
  const [logs, setLogs] = useState<TelemetryLog[]>([
    {
      id: "1",
      time: "09:00:01",
      action: "CRON_DISPATCH",
      actionColor: "text-slate-400",
      message: "Vercel Cron Trigger: GET /api/prospect (Schedule 12:00 UTC)",
      status: "INFO",
    },
    {
      id: "2",
      time: "09:00:03",
      action: "PLACES_SEARCH",
      actionColor: "text-blue-400",
      message: "Query: 'Marmoraria em Cachoeiro de Itapemirim' -> 12 Places encontradas",
      status: "INFO",
    },
    {
      id: "3",
      time: "09:00:04",
      action: "FILTER_CHECK",
      actionColor: "text-amber-400",
      message: "Marmoraria Granito Nobre: website == null [OPORTUNIDADE QUALIFICADA]",
      status: "MATCHED",
    },
    {
      id: "4",
      time: "09:00:06",
      action: "GEMINI_GEN",
      actionColor: "text-indigo-400",
      message: "Gemini 3.7 Flash: Pitch persuasivo gerado (4.8⭐ no Maps)",
      status: "GENERATED",
    },
    {
      id: "5",
      time: "09:00:08",
      action: "RESEND_SMTP",
      actionColor: "text-emerald-400",
      message: "Digest HTML diário preparado com links diretos wa.me",
      status: "SENT",
    },
  ]);

  // Sugestões de buscas para teste rápido
  const searchSuggestions = [
    "Marmoraria em Cachoeiro de Itapemirim",
    "Marcenaria em Vitória ES",
    "Oficina Mecânica em Vila Velha ES",
    "Clínica Odontológica em Linhares ES",
    "Restaurante em Guarapari",
  ];

  // Pipeline metrics calculations
  const metrics = useMemo(() => {
    const totalPlacesScanned = result ? 1284 + result.totalFound : 1284;
    const totalQualified = result ? 412 + result.totalWithoutWebsite : 412;
    const totalAiDrafts = result ? 398 + result.leads.length : 398;
    return { totalPlacesScanned, totalQualified, totalAiDrafts };
  }, [result]);

  const handleRunProspecting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const nowStr = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    const nowFullStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        time: nowStr,
        action: "PLACES_SEARCH",
        actionColor: "text-blue-400",
        message: `Iniciando varredura para: "${searchTerm}"`,
        status: "INFO",
      },
      ...prev.slice(0, 7),
    ]);

    try {
      const response = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm,
          maxResults: Number(maxResults),
          sendEmail,
          recipientEmail: recipientEmail.trim() || undefined,
        }),
      });

      const data: ProspectResult = await response.json();
      setResult(data);

      const finishStr = new Date().toLocaleTimeString("pt-BR", { hour12: false });
      setLogs((prev) => [
        {
          id: (Date.now() + 1).toString(),
          time: finishStr,
          action: "RESEND_SMTP",
          actionColor: data.emailSent ? "text-emerald-400" : "text-amber-400",
          message: data.emailSent
            ? `E-mail diário com links wa.me enviado com sucesso via Resend.`
            : data.emailError
            ? `Status do envio de e-mail: ${data.emailError}`
            : `Leads gerados com sucesso (${(data.executionTimeMs / 1000).toFixed(2)}s).`,
          status: data.emailSent ? "SENT" : "INFO",
        },
        {
          id: (Date.now() + 2).toString(),
          time: finishStr,
          action: "GEMINI_GEN",
          actionColor: "text-indigo-400",
          message: `Gerados ${data.leads?.length || 0} pitches de WhatsApp com Marcos Henrique.`,
          status: "GENERATED",
        },
        ...prev.slice(0, 6),
      ]);

      // Record in Execution History (Success/Warning)
      if (data.success) {
        const newHistoryItem: ExecutionHistoryItem = {
          id: "hist_" + Date.now(),
          timestamp: new Date().toISOString(),
          timeFormatted: nowFullStr,
          searchTerm: data.searchTerm || searchTerm,
          maxResults: Number(maxResults),
          status: "success",
          leadsCount: data.leads?.length || 0,
          emailSent: Boolean(data.emailSent),
          executionTimeMs: data.executionTimeMs || 0,
          resultData: data,
        };
        updateHistory([newHistoryItem, ...history.filter((h) => h.id !== newHistoryItem.id)]);

        // Trigger floating Toast notification
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Automação Concluída com Sucesso",
          count: data.leads?.length || 0,
          emailSent: Boolean(data.emailSent),
          timeMs: data.executionTimeMs || 0,
          term: data.searchTerm || searchTerm,
        });
      } else {
        const warningHistoryItem: ExecutionHistoryItem = {
          id: "hist_" + Date.now(),
          timestamp: new Date().toISOString(),
          timeFormatted: nowFullStr,
          searchTerm: searchTerm,
          maxResults: Number(maxResults),
          status: "error",
          leadsCount: data.leads?.length || 0,
          emailSent: false,
          executionTimeMs: data.executionTimeMs || 0,
          errorMessage: data.warning || "Execução retornou status com avisos.",
          resultData: data,
        };
        updateHistory([warningHistoryItem, ...history.filter((h) => h.id !== warningHistoryItem.id)]);

        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Aviso na Execução",
          count: data.leads?.length || 0,
          emailSent: false,
          timeMs: data.executionTimeMs || 0,
          term: searchTerm,
        });
      }
    } catch (error) {
      console.error("Erro ao executar prospecção:", error);
      
      const errorHistoryItem: ExecutionHistoryItem = {
        id: "hist_" + Date.now(),
        timestamp: new Date().toISOString(),
        timeFormatted: nowFullStr,
        searchTerm: searchTerm,
        maxResults: Number(maxResults),
        status: "error",
        leadsCount: 0,
        emailSent: false,
        executionTimeMs: 0,
        errorMessage: error instanceof Error ? error.message : "Falha na conexão com a API de prospecção",
      };
      updateHistory([errorHistoryItem, ...history.filter((h) => h.id !== errorHistoryItem.id)]);

      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Erro ao Conectar à API de Prospecção",
        count: 0,
        emailSent: false,
        timeMs: 0,
        term: searchTerm,
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore snapshot data to active session
  const handleLoadSnapshotIntoActiveSession = (item: ExecutionHistoryItem) => {
    if (item.resultData) {
      setResult(item.resultData);
      setSearchTerm(item.searchTerm);
      setMaxResults(item.maxResults);
      setSelectedHistoryItem(null);
      setActiveTab("leads");
      setToast({
        id: Date.now().toString(),
        type: "success",
        title: "Snapshot Restaurado na Sessão",
        count: item.resultData.leads?.length || 0,
        emailSent: Boolean(item.resultData.emailSent),
        timeMs: item.resultData.executionTimeMs || 0,
        term: item.searchTerm,
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePitchChange = (id: string, text: string) => {
    setCustomPitches((prev) => ({ ...prev, [id]: text }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* GEOMETRIC BALANCE HEADER */}
      <header className="h-16 border-b border-slate-800 bg-[#020617]/75 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            P
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center">
              ProspectEngine
              <span className="text-slate-500 font-mono text-xs ml-2 hidden sm:inline">v2.4.0-stable</span>
            </h1>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors relative ${
              activeTab === "leads"
                ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            Leads & Pitches
            {result?.leads && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full font-mono">
                {result.leads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hidden md:inline-block ${
              activeTab === "setup"
                ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            Vercel Cron Setup
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hidden lg:inline-block ${
              activeTab === "architecture"
                ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            Architecture
          </button>
        </div>

        {/* CRON STATUS & EXECUTION TIME */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest font-mono">
              Cron: Active
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-mono">Next Execution</p>
            <p className="text-xs font-mono text-slate-200">Daily 09:00:00 BRT</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT RAIL: METRICS & ENDPOINT CONFIG */}
            <aside className="lg:col-span-3 flex flex-col gap-4">
              {/* PIPELINE METRICS */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">
                    Pipeline Metrics
                  </h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Places API Scans</p>
                      <p className="text-2xl font-semibold text-white font-mono">{metrics.totalPlacesScanned.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Qualified Leads (No Site)</p>
                      <p className="text-2xl font-semibold text-blue-400 font-mono">{metrics.totalQualified.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Gemini AI Drafts</p>
                      <p className="text-2xl font-semibold text-indigo-400 font-mono">{metrics.totalAiDrafts.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                </div>

                {/* ENDPOINT CONFIG */}
                <div className="pt-4 border-t border-slate-800">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">
                    Endpoint Config
                  </h2>
                  <div className="space-y-2 font-mono text-[11px] bg-black p-3 rounded-lg border border-slate-800">
                    <p className="text-slate-400">
                      <span className="text-blue-400 font-bold">GET / POST</span> /api/prospect
                    </p>
                    <p className="text-slate-500">Cron Schedule: 0 12 * * *</p>
                    <p className="text-slate-500">Timeout: 60s (Serverless)</p>
                  </div>
                </div>
              </div>

              {/* ACTIVE CAMPAIGN */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-lg">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase font-mono mb-1">Active Target</p>
                  <p className="text-sm font-medium text-white">{searchTerm}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Filtro: Empresas com website === null</p>
                </div>
              </div>
            </aside>

            {/* CENTER RAIL: SEARCH FORM + LIVE FEED + GEMINI PREVIEW */}
            <section className="lg:col-span-6 flex flex-col gap-4">
              {/* INTERACTIVE PROSPECTING CONTROL */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    Parâmetros da Varredura
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500">Google Places API v1</span>
                </div>

                <form onSubmit={handleRunProspecting} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      Termo e Localização Alvo
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ex: Marmoraria em Cachoeiro de Itapemirim"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                        Limite de Extração
                      </label>
                      <select
                        value={maxResults}
                        onChange={(e) => setMaxResults(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value={4}>4 Empresas</option>
                        <option value={6}>6 Empresas</option>
                        <option value={10}>10 Empresas</option>
                        <option value={15}>15 Empresas</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                          E-mail Resend
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[10px] text-slate-400">Ativo</span>
                        </label>
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="Deixe vazio para .env"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        disabled={!sendEmail}
                      />
                    </div>
                  </div>

                  {/* QUICK SUGGESTIONS */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">Sugestões:</span>
                    {searchSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSearchTerm(sug)}
                        className="text-[11px] font-mono bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-800 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl h-12 flex items-center justify-center gap-2.5 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Executando Pipeline de Prospecção...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span className="text-sm">Executar Automação Agora</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* LIVE PROSPECTING FEED */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[260px]">
                <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    Live Prospecting Feed
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {loading ? "Streaming live events..." : "Realtime Logs"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto font-mono text-[11px] sm:text-[12px] p-4 space-y-2.5 bg-black/40">
                  <div className="flex gap-3 text-slate-500 pb-2 border-b border-slate-800/50 text-[10px] tracking-wider uppercase">
                    <span className="w-16 shrink-0">TIMESTAMP</span>
                    <span className="w-28 shrink-0">ACTION</span>
                    <span>LOG DETAILS</span>
                  </div>

                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start hover:bg-slate-900/40 p-1 rounded">
                      <span className="text-slate-500 shrink-0">{log.time}</span>
                      <span className={`${log.actionColor} shrink-0 font-bold`}>{log.action}</span>
                      <span className="text-slate-300 break-words">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GEMINI LOGIC PREVIEW */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Gemini 3.7 Logic Preview
                  </h2>
                  <span className="text-[10px] text-indigo-400 font-mono">Copywriter Engine</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs italic text-slate-400 leading-relaxed">
                  &ldquo;Olá equipe da [Empresa], vi que vocês possuem uma nota impecável de [Rating]⭐ no Google Maps! Parabéns pelo trabalho. No entanto, percebi que ainda não possuem um site oficial próprio cadastrado no perfil. Hoje, clientes que pesquisam no Google antes de fechar orçamentos acabam caindo em concorrentes com presença digital ativa...&rdquo;
                </div>
              </div>
            </section>

            {/* RIGHT RAIL: ENVIRONMENT HEALTH & RECENT LEADS QUICK ACCESS */}
            <aside className="lg:col-span-3 flex flex-col gap-4">
              {/* MINI MAP COMPONENT (GEOLOCALIZAÇÃO DOS LEADS) */}
              <MiniLeadsMap
                leads={activeMapLeads}
                searchTerm={result?.searchTerm || searchTerm}
                selectedLeadId={selectedMapLeadId}
                onSelectLead={(lead) => {
                  setSelectedMapLeadId(lead.id);
                }}
              />

              {/* ENVIRONMENT HEALTH */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">
                  Environment Health
                </h2>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Google Places API</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Google Gemini API</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Resend SMTP</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vercel Runtime</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                      Serverless
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Latest Run Summary
                  </h3>
                  {result ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Leads sem site:</span>
                        <strong className="text-emerald-400 font-mono">{result.leads.length}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Tempo de resposta:</span>
                        <span className="font-mono text-slate-400">{(result.executionTimeMs / 1000).toFixed(2)}s</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>E-mail digest:</span>
                        <span className="font-mono text-slate-400">{result.emailSent ? "Enviado" : "Simulado"}</span>
                      </div>
                      <button
                        onClick={() => setActiveTab("leads")}
                        className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Ver Leads Extraídos ({result.leads.length}) &rarr;
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Execute a automação para ver os leads qualificados em tempo real.
                    </p>
                  )}
                </div>
              </div>

              {/* QUICK DOCS CARD */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  WhatsApp Direct Action
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada lead possui um link pronto <code className="text-blue-400 font-mono">wa.me</code>. Ao clicar, o WhatsApp Web abre automaticamente com o pitch preenchido.
                </p>
              </div>
            </aside>
          </div>

          {/* HISTÓRICO DE EXECUÇÕES (ÚLTIMOS 5 LOGS DE SUCESSO E ERRO) */}
          <div className="mt-5 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Histórico de Execuções
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {history.length}/5 Registros
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Armazena os últimos 5 logs de sucesso e erro. Inspecione resultados e pitches anteriores sem perder a sessão atual.
                  </p>
                </div>
              </div>

              {/* Filter Buttons & Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setHistoryFilter("all")}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      historyFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Todos ({history.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter("success")}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      historyFilter === "success" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Sucesso ({history.filter((h) => h.status === "success").length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter("error")}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      historyFilter === "error" ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Erros ({history.filter((h) => h.status === "error").length})
                  </button>
                </div>

                <button
                  onClick={() => updateHistory(INITIAL_HISTORY)}
                  title="Restaurar histórico de exemplo"
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurar</span>
                </button>

                <button
                  onClick={() => updateHistory([])}
                  title="Limpar todos os logs do histórico"
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs rounded-lg border border-slate-800 hover:border-rose-900/50 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              </div>
            </div>

            {/* TABLE / LIST OF 5 LOGS */}
            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Termo Alvo</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Leads Sem Site</th>
                      <th className="py-2.5 px-3">E-mail Digest</th>
                      <th className="py-2.5 px-3">Tempo</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredHistory.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.timeFormatted}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-white max-w-[220px] truncate">
                          {item.searchTerm}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Sucesso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <AlertCircle className="w-3 h-3" />
                              Erro
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.status === "success" ? (
                            <span className="font-mono text-emerald-400 font-bold">
                              {item.leadsCount} leads qualificados
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">0 leads</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                          {item.status === "success" ? (
                            item.emailSent ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Enviado
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Simulado
                              </span>
                            )
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Falhou
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {item.executionTimeMs > 0 ? `${(item.executionTimeMs / 1000).toFixed(2)}s` : "-"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                              title="Inspecionar snapshot de leads e pitches anteriores"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>Revisar</span>
                            </button>
                            <button
                              onClick={() => {
                                setSearchTerm(item.searchTerm);
                                setMaxResults(item.maxResults);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-slate-800 transition-colors cursor-pointer"
                              title="Carregar termo nos parâmetros de busca"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-2">
                <p className="text-xs text-slate-500">Nenhum log encontrado para este filtro.</p>
                <button
                  onClick={() => setHistoryFilter("all")}
                  className="text-xs text-blue-400 hover:underline font-mono cursor-pointer"
                >
                  Ver todos os registros
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* LEADS TAB */}
        {activeTab === "leads" && (
          <div className="space-y-5">
            {/* SUMMARY & ACTION BAR */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold font-mono text-base shrink-0">
                  {result ? result.leads.length : "0"}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {result ? `Oportunidades em "${result.searchTerm}"` : "Nenhuma busca realizada nesta sessão"}
                    {result && result.leads.length > 0 && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {result.leads.filter((l) => sentLeadIds.includes(l.id)).length}/{result.leads.length} Contatados
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {result
                      ? `Empresas sem site oficial no Google Maps prontas para abordagem comercial.`
                      : "Clique em Executar no Dashboard para prospectar empresas."}
                  </p>
                </div>
              </div>

              {/* Progress & Quick Controls */}
              {result?.leads && result.leads.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setLeadsViewMode("table")}
                      className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        leadsViewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Visualização em Tabela com Coluna de Checkbox"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Tabela</span>
                    </button>
                    <button
                      onClick={() => setLeadsViewMode("cards")}
                      className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        leadsViewMode === "cards" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Visualização em Cards Detalhados"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                  </div>

                  {/* Batch Selection Controls */}
                  <button
                    onClick={() => markAllCurrentLeadsSent(result.leads.map((l) => l.id))}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 text-xs rounded-lg border border-slate-800 hover:border-emerald-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Marcar todos os leads da lista como enviados via WhatsApp"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Marcar Todos</span>
                  </button>

                  <button
                    onClick={() => clearCurrentLeadsSent(result.leads.map((l) => l.id))}
                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Desmarcar status de envio de todos os leads"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Desmarcar</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Nova Busca
                  </button>
                </div>
              )}
            </div>

            {/* LEADS CONTENT */}
            {result?.leads && result.leads.length > 0 ? (
              <>
                {/* PROGRESS TRACKER BAR */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <span className="text-slate-400">Progresso de Prospecção:</span>
                    <strong className="text-emerald-400">
                      {result.leads.filter((l) => sentLeadIds.includes(l.id)).length} de {result.leads.length} contatados
                    </strong>
                    <span>
                      ({Math.round((result.leads.filter((l) => sentLeadIds.includes(l.id)).length / result.leads.length) * 100)}%)
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full sm:w-64 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(result.leads.filter((l) => sentLeadIds.includes(l.id)).length / result.leads.length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* VIEW MODE: STRUCTURED TABLE */}
                {leadsViewMode === "table" && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-3 w-12 text-center">
                              <span className="sr-only">Status Checkbox</span>
                              <CheckSquare className="w-4 h-4 text-slate-400 mx-auto" />
                            </th>
                            <th className="py-3 px-3 min-w-[140px]">Status WhatsApp</th>
                            <th className="py-3 px-4 min-w-[220px]">Empresa / Local</th>
                            <th className="py-3 px-3">Google Maps</th>
                            <th className="py-3 px-3 min-w-[150px]">Telefone</th>
                            <th className="py-3 px-4 min-w-[280px]">Pitch Gemini 3.7</th>
                            <th className="py-3 px-4 text-right min-w-[160px]">Ação WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {result.leads.map((lead, idx) => {
                            const isSent = sentLeadIds.includes(lead.id);
                            const currentPitch = customPitches[lead.id] ?? lead.whatsappPitch;
                            const directWaUrl = lead.cleanPhone
                              ? `https://wa.me/${lead.cleanPhone}?text=${encodeURIComponent(currentPitch)}`
                              : "";

                            return (
                              <tr
                                key={lead.id || idx}
                                className={`transition-colors ${
                                  isSent
                                    ? "bg-emerald-950/15 hover:bg-emerald-950/25"
                                    : "hover:bg-slate-800/30"
                                }`}
                              >
                                {/* Checkbox Column */}
                                <td className="py-3.5 px-3 text-center">
                                  <label
                                    htmlFor={`chk_lead_${lead.id}`}
                                    className="cursor-pointer inline-flex items-center justify-center p-1 rounded hover:bg-slate-800"
                                    title={isSent ? "Marcar como pendente" : "Marcar como enviado via WhatsApp"}
                                  >
                                    <input
                                      id={`chk_lead_${lead.id}`}
                                      type="checkbox"
                                      checked={isSent}
                                      onChange={() => toggleLeadSent(lead.id)}
                                      className="sr-only"
                                    />
                                    {isSent ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                                    )}
                                  </label>
                                </td>

                                {/* Status Label */}
                                <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                                  <button
                                    onClick={() => toggleLeadSent(lead.id)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                      isSent
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                        : "bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                                    }`}
                                  >
                                    {isSent ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Enviado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span>Pendente</span>
                                      </>
                                    )}
                                  </button>
                                </td>

                                {/* Empresa & Detalhes */}
                                <td className="py-3.5 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                                      <span className="font-bold text-white flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        {lead.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-1">
                                      {lead.address}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                        <Globe className="w-2.5 h-2.5" />
                                        Sem Site
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Rating */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold font-mono w-fit">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    {lead.rating > 0 ? lead.rating.toFixed(1) : "N/A"}
                                    {lead.userRatingsTotal > 0 && (
                                      <span className="text-[10px] font-normal text-amber-500/70">
                                        ({lead.userRatingsTotal})
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Telefone */}
                                <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs">
                                  <div className="space-y-0.5">
                                    <p className="text-slate-200 flex items-center gap-1.5">
                                      <Phone className="w-3 h-3 text-slate-500" />
                                      {lead.phone}
                                    </p>
                                    {lead.cleanPhone && (
                                      <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        WhatsApp Válido
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Pitch Gerado IA */}
                                <td className="py-3.5 px-4 max-w-sm">
                                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                                      <span className="flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Pitch Gemini 3.7
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingPitchId(editingPitchId === lead.id ? null : lead.id)
                                          }
                                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                                        >
                                          {editingPitchId === lead.id ? "Salvar" : "Editar"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(currentPitch, lead.id)}
                                          className="p-0.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                                          title="Copiar mensagem"
                                        >
                                          {copiedId === lead.id ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {editingPitchId === lead.id ? (
                                      <textarea
                                        value={currentPitch}
                                        onChange={(e) => handlePitchChange(lead.id, e.target.value)}
                                        rows={4}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-blue-500"
                                      />
                                    ) : (
                                      <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed font-sans">
                                        {currentPitch}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* Ações */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  {lead.cleanPhone ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <a
                                        href={directWaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => {
                                          if (!isSent) toggleLeadSent(lead.id);
                                        }}
                                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        title="Abrir no WhatsApp Web e marcar automaticamente como enviado"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                        <span>Abrir WhatsApp</span>
                                      </a>
                                      <button
                                        onClick={() => toggleLeadSent(lead.id)}
                                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
                                      >
                                        {isSent ? "Desmarcar envio" : "Marcar enviado"}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-mono text-[11px]">
                                      Sem WhatsApp
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* VIEW MODE: CARDS GRID */}
                {leadsViewMode === "cards" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {result.leads.map((lead, idx) => {
                      const isSent = sentLeadIds.includes(lead.id);
                      const currentPitch = customPitches[lead.id] ?? lead.whatsappPitch;
                      const directWaUrl = lead.cleanPhone
                        ? `https://wa.me/${lead.cleanPhone}?text=${encodeURIComponent(currentPitch)}`
                        : "";

                      return (
                        <div
                          key={lead.id || idx}
                          className={`border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                            isSent
                              ? "bg-emerald-950/15 border-emerald-500/40 hover:border-emerald-500/60"
                              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                                    #{idx + 1} PROSPECT
                                  </span>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    No Website
                                  </span>
                                  {isSent && (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Enviado
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                                  {lead.name}
                                </h3>
                              </div>

                              {/* Rating */}
                              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs font-bold font-mono shrink-0">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {lead.rating > 0 ? lead.rating.toFixed(1) : "N/A"}
                                {lead.userRatingsTotal > 0 && (
                                  <span className="text-[10px] font-normal text-amber-500/80">
                                    ({lead.userRatingsTotal})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="text-xs text-slate-400 space-y-1 font-mono">
                              <p className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-200">{lead.phone}</span>
                                {lead.cleanPhone && (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                                    wa.me valid
                                  </span>
                                )}
                              </p>
                              <p className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1 text-slate-400 font-sans">{lead.address}</span>
                              </p>
                            </div>

                            {/* Checkbox Quick Toggle Bar */}
                            <div
                              onClick={() => toggleLeadSent(lead.id)}
                              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                                isSent
                                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs font-mono">
                                {isSent ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                                <span>{isSent ? "Mensagem Enviada no WhatsApp" : "Marcar como Enviado no WhatsApp"}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                {isSent ? "Concluído" : "Pendente"}
                              </span>
                            </div>

                            {/* Pitch Box */}
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Gemini 3.7 Pitch Output
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingPitchId(editingPitchId === lead.id ? null : lead.id)
                                    }
                                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
                                  >
                                    {editingPitchId === lead.id ? "Salvar" : "Editar"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(currentPitch, lead.id)}
                                    className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                                    title="Copiar mensagem"
                                  >
                                    {copiedId === lead.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {editingPitchId === lead.id ? (
                                <textarea
                                  value={currentPitch}
                                  onChange={(e) => handlePitchChange(lead.id, e.target.value)}
                                  rows={5}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-sans focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans max-h-40 overflow-y-auto">
                                  {currentPitch}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action */}
                          <div>
                            {lead.cleanPhone ? (
                              <a
                                href={directWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  if (!isSent) toggleLeadSent(lead.id);
                                }}
                                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
                              >
                                <MessageSquare className="w-4 h-4 fill-white" />
                                Abrir no WhatsApp Web com Mensagem Pronta &rarr;
                              </a>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2.5 px-4 bg-slate-800 text-slate-500 font-mono text-xs rounded-lg cursor-not-allowed text-center"
                              >
                                Telefone sem WhatsApp
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center space-y-3">
                <p className="text-sm text-slate-400">Nenhum lead extraído ainda.</p>
                <button
                  onClick={handleRunProspecting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Executar Varredura Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* SETUP / VERCEL CRON TAB */}
        {activeTab === "setup" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Configuração do Vercel Cron Job
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A aplicação utiliza a especificação nativa do Vercel Crons para executar <code className="text-blue-400 font-mono">GET /api/prospect</code> todos os dias pontualmente às 09h00 BRT.
              </p>

              <div className="space-y-4">
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/50">
                  <h3 className="text-xs font-bold text-blue-400 font-mono uppercase tracking-wider mb-2">
                    1. vercel.json na raiz do repositório
                  </h3>
                  <pre className="bg-black p-3 rounded font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
{`{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/prospect",
      "schedule": "0 12 * * *"
    }
  ]
}`}
                  </pre>
                </div>

                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/50">
                  <h3 className="text-xs font-bold text-blue-400 font-mono uppercase tracking-wider mb-2">
                    2. Variáveis de Ambiente Necessárias na Vercel
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2">KEY</th>
                          <th className="py-2">DESCRIÇÃO</th>
                          <th className="py-2">EXEMPLO</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300 divide-y divide-slate-800/40">
                        <tr>
                          <td className="py-2 text-blue-400">GEMINI_API_KEY</td>
                          <td className="py-2">Google GenAI (Gemini 3.7)</td>
                          <td className="py-2 text-slate-500">AIzaSy...</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-blue-400">GOOGLE_PLACES_API_KEY</td>
                          <td className="py-2">Google Cloud Places API</td>
                          <td className="py-2 text-slate-500">AIzaSy...</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-blue-400">RESEND_API_KEY</td>
                          <td className="py-2">Disparo de relatórios SMTP</td>
                          <td className="py-2 text-slate-500">re_1234...</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-blue-400">NOTIFICATION_EMAIL_TO</td>
                          <td className="py-2">Seu e-mail de destino</td>
                          <td className="py-2 text-slate-500">seu@email.com</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-blue-400">DEFAULT_SEARCH_TERM</td>
                          <td className="py-2">Termo padrão para o Cron</td>
                          <td className="py-2 text-slate-500">Marmoraria em Cachoeiro de Itapemirim</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARCHITECTURE TAB */}
        {activeTab === "architecture" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                Estrutura Modular de Arquitetura
              </h2>

              <pre className="bg-black p-4 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto leading-relaxed">
{`├── app/
│   ├── api/
│   │   └── prospect/
│   │       └── route.ts          # Route Handler (GET p/ Cron, POST p/ Dashboard)
│   ├── globals.css               # Tailwind CSS
│   ├── layout.tsx                # Next.js Root Layout
│   └── page.tsx                  # Dashboard Geometric Balance
├── lib/
│   ├── services/
│   │   ├── places.ts             # Google Places API (Busca + Filtro Sem Site)
│   │   ├── gemini.ts             # Google Gemini 3.7 (Copywriting WhatsApp)
│   │   └── resend.ts             # Resend SMTP (Relatório com Links wa.me)
│   ├── types.ts                  # Schemas TypeScript
│   └── utils.ts                  # Helpers
├── vercel.json                   # Cron Job (0 12 * * *)
└── package.json                  # Dependências`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* GEOMETRIC BALANCE FOOTER */}
      <footer className="h-10 border-t border-slate-800 bg-slate-900/30 flex items-center px-4 sm:px-6 justify-between text-[10px] uppercase tracking-widest text-slate-500 font-mono font-medium">
        <div>Runtime: Next.js 15 (App Router) • Edge / Serverless Functions</div>
        <div className="hidden sm:block">Built for Vercel Deployment • 2026 Production Build</div>
      </footer>

      {/* HISTORICAL SNAPSHOT REVIEW MODAL (INSPECTOR) */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Snapshot Histórico
                  </span>
                  {selectedHistoryItem.status === "success" ? (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Sucesso
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Falha
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {selectedHistoryItem.timeFormatted} • {(selectedHistoryItem.executionTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>&ldquo;{selectedHistoryItem.searchTerm}&rdquo;</span>
                </h3>
              </div>

              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Fechar visualizador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice Banner */}
            <div className="bg-blue-950/30 border-b border-blue-900/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-300">
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                Revisão em modo snapshot. Os dados da sua sessão de trabalho atual permanecem intactos.
              </span>
              {selectedHistoryItem.status === "success" && selectedHistoryItem.resultData && (
                <button
                  onClick={() => handleLoadSnapshotIntoActiveSession(selectedHistoryItem)}
                  className="font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar na Sessão Ativa
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedHistoryItem.status === "error" ? (
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Falha Registrada na Execução
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg border border-rose-900/40 leading-relaxed">
                    {selectedHistoryItem.errorMessage || "Erro desconhecido durante a comunicação com as APIs."}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dica: Verifique se suas chaves no painel de configuração (<code className="text-blue-400">GOOGLE_PLACES_API_KEY</code>, <code className="text-blue-400">GEMINI_API_KEY</code>) possuem cotas disponíveis e permissões ativas.
                  </p>
                </div>
              ) : selectedHistoryItem.resultData?.leads && selectedHistoryItem.resultData.leads.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{selectedHistoryItem.resultData.leads.length} OPORTUNIDADES QUALIFICADAS NESTE SNAPSHOT</span>
                    <span className={selectedHistoryItem.emailSent ? "text-emerald-400" : "text-slate-400"}>
                      E-mail: {selectedHistoryItem.emailSent ? "Disparado via Resend" : "Simulado"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedHistoryItem.resultData.leads.map((lead, idx) => {
                      const leadPitch = customPitches[lead.id] ?? lead.whatsappPitch;
                      const directWaUrl = lead.cleanPhone
                        ? `https://wa.me/${lead.cleanPhone}?text=${encodeURIComponent(leadPitch)}`
                        : "";

                      return (
                        <div
                          key={lead.id || idx}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="text-[9px] font-mono uppercase bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                                  #{idx + 1}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  {lead.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold font-mono shrink-0">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {lead.rating > 0 ? lead.rating.toFixed(1) : "N/A"}
                              </div>
                            </div>

                            <div className="text-xs text-slate-400 font-mono space-y-0.5 mb-2.5">
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-200">{lead.phone}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {lead.address}
                              </p>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Pitch Gemini 3.7
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(leadPitch, `modal_${lead.id}`)}
                                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-800 border border-slate-700 cursor-pointer"
                                  title="Copiar pitch"
                                >
                                  {copiedId === `modal_${lead.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line font-sans">
                                {leadPitch}
                              </p>
                            </div>
                          </div>

                          <div>
                            {lead.cleanPhone ? (
                              <a
                                href={directWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                Abrir WhatsApp Web
                              </a>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2 px-3 bg-slate-900 text-slate-600 text-xs font-mono rounded-lg cursor-not-allowed text-center"
                              >
                                Sem WhatsApp Válido
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  Nenhum lead armazenado neste snapshot.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium transition-colors cursor-pointer"
              >
                Fechar Visualizador
              </button>

              {selectedHistoryItem.status === "success" && selectedHistoryItem.resultData && (
                <button
                  onClick={() => handleLoadSnapshotIntoActiveSession(selectedHistoryItem)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Carregar na Sessão Ativa & Abrir Leads
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <aside
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] sm:w-[420px] bg-slate-900/95 border border-blue-500/40 backdrop-blur-xl rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] p-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 transition-all"
        >
          {/* Top Row: Icon + Title + Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  toast.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  {toast.title}
                  {toast.type === "success" && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Sucesso
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {toast.type === "success" ? (
                    <>
                      <strong className="text-emerald-400 font-mono">{toast.count}</strong> empresas sem site qualificadas e com abordagem IA gerada.
                    </>
                  ) : (
                    "Ocorreu um erro durante a execução da esteira de prospecção."
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-info: Timing & Actions */}
          {toast.type === "success" && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{(toast.timeMs / 1000).toFixed(2)}s</span>
                <span>•</span>
                <span className={toast.emailSent ? "text-emerald-400" : "text-slate-400"}>
                  {toast.emailSent ? "E-mail Enviado" : "E-mail Pronto"}
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab("leads");
                  setToast(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Ver Leads & Pitches
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Progress bar auto-dismiss indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div
              className={`h-full ${
                toast.type === "success" ? "bg-gradient-to-r from-blue-500 to-emerald-500" : "bg-rose-500"
              } animate-[progress_6s_linear]`}
              style={{
                animation: "shrinkWidth 6s linear forwards"
              }}
            />
          </div>
        </aside>
      )}
    </div>
  );
}

