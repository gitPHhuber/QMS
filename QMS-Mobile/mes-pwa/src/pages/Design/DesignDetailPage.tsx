import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  PenTool,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  FileInput,
  FileOutput,
  MessageSquare,
  ShieldCheck,
  CheckSquare,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Textarea, Select, DateInput } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type {
  DesignProject,
  DesignInput,
  DesignOutput,
  DesignReview,
  DesignVerificationRecord,
  DesignValidationRecord,
  DesignTransfer,
  DesignChange,
} from '../../types'

type SectionKey = 'inputs' | 'outputs' | 'reviews' | 'verifications' | 'validations' | 'transfers' | 'changes'

const DesignDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [project, setProject] = useState<DesignProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    inputs: false,
    outputs: false,
    reviews: false,
    verifications: false,
    validations: false,
    transfers: false,
    changes: false,
  })

  const [activeModal, setActiveModal] = useState<SectionKey | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states for each section
  const [inputForm, setInputForm] = useState({ inputDescription: '', source: '', criticality: '', status: 'DRAFT' })
  const [outputForm, setOutputForm] = useState({ outputDescription: '', specification: '', status: 'DRAFT' })
  const [reviewForm, setReviewForm] = useState({ reviewDate: '', reviewPhase: '', participants: '', findings: '', conclusions: '' })
  const [verificationForm, setVerificationForm] = useState({ verificationMethod: '', result: '', evidence: '', status: 'DRAFT' })
  const [validationForm, setValidationForm] = useState({ validationMethod: '', result: '', status: 'DRAFT' })
  const [transferForm, setTransferForm] = useState({ transferDate: '', transferProcess: '', status: 'DRAFT' })
  const [changeForm, setChangeForm] = useState({ changeNumber: '', changeDescription: '', reason: '', status: 'DRAFT' })

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/design/${id}`)
      setProject(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmitSection = async (section: SectionKey) => {
    try {
      setSubmitting(true)
      let payload: any
      let endpoint: string

      switch (section) {
        case 'inputs':
          payload = inputForm
          endpoint = `/design/${id}/inputs`
          break
        case 'outputs':
          payload = outputForm
          endpoint = `/design/${id}/outputs`
          break
        case 'reviews':
          payload = {
            ...reviewForm,
            participants: reviewForm.participants ? reviewForm.participants.split(',').map((p) => p.trim()).filter(Boolean) : [],
          }
          endpoint = `/design/${id}/reviews`
          break
        case 'verifications':
          payload = verificationForm
          endpoint = `/design/${id}/verifications`
          break
        case 'validations':
          payload = validationForm
          endpoint = `/design/${id}/validations`
          break
        case 'transfers':
          payload = transferForm
          endpoint = `/design/${id}/transfers`
          break
        case 'changes':
          payload = changeForm
          endpoint = `/design/${id}/changes`
          break
      }

      await api.post(endpoint, payload)
      setActiveModal(null)
      resetForms()
      loadProject()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const resetForms = () => {
    setInputForm({ inputDescription: '', source: '', criticality: '', status: 'DRAFT' })
    setOutputForm({ outputDescription: '', specification: '', status: 'DRAFT' })
    setReviewForm({ reviewDate: '', reviewPhase: '', participants: '', findings: '', conclusions: '' })
    setVerificationForm({ verificationMethod: '', result: '', evidence: '', status: 'DRAFT' })
    setValidationForm({ validationMethod: '', result: '', status: 'DRAFT' })
    setTransferForm({ transferDate: '', transferProcess: '', status: 'DRAFT' })
    setChangeForm({ changeNumber: '', changeDescription: '', reason: '', status: 'DRAFT' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка проекта..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/design')}>
          Назад
        </Button>
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error || 'Проект не найден'}</p>
          <Button variant="outline" onClick={loadProject}>Повторить</Button>
        </Card>
      </div>
    )
  }

  const statusOptions = [
    { value: 'DRAFT', label: 'Черновик' },
    { value: 'REVIEW', label: 'На рассмотрении' },
    { value: 'APPROVED', label: 'Утверждён' },
    { value: 'COMPLETED', label: 'Завершён' },
  ]

  const renderExpandableSection = (
    key: SectionKey,
    title: string,
    icon: React.ReactNode,
    items: any[] | undefined,
    renderItem: (item: any) => React.ReactNode,
  ) => (
    <Card key={key} className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-light/30 transition-colors"
        onClick={() => toggleSection(key)}
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">{icon}</div>
          <span className="font-semibold">{title}</span>
          {items && items.length > 0 && (
            <Badge variant="primary" size="sm">{items.length}</Badge>
          )}
        </div>
        {expandedSections[key] ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {expandedSections[key] && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <div className="flex justify-end mt-3 mb-2">
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setActiveModal(key)}>
              Добавить
            </Button>
          </div>
          {items && items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-surface-light rounded-xl text-sm">
                  {renderItem(item)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-3">Записи отсутствуют</p>
          )}
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/design')}>
          Назад
        </Button>
        <Button variant="outline" icon={<Edit size={18} />} onClick={() => navigate(`/design/${id}/edit`)}>
          Редактировать
        </Button>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <PenTool size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-slate-500 font-mono">{project.code}</span>
              <Badge variant={STATUS_COLORS[project.status] || 'neutral'}>
                {STATUS_LABELS[project.status] || project.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-2">{project.title}</h1>
            {project.description && (
              <p className="text-slate-400 text-sm mb-3">{project.description}</p>
            )}

            <div className="space-y-2 text-sm">
              {project.deviceType && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Тип устройства</span>
                  <span>{project.deviceType}</span>
                </div>
              )}
              {project.initiator && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Инициатор</span>
                  <span>{project.initiator.surname} {project.initiator.name}</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    <Calendar size={14} className="inline mr-1" />
                    Дата начала
                  </span>
                  <span>{new Date(project.startDate).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
              {project.plannedCompletionDate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Плановое завершение</span>
                  <span>{new Date(project.plannedCompletionDate).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
              {project.completionDate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Фактическое завершение</span>
                  <span>{new Date(project.completionDate).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Expandable sections */}

      {/* Inputs (7.3.3) */}
      {renderExpandableSection(
        'inputs',
        'Входные данные (7.3.3)',
        <FileInput size={18} />,
        project.inputs,
        (item: DesignInput) => (
          <div className="space-y-1">
            <p className="font-medium">{item.inputDescription}</p>
            <div className="flex items-center gap-3 text-slate-400">
              {item.source && <span>Источник: {item.source}</span>}
              {item.criticality && (
                <>
                  <span>•</span>
                  <span>Критичность: {item.criticality}</span>
                </>
              )}
            </div>
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Outputs (7.3.4) */}
      {renderExpandableSection(
        'outputs',
        'Выходные данные (7.3.4)',
        <FileOutput size={18} />,
        project.outputs,
        (item: DesignOutput) => (
          <div className="space-y-1">
            <p className="font-medium">{item.outputDescription}</p>
            {item.specification && (
              <p className="text-slate-400">Спецификация: {item.specification}</p>
            )}
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Reviews (7.3.5) */}
      {renderExpandableSection(
        'reviews',
        'Ревью (7.3.5)',
        <MessageSquare size={18} />,
        project.reviews,
        (item: DesignReview) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.reviewPhase}</span>
              <span className="text-slate-400">{new Date(item.reviewDate).toLocaleDateString('ru-RU')}</span>
            </div>
            {item.participants && item.participants.length > 0 && (
              <p className="text-slate-400">Участники: {item.participants.join(', ')}</p>
            )}
            {item.findings && <p className="text-slate-400">Замечания: {item.findings}</p>}
            {item.conclusions && <p className="text-slate-400">Выводы: {item.conclusions}</p>}
          </div>
        ),
      )}

      {/* Verifications (7.3.6) */}
      {renderExpandableSection(
        'verifications',
        'Верификация (7.3.6)',
        <ShieldCheck size={18} />,
        project.verifications,
        (item: DesignVerificationRecord) => (
          <div className="space-y-1">
            <p className="font-medium">{item.verificationMethod}</p>
            {item.result && <p className="text-slate-400">Результат: {item.result}</p>}
            {item.evidence && <p className="text-slate-400">Доказательства: {item.evidence}</p>}
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Validations (7.3.7) */}
      {renderExpandableSection(
        'validations',
        'Валидация (7.3.7)',
        <CheckSquare size={18} />,
        project.validations,
        (item: DesignValidationRecord) => (
          <div className="space-y-1">
            <p className="font-medium">{item.validationMethod}</p>
            {item.result && <p className="text-slate-400">Результат: {item.result}</p>}
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Transfers (7.3.8) */}
      {renderExpandableSection(
        'transfers',
        'Передача (7.3.8)',
        <ArrowRightLeft size={18} />,
        project.transfers,
        (item: DesignTransfer) => (
          <div className="space-y-1">
            {item.transferDate && (
              <p className="text-slate-400">Дата: {new Date(item.transferDate).toLocaleDateString('ru-RU')}</p>
            )}
            {item.transferProcess && <p className="font-medium">{item.transferProcess}</p>}
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Changes (7.3.9) */}
      {renderExpandableSection(
        'changes',
        'Изменения (7.3.9)',
        <RefreshCw size={18} />,
        project.changes,
        (item: DesignChange) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {item.changeNumber && <span className="text-xs text-slate-500 font-mono">{item.changeNumber}</span>}
            </div>
            <p className="font-medium">{item.changeDescription}</p>
            {item.reason && <p className="text-slate-400">Причина: {item.reason}</p>}
            <Badge variant={STATUS_COLORS[item.status] || 'neutral'} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
          </div>
        ),
      )}

      {/* Modals */}

      {/* Input Modal */}
      <Modal isOpen={activeModal === 'inputs'} onClose={() => setActiveModal(null)} title="Добавить входные данные">
        <div className="space-y-4">
          <Textarea
            label="Описание"
            value={inputForm.inputDescription}
            onChange={(e) => setInputForm({ ...inputForm, inputDescription: e.target.value })}
            placeholder="Описание входных данных"
          />
          <Input
            label="Источник"
            value={inputForm.source}
            onChange={(e) => setInputForm({ ...inputForm, source: e.target.value })}
            placeholder="Источник требования"
          />
          <Input
            label="Критичность"
            value={inputForm.criticality}
            onChange={(e) => setInputForm({ ...inputForm, criticality: e.target.value })}
            placeholder="Уровень критичности"
          />
          <Select
            label="Статус"
            value={inputForm.status}
            onChange={(e) => setInputForm({ ...inputForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('inputs')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Output Modal */}
      <Modal isOpen={activeModal === 'outputs'} onClose={() => setActiveModal(null)} title="Добавить выходные данные">
        <div className="space-y-4">
          <Textarea
            label="Описание"
            value={outputForm.outputDescription}
            onChange={(e) => setOutputForm({ ...outputForm, outputDescription: e.target.value })}
            placeholder="Описание выходных данных"
          />
          <Input
            label="Спецификация"
            value={outputForm.specification}
            onChange={(e) => setOutputForm({ ...outputForm, specification: e.target.value })}
            placeholder="Ссылка на спецификацию"
          />
          <Select
            label="Статус"
            value={outputForm.status}
            onChange={(e) => setOutputForm({ ...outputForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('outputs')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={activeModal === 'reviews'} onClose={() => setActiveModal(null)} title="Добавить ревью">
        <div className="space-y-4">
          <DateInput
            label="Дата ревью"
            value={reviewForm.reviewDate}
            onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })}
          />
          <Input
            label="Фаза ревью"
            value={reviewForm.reviewPhase}
            onChange={(e) => setReviewForm({ ...reviewForm, reviewPhase: e.target.value })}
            placeholder="Фаза проекта"
          />
          <Input
            label="Участники (через запятую)"
            value={reviewForm.participants}
            onChange={(e) => setReviewForm({ ...reviewForm, participants: e.target.value })}
            placeholder="Иванов И.И., Петров П.П."
          />
          <Textarea
            label="Замечания"
            value={reviewForm.findings}
            onChange={(e) => setReviewForm({ ...reviewForm, findings: e.target.value })}
            placeholder="Выявленные замечания"
          />
          <Textarea
            label="Выводы"
            value={reviewForm.conclusions}
            onChange={(e) => setReviewForm({ ...reviewForm, conclusions: e.target.value })}
            placeholder="Выводы по результатам ревью"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('reviews')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Verification Modal */}
      <Modal isOpen={activeModal === 'verifications'} onClose={() => setActiveModal(null)} title="Добавить верификацию">
        <div className="space-y-4">
          <Input
            label="Метод верификации"
            value={verificationForm.verificationMethod}
            onChange={(e) => setVerificationForm({ ...verificationForm, verificationMethod: e.target.value })}
            placeholder="Метод проверки"
          />
          <Textarea
            label="Результат"
            value={verificationForm.result}
            onChange={(e) => setVerificationForm({ ...verificationForm, result: e.target.value })}
            placeholder="Результат верификации"
          />
          <Input
            label="Доказательства"
            value={verificationForm.evidence}
            onChange={(e) => setVerificationForm({ ...verificationForm, evidence: e.target.value })}
            placeholder="Ссылка на доказательства"
          />
          <Select
            label="Статус"
            value={verificationForm.status}
            onChange={(e) => setVerificationForm({ ...verificationForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('verifications')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Validation Modal */}
      <Modal isOpen={activeModal === 'validations'} onClose={() => setActiveModal(null)} title="Добавить валидацию">
        <div className="space-y-4">
          <Input
            label="Метод валидации"
            value={validationForm.validationMethod}
            onChange={(e) => setValidationForm({ ...validationForm, validationMethod: e.target.value })}
            placeholder="Метод валидации"
          />
          <Textarea
            label="Результат"
            value={validationForm.result}
            onChange={(e) => setValidationForm({ ...validationForm, result: e.target.value })}
            placeholder="Результат валидации"
          />
          <Select
            label="Статус"
            value={validationForm.status}
            onChange={(e) => setValidationForm({ ...validationForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('validations')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={activeModal === 'transfers'} onClose={() => setActiveModal(null)} title="Добавить передачу">
        <div className="space-y-4">
          <DateInput
            label="Дата передачи"
            value={transferForm.transferDate}
            onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
          />
          <Textarea
            label="Процесс передачи"
            value={transferForm.transferProcess}
            onChange={(e) => setTransferForm({ ...transferForm, transferProcess: e.target.value })}
            placeholder="Описание процесса передачи"
          />
          <Select
            label="Статус"
            value={transferForm.status}
            onChange={(e) => setTransferForm({ ...transferForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('transfers')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      {/* Change Modal */}
      <Modal isOpen={activeModal === 'changes'} onClose={() => setActiveModal(null)} title="Добавить изменение">
        <div className="space-y-4">
          <Input
            label="Номер изменения"
            value={changeForm.changeNumber}
            onChange={(e) => setChangeForm({ ...changeForm, changeNumber: e.target.value })}
            placeholder="DCN-001"
          />
          <Textarea
            label="Описание изменения"
            value={changeForm.changeDescription}
            onChange={(e) => setChangeForm({ ...changeForm, changeDescription: e.target.value })}
            placeholder="Описание изменения"
          />
          <Textarea
            label="Причина"
            value={changeForm.reason}
            onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
            placeholder="Причина изменения"
          />
          <Select
            label="Статус"
            value={changeForm.status}
            onChange={(e) => setChangeForm({ ...changeForm, status: e.target.value })}
            options={statusOptions}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Отмена</Button>
            <Button className="flex-1" onClick={() => handleSubmitSection('changes')} loading={submitting}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DesignDetailPage
