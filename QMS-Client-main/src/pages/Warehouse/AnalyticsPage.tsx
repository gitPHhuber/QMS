import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardStats } from "src/api/warehouseApi";
import { DashboardStats, DailyOperationSummary } from "src/types/WarehouseModels";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, Activity, ArrowLeft } from "lucide-react";
import { WAREHOUSE_ROUTE } from "src/utils/consts";

interface FormattedChartPoint {
    name: string;
    count: number;
}

export const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 text-center text-asvo-text-mid">Загрузка аналитики...</div>;

    const totalItems = data?.stock?.totalItems ?? 0;
    const totalBoxes = data?.stock?.totalBoxes ?? 0;
    const scrapOp = data?.today?.find((x: DailyOperationSummary) => x.operation === 'QUALITY' || x.operation === 'SCRAP');
    const scrapToday = scrapOp ? Number(scrapOp.sumScrap) : 0;
    const chartData: FormattedChartPoint[] = data?.chart?.map(item => ({
        name: new Date(item.date).toLocaleDateString('ru-RU', {weekday: 'short'}),
        count: Number(item.count)
    })) ?? [];

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in bg-asvo-surface-2 min-h-screen">
            <button
                onClick={() => navigate(WAREHOUSE_ROUTE)}
                className="mb-4 flex items-center text-asvo-text-mid hover:text-asvo-accent transition font-medium text-sm"
            >
                <ArrowLeft size={18} className="mr-1"/> Вернуться на склад
            </button>

            <h1 className="text-3xl font-bold text-asvo-text mb-8">Аналитическая панель</h1>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

                <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-asvo-text-mid text-sm font-medium">Всего на складе</p>
                            <h3 className="text-3xl font-bold text-asvo-accent mt-2">{Number(totalItems).toLocaleString()}</h3>
                            <p className="text-xs text-asvo-text-dim mt-1">единиц хранения</p>
                        </div>
                        <div className="p-3 bg-asvo-accent-dim rounded-xl text-asvo-accent"><Package /></div>
                    </div>
                </div>

                <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-asvo-text-mid text-sm font-medium">Мест хранения</p>
                            <h3 className="text-3xl font-bold text-asvo-text mt-2">{totalBoxes}</h3>
                            <p className="text-xs text-asvo-text-dim mt-1">активных коробок</p>
                        </div>
                        <div className="p-3 bg-asvo-surface-2 rounded-xl text-asvo-text-mid"><Activity /></div>
                    </div>
                </div>

                <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-asvo-text-mid text-sm font-medium">Брак за сегодня</p>
                            <h3 className="text-3xl font-bold text-asvo-red mt-2">{scrapToday}</h3>
                            <p className="text-xs text-asvo-text-dim mt-1">выявлено на ОТК</p>
                        </div>
                        <div className="p-3 bg-asvo-red-dim rounded-xl text-asvo-red"><AlertTriangle /></div>
                    </div>
                </div>

                <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-asvo-text-mid text-sm font-medium">Эффективность</p>
                            <h3 className="text-3xl font-bold text-asvo-text-dim mt-2">—</h3>
                            <p className="text-xs text-asvo-text-dim mt-1">Ожидает подключения API</p>
                        </div>
                        <div className="p-3 bg-asvo-surface-2 rounded-xl text-asvo-text-dim"><Activity /></div>
                    </div>
                </div>
            </div>

            <div className="bg-asvo-surface p-6 rounded-2xl shadow-sm border border-asvo-border">
                <h3 className="text-lg font-bold text-asvo-text mb-6">Динамика операций (7 дней)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A2D42" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8899AB'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#8899AB'}} />
                            <Tooltip cursor={{fill: '#162231'}} contentStyle={{borderRadius: '8px', border: '1px solid #1A2D42', backgroundColor: '#0D1520', color: '#E8EDF3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'}} />
                            <Bar dataKey="count" fill="#2DD4A8" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
