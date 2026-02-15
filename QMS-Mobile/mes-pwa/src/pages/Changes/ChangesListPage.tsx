

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  GitPullRequest,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, CHANGE_TYPE_LABELS } from '../../config'
import type { ChangeRequest } from '../../types'

const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'neutral',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

const CATEGORY_COLORS: Record<string, 'warning' | 'neutral'> = {
  MAJOR: 'warning',
  MINOR: 'neutral',
}

const CATEGORY_LABELS: Record<string, string> = {
  MAJOR: 'Значительное',
  MINOR: 'Незначительное',
}

export const ChangesListPage = () => {
  const navigate = useNavigate()
  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadChanges()
  }, [debouncedSearch, activeTab])

  const loadChanges = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch

      if (activeTab === 'draft') params.status = 'DRAFT'
      else if (activeTab === 'submitted') params.status = 'SUBMITTED'
      else if (activeTab === 'approved') params.status = 'APPROVED'
      else if (activeTab === 'in_progress') params.status = 'IN_PROGRESS'
      else if (activeTab === 'completed') params.status = 'COMPLETED'

      const { data } = await api.get('/change', { params })
      setChanges(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки изменений'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'draft', label: 'Черновик' },
    { key: 'submitted', label: 'На рассмотрении' },
    { key: 'approved', label: 'Утверждённые' },
    { key: 'in_progress', label: 'В работе' },
    { key: 'completed', label: 'Завершённые' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Управление изменениями</h1>
          <p className="text-slate-400 text-sm">Запросы на изменение (ECR)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => loadChanges(true)}
            disabled={refreshing}
          >
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => navigate('/changes/new')}>
            Новый ECR
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
            <Button variant="ghost" size="sm" onClick={() => loadChanges()}>Повторить</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка изменений..." />
        </div>
      ) : changes.length === 0 ? (
        <EmptyState
          icon={<GitPullRequest size={48} />}
          title="Запросы не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'Нет запросов на изменение в данной категории'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>Сбросить поиск</Button>
            ) : (
              <Button icon={<Plus size={18} />} onClick={() => navigate('/changes/new')}>
                Создать запрос
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {changes.map((change) => (
            <Card key={change.id} hover className="p-4" onClick={() => navigate(`/changes/${change.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                  <GitPullRequest size={20} className="text-warning" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{change.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                    <span className="font-mono">{change.changeNumber}</span>
                    <span>·</span>
                    <Badge variant="neutral" size="sm">
                      {CHANGE_TYPE_LABELS[change.type] || change.type}
                    </Badge>
                    <Badge variant={PRIORITY_COLORS[change.priority] || 'neutral'} size="sm">
                      {PRIORITY_LABELS[change.priority] || change.priority}
                    </Badge>
                    <Badge variant={CATEGORY_COLORS[change.category] || 'neutral'} size="sm">
                      {CATEGORY_LABELS[change.category] || change.category}
                    </Badge>
                  </div>
                  {change.initiator && (
                    <p className="text-xs text-slate-500 mt-1">
                      {change.initiator.surname} {change.initiator.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[change.status] || 'neutral'}>
                    {STATUS_LABELS[change.status] || change.status}
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

export default ChangesListPage
