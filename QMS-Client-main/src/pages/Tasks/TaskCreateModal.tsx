import React, { useState, useEffect } from "react";
import { ProjectModel } from "src/api/projectsApi";
import { EpicModel, fetchEpics } from "src/api/epicsApi";
import { userGetModel } from "src/types/UserModel";
import { Modal } from "src/components/Modal/Modal";

interface TaskCreateModalProps {
  isModalOpen: boolean;
  createForm: any;
  users: userGetModel[];
  projects: ProjectModel[];
  onClose: () => void;
  onCreateFormChange: (form: any) => void;
  onSubmit: () => void;
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isModalOpen,
  createForm,
  users,
  projects,
  onClose,
  onCreateFormChange,
  onSubmit,
}) => {
  const [epics, setEpics] = useState<EpicModel[]>([]);
  useEffect(() => {
    if (isModalOpen && epics.length === 0) {
      fetchEpics().then(setEpics).catch(() => {});
    }
  }, [isModalOpen, epics.length]);
  return (
    <Modal isOpen={isModalOpen} onClose={onClose}>
      <div className="p-1">
        <h2 className="text-lg font-bold text-asvo-text mb-5">
          Создать задачу
        </h2>
        <div className="space-y-3">
          <input
            className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
            placeholder="Название"
            value={createForm.title || ""}
            onChange={e => onCreateFormChange({ ...createForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.projectId || ""}
              onChange={e => onCreateFormChange({ ...createForm, projectId: e.target.value })}
            >
              <option value="">Без проекта</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.epicId || ""}
              onChange={e => onCreateFormChange({ ...createForm, epicId: e.target.value })}
            >
              <option value="">Без эпика</option>
              {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.originType || ""}
              onChange={e => onCreateFormChange({ ...createForm, originType: e.target.value })}
            >
              <option value="">Без источника</option>
              <option value="PRODUCT">Изделие</option>
              <option value="COMPONENT">Комплектующее</option>
              <option value="NC">NC</option>
              <option value="CAPA">CAPA</option>
              <option value="RISK">Риск</option>
              <option value="AUDIT">Аудит</option>
              <option value="TRAINING">Обучение</option>
            </select>
            <input
              type="number"
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
              placeholder="ID объекта"
              value={createForm.originId || ""}
              onChange={e => onCreateFormChange({ ...createForm, originId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm font-bold placeholder:text-asvo-text-dim focus:border-asvo-border-lt focus:outline-none"
              placeholder="Кол-во"
              value={createForm.targetQty}
              onChange={e => onCreateFormChange({ ...createForm, targetQty: e.target.value })}
            />
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.priority || "1"}
              onChange={e => onCreateFormChange({ ...createForm, priority: e.target.value })}
            >
              <option value="1">Низкий</option>
              <option value="2">Средний</option>
              <option value="3">Высокий</option>
            </select>
            <select
              className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
              value={createForm.responsibleId || ""}
              onChange={e => onCreateFormChange({ ...createForm, responsibleId: e.target.value })}
            >
              <option value="">Исполнитель</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.surname} {u.name}</option>)}
            </select>
          </div>
          <input
            type="date"
            className="w-full px-3 py-2 bg-asvo-card border border-asvo-border rounded-lg text-asvo-text text-sm focus:border-asvo-border-lt focus:outline-none"
            value={createForm.dueDate || ""}
            onChange={e => onCreateFormChange({ ...createForm, dueDate: e.target.value })}
          />
          <button
            onClick={onSubmit}
            className="w-full mt-2 py-3 bg-gradient-to-r from-asvo-accent to-asvo-accent/80 hover:from-asvo-accent hover:to-asvo-accent text-asvo-bg font-bold rounded-xl transition-all text-sm shadow-[0_2px_12px_rgba(45,212,168,0.3)] hover:shadow-[0_4px_16px_rgba(45,212,168,0.4)]"
          >
            Создать
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskCreateModal;
