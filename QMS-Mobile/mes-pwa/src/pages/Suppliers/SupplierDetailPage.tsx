import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Truck,
  Phone,
  Mail,
  MapPin,
  User,
  Plus,
  Star,
  ClipboardCheck,
  Award,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Select, Textarea, DateInput } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, SUPPLIER_TYPE_LABELS } from '../../config'
import type { Supplier, SupplierEvaluation, SupplierAuditRecord } from '../../types'

const SupplierDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showEvalModal, setShowEvalModal] = useState(false)
  const [evalForm, setEvalForm] = useState({
    score: '',
    qualityRating: '',
    deliveryRating: '',
    comments: '',
  })

  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditForm, setAuditForm] = useState({
    auditDate: '',
    auditType: 'PERIODIC',
    findings: '',
  })

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSupplier()
  }, [id])

  const loadSupplier = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/suppliers/${id}`)
      setSupplier(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить поставщика?')) return
    try {
      await api.delete(`/suppliers/${id}`)
      navigate('/suppliers')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleAddEvaluation = async () => {
    try {
      setSubmitting(true)
      await api.post(`/suppliers/${id}/evaluations`, {
        score: Number(evalForm.score),
        qualityRating: evalForm.qualityRating ? Number(evalForm.qualityRating) : undefined,
        deliveryRating: evalForm.deliveryRating ? Number(evalForm.deliveryRating) : undefined,
        comments: evalForm.comments || undefined,
      })
      setShowEvalModal(false)
      setEvalForm({ score: '', qualityRating: '', deliveryRating: '', comments: '' })
      loadSupplier()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAudit = async () => {
    try {
      setSubmitting(true)
      await api.post(`/suppliers/${id}/audits`, {
        auditDate: auditForm.auditDate,
        auditType: auditForm.auditType,
        findings: auditForm.findings || undefined,
      })
      setShowAuditModal(false)
      setAuditForm({ auditDate: '', auditType: 'PERIODIC', findings: '' })
      loadSupplier()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка поставщика..." />
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/suppliers')}>
          Назад
        </Button>
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error || 'Поставщик не найден'}</p>
          <Button variant="outline" onClick={loadSupplier}>Повторить</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/suppliers')}>
          Назад
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Edit size={18} />} onClick={() => navigate(`/suppliers/${id}/edit`)}>
            Редактировать
          </Button>
          <Button variant="danger" icon={<Trash2 size={18} />} onClick={handleDelete}>
            Удалить
          </Button>
        </div>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Truck size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-slate-500 font-mono">{supplier.code}</span>
              <Badge variant="primary" size="sm">
                {SUPPLIER_TYPE_LABELS[supplier.type] || supplier.type}
              </Badge>
              <Badge variant={STATUS_COLORS[supplier.status] || 'neutral'}>
                {STATUS_LABELS[supplier.status] || supplier.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-2">{supplier.name}</h1>
            {supplier.evaluationScore !== undefined && supplier.evaluationScore !== null && (
              <div className="flex items-center gap-2">
                <Star size={16} className="text-warning" />
                <span className="font-semibold">{supplier.evaluationScore}/100</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Contact info */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">Контактная информация</h2>
        <div className="space-y-3 text-sm">
          {supplier.contactPerson && (
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-400 shrink-0" />
              <span>{supplier.contactPerson}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <span>{supplier.address}</span>
            </div>
          )}
          {supplier.country && (
            <div className="flex justify-between">
              <span className="text-slate-400">Страна</span>
              <span>{supplier.country}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Certifications */}
      {supplier.certifications && supplier.certifications.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3">
            <Award size={18} className="inline mr-2" />
            Сертификации
          </h2>
          <div className="flex flex-wrap gap-2">
            {supplier.certifications.map((cert, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {cert}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Evaluations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            <Star size={18} className="inline mr-2" />
            Оценки
          </h2>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowEvalModal(true)}>
            Добавить
          </Button>
        </div>

        {supplier.evaluations && supplier.evaluations.length > 0 ? (
          <div className="space-y-3">
            {supplier.evaluations.map((evaluation: SupplierEvaluation) => (
              <div key={evaluation.id} className="p-3 bg-surface-light rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="text-lg font-bold">{evaluation.score}/100</span>
                </div>
                <div className="space-y-1 text-sm">
                  {evaluation.qualityRating !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Качество</span>
                      <span>{evaluation.qualityRating}/100</span>
                    </div>
                  )}
                  {evaluation.deliveryRating !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Доставка</span>
                      <span>{evaluation.deliveryRating}/100</span>
                    </div>
                  )}
                  {evaluation.comments && (
                    <p className="text-slate-400 mt-2">{evaluation.comments}</p>
                  )}
                  {evaluation.evaluatedBy && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Оценил</span>
                      <span>{evaluation.evaluatedBy.surname} {evaluation.evaluatedBy.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">Оценки отсутствуют</p>
        )}
      </Card>

      {/* Audit records */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            <ClipboardCheck size={18} className="inline mr-2" />
            Аудиты
          </h2>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAuditModal(true)}>
            Добавить
          </Button>
        </div>

        {supplier.audits && supplier.audits.length > 0 ? (
          <div className="space-y-3">
            {supplier.audits.map((audit: SupplierAuditRecord) => (
              <div key={audit.id} className="p-3 bg-surface-light rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {new Date(audit.auditDate).toLocaleDateString('ru-RU')}
                  </span>
                  <Badge variant={STATUS_COLORS[audit.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[audit.status] || audit.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Тип</span>
                    <span>
                      {audit.auditType === 'INITIAL' ? 'Первичный' :
                       audit.auditType === 'PERIODIC' ? 'Периодический' :
                       audit.auditType === 'CAUSE' ? 'По причине' : audit.auditType}
                    </span>
                  </div>
                  {audit.findings && (
                    <p className="text-slate-400 mt-2">{audit.findings}</p>
                  )}
                  {audit.auditedBy && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Аудитор</span>
                      <span>{audit.auditedBy.surname} {audit.auditedBy.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">Аудиты отсутствуют</p>
        )}
      </Card>

      {/* Evaluation Modal */}
      <Modal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        title="Новая оценка поставщика"
      >
        <div className="space-y-4">
          <Input
            label="Общий балл (0-100)"
            type="number"
            min="0"
            max="100"
            value={evalForm.score}
            onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
            placeholder="0-100"
          />
          <Input
            label="Оценка качества (0-100)"
            type="number"
            min="0"
            max="100"
            value={evalForm.qualityRating}
            onChange={(e) => setEvalForm({ ...evalForm, qualityRating: e.target.value })}
            placeholder="0-100"
          />
          <Input
            label="Оценка доставки (0-100)"
            type="number"
            min="0"
            max="100"
            value={evalForm.deliveryRating}
            onChange={(e) => setEvalForm({ ...evalForm, deliveryRating: e.target.value })}
            placeholder="0-100"
          />
          <Textarea
            label="Комментарии"
            value={evalForm.comments}
            onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
            placeholder="Комментарии к оценке"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEvalModal(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAddEvaluation} loading={submitting}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Audit Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Новый аудит поставщика"
      >
        <div className="space-y-4">
          <DateInput
            label="Дата аудита"
            value={auditForm.auditDate}
            onChange={(e) => setAuditForm({ ...auditForm, auditDate: e.target.value })}
          />
          <Select
            label="Тип аудита"
            value={auditForm.auditType}
            onChange={(e) => setAuditForm({ ...auditForm, auditType: e.target.value })}
            options={[
              { value: 'INITIAL', label: 'Первичный' },
              { value: 'PERIODIC', label: 'Периодический' },
              { value: 'CAUSE', label: 'По причине' },
            ]}
          />
          <Textarea
            label="Результаты"
            value={auditForm.findings}
            onChange={(e) => setAuditForm({ ...auditForm, findings: e.target.value })}
            placeholder="Результаты и замечания аудита"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAuditModal(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAddAudit} loading={submitting}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SupplierDetailPage
