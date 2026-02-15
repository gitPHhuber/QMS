/**
 * DesignDetailModal.tsx -- Detail view & management of a Design Control project
 * ISO 13485 \u00a77.3 -- Tabs for each sub-clause: Inputs, Outputs, Reviews, V&V, Transfer, Changes
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Plus, CheckCircle2, ArrowRight,
  FileInput, FileOutput, Eye, ShieldCheck,
  FlaskConical, Truck, GitBranch, Compass,
} from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { designApi } from "../../api/qms/design";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";
import StatusDot from "../../components/qms/StatusDot";

/* --- Constants --- */

const STATUS_LABELS: Record<string, string> = {
  PLANNING:       "Планирование",
  INPUTS_DEFINED: "Входные данные",
  DESIGN_ACTIVE:  "Разработка",
  REVIEW:         "Анализ",
  VERIFICATION:   "Верификация",
  VALIDATION:     "Валидация",
  TRANSFER:       "Трансфер",
  CLOSED:         "Закрыт",
  ON_HOLD:        "Приостановлен",
};

const STATUS_DOT: Record<string, "red" | "blue" | "purple" | "orange" | "amber" | "accent" | "grey" | "green"> = {
  PLANNING:       "blue",
  INPUTS_DEFINED: "purple",
  DESIGN_ACTIVE:  "orange",
  REVIEW:         "amber",
  VERIFICATION:   "amber",
  VALIDATION:     "purple",
  TRANSFER:       "green",
  CLOSED:         "accent",
  ON_HOLD:        "grey",
};

type TabKey = "overview" | "inputs" | "outputs" | "reviews" | "verification" | "validation" | "transfers" | "changes";

const TABS: { key: TabKey; label: string; ref: string; icon: React.ElementType }[] = [
  { key: "overview",     label: "Обзор",        ref: "\u00a77.3.2", icon: Compass },
  { key: "inputs",       label: "Входные",      ref: "\u00a77.3.3", icon: FileInput },
  { key: "outputs",      label: "Выходные",     ref: "\u00a77.3.4", icon: FileOutput },
  { key: "reviews",      label: "Анализ",       ref: "\u00a77.3.5", icon: Eye },
  { key: "verification", label: "Верификация",  ref: "\u00a77.3.6", icon: ShieldCheck },
  { key: "validation",   label: "Валидация",    ref: "\u00a77.3.7", icon: FlaskConical },
  { key: "transfers",    label: "Трансфер",     ref: "\u00a77.3.8", icon: Truck },
  { key: "changes",      label: "Изменения",    ref: "\u00a77.3.9", icon: GitBranch },
];

/* --- Props --- */

interface DesignDetailModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

/* --- Component --- */

const DesignDetailModal: React.FC<DesignDetailModalProps> = ({
  projectId, isOpen, onClose, onAction,
}) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [users, setUsers] = useState<any[]>([]);

  // Add forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAssignee, setFormAssignee] = useState<number>(0);
  const [formDueDate, setFormDueDate] = useState("");

  /* -- Fetch -- */
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await designApi.getOne(projectId);
      setProject(d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { if (isOpen) fetchDetail(); }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers().then((res) => setUsers(Array.isArray(res) ? res : res?.rows || [])).catch(() => {});
    }
  }, [isOpen, users.length]);

  /* -- Actions helper -- */
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

  const resetForm = () => {
    setFormTitle(""); setFormDescription(""); setFormCategory("");
    setFormAssignee(0); setFormDueDate(""); setShowAddForm(false);
  };

  /* -- Tab-specific add handlers -- */
  const handleAddInput = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addInput(project.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory || undefined,
      source: "USER_NEED",
    }));
    resetForm();
  };

  const handleAddOutput = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addOutput(project.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory || undefined,
    }));
    resetForm();
  };

  const handleAddReview = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addReview(project.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      scheduledDate: formDueDate || undefined,
    }));
    resetForm();
  };

  const handleAddVerification = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addVerification(project.id, {
      title: formTitle.trim(),
      method: formDescription.trim() || undefined,
      assignedToId: formAssignee || undefined,
    }));
    resetForm();
  };

  const handleAddValidation = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addValidation(project.id, {
      title: formTitle.trim(),
      method: formDescription.trim() || undefined,
      assignedToId: formAssignee || undefined,
    }));
    resetForm();
  };

  const handleAddTransfer = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.addTransfer(project.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
    }));
    resetForm();
  };

  const handleCreateChange = () => {
    if (!formTitle.trim()) return;
    doAction(() => designApi.createChange(project.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      reason: formCategory || undefined,
    }));
    resetForm();
  };

  /* -- Helpers -- */
  const fmtDate = (d: string | null) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtPerson = (p: any) => p ? `${p.surname} ${p.name}` : "\u2014";

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";

  /* -- Item list renderer -- */
  const renderItemList = (
    items: any[] | undefined,
    emptyText: string,
    onAdd: () => void,
    addLabel: string,
    renderExtra?: (item: any) => React.ReactNode,
  ) => (
    <>
      <div className="space-y-2">
        {(!items || items.length === 0) ? (
          <p className="text-[13px] text-asvo-text-dim">{emptyText}</p>
        ) : (
          items.map((item: any, idx: number) => (
            <div key={item.id || idx} className="flex items-start gap-3 bg-asvo-surface rounded-lg px-3 py-2.5">
              <span className="text-[12px] text-asvo-text-dim w-6 pt-0.5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-asvo-text font-medium">{item.title || item.description}</div>
                {item.description && item.title && (
                  <div className="text-[12px] text-asvo-text-dim mt-0.5">{item.description}</div>
                )}
                {item.method && (
                  <div className="text-[12px] text-asvo-text-dim mt-0.5">Метод: {item.method}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.status && (
                  <Badge variant={item.status === "COMPLETED" || item.status === "APPROVED" ? "sop" : item.status === "REJECTED" ? "nc" : "design"}>
                    {item.status}
                  </Badge>
                )}
                {item.assignedTo && (
                  <span className="text-[11px] text-asvo-text-dim">{fmtPerson(item.assignedTo)}</span>
                )}
                {item.scheduledDate && (
                  <span className="text-[11px] text-asvo-text-dim">{fmtDate(item.scheduledDate)}</span>
                )}
                {item.dueDate && (
                  <span className="text-[11px] text-asvo-text-dim">{fmtDate(item.dueDate)}</span>
                )}
                {renderExtra?.(item)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      {!["CLOSED"].includes(project?.status) && (
        <>
          {showAddForm ? (
            <div className="border border-asvo-border rounded-lg p-3 space-y-3 mt-3">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Название"
                className={inputCls}
                autoFocus
              />
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Описание / метод..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <div className="grid grid-cols-2 gap-3">
                {(tab === "verification" || tab === "validation") && (
                  <select
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(Number(e.target.value))}
                    className={inputCls}
                  >
                    <option value={0}>{"\u2014"} Исполнитель {"\u2014"}</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.surname} {u.name}</option>
                    ))}
                  </select>
                )}
                {(tab === "reviews") && (
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className={inputCls}
                  />
                )}
                {(tab === "inputs" || tab === "outputs" || tab === "changes") && (
                  <input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder={tab === "changes" ? "Причина изменения" : "Категория"}
                    className={inputCls}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <ActionBtn variant="primary" onClick={onAdd} disabled={actionLoading}>
                  Добавить
                </ActionBtn>
                <ActionBtn variant="secondary" onClick={resetForm}>
                  Отмена
                </ActionBtn>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[12px] text-asvo-accent hover:underline flex items-center gap-1 mt-3"
            >
              <Plus size={12} /> {addLabel}
            </button>
          )}
        </>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
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

      {!loading && !error && project && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-asvo-accent text-[14px] font-bold">{project.number}</span>
                <Badge variant="design">{project.productType || "N/A"}</Badge>
                {project.regulatoryClass && (
                  <Badge variant="risk">{project.regulatoryClass}</Badge>
                )}
                <span className="flex items-center gap-1.5">
                  <StatusDot color={STATUS_DOT[project.status] || "grey"} />
                  <span className="text-asvo-text text-[13px]">
                    {STATUS_LABELS[project.status] || project.status}
                  </span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-asvo-text">{project.title}</h2>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Руководитель", value: fmtPerson(project.teamLead) },
              { label: "Начало", value: fmtDate(project.plannedStart) },
              { label: "Плановый срок", value: fmtDate(project.plannedEnd), isOverdue: project.plannedEnd && new Date(project.plannedEnd) < new Date() && project.status !== "CLOSED" },
              { label: "Прогресс", value: `${project.progress ?? 0}%` },
            ].map((m) => (
              <div key={m.label} className="bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2">
                <div className="text-[10px] text-asvo-text-dim uppercase tracking-wide">{m.label}</div>
                <div className={`text-[13px] font-medium mt-0.5 ${(m as any).isOverdue ? "text-red-400" : "text-asvo-text"}`}>
                  {m.value}
                </div>
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
          <div className="flex gap-1 border-b border-asvo-border overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); resetForm(); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 whitespace-nowrap ${
                  tab === t.key
                    ? "text-asvo-accent border-asvo-accent"
                    : "text-asvo-text-dim border-transparent hover:text-asvo-text"
                }`}
              >
                <t.icon size={13} />
                {t.label}
                <span className="text-[10px] text-asvo-text-dim ml-0.5">{t.ref}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4 space-y-4 min-h-[200px]">
            {/* Overview */}
            {tab === "overview" && (
              <>
                {project.description && (
                  <div>
                    <div className="text-[10px] text-asvo-text-dim uppercase mb-1">Описание проекта</div>
                    <p className="text-[13px] text-asvo-text whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-asvo-text-dim">Тип изделия:</span>
                    <span className="text-asvo-text ml-1">{project.productType || "\u2014"}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Класс регулирования:</span>
                    <span className="text-asvo-text ml-1">{project.regulatoryClass || "\u2014"}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Руководитель:</span>
                    <span className="text-asvo-text ml-1">{fmtPerson(project.teamLead)}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Создано:</span>
                    <span className="text-asvo-text ml-1">{fmtDate(project.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Начало:</span>
                    <span className="text-asvo-text ml-1">{fmtDate(project.plannedStart)}</span>
                  </div>
                  <div>
                    <span className="text-asvo-text-dim">Плановый срок:</span>
                    <span className="text-asvo-text ml-1">{fmtDate(project.plannedEnd)}</span>
                  </div>
                </div>

                {/* Phase progress */}
                <div className="mt-4">
                  <div className="text-[10px] text-asvo-text-dim uppercase mb-2">Фазы проекта</div>
                  <div className="flex items-center gap-1">
                    {TABS.filter(t => t.key !== "overview").map((phase) => {
                      const items = project[phase.key] || [];
                      const hasItems = items.length > 0;
                      const allDone = hasItems && items.every((i: any) =>
                        i.status === "COMPLETED" || i.status === "APPROVED" || i.status === "PASSED"
                      );
                      return (
                        <div
                          key={phase.key}
                          className={`flex-1 h-2 rounded-full ${
                            allDone
                              ? "bg-asvo-accent"
                              : hasItems
                                ? "bg-[#E89030]"
                                : "bg-asvo-border"
                          }`}
                          title={`${phase.label} (${phase.ref}): ${items.length} items`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {TABS.filter(t => t.key !== "overview").map((phase) => (
                      <span key={phase.key} className="text-[9px] text-asvo-text-dim">{phase.ref}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Inputs */}
            {tab === "inputs" && renderItemList(
              project.inputs,
              "Входные данные не определены",
              handleAddInput,
              "Добавить входные данные",
            )}

            {/* Outputs */}
            {tab === "outputs" && renderItemList(
              project.outputs,
              "Выходные данные не определены",
              handleAddOutput,
              "Добавить выходные данные",
            )}

            {/* Reviews */}
            {tab === "reviews" && renderItemList(
              project.reviews,
              "Анализы не запланированы",
              handleAddReview,
              "Запланировать анализ",
              (item) => item.completedAt ? (
                <Badge variant="sop">Завершён {fmtDate(item.completedAt)}</Badge>
              ) : null,
            )}

            {/* Verification */}
            {tab === "verification" && renderItemList(
              project.verifications,
              "Верификации не добавлены",
              handleAddVerification,
              "Добавить верификацию",
              (item) => item.result ? (
                <Badge variant={item.result === "PASS" ? "sop" : "nc"}>
                  {item.result === "PASS" ? "Пройдена" : "Не пройдена"}
                </Badge>
              ) : null,
            )}

            {/* Validation */}
            {tab === "validation" && renderItemList(
              project.validations,
              "Валидации не добавлены",
              handleAddValidation,
              "Добавить валидацию",
              (item) => item.result ? (
                <Badge variant={item.result === "PASS" ? "sop" : "nc"}>
                  {item.result === "PASS" ? "Пройдена" : "Не пройдена"}
                </Badge>
              ) : null,
            )}

            {/* Transfers */}
            {tab === "transfers" && renderItemList(
              project.transfers,
              "Элементы трансфера не определены",
              handleAddTransfer,
              "Добавить элемент трансфера",
              (item) => item.completedAt ? (
                <Badge variant="sop">Завершён</Badge>
              ) : (
                <button
                  onClick={() => doAction(() => designApi.completeTransfer(item.id, {}))}
                  disabled={actionLoading}
                  className="px-2 py-1 rounded bg-[#2DD4A8]/15 text-[#2DD4A8] text-[10px] font-medium hover:bg-[#2DD4A8]/25 transition-colors disabled:opacity-50"
                >
                  Завершить
                </button>
              ),
            )}

            {/* Changes */}
            {tab === "changes" && renderItemList(
              project.changes,
              "Изменения отсутствуют",
              handleCreateChange,
              "Создать изменение",
              (item) => item.status ? (
                <Badge variant={item.status === "APPROVED" ? "sop" : item.status === "REJECTED" ? "nc" : "capa"}>
                  {item.status}
                </Badge>
              ) : null,
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DesignDetailModal;
