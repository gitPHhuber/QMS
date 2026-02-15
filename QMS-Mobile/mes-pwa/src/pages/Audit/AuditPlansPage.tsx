

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, AUDIT_TYPE_LABELS } from '../../config'
import type { InternalAuditPlan, AuditSchedule } from '../../types'

export const AuditPlansPage = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<InternalAuditPlan[]>([])
  const [schedules, setSchedules] = useState<AuditSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('plans')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (activeTab === 'plans') {
      loadPlans()
    } else {
      loadSchedules()
    }
  }, [debouncedSearch, activeTab])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      const { data } = await api.get('/internal-audit/plans', { params })
      setPlans(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки планов'))
    } finally {
      setLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      const { data } = await api.get('/internal-audit/schedules', { params })
      setSchedules(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки расписания'))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'plans', label: 'Планы аудитов', icon: <ClipboardCheck size={16} /> },
    { key: 'schedules', label: 'Расписание', icon: <Calendar size={16} /> },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Внутренний аудит</h1>
          <p className="text-slate-400 text-sm">Планы и расписание аудитов</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'plans' ? (
            <Button icon={<Plus size={18} />} onClick={() => navigate('/audit/plans/new')}>
              Новый план
            </Button>
          ) : (
            <Button icon={<Plus size={18} />} onClick={() => navigate('/audit/schedules/new')}>
              Новый аудит
            </Button>
          )}
        </div>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск..."
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
            <Button variant="ghost" size="sm" onClick={() => activeTab === 'plans' ? loadPlans() : loadSchedules()}>
              Повторить
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка..." />
        </div>
      ) : activeTab === 'plans' ? (
        plans.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={48} />}
            title="Планы не найдены"
            description={search ? 'Попробуйте изменить запрос' : 'Планы аудитов ещё не созданы'}
            action={
              <Button icon={<Plus size={18} />} onClick={() => navigate('/audit/plans/new')}>
                Создать план
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <Card key={plan.id} hover className="p-4" onClick={() => navigate(`/audit/plans/${plan.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <ClipboardCheck size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">План аудита {plan.year}</p>
                      {plan.scope && (
                        <p className="text-sm text-slate-400 truncate">{plan.scope}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={STATUS_COLORS[plan.status] || 'neutral'}>
                      {STATUS_LABELS[plan.status] || plan.status}
                    </Badge>
                    <ChevronRight size={18} className="text-slate-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        schedules.length === 0 ? (
          <EmptyState
            icon={<Calendar size={48} />}
            title="Аудиты не найдены"
            description={search ? 'Попробуйте изменить запрос' : 'Расписание аудитов пусто'}
            action={
              <Button icon={<Plus size={18} />} onClick={() => navigate('/audit/schedules/new')}>
                Запланировать аудит
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <Card key={schedule.id} hover className="p-4" onClick={() => navigate(`/audit/schedules/${schedule.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                      <Calendar size={24} className="text-warning" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{schedule.area || 'Аудит'}</p>
                        <Badge variant={STATUS_COLORS[schedule.auditType] || 'primary'} size="sm">
                          {AUDIT_TYPE_LABELS[schedule.auditType] || schedule.auditType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>
                          {new Date(schedule.scheduledDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {schedule.department && (
                          <>
                            <span>•</span>
                            <span className="truncate">{schedule.department}</span>
                          </>
                        )}
                        {typeof schedule.findingsCount === 'number' && schedule.findingsCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-warning">
                              {schedule.findingsCount} замечаний
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={STATUS_COLORS[schedule.status] || 'neutral'}>
                      {STATUS_LABELS[schedule.status] || schedule.status}
                    </Badge>
                    <ChevronRight size={18} className="text-slate-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default AuditPlansPage
