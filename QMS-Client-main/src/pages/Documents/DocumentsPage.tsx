/**
 * DocumentsPage.tsx — Полная реализация модуля Документы СМК
 * Подключён к API /api/documents/, с пагинацией, фильтрацией, модалками.
 *
 * Заменяет предыдущую заглушку с захардкоженными данными.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText, Plus, Search, Upload, ChevronRight,
  CheckCircle, Clock, AlertTriangle, RefreshCw,
} from "lucide-react";

import { documentsApi } from "../../api/qmsApi";
import type { DocumentShort, DocumentStats, DocumentApprovalItem } from "../../api/qmsApi";

import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";
import TabBar from "../../components/qms/TabBar";
import DataTable from "../../components/qms/DataTable";
import ActionBtn from "../../components/qms/ActionBtn";
import KpiRow from "../../components/qms/KpiRow";

import CreateDocumentModal from "./CreateDocumentModal";
import DocumentDetailModal from "./DocumentDetailModal";
import Pagination from "./Pagination";

/* ───────────────────── Constants & Maps ───────────────────── */

const LIMIT = 20;

const TABS = [
  { key: "all",         label: "Все" },
  { key: "policy",      label: "Политики" },
  { key: "manual",      label: "Руководства" },
  { key: "procedure",   label: "Процедуры" },
  { key: "instruction", label: "Инструкции" },
  { key: "form",        label: "Формы" },
  { key: "record",      label: "Записи" },
  { key: "plan",        label: "Планы" },
  { key: "external",    label: "Внешние" },
];

const TAB_TO_TYPE: Record<string, string | undefined> = {
  all:         undefined,
  policy:      "POLICY",
  manual:      "MANUAL",
  procedure:   "PROCEDURE",
  instruction: "WORK_INSTRUCTION",
  form:        "FORM",
  record:      "RECORD",
  plan:        "PLAN",
  external:    "EXTERNAL",
};

export const TYPE_LABELS: Record<string, string> = {
  POLICY:           "Политика",
  MANUAL:           "Руководство",
  PROCEDURE:        "Процедура",
  WORK_INSTRUCTION: "Инструкция",
  FORM:             "Форма",
  RECORD:           "Запись",
  SPECIFICATION:    "Спецификация",
  PLAN:             "План",
  EXTERNAL:         "Внешний",
  OTHER:            "Другое",
};

export const TYPE_COLORS: Record<string, string> = {
  POLICY:           "#4A90E8",
  MANUAL:           "#4A90E8",
  PROCEDURE:        "#2DD4A8",
  WORK_INSTRUCTION: "#A06AE8",
  FORM:             "#E8A830",
  RECORD:           "#E87040",
  SPECIFICATION:    "#E87040",
  PLAN:             "#4A90E8",
  EXTERNAL:         "#3A4E62",
  OTHER:            "#3A4E62",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT:     "Черновик",
  REVIEW:    "Согласование",
  APPROVED:  "Утверждён",
  EFFECTIVE: "Действующий",
  REVISION:  "Пересмотр",
  OBSOLETE:  "Устарел",
  CANCELLED: "Отменён",
};

const STATUS_DOT_MAP: Record<string, "accent" | "blue" | "amber" | "grey" | "red"> = {
  DRAFT:     "grey",
  REVIEW:    "blue",
  APPROVED:  "accent",
  EFFECTIVE: "accent",
  REVISION:  "amber",
  OBSOLETE:  "red",
  CANCELLED: "red",
};

/* ───────────────────── Component ───────────────────── */

export const DocumentsPage: React.FC = () => {
  /* ── URL params for deep-link /qms/documents/:id ── */
  const { id: urlDocId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ── State ── */
  const [documents, setDocuments] = useState<DocumentShort[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<DocumentApprovalItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDocId, setDetailDocId] = useState<number | null>(
    urlDocId ? Number(urlDocId) : null
  );

  /* ── Search debounce ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  /* ── Reset page on filter change ── */
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  /* ── Fetch documents ── */
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: LIMIT,
      };

      const typeVal = TAB_TO_TYPE[activeTab];
      if (typeVal) params.type = typeVal;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();

      const result = await documentsApi.getAll(params);
      setDocuments(result.rows);
      setTotalCount(result.count);
      setTotalPages(Math.ceil(result.count / LIMIT));
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки документов");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, searchDebounced]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const s = await documentsApi.getStats();
      setStats(s);
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  }, []);

  /* ── Fetch pending approvals ── */
  const fetchPending = useCallback(async () => {
    try {
      const p = await documentsApi.getPending();
      setPendingApprovals(p);
    } catch (e) {
      console.error("Pending fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchStats, fetchPending]);

  /* ── Handlers ── */
  const openDetail = (id: number) => {
    setDetailDocId(id);
    navigate(`/qms/documents/${id}`, { replace: true });
  };

  const handleCreated = () => {
    fetchDocuments();
    fetchStats();
  };

  const handleDetailAction = () => {
    // After any action in detail (approve, effective, etc.)
    fetchDocuments();
    fetchStats();
    fetchPending();
  };

  /* ── KPI items from stats ── */
  const kpiItems = stats
    ? [
        {
          label: "Всего документов",
          value: stats.byStatus.reduce((sum, s) => sum + Number(s.count), 0),
          color: "#4A90E8",
          icon: <FileText size={18} />,
        },
        {
          label: "Действующих",
          value: Number(stats.byStatus.find((s) => s.status === "EFFECTIVE")?.count || 0),
          color: "#2DD4A8",
          icon: <CheckCircle size={18} />,
        },
        {
          label: "На согласовании",
          value: stats.pendingApprovalsCount,
          color: "#E8A830",
          icon: <Clock size={18} />,
        },
        {
          label: "Просрочен пересмотр",
          value: stats.overdueCount,
          color: "#F06060",
          icon: <AlertTriangle size={18} />,
        },
      ]
    : [];

  /* ── Table columns ── */
  const columns = [
    {
      key: "code",
      label: "Код",
      width: "120px",
      render: (row: DocumentShort) => (
        <span
          className="font-mono text-[12px] font-bold text-asvo-accent cursor-pointer hover:underline"
          onClick={() => openDetail(row.id)}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: "title",
      label: "Название",
      render: (row: DocumentShort) => (
        <span
          className="font-medium text-asvo-text cursor-pointer hover:text-asvo-accent transition-colors"
          onClick={() => openDetail(row.id)}
        >
          {row.title}
        </span>
      ),
    },
    {
      key: "type",
      label: "Тип",
      width: "140px",
      render: (row: DocumentShort) => {
        const color = TYPE_COLORS[row.type] || "#3A4E62";
        return (
          <Badge color={color} bg={`${color}22`}>
            {TYPE_LABELS[row.type] || row.type}
          </Badge>
        );
      },
    },
    {
      key: "version",
      label: "Версия",
      width: "80px",
      render: (row: DocumentShort) => (
        <span className="font-mono text-[12px] text-asvo-text-mid">
          {row.currentVersion ? `v${row.currentVersion.version}` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      width: "140px",
      render: (row: DocumentShort) => {
        const dotColor = STATUS_DOT_MAP[row.status] || "grey";
        return (
          <span className="flex items-center gap-2">
            <StatusDot color={dotColor} />
            <span className="text-asvo-text text-[13px]">
              {STATUS_LABELS[row.status] || row.status}
            </span>
          </span>
        );
      },
    },
    {
      key: "owner",
      label: "Владелец",
      width: "140px",
      render: (row: DocumentShort) => (
        <span className="text-asvo-text-mid text-[12px]">
          {row.owner
            ? `${row.owner.surname} ${row.owner.name.charAt(0)}.`
            : "—"}
        </span>
      ),
    },
    {
      key: "nextReviewDate",
      label: "Пересмотр",
      width: "110px",
      render: (row: DocumentShort) => {
        if (!row.nextReviewDate) return <span className="text-asvo-text-dim">—</span>;
        const isOverdue = new Date(row.nextReviewDate) < new Date();
        return (
          <span
            className={`text-[12px] ${
              isOverdue ? "text-red-400 font-semibold" : "text-asvo-text-mid"
            }`}
          >
            {new Date(row.nextReviewDate).toLocaleDateString("ru-RU")}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      width: "50px",
      align: "center" as const,
      render: (row: DocumentShort) => (
        <ChevronRight
          size={14}
          className="text-asvo-text-dim mx-auto cursor-pointer hover:text-asvo-accent transition-colors"
          onClick={() => openDetail(row.id)}
        />
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-accent/15 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-asvo-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-asvo-text">Документы СМК</h1>
            <p className="text-[12px] text-asvo-text-dim">
              ISO 13485 §4.2.4 — Управление документацией
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn variant="primary" icon={<Plus size={14} />} onClick={() => setCreateModalOpen(true)}>
            Создать документ
          </ActionBtn>
          <ActionBtn variant="secondary" icon={<RefreshCw size={14} />} onClick={() => { fetchDocuments(); fetchStats(); }}>
            Обновить
          </ActionBtn>
        </div>
      </div>

      {/* ── KPI Row ── */}
      {stats && <KpiRow items={kpiItems} />}

      {/* ── Pending Approvals Banner ── */}
      {pendingApprovals.length > 0 && (
        <div className="bg-[#E8A830]/10 border border-[#E8A830]/30 rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-[#E8A830] mb-3 flex items-center gap-2">
            <Clock size={16} />
            Ожидают вашего согласования ({pendingApprovals.length})
          </h3>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-asvo-surface-2 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-asvo-accent text-[12px] flex-shrink-0">
                    {a.version.document.code}
                  </span>
                  <span className="text-asvo-text text-[13px] truncate">
                    {a.version.document.title}
                  </span>
                  <Badge color="#A06AE8" bg="rgba(160,106,232,0.14)">
                    v{a.version.version}
                  </Badge>
                </div>
                <ActionBtn
                  variant="primary"
                  icon={<ChevronRight size={12} />}
                  onClick={() => openDetail(a.version.document.id)}
                >
                  Рассмотреть
                </ActionBtn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по коду, названию..."
            className="w-full pl-9 pr-3 py-2 bg-asvo-surface border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent/40 transition-colors"
          />
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
          <span className="text-red-400 text-[13px] flex-1">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchDocuments}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-16">
          <FileText className="mx-auto text-asvo-text-dim mb-3" size={48} />
          <p className="text-asvo-text-mid text-[14px]">Документы не найдены</p>
          <p className="text-asvo-text-dim text-[12px] mt-1">
            Создайте первый документ или измените фильтры
          </p>
        </div>
      )}

      {/* ── Data Table ── */}
      {!loading && !error && documents.length > 0 && (
        <>
          <DataTable<DocumentShort>
            columns={columns}
            data={documents}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={LIMIT}
            onChange={setPage}
          />
        </>
      )}

      {/* ── Stats Panel ── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Type */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-asvo-text mb-4">
              По типам документов
            </h3>
            <div className="space-y-2">
              {stats.byType
                .sort((a, b) => Number(b.count) - Number(a.count))
                .map((t) => {
                  const total = stats.byType.reduce((s, x) => s + Number(x.count), 0);
                  const pct = total > 0 ? (Number(t.count) / total) * 100 : 0;
                  const color = TYPE_COLORS[t.type] || "#3A4E62";
                  return (
                    <div key={t.type} className="flex items-center gap-3">
                      <span className="text-[12px] text-asvo-text-mid w-24 truncate">
                        {TYPE_LABELS[t.type] || t.type}
                      </span>
                      <div className="flex-1 h-2 bg-asvo-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <span className="text-[12px] font-mono w-8 text-right" style={{ color }}>
                        {t.count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Status */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-asvo-text mb-4">
              По статусам
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.byStatus.map((s) => {
                const dotColor = STATUS_DOT_MAP[s.status] || "grey";
                return (
                  <div
                    key={s.status}
                    className="flex items-center gap-2 bg-asvo-surface rounded-lg px-3 py-2"
                  >
                    <StatusDot color={dotColor} />
                    <span className="text-[12px] text-asvo-text-mid flex-1">
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                    <span className="text-[14px] font-bold text-asvo-text">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <CreateDocumentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      {detailDocId !== null && (
        <DocumentDetailModal
          docId={detailDocId}
          isOpen={true}
          onClose={() => {
            setDetailDocId(null);
            navigate("/qms/documents", { replace: true });
          }}
          onAction={handleDetailAction}
        />
      )}
    </div>
  );
};