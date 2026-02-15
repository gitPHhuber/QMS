import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, TRAINING_TYPE_LABELS } from '../../config'
import type { TrainingRecord, TrainingPlan, CompetencyMatrix } from '../../types'

export const TrainingListPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [competencies, setCompetencies] = useState<CompetencyMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('records')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadData()
  }, [debouncedSearch, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch

      if (activeTab === 'records') {
        const { data } = await api.get('/training/records', { params })
        setRecords(Array.isArray(data) ? data : data.rows || [])
      } else if (activeTab === 'plans') {
        const { data } = await api.get('/training/plans', { params })
        setPlans(Array.isArray(data) ? data : data.rows || [])
      } else if (activeTab === 'competency') {
        const { data } = await api.get('/training/competency', { params })
        setCompetencies(Array.isArray(data) ? data : data.rows || [])
      }

      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'records', label: 'Записи', icon: <BookOpen size={16} /> },
    { key: 'plans', label: 'Планы', icon: <Calendar size={16} /> },
    { key: 'competency', label: 'Компетенции', icon: <Users size={16} /> },
  ]

  const renderRecords = () => {
    if (records.length === 0) {
      return (
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="Записи не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Нет записей обучения'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/training/new')}>
              Новая запись
            </Button>
          }
        />
      )
    }
    return (
      <div className="space-y-2">
        {records.map((record) => (
          <Card key={record.id} hover className="p-4" onClick={() => navigate(`/training/${record.id}`)}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" size="sm">
                    {TRAINING_TYPE_LABELS[record.type] || record.type}
                  </Badge>
                </div>
                <p className="font-medium truncate">{record.title}</p>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  {record.user && (
                    <span className="truncate">{record.user.surname} {record.user.name}</span>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(record.trainingDate).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={STATUS_COLORS[record.status] || 'neutral'}>
                  {STATUS_LABELS[record.status] || record.status}
                </Badge>
                <ChevronRight size={18} className="text-slate-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderPlans = () => {
    if (plans.length === 0) {
      return (
        <EmptyState
          icon={<Calendar size={48} />}
          title="Планы не найдены"
          description="Нет планов обучения"
        />
      )
    }
    return (
      <div className="space-y-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-warning" />
                </div>
                <div>
                  <p className="font-semibold">План обучения {plan.year}</p>
                  {plan.items && (
                    <p className="text-sm text-slate-400">{plan.items.length} мероприятий</p>
                  )}
                </div>
              </div>
              <Badge variant={STATUS_COLORS[plan.status] || 'neutral'}>
                {STATUS_LABELS[plan.status] || plan.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderCompetencies = () => {
    if (competencies.length === 0) {
      return (
        <EmptyState
          icon={<Users size={48} />}
          title="Записи компетенций не найдены"
          description="Нет данных о компетенциях"
        />
      )
    }
    return (
      <div className="space-y-2">
        {competencies.map((comp) => (
          <Card key={comp.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {comp.user ? `${comp.user.surname} ${comp.user.name}` : `Пользователь #${comp.userId}`}
                </p>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  {comp.role && <span>{comp.role}</span>}
                  {comp.assessmentDate && (
                    <>
                      <span>•</span>
                      <span>{new Date(comp.assessmentDate).toLocaleDateString('ru-RU')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {comp.isCompetent ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 size={14} className="mr-1" />
                    Компетентен
                  </Badge>
                ) : (
                  <Badge variant="danger" size="sm">
                    <XCircle size={14} className="mr-1" />
                    Не компетентен
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Обучение</h1>
          <p className="text-slate-400 text-sm">Управление обучением и компетенциями</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/training/new')}>
          Новая запись
        </Button>
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>Повторить</Button>
        </Card>
      ) : (
        <>
          {activeTab === 'records' && renderRecords()}
          {activeTab === 'plans' && renderPlans()}
          {activeTab === 'competency' && renderCompetencies()}
        </>
      )}
    </div>
  )
}

export default TrainingListPage
