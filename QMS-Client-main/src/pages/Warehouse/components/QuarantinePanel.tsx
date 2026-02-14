import React, { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, Lock, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { fetchQuarantinedBoxes, makeQuarantineDecision } from "src/api/warehouseApi";

export const QuarantinePanel: React.FC = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionBox, setDecisionBox] = useState<any | null>(null);
  const [decisionForm, setDecisionForm] = useState({ reason: "", decisionType: "RELEASE", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchQuarantinedBoxes();
      setBoxes(data.rows || []);
      setSummary(data.summary || []);
    } catch { toast.error("Ошибка загрузки карантина"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDecision = async () => {
    if (!decisionBox || !decisionForm.reason) return toast.error("Укажите причину решения");
    try {
      await makeQuarantineDecision({
        boxId: decisionBox.id,
        reason: decisionForm.reason,
        decisionType: decisionForm.decisionType,
        notes: decisionForm.notes || undefined,
      });
      toast.success("Решение принято");
      setDecisionBox(null);
      setDecisionForm({ reason: "", decisionType: "RELEASE", notes: "" });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Ошибка"); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "QUARANTINE": return <ShieldAlert size={14} className="text-asvo-amber" />;
      case "BLOCKED": return <Lock size={14} className="text-asvo-red" />;
      case "EXPIRED": return <Clock size={14} className="text-asvo-red" />;
      default: return <AlertTriangle size={14} className="text-asvo-amber" />;
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-asvo-accent border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="font-bold text-asvo-text flex items-center gap-2"><ShieldAlert size={18} className="text-asvo-amber" /> Карантин</h3>
        <div className="flex gap-2">
          {summary.map((s: any) => (
            <span key={s.status} className="px-2 py-0.5 bg-asvo-surface-2 rounded text-xs font-bold text-asvo-text-mid">
              {s.status}: {s.count}
            </span>
          ))}
        </div>
      </div>

      {decisionBox && (
        <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-amber space-y-3">
          <h4 className="font-bold text-asvo-text">Решение по коробке #{decisionBox.id} — {decisionBox.label}</h4>
          <div className="grid grid-cols-3 gap-3">
            <select value={decisionForm.decisionType} onChange={e => setDecisionForm({...decisionForm, decisionType: e.target.value})} className="px-3 py-2 bg-asvo-bg border border-asvo-border rounded-lg text-asvo-text text-sm">
              <option value="RELEASE">Допустить (RELEASE)</option>
              <option value="REWORK">Доработка (REWORK)</option>
              <option value="SCRAP">Списание (SCRAP)</option>
              <option value="RETURN_TO_SUPPLIER">Возврат поставщику</option>
            </select>
            <input placeholder="Причина решения *" value={decisionForm.reason} onChange={e => setDecisionForm({...decisionForm, reason: e.target.value})} className="px-3 py-2 bg-asvo-bg border border-asvo-border rounded-lg text-asvo-text text-sm" />
            <input placeholder="Примечание" value={decisionForm.notes} onChange={e => setDecisionForm({...decisionForm, notes: e.target.value})} className="px-3 py-2 bg-asvo-bg border border-asvo-border rounded-lg text-asvo-text text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDecision} className="px-4 py-2 bg-asvo-green text-white rounded-lg text-sm font-bold">Подтвердить</button>
            <button onClick={() => setDecisionBox(null)} className="px-4 py-2 bg-asvo-surface-2 text-asvo-text-mid rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      {boxes.length > 0 ? (
        <div className="bg-asvo-surface rounded-xl border border-asvo-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-asvo-border bg-asvo-surface-2/50">
              <th className="text-left py-2 px-3 text-asvo-text-mid font-medium">ID</th>
              <th className="text-left py-2 px-3 text-asvo-text-mid font-medium">Наименование</th>
              <th className="text-left py-2 px-3 text-asvo-text-mid font-medium">Статус</th>
              <th className="text-left py-2 px-3 text-asvo-text-mid font-medium">Зона</th>
              <th className="text-left py-2 px-3 text-asvo-text-mid font-medium">Действие</th>
            </tr></thead>
            <tbody>
              {boxes.map((b: any) => (
                <tr key={b.id} className="border-b border-asvo-border/50 hover:bg-asvo-surface-2/30">
                  <td className="py-2 px-3 font-mono text-asvo-accent">#{b.id}</td>
                  <td className="py-2 px-3 text-asvo-text">{b.label}</td>
                  <td className="py-2 px-3 flex items-center gap-1">{statusIcon(b.status)} <span className="text-asvo-text-mid">{b.status}</span></td>
                  <td className="py-2 px-3 text-asvo-text-mid">{b.currentZone?.name || "—"}</td>
                  <td className="py-2 px-3"><button onClick={() => setDecisionBox(b)} className="px-2 py-1 bg-asvo-amber-dim text-asvo-amber rounded text-xs font-bold hover:bg-asvo-amber/20">Решение</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-asvo-text-dim text-sm">Нет коробок в карантине</div>
      )}
    </div>
  );
};
