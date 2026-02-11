/**
 * NcDetailPage.tsx — Детальная карточка NC
 * 5 табов: Информация, Расследование, Диспозиция, Вложения, История
 * ISO 13485 §8.3
 */

import React, { useState } from "react";
import {
  AlertTriangle, Image, FileText, Download, Check,
} from "lucide-react";
import QmsModal from "src/components/qms/Modal";
import TabBar from "src/components/qms/TabBar";
import Card from "src/components/qms/Card";
import Badge from "src/components/qms/Badge";
import KeyValue from "src/components/qms/KeyValue";
import WorkflowSteps from "src/components/qms/WorkflowSteps";
import FormInput from "src/components/qms/FormInput";
import FileDropzone from "src/components/qms/FileDropzone";
import ActionBtn from "src/components/qms/ActionBtn";
import StatusDot from "src/components/qms/StatusDot";

/* ─── Mock data ─────────────────────────────────────────── */

const ncData = {
  id: "NC-089",
  description: "Дефект пайки разъёма J4 на плате управления DEXA-200. Обнаружено при входном контроле партии.",
  source: "Входной контроль",
  classification: "Критическое",
  product: "DEXA-200",
  batch: "#2026-018",
  defectQty: 3,
  discoveredBy: "Чирков И.А.",
  responsible: "Омельченко А.Г.",
  department: "ОТК",
  date: "10.02.2026",
  due: "14.02.2026",
  created: "10.02.2026",
};

const workflowSteps = [
  { label: "Регистрация", done: true, subtitle: "10.02.2026" },
  { label: "Расследование", active: true, subtitle: "в процессе" },
  { label: "Диспозиция", done: false },
  { label: "CAPA", done: false },
  { label: "Верификация", done: false },
  { label: "Закрытие", done: false },
];

const fiveWhys = [
  { question: "Почему произошёл дефект пайки?", answer: "Недостаточная температура припоя при SMD-монтаже" },
  { question: "Почему температура была недостаточной?", answer: "Оператор не выполнил настройку профиля по SOP-012" },
  { question: "Почему SOP не была выполнена?", answer: "SOP-012 не обновлена после замены паяльной станции" },
  { question: "Почему SOP не обновлена?", answer: "Процедура управления изменениями не запущена при замене оборудования" },
  { question: "Почему процедура не была запущена?", answer: "Отсутствует чек-лист верификации при замене критического оборудования" },
];

const rootCause = "Отсутствие обязательного чек-листа верификации настроек при замене критического оборудования в производственном процессе SMD-монтажа";

const ishikawaCategories = [
  { title: "Человек", items: ["Недостаточная квалификация оператора", "Пропуск этапа верификации"] },
  { title: "Метод", items: ["Устаревшая SOP-012", "Отсутствие чек-листа замены"] },
  { title: "Оборудование", items: ["Замена паяльной станции", "Некалиброванный термопрофиль"] },
  { title: "Материал", items: ["Новая партия припоя Sn63Pb37", "Различия во флюсе"] },
  { title: "Среда", items: ["Влажность >60% в зоне пайки", "Температура цеха"] },
  { title: "Измерение", items: ["Визуальный контроль недостаточен", "Нет AOI-инспекции"] },
];

const dispositionOptions = [
  { label: "Использовать как есть", emoji: "✅", key: "use-as-is" },
  { label: "Доработка", emoji: "🔧", key: "rework" },
  { label: "Возврат поставщику", emoji: "↩️", key: "return" },
  { label: "Списание", emoji: "🗑", key: "scrap" },
  { label: "Уступка", emoji: "📋", key: "concession" },
  { label: "Переклассификация", emoji: "🔄", key: "reclass" },
];

const attachments = [
  { name: "photo_defect_01.jpg", size: "2.4 MB", date: "10.02.2026", type: "image" as const },
  { name: "photo_defect_02.jpg", size: "1.8 MB", date: "10.02.2026", type: "image" as const },
  { name: "report_investigation.pdf", size: "340 KB", date: "11.02.2026", type: "pdf" as const },
];

const historyEvents = [
  { date: "10.02.2026 09:12", action: "NC-089 зарегистрировано", user: "Чирков И.А.", dotColor: "accent" as const },
  { date: "10.02.2026 09:15", action: "Статус → Расследование", user: "Система", dotColor: "amber" as const },
  { date: "10.02.2026 10:30", action: "Назначен: Омельченко А.Г.", user: "Холтобин А.В.", dotColor: "blue" as const },
  { date: "10.02.2026 14:20", action: "Прикреплены фото дефекта", user: "Чирков И.А.", dotColor: "purple" as const },
  { date: "11.02.2026 11:05", action: "5-Why анализ завершён", user: "Омельченко А.Г.", dotColor: "amber" as const },
  { date: "11.02.2026 14:30", action: "Диаграмма Исикавы добавлена", user: "Омельченко А.Г.", dotColor: "grey" as const },
];

/* ─── Tabs config ─────────────────────────────────────── */

const TABS = [
  { key: "info", label: "Информация" },
  { key: "investigation", label: "Расследование" },
  { key: "disposition", label: "Диспозиция" },
  { key: "attachments", label: "Вложения" },
  { key: "history", label: "История" },
];

/* ─── Component ───────────────────────────────────────── */

interface NcDetailPageProps {
  onClose: () => void;
  onESign?: (description: string, action: () => void) => void;
}

const NcDetailPage: React.FC<NcDetailPageProps> = ({ onClose, onESign }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [selectedDisposition, setSelectedDisposition] = useState("rework");

  const handleNextStep = () => {
    if (onESign) {
      onESign(`Перевести NC-089 на следующий этап`, () => {
        // proceed
      });
    }
  };

  return (
    <QmsModal title={`Несоответствие ${ncData.id}`} onClose={onClose} width={780}>
      {/* Status badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="nc">Критическое</Badge>
          <Badge variant="capa">Расследование</Badge>
          <Badge variant="audit">Вх. контроль</Badge>
        </div>
        <span className="text-xs text-asvo-text-dim">Создано: {ncData.created}</span>
      </div>

      {/* Tab bar */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === "info" && <InfoTab />}
        {activeTab === "investigation" && <InvestigationTab />}
        {activeTab === "disposition" && (
          <DispositionTab selected={selectedDisposition} onSelect={setSelectedDisposition} />
        )}
        {activeTab === "attachments" && <AttachmentsTab />}
        {activeTab === "history" && <HistoryTab />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-asvo-border">
        <ActionBtn variant="secondary" color="#F06060" onClick={onClose}>
          Отклонить
        </ActionBtn>
        <ActionBtn variant="secondary" color="#E8A830">
          Редактировать
        </ActionBtn>
        <ActionBtn variant="primary" icon={<Check size={14} />} onClick={handleNextStep}>
          Перевести на след. этап
        </ActionBtn>
      </div>
    </QmsModal>
  );
};

/* ─── Tab: Info ────────────────────────────────────────── */

const InfoTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {/* Left card */}
      <Card>
        <KeyValue label="ID" value={ncData.id} color="#2DD4A8" />
        <KeyValue label="Описание" value={ncData.description} />
        <KeyValue label="Источник" value={ncData.source} />
        <KeyValue label="Критичность" value={ncData.classification} color="#F06060" />
        <KeyValue label="Продукт" value={ncData.product} />
        <KeyValue label="Партия" value={ncData.batch} />
        <KeyValue label="Кол-во дефектных" value={String(ncData.defectQty)} color="#F06060" />
      </Card>

      {/* Right card */}
      <Card>
        <KeyValue label="Обнаружил" value={ncData.discoveredBy} />
        <KeyValue label="Ответственный" value={ncData.responsible} />
        <KeyValue label="Подразделение" value={ncData.department} />
        <KeyValue label="Дата" value={ncData.date} />
        <KeyValue label="Крайний срок" value={ncData.due} color="#E8A830" />
        <div className="mt-3">
          <span className="text-[11px] text-asvo-text-dim font-semibold uppercase tracking-wide">
            Связанные записи
          </span>
          <div className="flex gap-2 mt-1.5">
            <Badge variant="capa">CAPA-048</Badge>
            <Badge variant="risk">R-001</Badge>
            <Badge variant="audit">AUD-012</Badge>
          </div>
        </div>
      </Card>
    </div>

    {/* Workflow */}
    <Card>
      <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-3">
        Workflow несоответствия
      </h4>
      <WorkflowSteps steps={workflowSteps} circleSize={36} />
    </Card>
  </div>
);

/* ─── Tab: Investigation ──────────────────────────────── */

const InvestigationTab: React.FC = () => (
  <div className="space-y-5">
    {/* 5 Why */}
    <div>
      <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-3">
        Анализ 5 Why
      </h4>
      <div className="space-y-2">
        {fiveWhys.map((item, i) => (
          <div key={i} style={{ paddingLeft: i * 16 }}>
            <div className="text-[11px] font-semibold text-asvo-amber mb-1">
              Why {i + 1}: {item.question}
            </div>
            <div
              className={`bg-asvo-surface rounded-lg p-2.5 text-[13px] text-asvo-text ${
                i === fiveWhys.length - 1
                  ? "border-l-[3px] border-l-asvo-red"
                  : "border-l-[3px] border-l-asvo-amber"
              }`}
            >
              {item.answer}
            </div>
          </div>
        ))}
      </div>

      {/* Root cause */}
      <div className="mt-4 bg-asvo-red-dim border border-asvo-red/20 rounded-lg p-3">
        <div className="text-[11px] font-semibold text-asvo-red uppercase mb-1">ROOT CAUSE</div>
        <div className="text-[13px] text-asvo-text">{rootCause}</div>
      </div>
    </div>

    {/* Ishikawa */}
    <div>
      <h4 className="text-xs font-semibold text-asvo-text-dim uppercase tracking-wide mb-3">
        Диаграмма Исикавы
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {ishikawaCategories.map((cat) => (
          <div key={cat.title} className="bg-asvo-surface rounded-lg p-2.5 border border-asvo-border">
            <div className="text-[11px] font-bold text-asvo-amber uppercase mb-1.5">{cat.title}</div>
            <div className="space-y-0.5">
              {cat.items.map((item, idx) => (
                <div key={idx} className="text-xs text-asvo-text">
                  • {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Tab: Disposition ────────────────────────────────── */

interface DispositionTabProps {
  selected: string;
  onSelect: (key: string) => void;
}

const DispositionTab: React.FC<DispositionTabProps> = ({ selected, onSelect }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {dispositionOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className={`p-3 rounded-lg text-center border-2 transition-colors ${
            selected === opt.key
              ? "bg-asvo-accent-dim border-asvo-accent text-asvo-accent"
              : "bg-asvo-surface border-asvo-border text-asvo-text-dim hover:border-asvo-text-dim"
          }`}
        >
          <div className="text-xl mb-1">{opt.emoji}</div>
          <div className="text-[12px] font-medium">{opt.label}</div>
        </button>
      ))}
    </div>

    <FormInput label="Обоснование решения" textarea placeholder="Опишите обоснование выбранного решения..." span={2} />

    <div className="grid grid-cols-2 gap-4">
      <FormInput
        label="Утверждающий"
        options={["Холтобин А.В.", "Костюков И.А.", "Омельченко А.Г."]}
      />
      <FormInput label="Дата решения" type="date" />
    </div>
  </div>
);

/* ─── Tab: Attachments ────────────────────────────────── */

const AttachmentsTab: React.FC = () => (
  <div className="space-y-3">
    {attachments.map((file) => (
      <div
        key={file.name}
        className="flex items-center justify-between bg-asvo-surface border border-asvo-border rounded-lg px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              file.type === "image"
                ? "bg-asvo-purple-dim text-asvo-purple"
                : "bg-asvo-blue-dim text-asvo-blue"
            }`}
          >
            {file.type === "image" ? <Image size={18} /> : <FileText size={18} />}
          </div>
          <div>
            <div className="text-[13px] text-asvo-text font-medium">{file.name}</div>
            <div className="text-[11px] text-asvo-text-dim">
              {file.size} &bull; {file.date}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-asvo-text-dim hover:text-asvo-accent transition-colors">
          <Download size={14} />
          Скачать
        </button>
      </div>
    ))}

    <FileDropzone />
  </div>
);

/* ─── Tab: History ────────────────────────────────────── */

const HistoryTab: React.FC = () => (
  <div className="space-y-1">
    {historyEvents.map((event, idx) => (
      <div key={idx} className="flex items-center gap-3 py-2">
        <span className="w-[120px] text-xs text-asvo-text-dim shrink-0">{event.date}</span>
        <StatusDot color={event.dotColor} />
        <span className="text-[13px] text-asvo-text">{event.action}</span>
        <span className="text-xs text-asvo-text-dim ml-auto">{event.user}</span>
      </div>
    ))}
  </div>
);

export default NcDetailPage;
