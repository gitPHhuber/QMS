

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FlaskConical,
  Calendar,
  User,
  FileCheck,
  Check,
  X,
  Minus,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { Card, Button, Badge, Loader, StatusTimeline, ConfirmDialog } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, VALIDATION_TYPE_LABELS } from '../../config'
import type { ProcessValidation, ValidationChecklist, ValidationChecklistItem } from '../../types'

const TIMELINE_STATUSES = ['PLANNING', 'EXECUTING', 'ANALYSIS', 'APPROVED']
const TIMELINE_LABELS: Record<string, string> = {
  PLANNING: 'Планирование',
  EXECUTING: 'Выполнение',
  ANALYSIS: 'Анализ',
  APPROVED: 'Утверждён',
}

const ValidationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [validation, setValidation] = useState<ProcessValidation | null>(null)
  const [checklists, setChecklists] = useState<ValidationChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false)
  const [creatingChecklist, setCreatingChecklist] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [validationRes, checklistsRes] = await Promise.all([
        api.get(`/process-validations/${id}`),
        api.get(`/process-validations/${id}/checklists`),
      ])
      setValidation(validationRes.data)
      setChecklists(
        Array.isArray(checklistsRes.data)
          ? checklistsRes.data
          : checklistsRes.data.rows || []
      )
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromTemplate = async () => {
    try {
      setCreatingChecklist(true)
      await api.post(`/process-validations/${id}/checklists/from-template`)
      setShowTemplateConfirm(false)
      loadData()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setCreatingChecklist(false)
    }
  }

  const getTimelineItems = () => {
    if (!validation) return []
    const currentIndex = TIMELINE_STATUSES.indexOf(validation.status)

    return TIMELINE_STATUSES.map((status, i) => ({
      status,
      label: TIMELINE_LABELS[status] || status,
      completed: i < currentIndex,
      active: i === currentIndex,
    }))
  }

  const getResultIndicator = (result?: string) => {
    if (!result) {
      return <Minus size={16} className="text-slate-500" />
    }
    const normalized = result.toUpperCase()
    if (normalized === 'PASS') {
      return <Check size={16} className="text-success" />
    }
    if (normalized === 'FAIL') {
      return <X size={16} className="text-danger" />
    }
    // N/A or N-A
    return <Minus size={16} className="text-slate-500" />
  }

  const getResultBg = (result?: string) => {
    if (!result) return 'bg-slate-600/20'
    const normalized = result.toUpperCase()
    if (normalized === 'PASS') return 'bg-success/20'
    if (normalized === 'FAIL') return 'bg-danger/20'
    return 'bg-slate-600/20'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  if (error || !validation) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Валидация не найдена'}</p>
        <Button variant="outline" onClick={() => navigate('/validation')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/validation')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{validation.processName}</h1>
          <p className="text-slate-400 text-sm">Валидация процесса</p>
        </div>
      </div>

      {/* Main info card */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={STATUS_COLORS[validation.validationType] || 'primary'}>
            {VALIDATION_TYPE_LABELS[validation.validationType] || validation.validationType}
          </Badge>
          <Badge variant={STATUS_COLORS[validation.status] || 'neutral'}>
            {STATUS_LABELS[validation.status] || validation.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FlaskConical size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Процесс</p>
              <p className="font-medium truncate">{validation.processName}</p>
            </div>
          </div>

          {validation.scope && (
            <div className="flex items-center gap-3">
              <FileCheck size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Область</p>
                <p className="font-medium">{validation.scope}</p>
              </div>
            </div>
          )}

          {validation.responsible && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Ответственный</p>
                <p className="font-medium truncate">
                  {validation.responsible.surname} {validation.responsible.name}
                </p>
              </div>
            </div>
          )}

          {validation.startDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Дата начала</p>
                <p className="font-medium">
                  {new Date(validation.startDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {validation.completionDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Дата завершения</p>
                <p className="font-medium">
                  {new Date(validation.completionDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Status Timeline */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Прогресс</h2>
        <StatusTimeline items={getTimelineItems()} />
      </Card>

      {/* Checklists card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-500" />
            Чеклисты
            {checklists.length > 0 && (
              <Badge variant="primary" size="sm">{checklists.length}</Badge>
            )}
          </h2>
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowTemplateConfirm(true)}
          >
            Из шаблона
          </Button>
        </div>

        {checklists.length > 0 ? (
          <div className="space-y-4">
            {checklists.map((checklist, clIndex) => (
              <div
                key={checklist.id}
                className="p-3 bg-surface-light rounded-xl border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">Чеклист #{clIndex + 1}</p>
                    <Badge variant={STATUS_COLORS[checklist.status] || 'neutral'} size="sm">
                      {STATUS_LABELS[checklist.status] || checklist.status}
                    </Badge>
                  </div>
                  {checklist.executedBy && (
                    <p className="text-xs text-slate-500">
                      {checklist.executedBy.surname} {checklist.executedBy.name}
                    </p>
                  )}
                </div>

                {checklist.items && checklist.items.length > 0 ? (
                  <div className="space-y-2">
                    {checklist.items.map((item: ValidationChecklistItem) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-1.5 border-b border-slate-700/30 last:border-0"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getResultBg(item.result)}`}
                        >
                          {getResultIndicator(item.result)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.itemDescription}</p>
                          {item.expectedCriteria && (
                            <p className="text-xs text-slate-500 truncate">
                              Критерий: {item.expectedCriteria}
                            </p>
                          )}
                        </div>
                        {item.result && (
                          <Badge
                            variant={
                              item.result.toUpperCase() === 'PASS'
                                ? 'success'
                                : item.result.toUpperCase() === 'FAIL'
                                ? 'danger'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {item.result.toUpperCase() === 'PASS'
                              ? 'Пройден'
                              : item.result.toUpperCase() === 'FAIL'
                              ? 'Не пройден'
                              : 'Н/П'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-2">
                    Нет элементов в чеклисте
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Чеклисты не созданы</p>
        )}
      </Card>

      {/* Create checklist from template confirm */}
      <ConfirmDialog
        isOpen={showTemplateConfirm}
        onClose={() => setShowTemplateConfirm(false)}
        onConfirm={handleCreateFromTemplate}
        title="Создать чеклист из шаблона"
        message="Будет создан новый чеклист на основе шаблона протокола валидации. Продолжить?"
        confirmText="Создать"
        cancelText="Отмена"
        variant="primary"
        loading={creatingChecklist}
      />
    </div>
  )
}

export default ValidationDetailPage
