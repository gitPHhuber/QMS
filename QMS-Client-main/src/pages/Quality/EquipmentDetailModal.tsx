/**
 * EquipmentDetailModal.tsx — Детальная модалка оборудования
 * ISO 13485 §7.6 — Паспорт и калибровки
 */

import React, { useState, useEffect, useCallback } from "react";
import { Wrench, Save, PlusCircle } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { equipmentApi } from "../../api/qmsApi";
import { getUsers } from "../../api/userApi";
import ActionBtn from "../../components/qms/ActionBtn";
import Badge from "../../components/qms/Badge";

/* ── Constants ── */

const EQUIPMENT_TYPES = [
  { value: "MEASURING", label: "Измерительное" },
  { value: "TESTING", label: "Испытательное" },
  { value: "PRODUCTION", label: "Производственное" },
  { value: "CLEANING", label: "Очистительное" },
  { value: "OTHER", label: "Прочее" },
];

const STATUS_OPTIONS = [
  { value: "Исправно", label: "Исправно" },
  { value: "Калибровка", label: "Калибровка" },
  { value: "Просрочено", label: "Просрочено" },
  { value: "Списано", label: "Списано" },
];

const TABS = ["Паспорт", "Калибровки"] as const;
type Tab = (typeof TABS)[number];

/* ── Props ── */

interface EquipmentDetailModalProps {
  equipmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
}

/* ── Component ── */

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipmentId, isOpen, onClose, onAction,
}) => {
  const [tab, setTab] = useState<Tab>("Паспорт");
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<any>(null);

  /* ── passport edit state ── */
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("MEASURING");
  const [editSerialNumber, setEditSerialNumber] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState("Исправно");
  const [editResponsibleId, setEditResponsibleId] = useState<number>(0);
  const [editNextCalibrationDate, setEditNextCalibrationDate] = useState("");
  const [editAccuracyClass, setEditAccuracyClass] = useState("");
  const [editCommissionDate, setEditCommissionDate] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── calibration form state ── */
  const [calDate, setCalDate] = useState("");
  const [calCertificate, setCalCertificate] = useState("");
  const [calValidUntil, setCalValidUntil] = useState("");
  const [calLab, setCalLab] = useState("");
  const [calResult, setCalResult] = useState("PASSED");
  const [calPerformedBy, setCalPerformedBy] = useState("");
  const [calNotes, setCalNotes] = useState("");
  const [calSubmitting, setCalSubmitting] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  /* ── helpers ── */

  const toDateInput = (v: string | null | undefined) => {
    if (!v) return "";
    try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
  };

  const populateForm = useCallback((eq: any) => {
    setEditName(eq.name || "");
    setEditType(eq.type || "MEASURING");
    setEditSerialNumber(eq.serialNumber || "");
    setEditModel(eq.model || "");
    setEditManufacturer(eq.manufacturer || "");
    setEditLocation(eq.location || "");
    setEditStatus(eq.status || "Исправно");
    setEditResponsibleId(eq.responsibleId || eq.responsiblePerson?.id || 0);
    setEditNextCalibrationDate(toDateInput(eq.nextCalibrationDate || eq.nextCalibration));
    setEditAccuracyClass(eq.accuracyClass || "");
    setEditCommissionDate(toDateInput(eq.commissionDate || eq.commissionedAt));
  }, []);

  /* ── fetch equipment detail ── */

  const fetchDetail = useCallback(async () => {
    if (!equipmentId) return;
    setLoading(true);
    try {
      const data = await equipmentApi.getOne(equipmentId);
      setEquipment(data);
      populateForm(data);
    } catch (err) {
      console.error("EquipmentDetailModal fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, populateForm]);

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setTab("Паспорт");
      setSaveError(null);
      setSaveSuccess(false);
      setCalError(null);
      resetCalForm();
    }
  }, [isOpen, fetchDetail]);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers()
        .then((res) => setUsers(Array.isArray(res) ? res : res?.rows || []))
        .catch(() => {});
    }
  }, [isOpen, users.length]);

  /* ── save passport ── */

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await equipmentApi.update(equipmentId, {
        name: editName.trim(),
        type: editType,
        serialNumber: editSerialNumber.trim() || undefined,
        model: editModel.trim() || undefined,
        manufacturer: editManufacturer.trim() || undefined,
        location: editLocation.trim() || undefined,
        status: editStatus,
        responsibleId: editResponsibleId || undefined,
        nextCalibrationDate: editNextCalibrationDate || undefined,
        accuracyClass: editAccuracyClass.trim() || undefined,
        commissionDate: editCommissionDate || undefined,
      });
      setSaveSuccess(true);
      onAction?.();
      await fetchDetail();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) {
      setSaveError(e.response?.data?.message || e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ── add calibration ── */

  const resetCalForm = () => {
    setCalDate(""); setCalCertificate(""); setCalValidUntil("");
    setCalLab(""); setCalResult("PASSED"); setCalPerformedBy("");
    setCalNotes(""); setCalError(null);
  };

  const handleAddCalibration = async () => {
    if (!calDate) { setCalError("Укажите дату калибровки"); return; }

    setCalSubmitting(true);
    setCalError(null);
    try {
      await equipmentApi.addCalibration(equipmentId, {
        calibrationDate: calDate,
        certificateNumber: calCertificate.trim() || undefined,
        validUntil: calValidUntil || undefined,
        calibrationLab: calLab.trim() || undefined,
        result: calResult,
        performedBy: calPerformedBy.trim() || undefined,
        notes: calNotes.trim() || undefined,
      });
      resetCalForm();
      onAction?.();
      await fetchDetail();
    } catch (e: any) {
      setCalError(e.response?.data?.message || e.message || "Ошибка при добавлении калибровки");
    } finally {
      setCalSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  const calibrations: any[] = equipment?.calibrations || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment?.name || "Оборудование"} size="4xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-asvo-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-asvo-surface-2 rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  tab === t
                    ? "bg-asvo-accent text-asvo-bg"
                    : "text-asvo-text-mid hover:text-asvo-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab: Паспорт ── */}
          {tab === "Паспорт" && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={labelCls}>Название</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Тип</label>
                  <select value={editType} onChange={(e) => setEditType(e.target.value)} className={inputCls}>
                    {EQUIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Статус</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Serial + Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Серийный номер</label>
                  <input value={editSerialNumber} onChange={(e) => setEditSerialNumber(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Модель</label>
                  <input value={editModel} onChange={(e) => setEditModel(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Manufacturer */}
              <div>
                <label className={labelCls}>Производитель</label>
                <input value={editManufacturer} onChange={(e) => setEditManufacturer(e.target.value)} className={inputCls} />
              </div>

              {/* Location + Responsible */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Расположение</label>
                  <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ответственный</label>
                  <select value={editResponsibleId} onChange={(e) => setEditResponsibleId(Number(e.target.value))} className={inputCls}>
                    <option value={0}>— Не назначен —</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Next Calibration + Accuracy Class */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Следующая калибровка</label>
                  <input type="date" value={editNextCalibrationDate} onChange={(e) => setEditNextCalibrationDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Класс точности</label>
                  <input value={editAccuracyClass} onChange={(e) => setEditAccuracyClass(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Commission Date */}
              <div>
                <label className={labelCls}>Дата ввода в эксплуатацию</label>
                <input type="date" value={editCommissionDate} onChange={(e) => setEditCommissionDate(e.target.value)} className={inputCls} />
              </div>

              {/* Save error / success */}
              {saveError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <span className="text-red-400 text-[12px]">{saveError}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                  <span className="text-green-400 text-[12px]">Сохранено успешно</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
                <ActionBtn variant="secondary" onClick={onClose}>Закрыть</ActionBtn>
                <ActionBtn variant="primary" icon={<Save size={14} />} onClick={handleSave} disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить"}
                </ActionBtn>
              </div>
            </div>
          )}

          {/* ── Tab: Калибровки ── */}
          {tab === "Калибровки" && (
            <div className="space-y-5">
              {/* Calibration list */}
              {calibrations.length > 0 ? (
                <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-asvo-border">
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Дата</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Сертификат</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Действует до</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Лаборатория</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-center">Результат</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Выполнил</th>
                        <th className="px-3 py-2.5 text-[10px] font-semibold text-asvo-text-dim uppercase tracking-wider text-left">Примечания</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calibrations.map((c: any, i: number) => (
                        <tr key={c.id ?? i} className="border-b border-asvo-border/50 hover:bg-asvo-surface-3 transition-colors text-[13px]">
                          <td className="px-3 py-2.5 text-asvo-text-mid">
                            {c.calibrationDate ? new Date(c.calibrationDate).toLocaleDateString("ru-RU") : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-asvo-text-mid text-[12px]">{c.certificateNumber || "—"}</td>
                          <td className="px-3 py-2.5 text-asvo-text-mid">
                            {c.validUntil ? new Date(c.validUntil).toLocaleDateString("ru-RU") : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-asvo-text-mid">{c.calibrationLab || "—"}</td>
                          <td className="px-3 py-2.5 text-center">
                            {c.result === "PASSED" || c.result === "годен" ? (
                              <Badge color="#2DD4A8">PASSED</Badge>
                            ) : (
                              <Badge color="#F06060">FAILED</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-asvo-text-mid">{c.performedBy || "—"}</td>
                          <td className="px-3 py-2.5 text-asvo-text-dim text-[12px]">{c.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-asvo-text-dim text-sm py-4 text-center">Нет записей о калибровках</p>
              )}

              {/* Add calibration form */}
              <div className="border border-asvo-border rounded-xl p-4 space-y-4">
                <h3 className="text-[14px] font-semibold text-asvo-text flex items-center gap-2">
                  <PlusCircle size={16} className="text-asvo-accent" />
                  Добавить калибровку
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Дата калибровки <span className="text-red-400">*</span></label>
                    <input type="date" value={calDate} onChange={(e) => setCalDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Номер сертификата</label>
                    <input value={calCertificate} onChange={(e) => setCalCertificate(e.target.value)} placeholder="CERT-XXXX" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Действует до</label>
                    <input type="date" value={calValidUntil} onChange={(e) => setCalValidUntil(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Калибровочная лаборатория</label>
                    <input value={calLab} onChange={(e) => setCalLab(e.target.value)} placeholder="Название лаборатории" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Результат</label>
                    <select value={calResult} onChange={(e) => setCalResult(e.target.value)} className={inputCls}>
                      <option value="PASSED">PASSED (Годен)</option>
                      <option value="FAILED">FAILED (Не годен)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Выполнил</label>
                    <input value={calPerformedBy} onChange={(e) => setCalPerformedBy(e.target.value)} placeholder="ФИО специалиста" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Примечания</label>
                  <textarea value={calNotes} onChange={(e) => setCalNotes(e.target.value)} placeholder="Дополнительная информация..." rows={2} className={`${inputCls} resize-none`} />
                </div>

                {calError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <span className="text-red-400 text-[12px]">{calError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <ActionBtn variant="primary" icon={<PlusCircle size={14} />} onClick={handleAddCalibration} disabled={calSubmitting}>
                    {calSubmitting ? "Добавление..." : "Добавить калибровку"}
                  </ActionBtn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default EquipmentDetailModal;
