/**
 * CreateNcModal.tsx — Форма регистрации нового NC
 * ISO 13485 §8.3
 */

import React, { useState } from "react";
import QmsModal from "src/components/qms/Modal";
import FormInput from "src/components/qms/FormInput";
import FileDropzone from "src/components/qms/FileDropzone";
import ActionBtn from "src/components/qms/ActionBtn";

interface CreateNcModalProps {
  onClose: () => void;
}

const CreateNcModal: React.FC<CreateNcModalProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    description: "",
    source: "",
    classification: "",
    product: "",
    batch: "",
    defectQty: "",
    batchQty: "",
    responsible: "",
    due: "",
  });

  const update = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <QmsModal title="Регистрация несоответствия" onClose={onClose} width={640}>
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Описание несоответствия"
          textarea
          placeholder="Опишите суть несоответствия..."
          value={form.description}
          onChange={update("description")}
          span={2}
        />
        <FormInput
          label="Источник"
          options={["Входной контроль", "Производство", "Аудит", "Рекламация", "Самоинспекция"]}
          value={form.source}
          onChange={update("source")}
        />
        <FormInput
          label="Критичность"
          options={["Критическое", "Значительное", "Незначительное"]}
          value={form.classification}
          onChange={update("classification")}
        />
        <FormInput
          label="Продукт"
          options={["DEXA-100", "DEXA-200", "DEXA-300", "Компонент", "Другое"]}
          value={form.product}
          onChange={update("product")}
        />
        <FormInput
          label="Партия / S/N"
          placeholder="#2026-..."
          value={form.batch}
          onChange={update("batch")}
        />
        <FormInput
          label="Кол-во дефектных"
          type="number"
          placeholder="0"
          value={form.defectQty}
          onChange={update("defectQty")}
        />
        <FormInput
          label="Кол-во в партии"
          type="number"
          placeholder="0"
          value={form.batchQty}
          onChange={update("batchQty")}
        />
        <FormInput
          label="Ответственный"
          options={["Омельченко А.Г.", "Костюков И.А.", "Холтобин А.В.", "Яровой Е.С.", "Чирков И.А."]}
          value={form.responsible}
          onChange={update("responsible")}
        />
        <FormInput
          label="Крайний срок"
          type="date"
          value={form.due}
          onChange={update("due")}
        />
      </div>

      <div className="mt-4">
        <FileDropzone icon="camera" label="Прикрепите фото/документы (до 10 МБ)" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-asvo-border">
        <ActionBtn variant="secondary" onClick={onClose}>
          Отмена
        </ActionBtn>
        <ActionBtn variant="primary">
          + Зарегистрировать NC
        </ActionBtn>
      </div>
    </QmsModal>
  );
};

export default CreateNcModal;
