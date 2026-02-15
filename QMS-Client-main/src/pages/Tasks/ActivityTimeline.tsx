import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, ArrowRight, Edit3, Plus,
  CheckSquare, ListChecks, MessageSquare,
} from "lucide-react";
import Avatar from "src/components/qms/Avatar";
import { TaskActivityEntry, fetchActivity } from "src/api/activityApi";

interface ActivityTimelineProps {
  taskId: number;
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  TASK_CREATED:              { icon: <Plus size={12} />,           label: "создал(а) задачу",                   color: "text-asvo-accent" },
  STATUS_CHANGED:            { icon: <ArrowRight size={12} />,     label: "изменил(а) статус",                  color: "text-[#E8A830]" },
  FIELD_UPDATED:             { icon: <Edit3 size={12} />,          label: "обновил(а) поле",                    color: "text-asvo-blue" },
  SUBTASK_ADDED:             { icon: <ListChecks size={12} />,     label: "добавил(а) подзадачу",               color: "text-asvo-accent" },
  SUBTASK_COMPLETED:         { icon: <ListChecks size={12} />,     label: "завершил(а) подзадачу",              color: "text-[#2DD4A8]" },
  CHECKLIST_ITEM_COMPLETED:  { icon: <CheckSquare size={12} />,    label: "отметил(а) пункт чеклиста",          color: "text-[#2DD4A8]" },
  COMMENT_ADDED:             { icon: <MessageSquare size={12} />,  label: "оставил(а) комментарий",             color: "text-asvo-text-mid" },
};

const FIELD_NAMES: Record<string, string> = {
  title: "Название",
  priority: "Приоритет",
  status: "Статус",
  responsibleId: "Исполнитель",
  projectId: "Проект",
  dueDate: "Срок",
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ taskId }) => {
  const [entries, setEntries] = useState<TaskActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivity(taskId);
      setEntries(data);
    } catch {} finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const fmtTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  const renderDetail = (entry: TaskActivityEntry) => {
    const config = ACTION_CONFIG[entry.action];

    if (entry.action === "STATUS_CHANGED" && entry.oldValue && entry.newValue) {
      return (
        <span className="text-asvo-text-dim">
          {entry.oldValue} → <span className="text-asvo-text font-medium">{entry.newValue}</span>
        </span>
      );
    }

    if (entry.action === "FIELD_UPDATED" && entry.field) {
      const fieldName = FIELD_NAMES[entry.field] || entry.field;
      return (
        <span className="text-asvo-text-dim">
          «{fieldName}»: {entry.oldValue || "—"} → <span className="text-asvo-text font-medium">{entry.newValue || "—"}</span>
        </span>
      );
    }

    if (entry.action === "SUBTASK_ADDED" && entry.metadata?.subtaskTitle) {
      return <span className="text-asvo-text-dim">«{entry.metadata.subtaskTitle}»</span>;
    }

    if (entry.action === "SUBTASK_COMPLETED" && entry.metadata?.subtaskTitle) {
      return <span className="text-asvo-text-dim">«{entry.metadata.subtaskTitle}»</span>;
    }

    if (entry.action === "CHECKLIST_ITEM_COMPLETED" && entry.metadata?.itemTitle) {
      return <span className="text-asvo-text-dim">«{entry.metadata.itemTitle}»</span>;
    }

    return null;
  };

  return (
    <div className="space-y-1">
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-[13px] text-asvo-text-dim text-center py-3">История пуста</p>
      )}

      {!loading && (
        <div className="space-y-0 max-h-[350px] overflow-y-auto pr-1">
          {entries.map(entry => {
            const config = ACTION_CONFIG[entry.action] || {
              icon: <Activity size={12} />,
              label: entry.action,
              color: "text-asvo-text-dim",
            };

            return (
              <div key={entry.id} className="flex items-start gap-2 py-1.5 border-b border-asvo-border/30 last:border-0">
                <div className={`mt-0.5 shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-asvo-text">
                      {entry.user ? `${entry.user.surname} ${entry.user.name}` : "Система"}
                    </span>
                    <span className={`text-[11px] ${config.color}`}>{config.label}</span>
                    <span className="text-[11px]">{renderDetail(entry)}</span>
                  </div>
                  <span className="text-[10px] text-asvo-text-dim">{fmtTime(entry.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
