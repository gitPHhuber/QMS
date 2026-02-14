/**
 * ESignPage.tsx -- E-Signature Administration & Audit
 * 21 CFR Part 11 -- Electronic Signatures management
 *
 * Tab 1: Pending signature requests
 * Tab 2: All signatures (history / audit trail)
 * Tab 3: Signing policies configuration
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  PenTool, RefreshCw, AlertTriangle, Clock,
  CheckCircle2, XCircle, ShieldCheck, Plus,
  FileText, Settings, Loader2, Filter,
} from "lucide-react";

import { esignApi } from "../../api/qms/esign";

import Badge from "../../components/qms/Badge";
import KpiRow from "../../components/qms/KpiRow";
import ActionBtn from "../../components/qms/ActionBtn";

/* --- Types --- */

interface SignatureRequest {
  id: number;
  title: string;
  entity: string;
  entityId: number;
  status: string;
  createdAt: string;
  createdBy?: { name: string; surname: string };
  signers?: Array<{
    id: number;
    userId: number;
    status: string;
    signedAt?: string;
    user?: { name: string; surname: string; role?: string };
  }>;
}

interface SignatureRecord {
  id: number;
  entity: string;
  entityId: number;
  action: string;
  meaning: string;
  signerName: string;
  signerRole?: string;
  signedAt: string;
  isValid: boolean;
  reason?: string;
  signer?: { name: string; surname: string; role?: string };
}

interface SigningPolicy {
  id: number;
  name: string;
  entity: string;
  action: string;
  requiredSigners: number;
  meanings: string[];
  isActive: boolean;
  createdAt: string;
}

type TabKey = "requests" | "history" | "policies";

/* --- Helpers --- */

const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("ru-RU");
};

const fmtPerson = (p: { name: string; surname: string } | null | undefined): string => {
  if (!p) return "\u2014";
  return `${p.surname} ${p.name.charAt(0)}.`;
};

const REQUEST_STATUS_VARIANT: Record<string, string> = {
  PENDING:   "capa",
  COMPLETED: "sop",
  DECLINED:  "nc",
  EXPIRED:   "closed",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING:   "Ожидает",
  COMPLETED: "Подписан",
  DECLINED:  "Отклонён",
  EXPIRED:   "Истёк",
};

/* --- Component --- */

export const ESignPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("requests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [policies, setPolicies] = useState<SigningPolicy[]>([]);

  // Policy form
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyEntity, setPolicyEntity] = useState("");
  const [policyAction, setPolicyAction] = useState("");
  const [policySigners, setPolicySigners] = useState(1);
  const [policySubmitting, setPolicySubmitting] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  /* -- Fetch data -- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "requests") {
        const result = await esignApi.getRequests();
        setRequests(Array.isArray(result) ? result : result?.rows ?? []);
      } else if (tab === "history") {
        // Use requests endpoint with broader params to get signature history
        const result = await esignApi.getRequests({ includeCompleted: true });
        // Extract all signatures from results
        const allSigs: SignatureRecord[] = [];
        const reqList = Array.isArray(result) ? result : result?.rows ?? [];
        reqList.forEach((req: any) => {
          if (req.signers) {
            req.signers.forEach((s: any) => {
              if (s.signedAt) {
                allSigs.push({
                  id: s.id,
                  entity: req.entity,
                  entityId: req.entityId,
                  action: req.action || req.title,
                  meaning: s.meaning || "APPROVED",
                  signerName: s.user ? `${s.user.surname} ${s.user.name}` : "Unknown",
                  signerRole: s.user?.role,
                  signedAt: s.signedAt,
                  isValid: s.status !== "DECLINED",
                  reason: s.reason,
                  signer: s.user,
                });
              }
            });
          }
        });
        setSignatures(allSigs);
      } else if (tab === "policies") {
        const result = await esignApi.getPolicies();
        setPolicies(Array.isArray(result) ? result : result?.rows ?? []);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -- KPI -- */
  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const completedCount = requests.filter(r => r.status === "COMPLETED").length;
  const declinedCount = requests.filter(r => r.status === "DECLINED").length;
  const activePolicies = policies.filter(p => p.isActive).length;

  const kpiItems = [
    { label: "Ожидающие подписи",  value: pendingCount,    color: "#E8A830",  icon: <Clock size={18} /> },
    { label: "Подписано",          value: completedCount,  color: "#2DD4A8",  icon: <CheckCircle2 size={18} /> },
    { label: "Отклонено",          value: declinedCount,   color: "#F06060",  icon: <XCircle size={18} /> },
    { label: "Активные политики",  value: activePolicies,  color: "#64B4E8",  icon: <ShieldCheck size={18} /> },
  ];

  /* -- Create policy handler -- */
  const handleCreatePolicy = async () => {
    if (!policyName.trim() || !policyEntity.trim() || !policyAction.trim()) {
      setPolicyError("Заполните все обязательные поля");
      return;
    }

    setPolicySubmitting(true);
    setPolicyError(null);
    try {
      await esignApi.createPolicy({
        name: policyName.trim(),
        entity: policyEntity.trim(),
        action: policyAction.trim(),
        requiredSigners: policySigners,
        meanings: ["APPROVED"],
        isActive: true,
      });
      setPolicyName(""); setPolicyEntity(""); setPolicyAction("");
      setPolicySigners(1); setShowPolicyForm(false);
      fetchData();
    } catch (e: any) {
      setPolicyError(e.response?.data?.message || e.message || "Ошибка создания политики");
    } finally {
      setPolicySubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";

  /* -- Tab definitions -- */
  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "requests", label: "Запросы на подпись", icon: FileText },
    { key: "history",  label: "Все подписи",       icon: Clock },
    { key: "policies", label: "Политики",          icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(100,180,232,0.12)] rounded-xl flex items-center justify-center">
            <PenTool className="w-5 h-5 text-[#64B4E8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Электронные подписи</h1>
            <p className="text-sm text-asvo-text-dim">21 CFR Part 11 -- Управление электронными подписями</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ActionBtn variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchData}>
            Обновить
          </ActionBtn>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiRow items={kpiItems} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-asvo-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${
              tab === t.key
                ? "text-asvo-accent border-asvo-accent"
                : "text-asvo-text-dim border-transparent hover:text-asvo-text"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0" size={18} />
          <span className="text-red-400 text-[13px] flex-1">{error}</span>
          <ActionBtn variant="secondary" onClick={fetchData}>
            Повторить
          </ActionBtn>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {/* ==================== REQUESTS TAB ==================== */}
      {!loading && !error && tab === "requests" && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-asvo-surface border-b border-asvo-border">
                {["ID", "Документ", "Тип", "Статус", "Инициатор", "Подписанты", "Дата"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <PenTool className="mx-auto text-asvo-text-dim mb-2" size={32} />
                    <p className="text-[13px] text-asvo-text-dim">Нет запросов на подпись</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-mono font-bold text-asvo-accent">
                      #{req.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text">{req.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="esign">{req.entity}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(REQUEST_STATUS_VARIANT[req.status] || "closed") as any}>
                        {REQUEST_STATUS_LABELS[req.status] || req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {fmtPerson(req.createdBy)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(req.signers || []).map((s) => (
                          <span
                            key={s.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              s.status === "SIGNED"
                                ? "bg-[#2DD4A8]/20 text-[#2DD4A8]"
                                : s.status === "DECLINED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-asvo-border text-asvo-text-dim"
                            }`}
                            title={s.user ? `${s.user.surname} ${s.user.name}` : `User #${s.userId}`}
                          >
                            {s.user?.name?.charAt(0) || "?"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {fmtDate(req.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== HISTORY TAB ==================== */}
      {!loading && !error && tab === "history" && (
        <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-asvo-surface border-b border-asvo-border">
                {["Подписант", "Роль", "Значение", "Объект", "Действие", "Дата", "Статус"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signatures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Clock className="mx-auto text-asvo-text-dim mb-2" size={32} />
                    <p className="text-[13px] text-asvo-text-dim">История подписей пуста</p>
                  </td>
                </tr>
              ) : (
                signatures.map((sig) => (
                  <tr
                    key={sig.id}
                    className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-asvo-text font-medium">
                      {sig.signerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-dim">
                      {sig.signerRole || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="esign">{sig.meaning}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {sig.entity} #{sig.entityId}
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {sig.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-asvo-text-mid">
                      {fmtDateTime(sig.signedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {sig.isValid ? (
                        <span className="flex items-center gap-1 text-[12px] text-[#2DD4A8]">
                          <CheckCircle2 size={14} /> Действительна
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[12px] text-red-400">
                          <XCircle size={14} /> Недействительна
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== POLICIES TAB ==================== */}
      {!loading && !error && tab === "policies" && (
        <>
          {/* Create policy button */}
          <div className="flex justify-end">
            {!showPolicyForm && (
              <ActionBtn
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setShowPolicyForm(true)}
              >
                Новая политика
              </ActionBtn>
            )}
          </div>

          {/* Policy creation form */}
          {showPolicyForm && (
            <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-asvo-text flex items-center gap-2">
                <Settings size={16} className="text-[#64B4E8]" />
                Создание политики подписания
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">
                    Название <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="Политика утверждения документов"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">
                    Тип объекта <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={policyEntity}
                    onChange={(e) => setPolicyEntity(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">-- Выберите --</option>
                    <option value="document">Документ</option>
                    <option value="capa">CAPA</option>
                    <option value="nonconformity">Несоответствие</option>
                    <option value="design_project">Проект Design Control</option>
                    <option value="change_request">Запрос на изменение</option>
                    <option value="audit_report">Аудит</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">
                    Действие <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={policyAction}
                    onChange={(e) => setPolicyAction(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">-- Выберите --</option>
                    <option value="approve">Утверждение</option>
                    <option value="release">Выпуск</option>
                    <option value="review">Рассмотрение</option>
                    <option value="close">Закрытие</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-asvo-text-mid font-medium mb-1">
                    Мин. подписантов
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={policySigners}
                    onChange={(e) => setPolicySigners(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              {policyError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <span className="text-red-400 text-[12px]">{policyError}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ActionBtn
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={handleCreatePolicy}
                  disabled={policySubmitting}
                >
                  {policySubmitting ? "Создание..." : "Создать политику"}
                </ActionBtn>
                <ActionBtn
                  variant="secondary"
                  onClick={() => { setShowPolicyForm(false); setPolicyError(null); }}
                >
                  Отмена
                </ActionBtn>
              </div>
            </div>
          )}

          {/* Policies list */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-asvo-surface border-b border-asvo-border">
                  {["Название", "Объект", "Действие", "Подписантов", "Статус", "Создана"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Settings className="mx-auto text-asvo-text-dim mb-2" size={32} />
                      <p className="text-[13px] text-asvo-text-dim">Политики подписания не настроены</p>
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr
                      key={policy.id}
                      className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-asvo-text font-medium">
                        {policy.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="esign">{policy.entity}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-asvo-text-mid">
                        {policy.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-asvo-text-mid text-center">
                        {policy.requiredSigners}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={policy.isActive ? "sop" : "closed"}>
                          {policy.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-asvo-text-mid">
                        {fmtDate(policy.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ESignPage;
