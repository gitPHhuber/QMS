

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  FlaskConical,
  ChevronRight,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, VALIDATION_TYPE_LABELS } from '../../config'
import type { ProcessValidation } from '../../types'

export const ValidationListPage = () => {
  const navigate = useNavigate()
  const [validations, setValidations] = useState<ProcessValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadValidations()
  }, [debouncedSearch, activeTab])

  const loadValidations = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab !== 'all') params.validationType = activeTab

      const { data } = await api.get('/process-validations', { params })
      setValidations(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки валидаций'))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'IQ', label: 'IQ' },
    { key: 'OQ', label: 'OQ' },
    { key: 'PQ', label: 'PQ' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Валидация процессов</h1>
          <p className="text-slate-400 text-sm">IQ / OQ / PQ квалификации</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/validation/new')}>
          Новая валидация
        </Button>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск по процессу..."
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
            <Button variant="ghost" size="sm" onClick={loadValidations}>Повторить</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка валидаций..." />
        </div>
      ) : validations.length === 0 ? (
        <EmptyState
          icon={<FlaskConical size={48} />}
          title="Валидации не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Процессы валидации ещё не созданы'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/validation/new')}>
              Создать валидацию
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {validations.map((v) => (
            <Card key={v.id} hover className="p-4" onClick={() => navigate(`/validation/${v.id}`)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <FlaskConical size={24} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{v.processName}</p>
                      <Badge variant={STATUS_COLORS[v.validationType] || 'primary'} size="sm">
                        {VALIDATION_TYPE_LABELS[v.validationType] || v.validationType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      {v.responsible && (
                        <span className="flex items-center gap-1 truncate">
                          <User size={14} />
                          {v.responsible.surname} {v.responsible.name}
                        </span>
                      )}
                      {v.startDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(v.startDate).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[v.status] || 'neutral'}>
                    {STATUS_LABELS[v.status] || v.status}
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

export default ValidationListPage
