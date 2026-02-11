/**
 * CreateCapaModal.tsx — Форма создания CAPA
 * ISO 13485 §8.5.2/§8.5.3
 */

import React, { useState } from "react";
import QmsModal from "src/components/qms/Modal";
import FormInput from "src/components/qms/FormInput";
import ActionBtn from "src/components/qms/ActionBtn";

interface CreateCapaModalProps {
  onClose: () => void;
}

const CreateCapaModal: React.FC<CreateCapaModalProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    description: "",
    type: "",
    source: "",
    responsible: "",
    due: "",
    team: "",
    priority: "",
    product: "",
  });

  const update = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <QmsModal title="Создание CAPA" onClose={onClose} width={640}>
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Описание корр./предупр. действия"
          textarea
          placeholder="Опишите корректирующее или предупреждающее действие..."
          value={form.description}
          onChange={update("description")}
          span={2}
        />
        <FormInput
          label="Тип"
          options={["Корректирующее (CA)", "Предупреждающее (PA)"]}
          value={form.type}
          onChange={update("type")}
        />
        <FormInput
          label="Источник"
          options={["NC-089", "NC-088", "NC-087", "Аудит AUD-012", "Риск R-001", "Другое"]}
          value={form.source}
          onChange={update("source")}
        />
        <FormInput
          label="Ответственный (лид)"
          options={["Костюков И.А.", "Омельченко А.Г.", "Холтобин А.В.", "Яровой Е.С.", "Чирков И.А."]}
          value={form.responsible}
          onChange={update("responsible")}
        />
        <FormInput
          label="Крайний срок"
          type="date"
          value={form.due}
          onChange={update("due")}
        />
        <FormInput
          label="Команда (D1)"
          textarea
          placeholder="Перечислите участников команды 8D..."
          value={form.team}
          onChange={update("team")}
          span={2}
        />
        <FormInput
          label="Приоритет"
          options={["Критический", "Высокий", "Средний", "Низкий"]}
          value={form.priority}
          onChange={update("priority")}
        />
        <FormInput
          label="Продукт"
          options={["DEXA-100", "DEXA-200", "DEXA-300", "Все"]}
          value={form.product}
          onChange={update("product")}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-asvo-border">
        <ActionBtn variant="secondary" onClick={onClose}>
          Отмена
        </ActionBtn>
        <ActionBtn variant="primary">
          + Создать CAPA
        </ActionBtn>
      </div>
    </QmsModal>
  );
};

export default CreateCapaModal;
