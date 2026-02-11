/**
 * CapaPage.tsx — Реестр CAPA
 * Dark theme, ASVO-QMS design system
 * ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия
 */

import React, { useState } from "react";
import {
  CheckCircle2, Plus, Download, Grid3X3,
} from "lucide-react";
import Badge from "src/components/qms/Badge";
import StatusDot from "src/components/qms/StatusDot";
import ProgressBar from "src/components/qms/ProgressBar";
import CapaDetailPage from "./CapaDetailPage";
import CreateCapaModal from "./CreateCapaModal";
import ESignatureModal from "src/components/qms/ESignatureModal";

/* ─── Mock data ──────────────────────────────────────────────── */

interface CapaRow {
  id: string;
  title: string;
  type: "Корректирующее" | "Предупреждающее";
  nc: string;
  status: string;
  statusVariant: "nc" | "capa" | "risk" | "audit" | "closed" | "sop";
  progress: number;
  progressColor: "red" | "amber" | "blue" | "accent" | "purple";
  responsible: string;
  due: string;
}

const capaRows: CapaRow[] = [
  { id: "CAPA-049", title: "Чек-лист верификации пайки SMD", type: "Корректирующее", nc: "NC-089", status: "Инициировано", statusVariant: "audit", progress: 10, progressColor: "blue", responsible: "Костюков И.", due: "20.02.2026" },
  { id: "CAPA-047", title: "Внедрение чек-листа монтажа", type: "Корректирующее", nc: "NC-085", status: "Выполнение", statusVariant: "capa", progress: 70, progressColor: "amber", responsible: "Омельченко А.", due: "20.02.2026" },
  { id: "CAPA-045", title: "Замена поставщика PCB", type: "Корректирующее", nc: "NC-082", status: "Проверка", statusVariant: "risk", progress: 90, progressColor: "accent", responsible: "Холтобин А.", due: "15.02.2026" },
  { id: "CAPA-042", title: "Обновление IQ/OQ для пресса", type: "Предупреждающее", nc: "\u2014", status: "Закрыто", statusVariant: "closed", progress: 100, progressColor: "accent", responsible: "Костюков И.", due: "01.02.2026" },
  { id: "CAPA-041", title: "Замена клея на участке сборки", type: "Корректирующее", nc: "NC-078", status: "Просрочено", statusVariant: "nc", progress: 45, progressColor: "red", responsible: "Яровой Е.", due: "28.01.2026" },
  { id: "CAPA-038", title: "Калибровка мультиметров", type: "Предупреждающее", nc: "\u2014", status: "Просрочено", statusVariant: "nc", progress: 60, progressColor: "red", responsible: "Чирков И.", due: "01.02.2026" },
];

const d8Steps = [
  { d: "D1", label: "Команда", done: true },
  { d: "D2", label: "Описание", done: true },
  { d: "D3", label: "Сдерживание", done: true },
  { d: "D4", label: "Root Cause", done: true },
  { d: "D5", label: "Действия", done: false },
  { d: "D6", label: "Внедрение", done: false },
  { d: "D7", label: "Предотвращение", done: false },
  { d: "D8", label: "Закрытие", done: false },
];

const typeBadge: Record<string, { color: string; bg: string }> = {
  "Корректирующее":    { color: "#E8A830", bg: "rgba(232,168,48,0.12)" },
  "Предупреждающее":   { color: "#4A90E8", bg: "rgba(74,144,232,0.12)" },
};

/* ─── Component ──────────────────────────────────────────────── */

export const CapaPage: React.FC = () => {
  const [selectedCapaId, setSelectedCapaId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showESign, setShowESign] = useState(false);
  const [eSignDescription, setESignDescription] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleESign = (description: string, action: () => void) => {
    setESignDescription(description);
    setPendingAction(() => action);
    setShowESign(true);
  };

  return (
    <div className="min-h-screen bg-asvo-bg p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-asvo-amber-dim rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-asvo-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">CAPA</h1>
            <p className="text-sm text-asvo-text-dim">ISO 13485 §8.5.2/§8.5.3 — Корректирующие и предупреждающие действия</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-asvo-accent text-asvo-bg rounded-lg text-sm font-semibold hover:brightness-110 transition"
          >
            <Plus size={16} />
            Создать CAPA
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-asvo-border text-asvo-text-mid rounded-lg text-sm font-medium hover:border-asvo-text-dim transition">
            <Download size={16} />
            Экспорт
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего CAPA", value: 49, cls: "text-asvo-blue" },
          { label: "Активных", value: 15, cls: "text-asvo-amber" },
          { label: "Просрочено", value: 4, cls: "text-asvo-red" },
          { label: "Эффективных", value: 31, cls: "text-asvo-accent" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${kpi.cls}`}>{kpi.value}</div>
            <div className="text-xs text-asvo-text-dim mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-asvo-surface border-b border-asvo-border">
              {["ID", "Название", "Тип", "NC", "Статус", "Прогресс", "Ответственный", "Срок"].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-asvo-text-dim uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capaRows.map((row) => {
              const tp = typeBadge[row.type];
              return (
                <tr
                  key={row.id}
                  onClick={() => setSelectedCapaId(row.id)}
                  className="border-b border-asvo-border/30 hover:bg-asvo-surface-3 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono font-bold text-asvo-accent">{row.id}</td>
                  <td className="px-4 py-3 text-sm text-asvo-text">{row.title}</td>
                  <td className="px-4 py-3">
                    <Badge color={tp.color} bg={tp.bg}>{row.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {row.nc !== "\u2014" ? (
                      <span className="text-sm font-mono font-semibold text-asvo-accent cursor-pointer hover:underline">
                        {row.nc}
                      </span>
                    ) : (
                      <span className="text-sm text-asvo-text-dim">{row.nc}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.statusVariant}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24">
                      <ProgressBar value={row.progress} color={row.progressColor} />
                      <div className="text-[10px] text-asvo-text-dim text-right mt-0.5">{row.progress}%</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-asvo-text-mid">{row.responsible}</td>
                  <td className="px-4 py-3 text-sm text-asvo-text-mid">{row.due}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 8D Workflow ──────────────────────────────────────── */}
      <div className="bg-asvo-surface-2 border border-asvo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 size={16} className="text-asvo-accent" />
          <h3 className="text-sm font-semibold text-asvo-text">8D Workflow</h3>
        </div>

        <div className="grid grid-cols-8 gap-3">
          {d8Steps.map((step) => (
            <div
              key={step.d}
              className={`rounded-lg p-3 text-center border ${
                step.done
                  ? "bg-asvo-accent-dim border-asvo-accent/30"
                  : "bg-asvo-surface border-asvo-border"
              }`}
            >
              <div
                className={`text-lg font-bold ${
                  step.done ? "text-asvo-accent" : "text-asvo-text-dim"
                }`}
              >
                {step.d}
              </div>
              <div
                className={`text-[10px] mt-1 ${
                  step.done ? "text-asvo-accent" : "text-asvo-text-dim"
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedCapaId && (
        <CapaDetailPage
          onClose={() => setSelectedCapaId(null)}
          onESign={handleESign}
        />
      )}
      {showCreateModal && (
        <CreateCapaModal onClose={() => setShowCreateModal(false)} />
      )}
      {showESign && (
        <ESignatureModal
          actionDescription={eSignDescription}
          onSign={() => {
            pendingAction?.();
            setShowESign(false);
            setSelectedCapaId(null);
          }}
          onCancel={() => setShowESign(false)}
        />
      )}
    </div>
  );
};
