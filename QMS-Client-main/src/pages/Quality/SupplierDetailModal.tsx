/**
 * SupplierDetailModal.tsx — Detail view and management for a supplier
 * ISO 13485 §7.4 — Purchasing / Supplier evaluation, audits
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Plus, Save, Truck,
  Star, ClipboardCheck,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { suppliersApi } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";

/* ── Constants ── */

const CATEGORIES = [
  "Компоненты", "PCB", "Крепёж", "Корпуса", "Датчики", "Калибровка", "Другое",
];

const CRITICALITY_OPTIONS = [
  { value: "CRITICAL", label: "Критический" },
  { value: "HIGH",     label: "Высокий" },
  { value: "MEDIUM",   label: "Средний" },
  { value: "LOW",      label: "Низкий" },
];

const CRITICALITY_COLORS: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  HIGH:     { color: "#E87040", bg: "rgba(232,112,64,0.14)" },
  MEDIUM:   { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  LOW:      { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  APPROVED:       { color: "#2DD4A8", bg: "rgba(45,212,168,0.14)" },
  CONDITIONAL:    { color: "#E8A830", bg: "rgba(232,168,48,0.14)" },
  BLOCKED:        { color: "#F06060", bg: "rgba(240,96,96,0.14)" },
  NEW:            { color: "#4A90E8", bg: "rgba(74,144,232,0.14)" },
  UNDER_REVIEW:   { color: "#A06AE8", bg: "rgba(160,106,232,0.14)" },
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Одобрен", CONDITIONAL: "Условный", BLOCKED: "Заблокирован",
  NEW: "Новый", UNDER_REVIEW: "На рассмотрении",
};

const AUDIT_TYPES = [
  { value: "INITIAL",   label: "Первичный" },
  { value: "PERIODIC",  label: "Периодический" },
  { value: "FOLLOW_UP", label: "Повторный" },
];

const AUDIT_RESULTS = [
  { value: "PASS", label: "Пройден" },
  { value: "FAIL", label: "Не пройден" },
];

/* ── Props ── */

interface SupplierDetailModalProps {
  supplierId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* ── Component ── */

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplierId, isOpen, onClose, onAction,
}) => {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"main" | "evaluations" | "audits">("main");

  /* ── Edit state (main tab) ── */
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCriticality, setEditCriticality] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editInn, setEditInn] = useState("");
  const [editCertifications, setEditCertifications] = useState("");
  const [editDescription, setEditDescription] = useState("");

  /* ── Evaluations state ── */
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [showAddEval, setShowAddEval] = useState(false);
  const [evalQuality, setEvalQuality] = useState(7);
  const [evalDelivery, setEvalDelivery] = useState(7);
  const [evalCommunication, setEvalCommunication] = useState(7);
  const [evalDate, setEvalDate] = useState("");
  const [evalNotes, setEvalNotes] = useState("");

  /* ── Audits state ── */
  const [audits, setAudits] = useState<any[]>([]);
  const [showAddAudit, setShowAddAudit] = useState(false);
  const [auditDate, setAuditDate] = useState("");
  const [auditType, setAuditType] = useState("INITIAL");
  const [auditScope, setAuditScope] = useState("");
  const [auditFindings, setAuditFindings] = useState("");
  const [auditResult, setAuditResult] = useState("PASS");

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await suppliersApi.getOne(supplierId);
      setSupplier(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await suppliersApi.getEvaluations(supplierId);
      setEvaluations(Array.isArray(res) ? res : res?.rows || []);
    } catch { /* ignore */ }
  }, [supplierId]);

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      fetchEvaluations();
      setTab("main");
      setEditing(false);
    }
  }, [isOpen, fetchDetail, fetchEvaluations]);

  /* ── Populate edit fields from supplier ── */
  const startEditing = () => {
    if (!supplier) return;
    setEditName(supplier.name || "");
    setEditCategory(supplier.category || CATEGORIES[0]);
    setEditCriticality(supplier.criticality || "MEDIUM");
    setEditContactPerson(supplier.contactPerson || "");
    setEditEmail(supplier.email || "");
    setEditPhone(supplier.phone || "");
    setEditAddress(supplier.address || "");
    setEditInn(supplier.inn || "");
    setEditCertifications(
      Array.isArray(supplier.certifications) ? supplier.certifications.join(", ") : (supplier.certifications || "")
    );
    setEditDescription(supplier.description || "");
    setEditing(true);
  };

  /* ── Generic action wrapper ── */
  const doAction = async (action: () => Promise<any>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
      await fetchDetail();
      onAction();
    } catch (e: any) {
      setActionError(e.response?.data?.message || e.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Save edit ── */
  const handleSave = () => {
    if (!editName.trim()) { setActionError("Укажите название поставщика"); return; }
    const certs = editCertifications.split(",").map((s) => s.trim()).filter(Boolean);
    doAction(() => suppliersApi.update(supplierId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      category: editCategory,
      criticality: editCriticality,
      contactPerson: editContactPerson.trim() || undefined,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      inn: editInn.trim() || undefined,
      certifications: certs.length ? certs : undefined,
    }));
    setEditing(false);
  };

  /* ── Add evaluation ── */
  const handleAddEvaluation = () => {
    doAction(async () => {
      await suppliersApi.addEvaluation(supplierId, {
        qualityScore: evalQuality,
        deliveryScore: evalDelivery,
        communicationScore: evalCommunication,
        evaluationDate: evalDate || undefined,
        notes: evalNotes.trim() || undefined,
      });
      await fetchEvaluations();
    });
    setEvalQuality(7); setEvalDelivery(7); setEvalCommunication(7);
    setEvalDate(""); setEvalNotes("");
    setShowAddEval(false);
  };

  /* ── Add audit ── */
  const handleAddAudit = () => {
    if (!auditDate) { setActionError("Укажите дату аудита"); return; }
    doAction(() => suppliersApi.addAudit(supplierId, {
      auditDate,
      auditType,
      scope: auditScope.trim() || undefined,
      findings: auditFindings.trim() || undefined,
      result: auditResult,
    }));
    setAuditDate(""); setAuditType("INITIAL"); setAuditScope("");
    setAuditFindings(""); setAuditResult("PASS");
    setShowAddAudit(false);
  };

  /* ── Helpers ── */
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const scoreColor = (v: number) => {
    if (v >= 8) return "#2DD4A8";
    if (v >= 5) return "#E8A830";
    return "#F06060";
  };

  const tabs = [
    { key: "main",        label: "Основное" },
    { key: "evaluations", label: "Оценки" },
    { key: "audits",      label: "Аудиты" },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <AlertTriangle className="mx-auto text-red-400 mb-2" size={32} />
          <p className="text-red-400 text-[13px]">{error}</p>
          <ActionBtn variant="secondary" onClick={fetchDetail} className="mt-3">Повторить</ActionBtn>
        </div>
      )}

      {!loading && !error && supplier && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">SUP-{supplier.id}</span>
                {supplier.criticality && (() => {
                  const cc = CRITICALITY_COLORS[supplier.criticality];
                  return cc ? <Badge color={cc.color} bg={cc.bg}>{CRITICALITY_OPTIONS.find((o) => o.value === supplier.criticality)?.label || supplier.criticality}</Badge> : null;
                })()}
                {supplier.qualificationStatus && (() => {
                  const sc = STATUS_COLORS[supplier.qualificationStatus] || STATUS_COLORS.NEW;
                  return <Badge color={sc.color} bg={sc.bg}>{STATUS_LABELS[supplier.qualificationStatus] || supplier.qualificationStatus}</Badge>;
                })()}
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{supplier.name}</h2>
            </div>
          </div>

          {/* Metadata cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Категория",  value: supplier.category || "\u2014" },
              { label: "Контакт",    value: supplier.contactPerson || "\u2014" },
              { label: "Email",      value: supplier.email || "\u2014" },
              { label: "Телефон",    value: supplier.phone || "\u2014" },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className="text-[13px] font-medium mt-0.5 text-asvo-text truncate">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Action error */}
          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-[12px]">{actionError}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-asvo-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                  tab === t.key ? "text-asvo-accent border-asvo-accent" : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4">

            {/* ─── Tab: Main ─── */}
            {tab === "main" && !editing && (
              <>
                {supplier.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{supplier.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-asvo-text-dim">ИНН:</span> <span className="text-asvo-text ml-1">{supplier.inn || "\u2014"}</span></div>
                  <div><span className="text-asvo-text-dim">Адрес:</span> <span className="text-asvo-text ml-1">{supplier.address || "\u2014"}</span></div>
                  <div><span className="text-asvo-text-dim">Критичность:</span> <span className="text-asvo-text ml-1">{CRITICALITY_OPTIONS.find((o) => o.value === supplier.criticality)?.label || supplier.criticality || "\u2014"}</span></div>
                  <div><span className="text-asvo-text-dim">Статус:</span> <span className="text-asvo-text ml-1">{STATUS_LABELS[supplier.qualificationStatus] || supplier.qualificationStatus || "\u2014"}</span></div>
                </div>
                {supplier.certifications && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Сертификаты</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(supplier.certifications) ? supplier.certifications : [supplier.certifications]).map((c: string, i: number) => (
                        <Badge key={i} variant="sop">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <ActionBtn variant="secondary" onClick={startEditing}>Редактировать</ActionBtn>
              </>
            )}

            {tab === "main" && editing && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Название <span className="text-red-400">*</span></label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Описание</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Категория</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Критичность</label>
                    <select value={editCriticality} onChange={(e) => setEditCriticality(e.target.value)} className={inputCls}>
                      {CRITICALITY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Контактное лицо</label>
                    <input value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Телефон</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>ИНН</label>
                    <input value={editInn} onChange={(e) => setEditInn(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Адрес</label>
                  <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Сертификаты (через запятую)</label>
                  <textarea value={editCertifications} onChange={(e) => setEditCertifications(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div className="flex gap-2">
                  <ActionBtn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={actionLoading}>
                    {actionLoading ? "Сохранение..." : "Сохранить"}
                  </ActionBtn>
                  <ActionBtn variant="secondary" onClick={() => setEditing(false)} disabled={actionLoading}>Отмена</ActionBtn>
                </div>
              </div>
            )}

            {/* ─── Tab: Evaluations ─── */}
            {tab === "evaluations" && (
              <>
                {/* Evaluations list */}
                <div className="space-y-2">
                  {evaluations.length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">Оценки не добавлены</p>
                  ) : (
                    evaluations.map((ev: any, i: number) => (
                      <div key={ev.id || i} className="bg-asvo-surface rounded-lg px-3 py-2 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] text-asvo-text-dim">{fmtDate(ev.evaluationDate || ev.createdAt)}</span>
                          {ev.evaluator && <span className="text-[11px] text-asvo-text-dim">| {ev.evaluator}</span>}
                          {ev.overallScore != null && (
                            <Badge color={scoreColor(ev.overallScore)} bg={`${scoreColor(ev.overallScore)}22`}>
                              {ev.overallScore.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[12px]">
                          <span><span className="text-asvo-text-dim">Качество:</span> <span className="text-asvo-text font-semibold" style={{ color: scoreColor(ev.qualityScore) }}>{ev.qualityScore}</span></span>
                          <span><span className="text-asvo-text-dim">Поставка:</span> <span className="text-asvo-text font-semibold" style={{ color: scoreColor(ev.deliveryScore) }}>{ev.deliveryScore}</span></span>
                          <span><span className="text-asvo-text-dim">Коммуникация:</span> <span className="text-asvo-text font-semibold" style={{ color: scoreColor(ev.communicationScore) }}>{ev.communicationScore}</span></span>
                        </div>
                        {ev.notes && <p className="text-[12px] text-asvo-text-dim italic">{ev.notes}</p>}
                      </div>
                    ))
                  )}
                </div>

                {/* Add evaluation form */}
                {showAddEval ? (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <Star size={14} className="text-asvo-accent" /> Новая оценка
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Качество (1-10)</label>
                        <input type="number" min={1} max={10} value={evalQuality} onChange={(e) => setEvalQuality(Number(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Поставка (1-10)</label>
                        <input type="number" min={1} max={10} value={evalDelivery} onChange={(e) => setEvalDelivery(Number(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Коммуникация (1-10)</label>
                        <input type="number" min={1} max={10} value={evalCommunication} onChange={(e) => setEvalCommunication(Number(e.target.value))} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Дата оценки</label>
                      <input type="date" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Примечания</label>
                      <textarea value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} rows={2} placeholder="Комментарии к оценке..." className={`${inputCls} resize-none`} />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn variant="primary" icon={<Star size={14} />} onClick={handleAddEvaluation} disabled={actionLoading}>
                        {actionLoading ? "Сохранение..." : "Добавить оценку"}
                      </ActionBtn>
                      <ActionBtn variant="secondary" onClick={() => setShowAddEval(false)}>Отмена</ActionBtn>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddEval(true)} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1">
                    <Plus size={12} /> Добавить оценку
                  </button>
                )}
              </>
            )}

            {/* ─── Tab: Audits ─── */}
            {tab === "audits" && (
              <>
                {/* Audits list */}
                <div className="space-y-2">
                  {(supplier.audits || audits || []).length === 0 ? (
                    <p className="text-[13px] text-asvo-text-dim">Аудиты не проводились</p>
                  ) : (
                    (supplier.audits || audits || []).map((a: any, i: number) => (
                      <div key={a.id || i} className="bg-asvo-surface rounded-lg px-3 py-2 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] text-asvo-text-dim">{fmtDate(a.auditDate || a.createdAt)}</span>
                          <Badge color={a.result === "PASS" ? "#2DD4A8" : "#F06060"} bg={a.result === "PASS" ? "rgba(45,212,168,0.14)" : "rgba(240,96,96,0.14)"}>
                            {a.result === "PASS" ? "Пройден" : "Не пройден"}
                          </Badge>
                          <Badge variant="audit">
                            {AUDIT_TYPES.find((t) => t.value === a.auditType)?.label || a.auditType}
                          </Badge>
                        </div>
                        {a.scope && (
                          <div className="text-[12px]">
                            <span className="text-asvo-text-dim">Область:</span>{" "}
                            <span className="text-asvo-text">{a.scope}</span>
                          </div>
                        )}
                        {a.findings && (
                          <div className="text-[12px]">
                            <span className="text-asvo-text-dim">Выводы:</span>{" "}
                            <span className="text-asvo-text">{a.findings}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add audit form */}
                {showAddAudit ? (
                  <div className="border border-asvo-border rounded-lg p-3 space-y-3">
                    <h4 className="text-[13px] font-semibold text-asvo-text flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-asvo-accent" /> Новый аудит
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Дата аудита <span className="text-red-400">*</span></label>
                        <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Тип</label>
                        <select value={auditType} onChange={(e) => setAuditType(e.target.value)} className={inputCls}>
                          {AUDIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Результат</label>
                        <select value={auditResult} onChange={(e) => setAuditResult(e.target.value)} className={inputCls}>
                          {AUDIT_RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Область аудита</label>
                      <input value={auditScope} onChange={(e) => setAuditScope(e.target.value)} placeholder="Область и процессы, подвергнутые аудиту" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Выводы / замечания</label>
                      <textarea value={auditFindings} onChange={(e) => setAuditFindings(e.target.value)} rows={3} placeholder="Основные выводы и обнаруженные несоответствия..." className={`${inputCls} resize-none`} />
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn variant="primary" icon={<ClipboardCheck size={14} />} onClick={handleAddAudit} disabled={actionLoading}>
                        {actionLoading ? "Сохранение..." : "Добавить аудит"}
                      </ActionBtn>
                      <ActionBtn variant="secondary" onClick={() => setShowAddAudit(false)}>Отмена</ActionBtn>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddAudit(true)} className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1">
                    <Plus size={12} /> Добавить аудит
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SupplierDetailModal;
