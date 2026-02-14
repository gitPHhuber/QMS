/**
 * DmrEditor.tsx — Детальный просмотр/редактирование DMR
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §4.2.3 — Device Master Record
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Send,
  CheckCircle2,
  Archive,
  Copy,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  Save,
  X,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import TabBar from "src/components/qms/TabBar";
import { dmrApi } from "src/api/qms/dmr";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DmrStatus = "DRAFT" | "REVIEW" | "APPROVED" | "OBSOLETE";

interface BomItem {
  id: number;
  partNumber: string;
  description: string;
  category: string;
  quantityPer: number;
  unit: string;
  lotTracking: boolean;
  serialTracking: boolean;
}

interface ChecklistItem {
  id: number;
  label: string;
  type: string;
  required: boolean;
}

interface RouteStep {
  id: number;
  stepNumber: number;
  name: string;
  description: string;
  estimatedDuration: number | null;
  checklist: ChecklistItem[];
}

interface DmrDetail {
  id: number;
  dmrNumber: string;
  title: string;
  description: string;
  version: number;
  status: DmrStatus;
  productId: number;
  productTitle: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  bomItems: BomItem[];
  routes: Array<{
    id: number;
    name: string;
    steps: RouteStep[];
  }>;
}

/* ---- Status config ---- */

const STATUS_CFG: Record<DmrStatus, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: "Черновик",    color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  REVIEW:   { label: "На проверке", color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  APPROVED: { label: "Утверждён",   color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  OBSOLETE: { label: "Устарел",     color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const BOM_CATEGORIES: Record<string, string> = {
  COMPONENT: "Компонент",
  RAW_MATERIAL: "Сырьё",
  SUBASSEMBLY: "Подсборка",
  PACKAGING: "Упаковка",
  LABEL: "Этикетка",
  CONSUMABLE: "Расходник",
};

const TABS = [
  { key: "general", label: "Общее" },
  { key: "bom", label: "BOM" },
  { key: "route", label: "Маршрут" },
  { key: "docs", label: "Документы" },
];

const fmtDate = (iso: string | null): string => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const DmrEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ---- state ---- */
  const [dmr, setDmr] = useState<DmrDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [actionLoading, setActionLoading] = useState(false);

  /* editable fields */
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  /* BOM modal */
  const [showBomModal, setShowBomModal] = useState(false);
  const [editingBom, setEditingBom] = useState<BomItem | null>(null);
  const [bomForm, setBomForm] = useState({
    partNumber: "",
    description: "",
    category: "COMPONENT",
    quantityPer: "1",
    unit: "шт",
    lotTracking: false,
    serialTracking: false,
  });
  const [bomSaving, setBomSaving] = useState(false);

  /* Route step */
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepForm, setStepForm] = useState({ name: "", description: "", estimatedDuration: "" });
  const [stepSaving, setStepSaving] = useState(false);

  const isDraft = dmr?.status === "DRAFT";

  /* ---- fetch ---- */

  const fetchDmr = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dmrApi.getOne(Number(id));
      const d: DmrDetail = {
        id: res.id,
        dmrNumber: res.dmrNumber ?? `DMR-${res.id}`,
        title: res.title ?? "",
        description: res.description ?? "",
        version: res.version ?? 1,
        status: res.status ?? "DRAFT",
        productId: res.productId ?? res.product?.id ?? 0,
        productTitle: res.product?.title ?? res.productTitle ?? "\u2014",
        approvedAt: res.approvedAt ?? null,
        createdAt: res.createdAt ?? "",
        updatedAt: res.updatedAt ?? "",
        authorName: res.author
          ? `${res.author.surname ?? ""} ${(res.author.name ?? "").charAt(0)}.`.trim()
          : res.authorName ?? "\u2014",
        bomItems: (res.bomItems ?? res.bom ?? []).map((b: any) => ({
          id: b.id,
          partNumber: b.partNumber ?? "",
          description: b.description ?? "",
          category: b.category ?? "COMPONENT",
          quantityPer: b.quantityPer ?? 0,
          unit: b.unit ?? "шт",
          lotTracking: b.lotTracking ?? false,
          serialTracking: b.serialTracking ?? false,
        })),
        routes: (res.routes ?? []).map((rt: any) => ({
          id: rt.id,
          name: rt.name ?? "Основной маршрут",
          steps: (rt.steps ?? []).map((s: any) => ({
            id: s.id,
            stepNumber: s.stepNumber ?? s.order ?? 0,
            name: s.name ?? "",
            description: s.description ?? "",
            estimatedDuration: s.estimatedDuration ?? null,
            checklist: (s.checklist ?? s.checklistItems ?? []).map((c: any) => ({
              id: c.id,
              label: c.label ?? c.text ?? "",
              type: c.type ?? "CHECKBOX",
              required: c.required ?? false,
            })),
          })),
        })),
      };

      setDmr(d);
      setEditTitle(d.title);
      setEditDescription(d.description);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки DMR");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDmr();
  }, [fetchDmr]);

  /* ---- actions ---- */

  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    try {
      await action();
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!dmr) return;
    setSaving(true);
    try {
      await dmrApi.update(dmr.id, { title: editTitle, description: editDescription });
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ---- BOM actions ---- */

  const openBomAdd = () => {
    setEditingBom(null);
    setBomForm({ partNumber: "", description: "", category: "COMPONENT", quantityPer: "1", unit: "шт", lotTracking: false, serialTracking: false });
    setShowBomModal(true);
  };

  const openBomEdit = (item: BomItem) => {
    setEditingBom(item);
    setBomForm({
      partNumber: item.partNumber,
      description: item.description,
      category: item.category,
      quantityPer: String(item.quantityPer),
      unit: item.unit,
      lotTracking: item.lotTracking,
      serialTracking: item.serialTracking,
    });
    setShowBomModal(true);
  };

  const handleBomSave = async () => {
    if (!dmr) return;
    setBomSaving(true);
    try {
      const payload = {
        partNumber: bomForm.partNumber,
        description: bomForm.description,
        category: bomForm.category,
        quantityPer: Number(bomForm.quantityPer),
        unit: bomForm.unit,
        lotTracking: bomForm.lotTracking,
        serialTracking: bomForm.serialTracking,
      };
      if (editingBom) {
        await dmrApi.updateBomItem(editingBom.id, payload);
      } else {
        await dmrApi.addBomItem(dmr.id, payload);
      }
      setShowBomModal(false);
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка сохранения BOM");
    } finally {
      setBomSaving(false);
    }
  };

  const handleBomDelete = async (bomId: number) => {
    if (!confirm("Удалить позицию BOM?")) return;
    try {
      await dmrApi.deleteBomItem(bomId);
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ошибка удаления");
    }
  };

  /* ---- Route step actions ---- */

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleAddStep = async () => {
    if (!dmr || dmr.routes.length === 0) return;
    setStepSaving(true);
    try {
      await dmrApi.addStep(dmr.routes[0].id, {
        name: stepForm.name,
        description: stepForm.description,
        estimatedDuration: stepForm.estimatedDuration ? Number(stepForm.estimatedDuration) : undefined,
      });
      setShowStepModal(false);
      setStepForm({ name: "", description: "", estimatedDuration: "" });
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ошибка добавления шага");
    } finally {
      setStepSaving(false);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm("Удалить шаг маршрута?")) return;
    try {
      await dmrApi.deleteStep(stepId);
      await fetchDmr();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ошибка удаления шага");
    }
  };

  /* ---- loading/error ---- */

  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка DMR...</span>
        </div>
      </div>
    );
  }

  if (error || !dmr) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error ?? "DMR не найден"}</span>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-surface text-asvo-accent border border-asvo-border hover:bg-asvo-border transition"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  const sCfg = STATUS_CFG[dmr.status] ?? STATUS_CFG.DRAFT;

  /* ---- render ---- */

  return (
    <div className="p-6 space-y-5 bg-asvo-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-asvo-border text-asvo-text-mid hover:bg-asvo-surface-2 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(74,144,232,0.12)" }}>
            <FileText size={22} style={{ color: "#4A90E8" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-asvo-text">{dmr.dmrNumber}</h1>
              <span className="text-asvo-text-mid font-mono text-sm">v{dmr.version}</span>
              <Badge color={sCfg.color} bg={sCfg.bg}>{sCfg.label}</Badge>
            </div>
            <p className="text-xs text-asvo-text-dim">{dmr.productTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <button
              onClick={() => doAction(() => dmrApi.submitReview(dmr.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E8A830]/40 text-[#E8A830] rounded-lg text-[13px] font-medium hover:bg-[rgba(232,168,48,0.08)] transition disabled:opacity-50"
            >
              <Send size={14} />
              На проверку
            </button>
          )}
          {dmr.status === "REVIEW" && (
            <button
              onClick={() => doAction(() => dmrApi.approve(dmr.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              Утвердить
            </button>
          )}
          {dmr.status === "APPROVED" && (
            <button
              onClick={() => doAction(() => dmrApi.obsolete(dmr.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#F06060]/40 text-[#F06060] rounded-lg text-[13px] font-medium hover:bg-[rgba(240,96,96,0.08)] transition disabled:opacity-50"
            >
              <Archive size={14} />
              Устарел
            </button>
          )}
          <button
            onClick={() => doAction(() => dmrApi.clone(dmr.id))}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-asvo-border text-asvo-text-mid rounded-lg text-[13px] font-medium hover:bg-asvo-surface-2 transition disabled:opacity-50"
          >
            <Copy size={14} />
            Клонировать
          </button>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab: Общее */}
      {activeTab === "general" && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Изделие</span>
              <span className="text-[13px] text-asvo-text">{dmr.productTitle}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Версия</span>
              <span className="text-[13px] text-asvo-text font-mono">v{dmr.version}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Статус</span>
              <Badge color={sCfg.color} bg={sCfg.bg}>{sCfg.label}</Badge>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Автор</span>
              <span className="text-[13px] text-asvo-text">{dmr.authorName}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Создан</span>
              <span className="text-[13px] text-asvo-text-mid">{fmtDate(dmr.createdAt)}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Утверждён</span>
              <span className="text-[13px] text-asvo-text-mid">{fmtDate(dmr.approvedAt)}</span>
            </div>
          </div>

          <hr className="border-asvo-border" />

          <div>
            <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
              Название
            </label>
            {isDraft ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
              />
            ) : (
              <span className="text-[13px] text-asvo-text">{dmr.title}</span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
              Описание
            </label>
            {isDraft ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition resize-none"
              />
            ) : (
              <span className="text-[13px] text-asvo-text whitespace-pre-wrap">{dmr.description || "\u2014"}</span>
            )}
          </div>

          {isDraft && (editTitle !== dmr.title || editDescription !== dmr.description) && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Сохранить
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: BOM */}
      {activeTab === "bom" && (
        <div className="space-y-4">
          {isDraft && (
            <div className="flex justify-end">
              <button
                onClick={openBomAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)]"
              >
                <Plus size={14} />
                Добавить позицию
              </button>
            </div>
          )}

          <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="sticky top-0 bg-asvo-surface z-10">
                <tr className="border-b border-asvo-border">
                  {["№", "Парт-номер", "Наименование", "Категория", "Кол-во / Ед", "Отслеж. партий", "Отслеж. серийных", ""].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dmr.bomItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[13px] text-asvo-text-dim">
                      BOM пуст. Добавьте позиции.
                    </td>
                  </tr>
                ) : (
                  dmr.bomItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px]">
                      <td className="px-3 py-2.5 text-asvo-text-dim font-mono">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-asvo-accent font-mono font-semibold">{item.partNumber}</td>
                      <td className="px-3 py-2.5 text-asvo-text">{item.description}</td>
                      <td className="px-3 py-2.5">
                        <Badge color="#4A90E8" bg="rgba(74,144,232,0.12)">
                          {BOM_CATEGORIES[item.category] ?? item.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-asvo-text-mid">
                        {item.quantityPer} {item.unit}
                      </td>
                      <td className="px-3 py-2.5">
                        {item.lotTracking ? (
                          <CheckCircle2 size={15} className="text-asvo-accent" />
                        ) : (
                          <span className="text-asvo-text-dim">\u2014</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {item.serialTracking ? (
                          <CheckCircle2 size={15} className="text-asvo-accent" />
                        ) : (
                          <span className="text-asvo-text-dim">\u2014</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {isDraft && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openBomEdit(item)}
                              className="p-1 rounded hover:bg-asvo-surface-2 text-asvo-text-dim hover:text-asvo-accent transition"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleBomDelete(item.id)}
                              className="p-1 rounded hover:bg-asvo-surface-2 text-asvo-text-dim hover:text-[#F06060] transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Маршрут */}
      {activeTab === "route" && (
        <div className="space-y-4">
          {isDraft && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setStepForm({ name: "", description: "", estimatedDuration: "" });
                  setShowStepModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)]"
              >
                <Plus size={14} />
                Добавить шаг
              </button>
            </div>
          )}

          {dmr.routes.length === 0 ? (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-8 text-center">
              <p className="text-sm text-asvo-text-dim">Маршрут не определён</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dmr.routes[0]?.steps
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((step) => {
                  const isExpanded = expandedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden"
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-asvo-surface-3 transition-colors"
                        onClick={() => toggleStep(step.id)}
                      >
                        {isDraft && (
                          <GripVertical size={14} className="text-asvo-text-dim cursor-grab" />
                        )}
                        <span className="w-7 h-7 rounded-lg bg-asvo-accent-dim flex items-center justify-center text-xs font-bold text-asvo-accent">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <span className="text-[13px] font-semibold text-asvo-text">{step.name}</span>
                          {step.estimatedDuration && (
                            <span className="ml-2 text-[11px] text-asvo-text-dim">
                              ~{step.estimatedDuration} мин
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-asvo-text-dim">
                          {step.checklist.length} пунктов
                        </span>
                        {isDraft && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(step.id);
                            }}
                            className="p-1 rounded hover:bg-asvo-surface text-asvo-text-dim hover:text-[#F06060] transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-asvo-text-dim" />
                        ) : (
                          <ChevronRight size={16} className="text-asvo-text-dim" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-asvo-border/50 space-y-3">
                          {step.description && (
                            <p className="text-[13px] text-asvo-text-mid">{step.description}</p>
                          )}
                          {step.checklist.length === 0 ? (
                            <p className="text-[12px] text-asvo-text-dim">Чек-лист пуст</p>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                                Чек-лист
                              </span>
                              {step.checklist.map((cl) => (
                                <div
                                  key={cl.id}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-asvo-surface border border-asvo-border/30"
                                >
                                  <span className="text-[12px] text-asvo-text">{cl.label}</span>
                                  <span className="ml-auto text-[10px] text-asvo-text-dim uppercase">
                                    {cl.type}
                                  </span>
                                  {cl.required && (
                                    <span className="text-[10px] text-[#F06060] font-semibold">*</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Документы */}
      {activeTab === "docs" && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-asvo-text-dim" />
          <p className="text-sm text-asvo-text-dim">
            Раздел связанных документов будет реализован в следующей фазе
          </p>
        </div>
      )}

      {/* BOM Modal */}
      {showBomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-asvo-text">
                {editingBom ? "Редактировать позицию BOM" : "Добавить позицию BOM"}
              </h2>
              <button onClick={() => setShowBomModal(false)} className="text-asvo-text-dim hover:text-asvo-text transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Парт-номер</label>
                <input
                  type="text"
                  value={bomForm.partNumber}
                  onChange={(e) => setBomForm((f) => ({ ...f, partNumber: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Наименование</label>
                <input
                  type="text"
                  value={bomForm.description}
                  onChange={(e) => setBomForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Категория</label>
                  <select
                    value={bomForm.category}
                    onChange={(e) => setBomForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
                  >
                    {Object.entries(BOM_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Кол-во</label>
                  <input
                    type="number"
                    step="0.001"
                    value={bomForm.quantityPer}
                    onChange={(e) => setBomForm((f) => ({ ...f, quantityPer: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Единица</label>
                  <input
                    type="text"
                    value={bomForm.unit}
                    onChange={(e) => setBomForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-[13px] text-asvo-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bomForm.lotTracking}
                    onChange={(e) => setBomForm((f) => ({ ...f, lotTracking: e.target.checked }))}
                    className="rounded border-asvo-border"
                  />
                  Отслеживание партий
                </label>
                <label className="flex items-center gap-2 text-[13px] text-asvo-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bomForm.serialTracking}
                    onChange={(e) => setBomForm((f) => ({ ...f, serialTracking: e.target.checked }))}
                    className="rounded border-asvo-border"
                  />
                  Отслеживание серийных
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBomModal(false)}
                className="px-4 py-2 rounded-lg border border-asvo-border text-[13px] text-asvo-text-mid hover:bg-asvo-surface transition"
              >
                Отмена
              </button>
              <button
                onClick={handleBomSave}
                disabled={bomSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {bomSaving && <Loader2 size={14} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-asvo-text">Добавить шаг маршрута</h2>
              <button onClick={() => setShowStepModal(false)} className="text-asvo-text-dim hover:text-asvo-text transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Название</label>
                <input
                  type="text"
                  value={stepForm.name}
                  onChange={(e) => setStepForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Название операции"
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">Описание</label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text focus:outline-none focus:border-asvo-accent transition resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                  Время (мин)
                </label>
                <input
                  type="number"
                  value={stepForm.estimatedDuration}
                  onChange={(e) => setStepForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                  placeholder="Ориентировочное время, мин"
                  className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStepModal(false)}
                className="px-4 py-2 rounded-lg border border-asvo-border text-[13px] text-asvo-text-mid hover:bg-asvo-surface transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAddStep}
                disabled={stepSaving || !stepForm.name}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {stepSaving && <Loader2 size={14} className="animate-spin" />}
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DmrEditor;
