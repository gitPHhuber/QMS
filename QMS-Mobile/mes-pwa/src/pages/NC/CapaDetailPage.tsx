


import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  CheckCircle2,
  User,
  Calendar,
  Target,
  Search,
  Info,
  ListChecks,
  ShieldCheck,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Textarea, StatusTimeline, ConfirmDialog } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../../config'
import type { Capa, CapaAction, CapaVerification } from '../../types'

const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  CRITICAL: 'danger',
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'primary',
  LOW: 'neutral',
}

const CAPA_WORKFLOW = [
  { status: 'INITIATED', label: 'Инициировано' },
  { status: 'INVESTIGATING', label: 'Расследование' },
  { status: 'PLANNING', label: 'Планирование' },
  { status: 'PLAN_APPROVED', label: 'План утверждён' },
  { status: 'IMPLEMENTING', label: 'Внедрение' },
  { status: 'VERIFYING', label: 'Проверка' },
  { status: 'EFFECTIVE', label: 'Действует' },
  { status: 'CLOSED', label: 'Закрыто' },
]

const CapaDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [capa, setCapa] = useState<Capa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add action modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionDescription, setActionDescription] = useState('')
  const [actionAssignedToId, setActionAssignedToId] = useState('')
  const [actionDueDate, setActionDueDate] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // Verification dialog
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyEvidence, setVerifyEvidence] = useState('')
  const [verifyEffective, setVerifyEffective] = useState(true)
  const [submittingVerify, setSubmittingVerify] = useState(false)

  useEffect(() => {
    if (id) loadCapa()
  }, [id])

  const loadCapa = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/nc/capa/${id}`)
      setCapa(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAddAction = async () => {
    if (!actionDescription.trim()) return
    try {
      setSubmittingAction(true)
      const payload: Record<string, any> = {
        description: actionDescription.trim(),
      }
      if (actionAssignedToId) payload.assignedToId = parseInt(actionAssignedToId)
      if (actionDueDate) payload.dueDate = actionDueDate

      await api.post(`/nc/capa/${id}/actions`, payload)
      setShowActionModal(false)
      setActionDescription('')
      setActionAssignedToId('')
      setActionDueDate('')
      loadCapa()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleVerify = async () => {
    try {
      setSubmittingVerify(true)
      await api.post(`/nc/capa/${id}/verify`, {
        isEffective: verifyEffective,
        evidence: verifyEvidence.trim() || undefined,
      })
      setShowVerifyDialog(false)
      setVerifyEvidence('')
      setVerifyEffective(true)
      loadCapa()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmittingVerify(false)
    }
  }

  const getTimelineItems = () => {
    if (!capa) return []

    const currentIndex = CAPA_WORKFLOW.findIndex((w) => w.status === capa.status)

    return CAPA_WORKFLOW.map((w, i) => ({
      status: w.status,
      label: w.label,
      completed: i < currentIndex,
      active: i === currentIndex,
    }))
  }

  const getActionStatusBadge = (status: string) => {
    const colors: Record<string, 'success' | 'primary' | 'warning' | 'neutral'> = {
      COMPLETED: 'success',
      IN_PROGRESS: 'primary',
      PENDING: 'warning',
    }
    const labels: Record<string, string> = {
      COMPLETED: 'Выполнено',
      IN_PROGRESS: 'В работе',
      PENDING: 'Ожидает',
    }
    return (
      <Badge variant={colors[status] || 'neutral'} size="sm">
        {labels[status] || status}
      </Badge>
    )
  }

  const canVerify = capa && (capa.status === 'VERIFYING' || capa.status === 'IMPLEMENTING')

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error || !capa) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'CAPA не найдено'}</p>
        <Button variant="outline" onClick={() => navigate('/capa')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/capa')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{capa.number}</h1>
          <p className="text-slate-400 text-sm truncate">{capa.title}</p>
        </div>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <ClipboardList size={28} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{capa.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={capa.type === 'CORRECTIVE' ? 'primary' : 'warning'}>
                {capa.type === 'CORRECTIVE' ? 'Корректирующее' : 'Предупреждающее'}
              </Badge>
              <Badge variant={STATUS_COLORS[capa.status] || 'neutral'}>
                {STATUS_LABELS[capa.status] || capa.status}
              </Badge>
              {capa.priority && (
                <Badge variant={PRIORITY_COLORS[capa.priority] || 'neutral'}>
                  {PRIORITY_LABELS[capa.priority] || capa.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {capa.description && (
          <p className="text-slate-300 text-sm leading-relaxed">{capa.description}</p>
        )}

        <div className="space-y-3 mt-4 pt-4 border-t border-slate-700/50">
          {capa.assignedTo && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Ответственный</p>
                <p className="font-medium truncate">{capa.assignedTo.surname} {capa.assignedTo.name}</p>
              </div>
            </div>
          )}
          {capa.initiatedBy && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Инициатор</p>
                <p className="font-medium truncate">{capa.initiatedBy.surname} {capa.initiatedBy.name}</p>
              </div>
            </div>
          )}
          {capa.dueDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Срок выполнения</p>
                <p className={`font-medium ${new Date(capa.dueDate) < new Date() && capa.status !== 'CLOSED' && capa.status !== 'EFFECTIVE' ? 'text-danger' : ''}`}>
                  {new Date(capa.dueDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Дата создания</p>
              <p className="font-medium">
                {new Date(capa.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Root cause analysis */}
      {(capa.rootCauseAnalysis || capa.rootCauseMethod) && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Search size={18} className="text-slate-500" />
            Анализ коренной причины
          </h2>
          <div className="space-y-4">
            {capa.rootCauseAnalysis && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Анализ причины</p>
                <p className="text-slate-300 text-sm leading-relaxed">{capa.rootCauseAnalysis}</p>
              </div>
            )}
            {capa.rootCauseMethod && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Метод анализа</p>
                <p className="text-slate-300 text-sm leading-relaxed">{capa.rootCauseMethod}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ListChecks size={18} className="text-slate-500" />
            Действия ({capa.actions?.length || 0})
          </h2>
          {capa.status !== 'CLOSED' && capa.status !== 'EFFECTIVE' && (
            <Button
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowActionModal(true)}
            >
              Добавить
            </Button>
          )}
        </div>
        {capa.actions && capa.actions.length > 0 ? (
          <div className="space-y-3">
            {capa.actions.map((action, index) => (
              <div
                key={action.id}
                className="py-3 px-3 rounded-xl bg-surface-light/50 border border-slate-700/30"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">#{action.order || index + 1}</span>
                    {getActionStatusBadge(action.status)}
                  </div>
                  {action.dueDate && (
                    <span className={`text-xs ${new Date(action.dueDate) < new Date() && action.status !== 'COMPLETED' ? 'text-danger' : 'text-slate-500'}`}>
                      {new Date(action.dueDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{action.description}</p>
                {action.assignedTo && (
                  <p className="text-xs text-slate-500 mt-2">
                    {action.assignedTo.surname} {action.assignedTo.name}
                  </p>
                )}
                {action.result && (
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400">Результат:</p>
                    <p className="text-sm text-slate-300">{action.result}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Действия не добавлены</p>
        )}
      </Card>

      {/* Verification */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-500" />
            Проверка эффективности
          </h2>
          {canVerify && (
            <Button
              size="sm"
              variant="success"
              icon={<CheckCircle2 size={16} />}
              onClick={() => setShowVerifyDialog(true)}
            >
              Проверить
            </Button>
          )}
        </div>
        {capa.verifications && capa.verifications.length > 0 ? (
          <div className="space-y-3">
            {capa.verifications.map((v) => (
              <div
                key={v.id}
                className="py-3 px-3 rounded-xl bg-surface-light/50 border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={v.isEffective ? 'success' : 'danger'} size="sm">
                    {v.isEffective ? 'Эффективно' : 'Неэффективно'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {new Date(v.verifiedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {v.evidence && (
                  <p className="text-sm text-slate-300">{v.evidence}</p>
                )}
                {v.verifiedBy && (
                  <p className="text-xs text-slate-500 mt-2">
                    Проверил: {v.verifiedBy.surname} {v.verifiedBy.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Проверки не проводились</p>
        )}
      </Card>

      {/* Status timeline */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target size={18} className="text-slate-500" />
          Ход выполнения
        </h2>
        <StatusTimeline items={getTimelineItems()} />
      </Card>

      {/* Add action modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title="Новое действие"
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Описание действия *"
            placeholder="Опишите действие, которое необходимо выполнить"
            value={actionDescription}
            onChange={(e) => setActionDescription(e.target.value)}
          />
          <Input
            label="ID ответственного"
            type="number"
            placeholder="Введите ID пользователя"
            value={actionAssignedToId}
            onChange={(e) => setActionAssignedToId(e.target.value)}
          />
          <Input
            label="Срок выполнения"
            type="date"
            value={actionDueDate}
            onChange={(e) => setActionDueDate(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowActionModal(false)}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddAction}
              loading={submittingAction}
              disabled={!actionDescription.trim()}
            >
              Добавить действие
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify modal */}
      <Modal
        isOpen={showVerifyDialog}
        onClose={() => setShowVerifyDialog(false)}
        title="Проверка эффективности"
        size="md"
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={verifyEffective}
              onChange={(e) => setVerifyEffective(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-slate-300">CAPA эффективно</span>
          </label>
          <Textarea
            label="Доказательства / обоснование"
            placeholder="Опишите результаты проверки эффективности"
            value={verifyEvidence}
            onChange={(e) => setVerifyEvidence(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowVerifyDialog(false)}>
              Отмена
            </Button>
            <Button
              variant="success"
              className="flex-1"
              onClick={handleVerify}
              loading={submittingVerify}
            >
              Подтвердить проверку
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CapaDetailPage
