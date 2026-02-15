


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ChevronRight,
  AlertOctagon,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, NC_SOURCE_LABELS } from '../../config'
import type { Nonconformity } from '../../types'

export const NcListPage = () => {
  const navigate = useNavigate()

  const [ncList, setNcList] = useState<Nonconformity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('open')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadNcList()
  }, [debouncedSearch, activeTab])

  const loadNcList = async () => {
    try {
      setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'open') params.status = 'OPEN,REOPENED'
      if (activeTab === 'in_progress') params.status = 'INVESTIGATING,DISPOSITION,IMPLEMENTING,VERIFICATION'
      if (activeTab === 'closed') params.status = 'CLOSED'

      const { data } = await api.get('/nc', { params })
      setNcList(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getClassificationBadge = (classification: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'neutral'> = {
      CRITICAL: 'danger',
      MAJOR: 'warning',
      MINOR: 'neutral',
    }
    const labels: Record<string, string> = {
      CRITICAL: 'Критическое',
      MAJOR: 'Значительное',
      MINOR: 'Незначительное',
    }
    return (
      <Badge variant={variants[classification] || 'neutral'} size="sm">
        {labels[classification] || classification}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'REOPENED':
        return <AlertOctagon size={16} className="text-danger" />
      case 'INVESTIGATING':
      case 'DISPOSITION':
        return <Clock size={16} className="text-warning" />
      case 'IMPLEMENTING':
      case 'VERIFICATION':
        return <Clock size={16} className="text-primary" />
      case 'CLOSED':
        return <CheckCircle2 size={16} className="text-success" />
      default:
        return <Clock size={16} className="text-slate-500" />
    }
  }

  const tabs = [
    { key: 'open', label: 'Открытые', icon: <AlertOctagon size={16} /> },
    { key: 'in_progress', label: 'В работе' },
    { key: 'closed', label: 'Закрытые' },
    { key: 'all', label: 'Все' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Несоответствия</h1>
          <p className="text-slate-400 text-sm">Управление несоответствиями (NC)</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/nc/new')}>
          Создать NC
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Поиск несоответствий..."
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
          <Loader text="Загрузка несоответствий..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadNcList}>Повторить</Button>
        </Card>
      ) : ncList.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Несоответствия не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Нет зарегистрированных несоответствий'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/nc/new')}>
              Создать NC
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {ncList.map((nc) => (
            <Card key={nc.id} hover className="p-4" onClick={() => navigate(`/nc/${nc.id}`)}>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {getStatusIcon(nc.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{nc.number}</span>
                    {getClassificationBadge(nc.classification)}
                  </div>
                  <p className="font-medium truncate">{nc.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="truncate">{NC_SOURCE_LABELS[nc.source] || nc.source}</span>
                    {nc.assignedTo && (
                      <>
                        <span>•</span>
                        <span className="truncate">{nc.assignedTo.surname} {nc.assignedTo.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(nc.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[nc.status] || 'neutral'}>
                    {STATUS_LABELS[nc.status] || nc.status}
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

export default NcListPage
