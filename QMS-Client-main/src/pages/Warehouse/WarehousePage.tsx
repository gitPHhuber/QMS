import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, ArrowRightLeft, FileText, Truck, PieChart,
  BarChart3, ClipboardCheck, Settings, Tag, Tv, History
} from "lucide-react";

import { fetchStructure } from "src/api/structureApi";
import { fetchAlerts } from "src/api/warehouseApi";
import { SectionModel } from "src/store/StructureStore";
import { productModel } from "src/types/ProductModel";
import { componentModel } from "src/types/ComponentModel";
import { WAREHOUSE_ANALYTICS_ROUTE, WAREHOUSE_INVENTORY_ROUTE } from "src/utils/consts";

import { ProjectDashboard } from "./components/ProjectDashboard";
import { WarehouseIntake } from "./tabs/WarehouseIntake";
import { WarehouseMoves } from "./tabs/WarehouseMoves";
import { WarehouseDocs } from "./tabs/WarehouseDocs";
import { WarehouseBalance } from "./tabs/WarehouseBalance";
import { WarehouseSettings } from "./tabs/WarehouseSettings";
import { WarehouseLabels } from "./tabs/WarehouseLabels";
import { VideoTransmittersLabel } from "./tabs/VideoTransmittersLabel";
import { WarehousePrintHistory } from "./tabs/WarehousePrintHistory";

type Tab = "INTAKE" | "MOVES" | "BALANCE" | "DOCS" | "SETTINGS" | "LABELS" | "VIDEO_LABEL" | "HISTORY";

export const WarehousePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("INTAKE");
  const [alertsCount, setAlertsCount] = useState(0);

  const [sections, setSections] = useState<SectionModel[]>([]);
  const [productsList, setProductsList] = useState<productModel[]>([]);
  const [componentsList, setComponentsList] = useState<componentModel[]>([]);

  useEffect(() => {
    fetchStructure().then(setSections);

    fetchAlerts().then(alerts => setAlertsCount(alerts.length)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen p-6 pb-20 font-sans text-asvo-text">


      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-asvo-accent-dim rounded-2xl relative">
                  <Package className="w-8 h-8 text-asvo-accent" />

                  {alertsCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-asvo-red rounded-full border-2 border-asvo-bg animate-pulse"></span>}
               </div>
               <div>
                  <h1 className="text-3xl font-bold text-asvo-text">Складская система</h1>
                  <p className="text-asvo-accent/80 font-medium">WMS ASVO-QMS v2.4</p>
               </div>
            </div>


            <div className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto">
                <ProjectDashboard />

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(WAREHOUSE_ANALYTICS_ROUTE)}
                        className="flex flex-col items-center justify-center w-24 h-20 bg-asvo-surface-2 border border-asvo-border rounded-xl shadow-sm hover:shadow-md hover:border-asvo-accent/40 transition group"
                    >
                        <div className="p-2 bg-asvo-accent-dim rounded-full group-hover:bg-asvo-accent/20 text-asvo-accent mb-1"><BarChart3 size={20}/></div>
                        <span className="text-[10px] font-bold text-asvo-text-mid uppercase">Аналитика</span>
                    </button>

                    <button
                        onClick={() => navigate(WAREHOUSE_INVENTORY_ROUTE)}
                        className="flex flex-col items-center justify-center w-24 h-20 bg-asvo-surface-2 border border-asvo-border rounded-xl shadow-sm hover:shadow-md hover:border-asvo-amber/40 transition group"
                    >
                        <div className="p-2 bg-asvo-amber-dim rounded-full group-hover:bg-asvo-amber/20 text-asvo-amber mb-1"><ClipboardCheck size={20}/></div>
                        <span className="text-[10px] font-bold text-asvo-text-mid uppercase">Ревизия</span>
                    </button>
                </div>
            </div>
        </div>


        <div className="flex gap-2 border-b border-asvo-border pb-1 overflow-x-auto">
           {[
               { id: "INTAKE", label: "Приёмка", icon: <Truck size={18}/> },
               { id: "MOVES", label: "Операции", icon: <ArrowRightLeft size={18}/> },
               { id: "BALANCE", label: "Остатки", icon: <PieChart size={18}/> },
               { id: "DOCS", label: "Накладные", icon: <FileText size={18}/> },
               { id: "LABELS", label: "Этикетки / Реестр", icon: <Tag size={18}/> },
               { id: "VIDEO_LABEL", label: "Печать Видео", icon: <Tv size={18}/> },

               { id: "HISTORY", label: "История печати", icon: <History size={18}/> },

               { id: "SETTINGS", label: "Настройки / Лимиты", icon:
                 <div className="relative flex items-center gap-1">
                    <Settings size={18}/>
                    {alertsCount > 0 && <span className="bg-asvo-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">{alertsCount}</span>}
                 </div>
               },
           ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-bold text-sm transition-all relative top-[1px] whitespace-nowrap ${
                      activeTab === tab.id
                      ? "bg-asvo-surface-2 text-asvo-accent border border-asvo-border border-b-asvo-surface-2 shadow-sm z-10"
                      : "text-asvo-text-dim hover:text-asvo-accent hover:bg-asvo-surface-2/50"
                  }`}
               >
                   {tab.icon} {tab.label}
               </button>
           ))}
        </div>
      </div>


      <div className="max-w-7xl mx-auto">
        {activeTab === "INTAKE" && <WarehouseIntake sections={sections} productsList={productsList} componentsList={componentsList} />}
        {activeTab === "MOVES" && <WarehouseMoves sections={sections} />}
        {activeTab === "BALANCE" && <WarehouseBalance />}
        {activeTab === "DOCS" && <WarehouseDocs />}
        {activeTab === "LABELS" && <WarehouseLabels />}
        {activeTab === "VIDEO_LABEL" && <VideoTransmittersLabel />}
        {activeTab === "HISTORY" && <WarehousePrintHistory />}
        {activeTab === "SETTINGS" && <WarehouseSettings />}
      </div>
    </div>
  );
};
