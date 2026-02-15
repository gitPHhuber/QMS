import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronRight,
  Settings,
  AlertTriangle,
  Wrench,
  Activity,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '../../config'
import type { Equipment } from '../../types'

export const EquipmentListPage = () => {
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadEquipment()
  }, [debouncedSearch, activeTab])

  const loadEquipment = async () => {
    try {
      setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'active') params.status = 'ACTIVE'
      if (activeTab === 'maintenance') params.status = 'MAINTENANCE'

      const { data } = await api.get('/equipment', { params })
      let items: Equipment[] = Array.isArray(data) ? data : data.rows || []

      if (activeTab === 'calibration') {
        const today = new Date().toISOString().split('T')[0]
        items = items.filter(
          (eq) => eq.nextCalibrationDate && eq.nextCalibrationDate < today
        )
      }

      setEquipment(items)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (date?: string) => {
    if (!date) return false
    return date < new Date().toISOString().split('T')[0]
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'active', label: 'Активное', icon: <Activity size={16} /> },
    { key: 'maintenance', label: 'На обслуживании', icon: <Wrench size={16} /> },
    { key: 'calibration', label: 'Требует калибровки', icon: <AlertTriangle size={16} /> },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Оборудование</h1>
          <p className="text-slate-400 text-sm">Управление оборудованием и калибровкой</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/equipment/new')}>
          Новое оборудование
        </Button>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск оборудования..."
          icon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка оборудования..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadEquipment}>Повторить</Button>
        </Card>
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={<Settings size={48} />}
          title="Оборудование не найдено"
          description={search ? 'Попробуйте изменить запрос' : 'Нет зарегистрированного оборудования'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/equipment/new')}>
              Новое оборудование
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {equipment.map((eq) => (
            <Card key={eq.id} hover className="p-4" onClick={() => navigate(`/equipment/${eq.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Settings size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{eq.code}</span>
                    <Badge variant="primary" size="sm">
                      {EQUIPMENT_TYPE_LABELS[eq.type] || eq.type}
                    </Badge>
                  </div>
                  <p className="font-medium truncate">{eq.name}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    {eq.location && <span className="truncate">{eq.location}</span>}
                    {eq.nextCalibrationDate && (
                      <>
                        {eq.location && <span>•</span>}
                        <span className={isOverdue(eq.nextCalibrationDate) ? 'text-danger font-medium' : ''}>
                          Калибровка: {new Date(eq.nextCalibrationDate).toLocaleDateString('ru-RU')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[eq.status] || 'neutral'}>
                    {STATUS_LABELS[eq.status] || eq.status}
                  </Badge>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EquipmentListPage
