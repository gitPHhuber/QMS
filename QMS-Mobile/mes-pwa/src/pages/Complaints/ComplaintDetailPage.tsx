

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  MessageSquareWarning,
  User,
  Package,
  Search as SearchIcon,
  ShieldAlert,
  Calendar,
  MapPin,
  AlertTriangle,
  Send,
} from 'lucide-react'
import { Card, Button, Badge, Loader, ConfirmDialog } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { Complaint } from '../../types'

const SEVERITY_VARIANTS: Record<string, 'danger' | 'warning' | 'neutral' | 'primary'> = {
  CRITICAL: 'danger',
  MAJOR: 'warning',
  MINOR: 'neutral',
  INFORMATIONAL: 'primary',
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критическая',
  MAJOR: 'Значительная',
  MINOR: 'Незначительная',
  INFORMATIONAL: 'Информационная',
}

const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: 'Безопасность',
  PERFORMANCE: 'Производительность',
  LABELING: 'Маркировка',
  PACKAGING: 'Упаковка',
  DOCUMENTATION: 'Документация',
  DELIVERY: 'Доставка',
  SERVICE: 'Сервис',
  OTHER: 'Прочее',
}

const TYPE_LABELS: Record<string, string> = {
  COMPLAINT: 'Жалоба',
  RECLAMATION: 'Рекламация',
  FEEDBACK: 'Обратная связь',
}

const SOURCE_LABELS: Record<string, string> = {
  CUSTOMER: 'Заказчик',
  DISTRIBUTOR: 'Дистрибьютор',
  INTERNAL: 'Внутренний',
  REGULATOR: 'Регулятор',
  FIELD_REPORT: 'Полевой отчёт',
}

const VIGILANCE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  SUBMITTED: 'Подано',
  ACKNOWLEDGED: 'Подтверждено',
  CLOSED: 'Закрыто',
}

const formatDate = (date?: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const ComplaintDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVigilanceConfirm, setShowVigilanceConfirm] = useState(false)
  const [submittingVigilance, setSubmittingVigilance] = useState(false)

  useEffect(() => {
    if (id) loadComplaint()
  }, [id])

  const loadComplaint = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Complaint>(`/complaints/${id}`)
      setComplaint(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVigilanceSubmit = async () => {
    try {
      setSubmittingVigilance(true)
      await api.post(`/complaints/${id}/vigilance/submit`)
      setShowVigilanceConfirm(false)
      loadComplaint()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmittingVigilance(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Рекламация не найдена'}</p>
        <Button variant="outline" onClick={() => navigate('/complaints')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/complaints')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{complaint.complaintNumber}</h1>
          <p className="text-slate-400 text-sm truncate">{complaint.title}</p>
        </div>
        <Button
          variant="ghost"
          icon={<Edit size={18} />}
          onClick={() => navigate(`/complaints/${id}/edit`)}
        >
          <span className="hidden sm:inline">Редактировать</span>
        </Button>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
            <MessageSquareWarning size={24} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{complaint.title}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <span className="font-mono">{complaint.complaintNumber}</span>
              {complaint.complaintType && (
                <>
                  <span>•</span>
                  <span>{TYPE_LABELS[complaint.complaintType] || complaint.complaintType}</span>
                </>
              )}
              {complaint.source && (
                <>
                  <span>•</span>
                  <span>{SOURCE_LABELS[complaint.source] || complaint.source}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={SEVERITY_VARIANTS[complaint.severity] || 'neutral'} dot>
            {SEVERITY_LABELS[complaint.severity] || complaint.severity}
          </Badge>
          <Badge variant={STATUS_COLORS[complaint.status] || 'neutral'} dot>
            {STATUS_LABELS[complaint.status] || complaint.status}
          </Badge>
          {complaint.category && (
            <Badge variant="neutral">
              {CATEGORY_LABELS[complaint.category] || complaint.category}
            </Badge>
          )}
        </div>

        {complaint.description && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Описание</p>
            <p className="text-slate-200 whitespace-pre-wrap">{complaint.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700/50">
          {complaint.patientInvolved && (
            <Badge variant="danger" size="sm">Пациент вовлечён</Badge>
          )}
          {complaint.healthHazard && (
            <Badge variant="danger" size="sm">Угроза здоровью</Badge>
          )}
          {complaint.isReportable && (
            <Badge variant="warning" size="sm">Подлежит отчётности</Badge>
          )}
        </div>
      </Card>

      {/* Reporter info */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User size={18} className="text-slate-500" />
          Заявитель
        </h2>
        <div className="space-y-3">
          {complaint.reporterName && (
            <div>
              <p className="text-sm text-slate-400">Имя</p>
              <p className="font-medium">{complaint.reporterName}</p>
            </div>
          )}
          {complaint.reporterOrganization && (
            <div>
              <p className="text-sm text-slate-400">Организация</p>
              <p className="font-medium">{complaint.reporterOrganization}</p>
            </div>
          )}
          {complaint.reporterContact && (
            <div>
              <p className="text-sm text-slate-400">Контакт</p>
              <p className="font-medium">{complaint.reporterContact}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-slate-400">Дата получения</p>
              <p className="font-medium">{formatDate(complaint.receivedDate)}</p>
            </div>
            {complaint.eventDate && (
              <div>
                <p className="text-sm text-slate-400">Дата события</p>
                <p className="font-medium">{formatDate(complaint.eventDate)}</p>
              </div>
            )}
          </div>
          {complaint.countryOfOccurrence && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-500" />
              <div>
                <p className="text-sm text-slate-400">Страна</p>
                <p className="font-medium">{complaint.countryOfOccurrence}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Product info */}
      {(complaint.productName || complaint.productModel || complaint.serialNumber || complaint.lotNumber) && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Package size={18} className="text-slate-500" />
            Продукт
          </h2>
          <div className="space-y-3">
            {complaint.productName && (
              <div>
                <p className="text-sm text-slate-400">Наименование</p>
                <p className="font-medium">{complaint.productName}</p>
              </div>
            )}
            {complaint.productModel && (
              <div>
                <p className="text-sm text-slate-400">Модель</p>
                <p className="font-medium">{complaint.productModel}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {complaint.serialNumber && (
                <div>
                  <p className="text-sm text-slate-400">Серийный номер</p>
                  <p className="font-medium font-mono">{complaint.serialNumber}</p>
                </div>
              )}
              {complaint.lotNumber && (
                <div>
                  <p className="text-sm text-slate-400">Номер партии</p>
                  <p className="font-medium font-mono">{complaint.lotNumber}</p>
                </div>
              )}
            </div>
            {complaint.quantityAffected != null && (
              <div>
                <p className="text-sm text-slate-400">Затронутое количество</p>
                <p className="font-medium">{complaint.quantityAffected}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Investigation */}
      {(complaint.investigationSummary || complaint.rootCause || complaint.correctiveAction || complaint.preventiveAction) && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <SearchIcon size={18} className="text-slate-500" />
            Расследование
          </h2>
          <div className="space-y-4">
            {complaint.investigationSummary && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Резюме расследования</p>
                <p className="text-slate-200 whitespace-pre-wrap">{complaint.investigationSummary}</p>
              </div>
            )}
            {complaint.rootCause && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Корневая причина</p>
                <p className="text-slate-200 whitespace-pre-wrap">{complaint.rootCause}</p>
              </div>
            )}
            {complaint.correctiveAction && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Корректирующее действие</p>
                <p className="text-slate-200 whitespace-pre-wrap">{complaint.correctiveAction}</p>
              </div>
            )}
            {complaint.preventiveAction && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Предупреждающее действие</p>
                <p className="text-slate-200 whitespace-pre-wrap">{complaint.preventiveAction}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Vigilance */}
      {complaint.isReportable && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-warning" />
            Надзорная отчётность (Vigilance)
          </h2>
          <div className="space-y-3">
            {complaint.vigilanceStatus && (
              <div>
                <p className="text-sm text-slate-400">Статус</p>
                <Badge variant={STATUS_COLORS[complaint.vigilanceStatus] || 'warning'}>
                  {VIGILANCE_STATUS_LABELS[complaint.vigilanceStatus] || complaint.vigilanceStatus}
                </Badge>
              </div>
            )}
            {complaint.vigilanceReportNumber && (
              <div>
                <p className="text-sm text-slate-400">Номер отчёта</p>
                <p className="font-medium font-mono">{complaint.vigilanceReportNumber}</p>
              </div>
            )}
            {complaint.vigilanceDeadline && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Срок подачи</p>
                  <p className="font-medium">{formatDate(complaint.vigilanceDeadline)}</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-700/50">
              <Button
                variant="outline"
                icon={<Send size={16} />}
                onClick={() => setShowVigilanceConfirm(true)}
                disabled={complaint.vigilanceStatus === 'SUBMITTED'}
              >
                Отправить в надзорный орган
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Vigilance confirmation dialog */}
      <ConfirmDialog
        isOpen={showVigilanceConfirm}
        onClose={() => setShowVigilanceConfirm(false)}
        onConfirm={handleVigilanceSubmit}
        title="Отправка в надзорный орган"
        message="Вы уверены, что хотите отправить отчёт в надзорный орган? Это действие нельзя отменить."
        confirmText="Отправить"
        cancelText="Отмена"
        variant="primary"
        loading={submittingVigilance}
      />
    </div>
  )
}

export default ComplaintDetailPage
