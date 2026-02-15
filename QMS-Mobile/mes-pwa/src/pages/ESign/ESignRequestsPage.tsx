

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  PenTool,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Users,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { SignatureRequest } from '../../types'

export const ESignRequestsPage = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<SignatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('incoming')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadRequests()
  }, [debouncedSearch, activeTab])

  const loadRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch

      if (activeTab === 'incoming') params.direction = 'incoming'
      else if (activeTab === 'outgoing') params.direction = 'outgoing'

      const { data } = await api.get('/esign/requests', { params })
      setRequests(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки запросов'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getEntityLabel = (entityType: string): string => {
    const labels: Record<string, string> = {
      DOCUMENT: 'Документ',
      CHANGE_REQUEST: 'Запрос на изменение',
      CAPA: 'CAPA',
      NC: 'Несоответствие',
      AUDIT: 'Аудит',
    }
    return labels[entityType] || entityType
  }

  const tabs = [
    { key: 'incoming', label: 'Входящие' },
    { key: 'outgoing', label: 'Исходящие' },
    { key: 'all', label: 'Все' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Электронные подписи</h1>
          <p className="text-slate-400 text-sm">Запросы на подписание</p>
        </div>
        <Button
          variant="ghost"
          icon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
          onClick={() => loadRequests(true)}
          disabled={refreshing}
        >
          <span className="hidden sm:inline">Обновить</span>
        </Button>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск запросов..."
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
            <Button variant="ghost" size="sm" onClick={() => loadRequests()}>Повторить</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка запросов..." />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<PenTool size={48} />}
          title="Запросы не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'Нет запросов на подписание'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>Сбросить поиск</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} hover className="p-4" onClick={() => navigate(`/esign/${req.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <PenTool size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">
                      {getEntityLabel(req.entityType)} #{req.entityId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                    {req.requestedBy && (
                      <span className="truncate">
                        {req.requestedBy.surname} {req.requestedBy.name}
                      </span>
                    )}
                    {req.dueDate && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(req.dueDate).toLocaleDateString('ru-RU')}
                        </span>
                      </>
                    )}
                    {req.signers && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {req.signers.length} подписант(ов)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[req.status] || 'neutral'}>
                    {STATUS_LABELS[req.status] || req.status}
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

export default ESignRequestsPage
