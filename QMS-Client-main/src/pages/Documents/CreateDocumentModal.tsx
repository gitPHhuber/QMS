/**
 * CreateDocumentModal.tsx — Модалка создания нового документа
 * С поддержкой загрузки файла (.pdf, .docx, .xlsx)
 */

import React, { useState, useRef } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Modal } from "../../components/Modal/Modal";
import { documentsApi } from "../../api/qmsApi";
import type { DocType } from "../../api/qmsApi";
import ActionBtn from "../../components/qms/ActionBtn";

/* ── Constants ── */

const DOC_TYPES: Array<{ value: DocType; label: string }> = [
  { value: "POLICY",           label: "Политика (ПК)" },
  { value: "MANUAL",           label: "Руководство (РК)" },
  { value: "PROCEDURE",        label: "Процедура (СТО)" },
  { value: "WORK_INSTRUCTION", label: "Рабочая инструкция (РИ)" },
  { value: "FORM",             label: "Форма (Ф)" },
  { value: "RECORD",           label: "Запись (ЗП)" },
  { value: "SPECIFICATION",    label: "Спецификация (СП)" },
  { value: "PLAN",             label: "План (ПЛ)" },
  { value: "EXTERNAL",         label: "Внешний документ (ВД)" },
  { value: "OTHER",            label: "Другое (ДОК)" },
];

const ISO_SECTIONS = [
  "4.1", "4.2.3", "4.2.4", "4.2.5",
  "5.1", "5.2", "5.3", "5.4", "5.5", "5.6",
  "6.1", "6.2", "6.3", "6.4",
  "7.1", "7.2", "7.3", "7.4", "7.5", "7.6",
  "8.1", "8.2", "8.3", "8.4", "8.5",
];

const ACCEPTED_TYPES = ".pdf,.docx,.xlsx,.doc,.xls,.odt,.ods,.txt,.csv";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/* ── Props ── */

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("PROCEDURE");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isoSection, setIsoSection] = useState("");
  const [reviewCycleMonths, setReviewCycleMonths] = useState(12);
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setTitle("");
    setType("PROCEDURE");
    setCategory("");
    setDescription("");
    setIsoSection("");
    setReviewCycleMonths(12);
    setFile(null);
    setUploadProgress(null);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ── File handling ── */

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) {
      return `Файл слишком большой (${(f.size / 1024 / 1024).toFixed(1)} МБ). Максимум 50 МБ.`;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "docx", "xlsx", "doc", "xls", "odt", "ods", "txt", "csv"];
    if (ext && !allowed.includes(ext)) {
      return `Неподдерживаемый формат .${ext}. Допустимые: ${allowed.join(", ")}`;
    }
    return null;
  };

  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setFile(f);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  /* ── Submit ── */

  const handleSubmit = async () => {
    if (!title.trim()) {
      setFormError("Укажите название документа");
      return;
    }
    if (title.trim().length < 3) {
      setFormError("Название должно содержать минимум 3 символа");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // 1. Create document (returns doc with first version in DRAFT)
      const created = await documentsApi.create({
        title: title.trim(),
        type,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        isoSection: isoSection || undefined,
      });

      // 2. Upload file if selected
      if (file && created.currentVersionId) {
        setUploadProgress(0);
        await documentsApi.uploadFile(created.currentVersionId, file);
        setUploadProgress(100);
      }

      resetForm();
      onCreated();
      onClose();
    } catch (e: any) {
      setFormError(
        e.response?.data?.message || e.message || "Ошибка при создании документа"
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const inputCls =
    "w-full px-3 py-2 bg-asvo-surface-2 border border-asvo-border rounded-lg text-[13px] text-asvo-text placeholder:text-asvo-text-dim focus:border-asvo-accent/50 focus:outline-none transition-colors";
  const labelCls = "block text-[13px] text-asvo-text-mid font-medium mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать документ" size="xl">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>
            Название документа <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Руководство по качеству"
            className={inputCls}
            autoFocus
          />
        </div>

        {/* Type + ISO Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Тип документа <span className="text-red-400">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocType)}
              className={inputCls}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Раздел ISO 13485</label>
            <select
              value={isoSection}
              onChange={(e) => setIsoSection(e.target.value)}
              className={inputCls}
            >
              <option value="">— Не указан —</option>
              {ISO_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  §{s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category + Review Cycle */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Категория</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например: Производство"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Цикл пересмотра (мес.)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={reviewCycleMonths}
              onChange={(e) => setReviewCycleMonths(Number(e.target.value) || 12)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание содержания и назначения документа..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className={labelCls}>Файл документа</label>
          {file ? (
            <div className="flex items-center gap-2 bg-asvo-surface-2 border border-asvo-accent/30 rounded-lg px-3 py-2.5">
              <FileText size={16} className="text-asvo-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-asvo-text truncate">{file.name}</div>
                <div className="text-[10px] text-asvo-text-dim">
                  {(file.size / 1024).toFixed(0)} КБ
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-asvo-text-dim hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 border-2 border-dashed border-asvo-border hover:border-asvo-accent/40 rounded-lg px-4 py-5 cursor-pointer transition-colors"
            >
              <Upload size={20} className="text-asvo-text-dim" />
              <div className="text-[12px] text-asvo-text-mid text-center">
                Перетащите файл сюда или <span className="text-asvo-accent underline">выберите</span>
              </div>
              <div className="text-[10px] text-asvo-text-dim">
                PDF, DOCX, XLSX — до 50 МБ
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <div className="w-full bg-asvo-surface-2 rounded-full h-1.5">
            <div
              className="bg-asvo-accent h-1.5 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Info */}
        <div className="bg-asvo-accent/5 border border-asvo-accent/20 rounded-lg p-3">
          <p className="text-[11px] text-asvo-text-dim leading-relaxed">
            <FileText size={12} className="inline mr-1 text-asvo-accent" />
            Документу будет автоматически присвоен код по шаблону (например, СТО-СМК-001) и создана
            первая версия в статусе «Черновик». После загрузки файла вы сможете отправить документ
            на согласование.
          </p>
        </div>

        {/* Error */}
        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-[12px]">{formError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-asvo-border">
          <ActionBtn variant="secondary" onClick={handleClose} disabled={submitting}>
            Отмена
          </ActionBtn>
          <ActionBtn
            variant="primary"
            icon={<FileText size={14} />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? uploadProgress !== null
                ? "Загрузка файла..."
                : "Создание..."
              : "Создать документ"}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
};

export default CreateDocumentModal;
