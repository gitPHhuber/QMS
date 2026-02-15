

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  AlertTriangle,
  MessageSquareWarning,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { Complaint, PaginatedResponse } from '../../types'

const SEVERITY_VARIANTS: Record<string, 'danger' | 'warning' | 'neutral' | 'primary'> = {
  CRITICAL: 'danger',
  MAJOR: 'warning',
  MINOR: 'neutral',
  INFORMATIONAL: 'primary',
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критическая',
  MAJOR: 'Значительная',
  MINOR: 'Незначительная',
  INFORMATIONAL: 'Информационная',
}

const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: 'Безопасность',
  PERFORMANCE: 'Производительность',
  LABELING: 'Маркировка',
  PACKAGING: 'Упаковка',
  DOCUMENTATION: 'Документация',
  DELIVERY: 'Доставка',
  SERVICE: 'Сервис',
  OTHER: 'Прочее',
}

export const ComplaintsListPage = () => {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadComplaints()
  }, [debouncedSearch, activeTab])

  const loadComplaints = async (isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true)
      else setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'received') params.status = 'RECEIVED'
      if (activeTab === 'investigating') params.status = 'INVESTIGATING'
      if (activeTab === 'resolved') params.status = 'RESOLVED'
      if (activeTab === 'closed') params.status = 'CLOSED'

      const { data } = await api.get<PaginatedResponse<Complaint> | Complaint[]>('/complaints', { params })
      setComplaints(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки рекламаций'))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'received', label: 'Получено' },
    { key: 'investigating', label: 'Расследование' },
    { key: 'resolved', label: 'Решено' },
    { key: 'closed', label: 'Закрыто' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Рекламации</h1>
          <p className="text-slate-400 text-sm">Управление рекламациями и жалобами</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw size={18} />}
            onClick={() => loadComplaints(true)}
          >
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => navigate('/complaints/new')}>
            Новая рекламация
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск по номеру, названию..."
          icon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => loadComplaints()}>Повторить</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка рекламаций..." />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning size={48} />}
          title="Рекламации не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'Список рекламаций пуст'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>Сбросить поиск</Button>
            ) : (
              <Button icon={<Plus size={18} />} onClick={() => navigate('/complaints/new')}>
                Новая рекламация
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              hover
              className="p-4"
              onClick={() => navigate(`/complaints/${complaint.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                  <MessageSquareWarning size={20} className="text-warning" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{complaint.complaintNumber}</span>
                    <Badge
                      variant={SEVERITY_VARIANTS[complaint.severity] || 'neutral'}
                      size="sm"
                    >
                      {SEVERITY_LABELS[complaint.severity] || complaint.severity}
                    </Badge>
                  </div>
                  <p className="font-medium truncate">{complaint.title}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    {complaint.category && (
                      <span className="truncate">{CATEGORY_LABELS[complaint.category] || complaint.category}</span>
                    )}
                    {complaint.receivedDate && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(complaint.receivedDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[complaint.status] || 'neutral'}>
                    {STATUS_LABELS[complaint.status] || complaint.status}
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

export default ComplaintsListPage
