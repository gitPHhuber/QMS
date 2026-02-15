

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  AlertTriangle,
  Shield,
  ChevronRight,
  RefreshCw,
  Grid3X3,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { RiskRegister, PaginatedResponse } from '../../types'

const RISK_LEVEL_VARIANTS: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
}

const RISK_LEVEL_LABELS: Record<string, string> = {
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

export const RiskListPage = () => {
  const navigate = useNavigate()
  const [risks, setRisks] = useState<RiskRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadRisks()
  }, [debouncedSearch, activeTab])

  const loadRisks = async (isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true)
      else setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'identified') params.status = 'IDENTIFIED'
      if (activeTab === 'assessed') params.status = 'ASSESSED'
      if (activeTab === 'mitigated') params.status = 'MITIGATED'
      if (activeTab === 'accepted') params.status = 'ACCEPTED'

      const { data } = await api.get<PaginatedResponse<RiskRegister> | RiskRegister[]>('/risks', { params })
      setRisks(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки рисков'))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'identified', label: 'Выявленные' },
    { key: 'assessed', label: 'Оценённые' },
    { key: 'mitigated', label: 'Снижены' },
    { key: 'accepted', label: 'Принятые' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Управление рисками</h1>
          <p className="text-slate-400 text-sm">Реестр рисков</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            icon={<Grid3X3 size={18} />}
            onClick={() => navigate('/risks/matrix')}
          >
            <span className="hidden sm:inline">Матрица</span>
          </Button>
          <Button
            variant="ghost"
            icon={<RefreshCw size={18} />}
            onClick={() => loadRisks(true)}
          >
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => navigate('/risks/new')}>
            Новый риск
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
            <Button variant="ghost" size="sm" onClick={() => loadRisks()}>Повторить</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка рисков..." />
        </div>
      ) : risks.length === 0 ? (
        <EmptyState
          icon={<Shield size={48} />}
          title="Риски не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'Реестр рисков пуст'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>Сбросить поиск</Button>
            ) : (
              <Button icon={<Plus size={18} />} onClick={() => navigate('/risks/new')}>
                Новый риск
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => (
            <Card
              key={risk.id}
              hover
              className="p-4"
              onClick={() => navigate(`/risks/${risk.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{risk.number}</span>
                  </div>
                  <p className="font-medium truncate">{risk.title}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    {risk.initialRiskLevel && (
                      <Badge
                        variant={RISK_LEVEL_VARIANTS[risk.initialRiskLevel] || 'neutral'}
                        size="sm"
                      >
                        {RISK_LEVEL_LABELS[risk.initialRiskLevel] || risk.initialRiskLevel}
                      </Badge>
                    )}
                    {risk.residualRiskLevel && (
                      <>
                        <span className="text-slate-600">→</span>
                        <Badge
                          variant={RISK_LEVEL_VARIANTS[risk.residualRiskLevel] || 'neutral'}
                          size="sm"
                        >
                          {RISK_LEVEL_LABELS[risk.residualRiskLevel] || risk.residualRiskLevel}
                        </Badge>
                      </>
                    )}
                    {risk.owner && (
                      <>
                        <span>•</span>
                        <span className="truncate">{risk.owner.surname} {risk.owner.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[risk.status] || 'neutral'}>
                    {STATUS_LABELS[risk.status] || risk.status}
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

export default RiskListPage
