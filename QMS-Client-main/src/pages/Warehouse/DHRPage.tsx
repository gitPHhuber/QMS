import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Layers, Clock, Package, FileText, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { fetchDHR, fetchDHRTraceBack } from "src/api/warehouseApi";
import { WAREHOUSE_ROUTE } from "src/utils/consts";

const STATUS_COLORS: Record<string, string> = {
  IN_PRODUCTION: "bg-asvo-blue-dim text-asvo-blue",
  QC_PASSED: "bg-asvo-green-dim text-asvo-green",
  QC_FAILED: "bg-asvo-red-dim text-asvo-red",
  RELEASED: "bg-asvo-purple-dim text-asvo-purple",
  SHIPPED: "bg-asvo-accent-dim text-asvo-accent",
  RETURNED: "bg-asvo-amber-dim text-asvo-amber",
};

export const DHRPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [searchMode, setSearchMode] = useState<"serial" | "batch">("serial");
  const [dhrData, setDhrData] = useState<any | null>(null);
  const [traceData, setTraceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    setDhrData(null);
    setTraceData(null);

    try {
      if (searchMode === "serial") {
        const data = await fetchDHR(searchValue.trim());
        setDhrData(data);
      } else {
        const data = await fetchDHRTraceBack(searchValue.trim());
        setTraceData(data);
      }
    } catch {
      toast.error("Не найдено");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-asvo-bg p-6 pb-20 font-sans text-asvo-text">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(WAREHOUSE_ROUTE)} className="p-2 bg-asvo-surface border border-asvo-border rounded-lg hover:border-asvo-accent transition">
            <ArrowLeft size={20} className="text-asvo-text-mid" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-asvo-text">Device History Record (DHR)</h1>
            <p className="text-asvo-accent/80 text-sm">ISO 13485 §7.5.9 — Прослеживаемость</p>
          </div>
        </div>

        <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border mb-6">
          <div className="flex gap-3">
            <div className="flex bg-asvo-bg rounded-lg border border-asvo-border overflow-hidden">
              <button onClick={() => setSearchMode("serial")} className={`px-4 py-2 text-sm font-bold transition ${searchMode === "serial" ? "bg-asvo-accent text-white" : "text-asvo-text-mid hover:text-asvo-accent"}`}>По серийному номеру</button>
              <button onClick={() => setSearchMode("batch")} className={`px-4 py-2 text-sm font-bold transition ${searchMode === "batch" ? "bg-asvo-accent text-white" : "text-asvo-text-mid hover:text-asvo-accent"}`}>По партии (обратная)</button>
            </div>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-asvo-text-dim" />
              <input value={searchValue} onChange={e => setSearchValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={searchMode === "serial" ? "Введите серийный номер..." : "Введите номер партии..."}
                className="w-full pl-10 pr-4 py-2 bg-asvo-bg border border-asvo-border rounded-lg text-asvo-text text-sm focus:ring-2 focus:ring-asvo-accent outline-none" />
            </div>
            <button onClick={handleSearch} disabled={loading} className="px-6 py-2 bg-asvo-accent text-white rounded-lg text-sm font-bold hover:bg-asvo-accent/80 transition disabled:opacity-50">
              {loading ? "Поиск..." : "Найти"}
            </button>
          </div>
        </div>

        {dhrData && dhrData.dhr && (
          <div className="space-y-6">
            <div className="bg-asvo-surface p-6 rounded-xl border border-asvo-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-asvo-text">{dhrData.dhr.serialNumber}</h2>
                  <p className="text-asvo-text-mid text-sm">Партия: {dhrData.dhr.batchNumber || "—"}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${STATUS_COLORS[dhrData.dhr.status] || "bg-asvo-surface-2 text-asvo-text-mid"}`}>{dhrData.dhr.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-asvo-text-dim">Дата производства:</span> <span className="font-bold text-asvo-text ml-1">{dhrData.dhr.manufacturingDate || "—"}</span></div>
                <div><span className="text-asvo-text-dim">Дата выпуска:</span> <span className="font-bold text-asvo-text ml-1">{dhrData.dhr.releaseDate || "—"}</span></div>
                <div><span className="text-asvo-text-dim">ID продукта:</span> <span className="font-bold text-asvo-text ml-1">{dhrData.dhr.productId || "—"}</span></div>
              </div>
            </div>

            {dhrData.dhr.components?.length > 0 && (
              <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border">
                <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2"><Layers size={16} className="text-asvo-accent" /> Комплектующие ({dhrData.dhr.components.length})</h3>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-asvo-border">
                    <th className="text-left py-2 px-3 text-asvo-text-mid">Компонент</th>
                    <th className="text-center py-2 px-3 text-asvo-text-mid">Кол-во</th>
                    <th className="text-left py-2 px-3 text-asvo-text-mid">Партия поставщика</th>
                    <th className="text-left py-2 px-3 text-asvo-text-mid">Сертификат</th>
                    <th className="text-left py-2 px-3 text-asvo-text-mid">Коробка</th>
                  </tr></thead>
                  <tbody>
                    {dhrData.dhr.components.map((c: any) => (
                      <tr key={c.id} className="border-b border-asvo-border/50">
                        <td className="py-2 px-3 text-asvo-text font-medium">{c.componentName}</td>
                        <td className="py-2 px-3 text-center text-asvo-text">{c.quantity}</td>
                        <td className="py-2 px-3 text-asvo-text-mid">{c.supplierLot || "—"}</td>
                        <td className="py-2 px-3 text-asvo-text-mid">{c.certificateRef || "—"}</td>
                        <td className="py-2 px-3 text-asvo-accent font-mono">{c.boxId ? `#${c.boxId}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {dhrData.dhr.records?.length > 0 && (
              <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border">
                <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2"><Clock size={16} className="text-asvo-accent" /> Хронология ({dhrData.dhr.records.length})</h3>
                <div className="space-y-2">
                  {dhrData.dhr.records.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 bg-asvo-bg rounded-lg">
                      <div className="w-2 h-2 bg-asvo-accent rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-asvo-text">{r.recordType}</span>
                          <span className="text-xs text-asvo-text-dim">{new Date(r.recordedAt).toLocaleString("ru-RU")}</span>
                        </div>
                        {r.description && <p className="text-sm text-asvo-text-mid mt-0.5">{r.description}</p>}
                        {r.recordedBy && <span className="text-xs text-asvo-text-dim">{r.recordedBy.name} {r.recordedBy.surname}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dhrData.movements?.length > 0 && (
              <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border">
                <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2"><Package size={16} className="text-asvo-accent" /> Перемещения комплектующих ({dhrData.movements.length})</h3>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {dhrData.movements.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 py-1 text-sm text-asvo-text-mid">
                      <span className="font-mono text-xs text-asvo-accent">#{m.boxId}</span>
                      <span>{m.operation}</span>
                      <span className="text-asvo-text-dim">{new Date(m.performedAt).toLocaleString("ru-RU")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {traceData && (
          <div className="space-y-4">
            <div className="bg-asvo-surface p-4 rounded-xl border border-asvo-border">
              <h3 className="font-bold text-asvo-text mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-asvo-amber" />
                Обратная прослеживаемость: партия "{traceData.batchNumber}"
              </h3>
              <p className="text-sm text-asvo-text-mid">Затронуто устройств: <span className="font-bold text-asvo-text">{traceData.totalDevices}</span></p>
            </div>

            {traceData.affectedDevices?.map((d: any) => (
              <div key={d.id} className="bg-asvo-surface p-4 rounded-xl border border-asvo-border">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-asvo-text">{d.serialNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[d.status] || ""}`}>{d.status}</span>
                </div>
                <span className="text-sm text-asvo-text-mid">Партия: {d.batchNumber || "—"}</span>
              </div>
            ))}

            {traceData.affectedDevices?.length === 0 && (
              <div className="text-center py-8 text-asvo-text-dim">Устройства с данной партией комплектующих не найдены</div>
            )}
          </div>
        )}

        {!dhrData && !traceData && !loading && (
          <div className="text-center py-16 text-asvo-text-dim">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Введите серийный номер или номер партии для поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};
