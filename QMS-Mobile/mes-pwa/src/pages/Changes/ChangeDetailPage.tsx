

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  GitPullRequest,
  Edit,
  Plus,
  AlertTriangle,
  Shield,
  FileWarning,
  Link2,
  User,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Select, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, CHANGE_TYPE_LABELS } from '../../config'
import type { ChangeRequest, ChangeImpactItem } from '../../types'

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

const CATEGORY_LABELS: Record<string, string> = {
  MAJOR: 'Значительное',
  MINOR: 'Незначительное',
}

const severityOptions = [
  { value: '1', label: '1 — Минимальная' },
  { value: '2', label: '2 — Низкая' },
  { value: '3', label: '3 — Средняя' },
  { value: '4', label: '4 — Высокая' },
  { value: '5', label: '5 — Критическая' },
]

const ChangeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [change, setChange] = useState<ChangeRequest | null>(null)
  const [impactItems, setImpactItems] = useState<ChangeImpactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showImpactModal, setShowImpactModal] = useState(false)
  const [impactArea, setImpactArea] = useState('')
  const [impactDescription, setImpactDescription] = useState('')
  const [impactSeverity, setImpactSeverity] = useState('')
  const [savingImpact, setSavingImpact] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [changeRes, impactsRes] = await Promise.all([
        api.get(`/change/${id}`),
        api.get(`/change/${id}/impacts`),
      ])
      setChange(changeRes.data)
      setImpactItems(Array.isArray(impactsRes.data) ? impactsRes.data : impactsRes.data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAddImpact = async () => {
    if (!impactArea.trim() || !impactDescription.trim()) return

    try {
      setSavingImpact(true)
      await api.post(`/change/${id}/impacts`, {
        impactArea: impactArea.trim(),
        description: impactDescription.trim(),
        severity: impactSeverity ? parseInt(impactSeverity) : undefined,
      })
      setShowImpactModal(false)
      setImpactArea('')
      setImpactDescription('')
      setImpactSeverity('')
      loadData()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSavingImpact(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error || !change) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Запрос не найден'}</p>
        <Button variant="outline" onClick={() => navigate('/changes')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/changes')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{change.title}</h1>
          <p className="text-slate-400 text-sm font-mono">{change.changeNumber}</p>
        </div>
        <Button variant="ghost" icon={<Edit size={18} />} onClick={() => navigate(`/changes/${id}/edit`)}>
          <span className="hidden sm:inline">Редактировать</span>
        </Button>
      </div>

      {/* Main card */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center shrink-0">
            <GitPullRequest size={28} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{change.title}</h2>
            <p className="text-sm text-slate-400 font-mono">{change.changeNumber}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={STATUS_COLORS[change.status] || 'neutral'}>
            {STATUS_LABELS[change.status] || change.status}
          </Badge>
          <Badge variant="neutral">
            {CHANGE_TYPE_LABELS[change.type] || change.type}
          </Badge>
          <Badge variant={PRIORITY_COLORS[change.priority] || 'neutral'}>
            {PRIORITY_LABELS[change.priority] || change.priority}
          </Badge>
          <Badge variant={change.category === 'MAJOR' ? 'warning' : 'neutral'}>
            {CATEGORY_LABELS[change.category] || change.category}
          </Badge>
        </div>

        {change.description && (
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-1">Описание</p>
            <p className="text-sm">{change.description}</p>
          </div>
        )}

        {change.justification && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Обоснование</p>
            <p className="text-sm">{change.justification}</p>
          </div>
        )}

        {change.initiator && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
            <User size={16} className="text-slate-500" />
            <span className="text-sm text-slate-400">Инициатор:</span>
            <span className="text-sm font-medium">{change.initiator.surname} {change.initiator.name}</span>
          </div>
        )}
      </Card>

      {/* Assessment card */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-slate-500" />
          Оценка влияния
        </h2>
        <div className="space-y-4">
          {change.impactAssessment && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Оценка воздействия</p>
              <p className="text-sm">{change.impactAssessment}</p>
            </div>
          )}
          {change.riskAssessment && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Оценка рисков</p>
              <p className="text-sm">{change.riskAssessment}</p>
            </div>
          )}
          {change.regulatoryImpact !== undefined && (
            <div className="flex items-center gap-2">
              <FileWarning size={16} className={change.regulatoryImpact ? 'text-warning' : 'text-slate-500'} />
              <span className="text-sm">
                Регуляторное воздействие: {change.regulatoryImpact ? 'Да' : 'Нет'}
              </span>
            </div>
          )}
          {change.regulatoryDossierImpact && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Влияние на регуляторное досье</p>
              <p className="text-sm">{change.regulatoryDossierImpact}</p>
            </div>
          )}
          {!change.impactAssessment && !change.riskAssessment && !change.regulatoryDossierImpact && (
            <p className="text-slate-500 text-center py-2">Оценка не проведена</p>
          )}
        </div>
      </Card>

      {/* Impact items */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-500" />
            Элементы влияния
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowImpactModal(true)}
          >
            Добавить
          </Button>
        </div>

        {impactItems.length > 0 ? (
          <div className="space-y-3">
            {impactItems.map((item) => (
              <div key={item.id} className="p-3 border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{item.impactArea}</span>
                  {item.severity && (
                    <Badge
                      variant={item.severity >= 4 ? 'danger' : item.severity >= 3 ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      Серьёзность: {item.severity}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Нет элементов влияния</p>
        )}
      </Card>

      {/* Linked items */}
      {(change.linkedNcId || change.linkedCapaId) && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-slate-500" />
            Связанные записи
          </h2>
          <div className="space-y-2">
            {change.linkedNcId && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(`/nc/${change.linkedNcId}`)}
              >
                Несоответствие #{change.linkedNcId}
              </Button>
            )}
            {change.linkedCapaId && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(`/capa/${change.linkedCapaId}`)}
              >
                CAPA #{change.linkedCapaId}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Impact Modal */}
      <Modal
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        title="Добавить элемент влияния"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Область влияния *"
            value={impactArea}
            onChange={(e) => setImpactArea(e.target.value)}
            placeholder="Например: Производственный процесс"
          />
          <Textarea
            label="Описание *"
            value={impactDescription}
            onChange={(e) => setImpactDescription(e.target.value)}
            placeholder="Описание влияния на данную область"
          />
          <Select
            label="Серьёзность"
            value={impactSeverity}
            onChange={(e) => setImpactSeverity(e.target.value)}
            options={severityOptions}
            placeholder="Выберите уровень"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowImpactModal(false)}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddImpact}
              loading={savingImpact}
              disabled={!impactArea.trim() || !impactDescription.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ChangeDetailPage
