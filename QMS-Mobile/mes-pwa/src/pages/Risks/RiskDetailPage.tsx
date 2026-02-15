

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Target,
  ClipboardCheck,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Textarea, ConfirmDialog } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { RiskRegister, RiskMitigation } from '../../types'

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

const MITIGATION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Запланировано',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнено',
  VERIFIED: 'Верифицировано',
}

const RiskDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [risk, setRisk] = useState<RiskRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showMitigationModal, setShowMitigationModal] = useState(false)
  const [mitigationDescription, setMitigationDescription] = useState('')
  const [submittingMitigation, setSubmittingMitigation] = useState(false)

  const [showAssessConfirm, setShowAssessConfirm] = useState(false)
  const [assessingRisk, setAssessingRisk] = useState(false)

  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
  const [acceptingRisk, setAcceptingRisk] = useState(false)

  useEffect(() => {
    if (id) loadRisk()
  }, [id])

  const loadRisk = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<RiskRegister>(`/risks/${id}`)
      setRisk(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAddMitigation = async () => {
    if (!mitigationDescription.trim()) return
    try {
      setSubmittingMitigation(true)
      await api.post(`/risks/${id}/mitigation`, {
        description: mitigationDescription,
      })
      setShowMitigationModal(false)
      setMitigationDescription('')
      loadRisk()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmittingMitigation(false)
    }
  }

  const handleAssessRisk = async () => {
    try {
      setAssessingRisk(true)
      await api.post(`/risks/${id}/assess`)
      setShowAssessConfirm(false)
      loadRisk()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setAssessingRisk(false)
    }
  }

  const handleAcceptRisk = async () => {
    try {
      setAcceptingRisk(true)
      await api.post(`/risks/${id}/accept`)
      setShowAcceptConfirm(false)
      loadRisk()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setAcceptingRisk(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  if (error || !risk) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Риск не найден'}</p>
        <Button variant="outline" onClick={() => navigate('/risks')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/risks')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{risk.number}</h1>
          <p className="text-slate-400 text-sm truncate">{risk.title}</p>
        </div>
        <Button
          variant="ghost"
          icon={<Edit size={18} />}
          onClick={() => navigate(`/risks/${id}/edit`)}
        >
          <span className="hidden sm:inline">Редактировать</span>
        </Button>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Shield size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{risk.title}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <span className="font-mono">{risk.number}</span>
              {risk.source && (
                <>
                  <span>•</span>
                  <span>{risk.source}</span>
                </>
              )}
              {risk.classification && (
                <>
                  <span>•</span>
                  <span>{risk.classification}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={STATUS_COLORS[risk.status] || 'neutral'} dot>
            {STATUS_LABELS[risk.status] || risk.status}
          </Badge>
        </div>

        {risk.description && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Описание</p>
            <p className="text-slate-200 whitespace-pre-wrap">{risk.description}</p>
          </div>
        )}

        {risk.owner && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Ответственный</p>
            <p className="font-medium">{risk.owner.surname} {risk.owner.name}</p>
          </div>
        )}
      </Card>

      {/* Risk assessment */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target size={18} className="text-slate-500" />
          Оценка риска
        </h2>

        <div className="space-y-4">
          {/* Initial risk */}
          <div>
            <p className="text-sm text-slate-400 mb-2">Начальный уровень риска</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Вероятность:</span>
                <span className="font-bold">{risk.initialProbability ?? '—'}</span>
              </div>
              <span className="text-slate-600">x</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Серьёзность:</span>
                <span className="font-bold">{risk.initialSeverity ?? '—'}</span>
              </div>
              <span className="text-slate-600">=</span>
              {risk.initialRiskLevel ? (
                <Badge variant={RISK_LEVEL_VARIANTS[risk.initialRiskLevel] || 'neutral'} dot>
                  {RISK_LEVEL_LABELS[risk.initialRiskLevel] || risk.initialRiskLevel}
                </Badge>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>

          {/* Residual risk */}
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Остаточный уровень риска</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Вероятность:</span>
                <span className="font-bold">{risk.residualProbability ?? '—'}</span>
              </div>
              <span className="text-slate-600">x</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Серьёзность:</span>
                <span className="font-bold">{risk.residualSeverity ?? '—'}</span>
              </div>
              <span className="text-slate-600">=</span>
              {risk.residualRiskLevel ? (
                <Badge variant={RISK_LEVEL_VARIANTS[risk.residualRiskLevel] || 'neutral'} dot>
                  {RISK_LEVEL_LABELS[risk.residualRiskLevel] || risk.residualRiskLevel}
                </Badge>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Mitigations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardCheck size={18} className="text-slate-500" />
            Меры снижения
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowMitigationModal(true)}
          >
            Добавить
          </Button>
        </div>

        {risk.mitigations && risk.mitigations.length > 0 ? (
          <div className="space-y-3">
            {risk.mitigations.map((mitigation) => (
              <div
                key={mitigation.id}
                className="p-3 rounded-xl bg-surface-light border border-slate-700/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-200 flex-1">{mitigation.description}</p>
                  <Badge
                    variant={STATUS_COLORS[mitigation.status] || 'neutral'}
                    size="sm"
                  >
                    {MITIGATION_STATUS_LABELS[mitigation.status] || STATUS_LABELS[mitigation.status] || mitigation.status}
                  </Badge>
                </div>
                {mitigation.responsible && (
                  <p className="text-xs text-slate-500 mt-2">
                    {mitigation.responsible.surname} {mitigation.responsible.name}
                  </p>
                )}
                {(mitigation.targetProbability != null || mitigation.targetSeverity != null) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    {mitigation.targetProbability != null && (
                      <span>Целевая вероятность: {mitigation.targetProbability}</span>
                    )}
                    {mitigation.targetSeverity != null && (
                      <>
                        <span>•</span>
                        <span>Целевая серьёзность: {mitigation.targetSeverity}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Меры снижения не добавлены</p>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Действия</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            icon={<Target size={16} />}
            onClick={() => setShowAssessConfirm(true)}
            disabled={risk.status === 'ACCEPTED' || risk.status === 'CLOSED'}
          >
            Оценить риск
          </Button>
          <Button
            variant="success"
            className="flex-1"
            icon={<CheckCircle2 size={16} />}
            onClick={() => setShowAcceptConfirm(true)}
            disabled={risk.status === 'ACCEPTED' || risk.status === 'CLOSED'}
          >
            Принять остаточный риск
          </Button>
        </div>
      </Card>

      {/* Add mitigation modal */}
      <Modal
        isOpen={showMitigationModal}
        onClose={() => setShowMitigationModal(false)}
        title="Добавить меру снижения"
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Описание меры"
            value={mitigationDescription}
            onChange={(e) => setMitigationDescription(e.target.value)}
            placeholder="Опишите меру снижения риска"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowMitigationModal(false)}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddMitigation}
              loading={submittingMitigation}
              disabled={!mitigationDescription.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assess confirmation */}
      <ConfirmDialog
        isOpen={showAssessConfirm}
        onClose={() => setShowAssessConfirm(false)}
        onConfirm={handleAssessRisk}
        title="Оценка риска"
        message="Подтвердите, что оценка риска завершена и уровень риска определён."
        confirmText="Подтвердить оценку"
        cancelText="Отмена"
        variant="primary"
        loading={assessingRisk}
      />

      {/* Accept confirmation */}
      <ConfirmDialog
        isOpen={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        onConfirm={handleAcceptRisk}
        title="Принятие остаточного риска"
        message="Вы уверены, что хотите принять остаточный уровень риска? Это означает, что текущий уровень риска считается приемлемым."
        confirmText="Принять риск"
        cancelText="Отмена"
        variant="success"
        loading={acceptingRisk}
      />
    </div>
  )
}

export default RiskDetailPage
