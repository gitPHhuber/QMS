


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Filter,
  ClipboardList,
  ChevronRight,
  Shield,
  Wrench,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../../config'
import type { Capa } from '../../types'

const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  CRITICAL: 'danger',
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'neutral',
}

export const CapaListPage = () => {
  const navigate = useNavigate()

  const [capaList, setCapaList] = useState<Capa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadCapaList()
  }, [debouncedSearch, activeTab])

  const loadCapaList = async () => {
    try {
      setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'corrective') params.type = 'CORRECTIVE'
      if (activeTab === 'preventive') params.type = 'PREVENTIVE'

      const { data } = await api.get('/nc/capa', { params })
      setCapaList(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'CORRECTIVE'
      ? <Wrench size={16} className="text-primary" />
      : <Shield size={16} className="text-warning" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EFFECTIVE':
      case 'CLOSED':
        return <CheckCircle2 size={16} className="text-success" />
      case 'INEFFECTIVE':
        return <Clock size={16} className="text-danger" />
      default:
        return <Clock size={16} className="text-primary" />
    }
  }

  const tabs = [
    { key: 'all', label: 'Все', icon: <ClipboardList size={16} /> },
    { key: 'corrective', label: 'Корректирующие', icon: <Wrench size={16} /> },
    { key: 'preventive', label: 'Предупреждающие', icon: <Shield size={16} /> },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CAPA</h1>
          <p className="text-slate-400 text-sm">Корректирующие и предупреждающие действия</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/capa/new')}>
          Создать CAPA
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Поиск CAPA..."
              icon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" icon={<Filter size={18} />}>
            <span className="hidden sm:inline">Фильтры</span>
          </Button>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка CAPA..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadCapaList}>Повторить</Button>
        </Card>
      ) : capaList.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="CAPA не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Нет зарегистрированных CAPA'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/capa/new')}>
              Создать CAPA
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {capaList.map((capa) => (
            <Card key={capa.id} hover className="p-4" onClick={() => navigate(`/capa/${capa.id}`)}>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {getStatusIcon(capa.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{capa.number}</span>
                    <Badge
                      variant={capa.type === 'CORRECTIVE' ? 'primary' : 'warning'}
                      size="sm"
                    >
                      {capa.type === 'CORRECTIVE' ? 'Корр.' : 'Пред.'}
                    </Badge>
                    {capa.priority && (
                      <Badge
                        variant={PRIORITY_COLORS[capa.priority] || 'neutral'}
                        size="sm"
                      >
                        {PRIORITY_LABELS[capa.priority] || capa.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium truncate">{capa.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    {capa.assignedTo && (
                      <span className="truncate">{capa.assignedTo.surname} {capa.assignedTo.name}</span>
                    )}
                    {capa.dueDate && (
                      <>
                        {capa.assignedTo && <span>•</span>}
                        <span className={new Date(capa.dueDate) < new Date() && capa.status !== 'CLOSED' && capa.status !== 'EFFECTIVE' ? 'text-danger' : ''}>
                          {new Date(capa.dueDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[capa.status] || 'neutral'}>
                    {STATUS_LABELS[capa.status] || capa.status}
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

export default CapaListPage
