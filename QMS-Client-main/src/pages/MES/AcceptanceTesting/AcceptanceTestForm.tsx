/**
 * AcceptanceTestForm.tsx — Форма проведения ПСИ
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §7.5.1 — Валидация процессов
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Gavel,
  X,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import { acceptanceTestApi } from "src/api/qms/acceptanceTests";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PsiStatus = "DRAFT" | "SUBMITTED" | "IN_TESTING" | "PASSED" | "FAILED" | "CONDITIONAL";
type ItemResult = "PASS" | "FAIL" | null;

interface TestItem {
  id: number;
  orderNum: number;
  parameter: string;
  criteria: string;
  lowerLimit: string | null;
  upperLimit: string | null;
  unit: string | null;
  actualValue: string;
  result: ItemResult;
}

interface PsiDetail {
  id: number;
  psiNumber: string;
  productTitle: string;
  serialNumber: string;
  status: PsiStatus;
  testDate: string | null;
  inspectorName: string;
  items: TestItem[];
}

type DecisionType = "PASSED" | "FAILED" | "CONDITIONAL";

const STATUS_CFG: Record<PsiStatus, { label: string; color: string; bg: string }> = {
  DRAFT:       { label: "Черновик",    color: "#8899AB", bg: "rgba(58,78,98,0.25)" },
  SUBMITTED:   { label: "Предъявлено", color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
  IN_TESTING:  { label: "Испытания",  color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  PASSED:      { label: "Принято",    color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  FAILED:      { label: "Забраковано", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
  CONDITIONAL: { label: "Условно",    color: "#E89030", bg: "rgba(232,144,48,0.12)" },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const AcceptanceTestForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [psi, setPsi] = useState<PsiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  /* decision modal */
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<DecisionType>("PASSED");
  const [decisionNotes, setDecisionNotes] = useState("");

  /* ---- fetch ---- */

  const fetchPsi = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await acceptanceTestApi.getOne(Number(id));
      setPsi({
        id: res.id,
        psiNumber: res.psiNumber ?? res.number ?? `PSI-${res.id}`,
        productTitle: res.product?.title ?? res.productTitle ?? "\u2014",
        serialNumber: res.serialNumber ?? res.lotNumber ?? "\u2014",
        status: res.status ?? "DRAFT",
        testDate: res.testDate ?? res.createdAt ?? null,
        inspectorName: res.inspector
          ? `${res.inspector.surname ?? ""} ${(res.inspector.name ?? "").charAt(0)}.`.trim()
          : res.inspectorName ?? "\u2014",
        items: (res.items ?? []).map((item: any, idx: number) => ({
          id: item.id,
          orderNum: item.orderNum ?? idx + 1,
          parameter: item.parameter ?? item.name ?? "",
          criteria: item.criteria ?? item.description ?? "",
          lowerLimit: item.lowerLimit != null ? String(item.lowerLimit) : null,
          upperLimit: item.upperLimit != null ? String(item.upperLimit) : null,
          unit: item.unit ?? null,
          actualValue: item.actualValue != null ? String(item.actualValue) : "",
          result: item.result ?? null,
        })),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Ошибка загрузки ПСИ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPsi();
  }, [fetchPsi]);

  /* ---- item update ---- */

  const updateLocalItem = (itemId: number, field: "actualValue" | "result", value: string | ItemResult) => {
    setPsi((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
    });
  };

  const saveItem = async (item: TestItem) => {
    setSavingItemId(item.id);
    try {
      await acceptanceTestApi.updateItem(item.id, {
        actualValue: item.actualValue || null,
        result: item.result,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ошибка сохранения");
    } finally {
      setSavingItemId(null);
    }
  };

  /* ---- actions ---- */

  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    try {
      await action();
      await fetchPsi();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!psi) return;
    setActionLoading(true);
    try {
      await acceptanceTestApi.decide(psi.id, {
        decision: decisionType,
        notes: decisionNotes || undefined,
      });
      setShowDecisionModal(false);
      setDecisionNotes("");
      await fetchPsi();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Ошибка принятия решения");
    } finally {
      setActionLoading(false);
    }
  };

  /* ---- loading/error ---- */

  if (loading) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-asvo-accent" />
          <span className="text-sm text-asvo-text-dim">Загрузка ПСИ...</span>
        </div>
      </div>
    );
  }

  if (error || !psi) {
    return (
      <div className="p-6 bg-asvo-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full" style={{ background: "rgba(240,96,96,0.12)" }}>
            <AlertTriangle size={28} style={{ color: "#F06060" }} />
          </div>
          <span className="text-sm text-asvo-text">{error ?? "ПСИ не найден"}</span>
          <button onClick={() => navigate(-1)} className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-asvo-surface text-asvo-accent border border-asvo-border hover:bg-asvo-border transition">
            Назад
          </button>
        </div>
      </div>
    );
  }

  const sCfg = STATUS_CFG[psi.status] ?? STATUS_CFG.DRAFT;
  const isEditable = psi.status === "IN_TESTING";

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
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(45,212,168,0.12)" }}>
            <ClipboardCheck size={22} style={{ color: "#2DD4A8" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-asvo-text">{psi.psiNumber}</h1>
              <Badge color={sCfg.color} bg={sCfg.bg}>{sCfg.label}</Badge>
            </div>
            <p className="text-xs text-asvo-text-dim">
              {psi.productTitle} &bull; {psi.serialNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {psi.status === "DRAFT" && (
            <button
              onClick={() => doAction(() => acceptanceTestApi.submit(psi.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#4A90E8]/40 text-[#4A90E8] rounded-lg text-[13px] font-medium hover:bg-[rgba(74,144,232,0.08)] transition disabled:opacity-50"
            >
              <Send size={14} />
              Предъявить
            </button>
          )}
          {psi.status === "SUBMITTED" && (
            <button
              onClick={() => doAction(() => acceptanceTestApi.startTesting(psi.id))}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Начать испытания
            </button>
          )}
          {psi.status === "IN_TESTING" && (
            <button
              onClick={() => setShowDecisionModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
            >
              <Gavel size={14} />
              Решение
            </button>
          )}
        </div>
      </div>

      {/* Test Items Table */}
      <div className="bg-asvo-surface border border-asvo-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="sticky top-0 bg-asvo-surface z-10">
            <tr className="border-b border-asvo-border">
              {["№", "Параметр", "Критерий", "Пределы", "Факт. значение", "Результат"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {psi.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[13px] text-asvo-text-dim">
                  Нет параметров испытаний
                </td>
              </tr>
            ) : (
              psi.items
                .sort((a, b) => a.orderNum - b.orderNum)
                .map((item) => {
                  const isPass = item.result === "PASS";
                  const isFail = item.result === "FAIL";
                  const rowBg = isPass
                    ? "bg-[rgba(45,212,168,0.04)]"
                    : isFail
                    ? "bg-[rgba(240,96,96,0.04)]"
                    : "";

                  const limitsStr = [
                    item.lowerLimit != null ? `${item.lowerLimit}` : null,
                    item.upperLimit != null ? `${item.upperLimit}` : null,
                  ]
                    .filter(Boolean)
                    .join(" \u2013 ");

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px] ${rowBg}`}
                    >
                      <td className="px-3 py-2.5 text-asvo-text-dim font-mono w-12">{item.orderNum}</td>
                      <td className="px-3 py-2.5 text-asvo-text font-medium">{item.parameter}</td>
                      <td className="px-3 py-2.5 text-asvo-text-mid">{item.criteria}</td>
                      <td className="px-3 py-2.5 text-asvo-text-mid font-mono">
                        {limitsStr || "\u2014"}
                        {item.unit && <span className="text-asvo-text-dim ml-1">{item.unit}</span>}
                      </td>
                      <td className="px-3 py-2.5 w-40">
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.actualValue}
                            onChange={(e) => updateLocalItem(item.id, "actualValue", e.target.value)}
                            onBlur={() => saveItem(item)}
                            className={`w-full px-2 py-1 rounded-md bg-asvo-surface border text-[13px] font-mono focus:outline-none focus:border-asvo-accent transition ${
                              isFail
                                ? "border-[#F06060]/40 text-[#F06060]"
                                : isPass
                                ? "border-[#2DD4A8]/40 text-[#2DD4A8]"
                                : "border-asvo-border text-asvo-text"
                            }`}
                          />
                        ) : (
                          <span className={`font-mono ${isFail ? "text-[#F06060]" : isPass ? "text-[#2DD4A8]" : "text-asvo-text-mid"}`}>
                            {item.actualValue || "\u2014"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 w-32">
                        {isEditable ? (
                          <div className="relative">
                            <select
                              value={item.result ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : (e.target.value as ItemResult);
                                updateLocalItem(item.id, "result", val);
                                saveItem({ ...item, result: val });
                              }}
                              className={`w-full px-2 py-1 rounded-md bg-asvo-surface border text-[12px] font-semibold focus:outline-none focus:border-asvo-accent transition appearance-none ${
                                isFail
                                  ? "border-[#F06060]/40 text-[#F06060]"
                                  : isPass
                                  ? "border-[#2DD4A8]/40 text-[#2DD4A8]"
                                  : "border-asvo-border text-asvo-text-mid"
                              }`}
                            >
                              <option value="">--</option>
                              <option value="PASS">PASS</option>
                              <option value="FAIL">FAIL</option>
                            </select>
                            {savingItemId === item.id && (
                              <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-asvo-text-dim" />
                            )}
                          </div>
                        ) : (
                          <span>
                            {item.result === "PASS" && (
                              <span className="flex items-center gap-1 text-[#2DD4A8] font-semibold text-[12px]">
                                <CheckCircle2 size={13} /> PASS
                              </span>
                            )}
                            {item.result === "FAIL" && (
                              <span className="flex items-center gap-1 text-[#F06060] font-semibold text-[12px]">
                                <XCircle size={13} /> FAIL
                              </span>
                            )}
                            {!item.result && <span className="text-asvo-text-dim">\u2014</span>}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-asvo-text">Решение по ПСИ</h2>
              <button onClick={() => setShowDecisionModal(false)} className="text-asvo-text-dim hover:text-asvo-text transition">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-2">
                Решение
              </label>
              <div className="flex gap-2">
                {([
                  { key: "PASSED" as DecisionType, label: "Принято", color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
                  { key: "FAILED" as DecisionType, label: "Забраковано", color: "#F06060", bg: "rgba(240,96,96,0.12)" },
                  { key: "CONDITIONAL" as DecisionType, label: "Условно", color: "#E89030", bg: "rgba(232,144,48,0.12)" },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDecisionType(opt.key)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-[13px] font-semibold transition ${
                      decisionType === opt.key
                        ? "border-2"
                        : "border-asvo-border opacity-60 hover:opacity-80"
                    }`}
                    style={
                      decisionType === opt.key
                        ? { borderColor: opt.color, color: opt.color, background: opt.bg }
                        : { color: opt.color }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider mb-1">
                Примечания
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
                placeholder="Комментарий к решению..."
                className="w-full px-3 py-2 rounded-lg bg-asvo-surface border border-asvo-border text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:outline-none focus:border-asvo-accent transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 rounded-lg border border-asvo-border text-[13px] text-asvo-text-mid hover:bg-asvo-surface transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDecision}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-asvo-accent text-asvo-bg font-bold rounded-lg text-[13px] transition hover:shadow-[0_2px_12px_rgba(45,212,168,0.3)] disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptanceTestForm;
