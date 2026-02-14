/**
 * WorkOrderCard.tsx — Карточка производственного задания
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §7.5.1 — Управление производством
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Play,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Box,
  Layers,
  X,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import TabBar from "src/components/qms/TabBar";
import { workOrderApi } from "src/api/qms/workOrders";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type WoStatus = "NEW" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type UnitStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "SCRAPPED";

interface WoUnit {
  id: number;
  serialNumber: string;
  status: UnitStatus;
  currentStep: string | null;
}

interface WoMaterial {
  id: number;
  partNumber: string;
  description: string;
  requiredQty: number;
  allocatedQty: number;
  consumedQty: number;
  unit: string;
}

interface ReadinessSection {
  name: string;
  items: Array<{ label: string; ok: boolean; detail?: string }>;
}

interface WoDetail {
  id: number;
  number: string;
  title: string;
  status: WoStatus;
  dmrNumber: string;
  dmrTitle: string;
  productTitle: string;
  batchNumber: string;
  targetQty: number;
  completedQty: number;
  yieldTarget: number | null;
  dueDate: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  units: WoUnit[];
  materials: WoMaterial[];
}

interface ProgressData {
  completionPct: number;
  unitsByStatus: Record<string, number>;
}

const STATUS_CFG: Record<WoStatus, { label: string; color: string; bg: string }> = {
  NEW:         { label: "Новый",       color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  PLANNED:     { label: "Запланирован", color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  IN_PROGRESS: { label: "В работе",    color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  COMPLETED:   { label: "Завершён",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  CANCELLED:   { label: "Отменён",     color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const UNIT_STATUS_CFG: Record<UnitStatus, { label: string; color: string; bg: string }> = {
  CREATED:     { label: "Создана",    color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  IN_PROGRESS: { label: "В работе",   color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  COMPLETED:   { label: "Завершена",  color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  ON_HOLD:     { label: "Задержана",  color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  SCRAPPED:    { label: "Брак",       color: "#F06060", bg: "rgba(240,96,96,0.12)" },
};

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "units", label: "Единицы" },
  { key: "materials", label: "Материалы" },
  { key: "readiness", label: "Готовность" },
  { key: "progress", label: "Прогресс" },
];

const fmtDate = (iso: string | null): string => {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const WorkOrderCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [wo, setWo] = useState<WoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);

  const [readiness, setReadiness] = useState<ReadinessSection[] | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);

  const [progress, setProgress] = useState<ProgressData | null>(null);

  /* ---- fetch ---- */

  const fetchWo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [res, unitsRes] = await Promise.all([
        workOrderApi.getOne(Number(id)),
        workOrderApi.getUnits(Number(id)).catch(() => ({ rows: [] })),
      ]);

      setWo({
        id: res.id,
        number: res.number ?? res.woNumber ?? `WO-${res.id}`,
        title: res.title ?? "",
        status: res.status ?? "NEW",
        dmrNumber: res.dmr?.dmrNumber ?? res.dmrNumber ?? "\u2014",
        dmrTitle: res.dmr?.title ?? res.dmrTitle ?? "",
        productTitle: res.dmr?.product?.title ?? res.productTitle ?? "\u2014",
        batchNumber: res.batchNumber ?? "\u2014",
        targetQty: res.targetQty ?? 0,
        completedQty: res.completedQty ?? 0,
        yieldTarget: res.yieldTarget ?? null,
        dueDate: res.dueDate ?? null,
        launchedAt: res.launchedAt ?? null,
        completedAt: res.completedAt ?? null,
        createdAt: res.createdAt ?? "",
        units: (unitsRes.rows ?? unitsRes.data ?? unitsRes ?? []).map((u: any) => ({
          id: u.id,
          serialNumber: u.serialNumber ?? `SN-${u.id}`,
          status: u.status ?? "CREATED",
          currentStep: u.currentStep ?? u.currentStepName ?? null,
        })),
        materials: (res.materials ?? []).map((m: any) => ({
          id: m.id,
          partNumber: m.partNumber ?? m.bomItem?.partNumber ?? "",
          description: m.description ?? m.bomItem?.description ?? "",
          requiredQty: m.requiredQty ?? 0,
          allocatedQty: m.allocatedQty ?? 0,
          consumedQty: m.consumedQty ?? 0,
          unit: m.unit ?? m.bomItem?.unit ?? "шт",
        })),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWo();
  }, [fetchWo]);

  /* ---- fetch progress ---- */

  const fetchProgress = useCallback(async () => {
    if (!id) return;
    try {
      const res = await workOrderApi.getProgress(Number(id));
      setProgress({
        completionPct: res.completionPct ?? 0,
        unitsByStatus: res.unitsByStatus ?? {},
      });
    } catch {
      /* non-critical */
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "progress") fetchProgress();
  }, [activeTab, fetchProgress]);

  /* ---- actions ---- */

  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    try {
      await action();
      await fetchWo();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLaunchCheck = async () => {
    if (!wo) return;
    setReadinessLoading(true);
    try {
      const res = await workOrderApi.readinessCheck(wo.id);
      const sections: ReadinessSection[] = [
        {
          name: "Материалы",
          items: (res.materials ?? []).map((m: any) => ({
            label: m.label ?? m.partNumber ?? "Материал",
            ok: m.ok ?? m.ready ?? false,
            detail: m.detail ?? "",
          })),
        },
        {
          name: "Оборудование",
          items: (res.equipment ?? []).map((e: any) => ({
            label: e.label ?? e.name ?? "Оборудование",
            ok: e.ok ?? e.ready ?? false,
            detail: e.detail ?? "",
          })),
        },
        {
          name: "Обучение",
          items: (res.training ?? []).map((t: any) => ({
            label: t.label ?? t.name ?? "Обучение",
            ok: t.ok ?? t.ready ?? false,
            detail: t.detail ?? "",
          })),
        },
      ];
      setReadiness(sections);
      setShowLaunchConfirm(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка проверки готовности");
    } finally {
      setReadinessLoading(false);
    }
  };

  const handleLaunchConfirm = () => {
    if (!wo) return;
    setShowLaunchConfirm(false);
    doAction(() => workOrderApi.launch(wo.id));
  };

  /* ---- loading/error ---- */

  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка задания...</span>
        </div>
      </div>
    );
  }

  if (error || !wo) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error ?? "Задание не найдено"}</span>
          <button onClick={() => navigate(-1)} className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-surface text-asvo-accent border border-asvo-border hover:bg-asvo-border transition">
            Назад
          </button>
        </div>
      </div>
    );
  }

  const sCfg = STATUS_CFG[wo.status] ?? STATUS_CFG.NEW;
  const canLaunch = wo.status === "NEW" || wo.status === "PLANNED";
  const canComplete = wo.status === "IN_PROGRESS";

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
            <Package size={22} style={{ color: "#4A90E8" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-asvo-text">{wo.title}</h1>
              <Badge color={sCfg.color} bg={sCfg.bg}>{sCfg.label}</Badge>
            </div>
            <p className="text-xs text-asvo-text-dim">{wo.number} &bull; {wo.productTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canLaunch && (
            <button
              onClick={handleLaunchCheck}
              disabled={actionLoading || readinessLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
            >
              {readinessLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Запустить
            </button>
          )}
          {wo.status === "IN_PROGRESS" && (
            <button
              onClick={() => doAction(() => workOrderApi.issueMaterials(wo.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#4A90E8]/40 text-[#4A90E8] rounded-lg text-[13px] font-medium hover:bg-[rgba(74,144,232,0.08)] transition disabled:opacity-50"
            >
              <Layers size={14} />
              Выдать материалы
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => doAction(() => workOrderApi.complete(wo.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#2DD4A8]/40 text-[#2DD4A8] rounded-lg text-[13px] font-medium hover:bg-[rgba(45,212,168,0.08)] transition disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              Завершить
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab: Обзор */}
      {activeTab === "overview" && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "DMR", value: `${wo.dmrNumber} — ${wo.dmrTitle}` },
              { label: "Изделие", value: wo.productTitle },
              { label: "Номер партии", value: wo.batchNumber },
              { label: "Целевое кол-во", value: String(wo.targetQty) },
              { label: "Выполнено", value: `${wo.completedQty} / ${wo.targetQty}` },
              { label: "Цель выхода годных", value: wo.yieldTarget ? `${wo.yieldTarget}%` : "\u2014" },
              { label: "Срок", value: fmtDate(wo.dueDate) },
              { label: "Запущено", value: fmtDate(wo.launchedAt) },
              { label: "Завершено", value: fmtDate(wo.completedAt) },
            ].map((item) => (
              <div key={item.label}>
                <span className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                  {item.label}
                </span>
                <span className="text-[13px] text-asvo-text">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Единицы */}
      {activeTab === "units" && (
        <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-asvo-surface z-10">
              <tr className="border-b border-asvo-border">
                {["Серийный №", "Статус", "Текущий шаг"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wo.units.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-[13px] text-asvo-text-dim">Нет единиц</td></tr>
              ) : (
                wo.units.map((u) => {
                  const uCfg = UNIT_STATUS_CFG[u.status] ?? UNIT_STATUS_CFG.CREATED;
                  return (
                    <tr key={u.id} className="border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px]">
                      <td className="px-3 py-2.5 font-mono text-asvo-accent font-semibold">{u.serialNumber}</td>
                      <td className="px-3 py-2.5"><Badge color={uCfg.color} bg={uCfg.bg}>{uCfg.label}</Badge></td>
                      <td className="px-3 py-2.5 text-asvo-text-mid">{u.currentStep ?? "\u2014"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Материалы */}
      {activeTab === "materials" && (
        <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-asvo-surface z-10">
              <tr className="border-b border-asvo-border">
                {["Парт-номер", "Наименование", "Требуется", "Выделено", "Израсходовано", "Ед."].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wo.materials.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[13px] text-asvo-text-dim">Нет материалов</td></tr>
              ) : (
                wo.materials.map((m) => {
                  const deficit = m.requiredQty > m.allocatedQty;
                  return (
                    <tr key={m.id} className="border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px]">
                      <td className="px-3 py-2.5 font-mono text-asvo-accent">{m.partNumber}</td>
                      <td className="px-3 py-2.5 text-asvo-text">{m.description}</td>
                      <td className="px-3 py-2.5 text-asvo-text-mid">{m.requiredQty}</td>
                      <td className={`px-3 py-2.5 font-semibold ${deficit ? "text-[#F06060]" : "text-asvo-text-mid"}`}>
                        {m.allocatedQty}
                      </td>
                      <td className="px-3 py-2.5 text-asvo-text-mid">{m.consumedQty}</td>
                      <td className="px-3 py-2.5 text-asvo-text-dim">{m.unit}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Готовность */}
      {activeTab === "readiness" && (
        <div className="space-y-4">
          {!readiness ? (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-8 text-center">
              <ShieldCheck size={32} className="mx-auto mb-3 text-asvo-text-dim" />
              <p className="text-sm text-asvo-text-dim mb-3">Запустите проверку готовности</p>
              <button
                onClick={handleLaunchCheck}
                disabled={readinessLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {readinessLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Проверить готовность
              </button>
            </div>
          ) : (
            readiness.map((section) => {
              const allOk = section.items.length > 0 && section.items.every((i) => i.ok);
              return (
                <div key={section.name} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {allOk ? (
                      <ShieldCheck size={18} className="text-[#2DD4A8]" />
                    ) : (
                      <ShieldAlert size={18} className="text-[#F06060]" />
                    )}
                    <h3 className="text-sm font-semibold text-asvo-text">{section.name}</h3>
                    <Badge
                      color={allOk ? "#2DD4A8" : "#F06060"}
                      bg={allOk ? "rgba(45,212,168,0.12)" : "rgba(240,96,96,0.12)"}
                    >
                      {allOk ? "Готово" : "Не готово"}
                    </Badge>
                  </div>
                  {section.items.length === 0 ? (
                    <p className="text-[12px] text-asvo-text-dim">Нет данных</p>
                  ) : (
                    <div className="space-y-1">
                      {section.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border/30"
                        >
                          {item.ok ? (
                            <CheckCircle2 size={14} className="text-[#2DD4A8] shrink-0" />
                          ) : (
                            <XCircle size={14} className="text-[#F06060] shrink-0" />
                          )}
                          <span className="text-[12px] text-asvo-text">{item.label}</span>
                          {item.detail && (
                            <span className="ml-auto text-[11px] text-asvo-text-dim">{item.detail}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Прогресс */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={18} className="text-asvo-accent" />
              <h3 className="text-sm font-semibold text-asvo-text">Общий прогресс</h3>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] text-asvo-text-mid">Завершено</span>
              <span className="text-[13px] font-bold text-asvo-accent">
                {progress?.completionPct ?? Math.round((wo.completedQty / Math.max(wo.targetQty, 1)) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-asvo-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-asvo-accent rounded-full transition-all duration-500"
                style={{
                  width: `${progress?.completionPct ?? Math.round((wo.completedQty / Math.max(wo.targetQty, 1)) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-4 text-[13px] text-asvo-text-mid">
              {wo.completedQty} из {wo.targetQty} единиц завершено
            </div>
          </div>

          {progress?.unitsByStatus && Object.keys(progress.unitsByStatus).length > 0 && (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-asvo-text mb-3">Единицы по статусам</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(progress.unitsByStatus).map(([status, count]) => {
                  const cfg = UNIT_STATUS_CFG[status as UnitStatus] ?? { label: status, color: "#8899AB", bg: "rgba(58,78,98,0.25)" };
                  return (
                    <div key={status} className="bg-asvo-surface border border-asvo-border/50 rounded-lg p-3">
                      <div className="text-xl font-bold" style={{ color: cfg.color }}>{count}</div>
                      <div className="text-[11px] text-asvo-text-dim mt-1">{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Launch Confirm Modal */}
      {showLaunchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-asvo-text">Подтвердить запуск</h2>
              <button onClick={() => setShowLaunchConfirm(false)} className="text-asvo-text-dim hover:text-asvo-text transition">
                <X size={18} />
              </button>
            </div>

            {readiness && readiness.map((section) => {
              const allOk = section.items.length > 0 && section.items.every((i) => i.ok);
              return (
                <div key={section.name} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {allOk ? (
                      <CheckCircle2 size={14} className="text-[#2DD4A8]" />
                    ) : (
                      <XCircle size={14} className="text-[#F06060]" />
                    )}
                    <span className="text-[13px] font-semibold text-asvo-text">{section.name}</span>
                    <span className={`text-[11px] font-semibold ${allOk ? "text-[#2DD4A8]" : "text-[#F06060]"}`}>
                      {allOk ? "OK" : "Проблемы"}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLaunchConfirm(false)}
                className="px-4 py-2 rounded-lg border border-asvo-border text-[13px] text-asvo-text-mid hover:bg-asvo-surface transition"
              >
                Отмена
              </button>
              <button
                onClick={handleLaunchConfirm}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Запустить производство
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderCard;
