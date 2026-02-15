


import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Edit,
  XCircle,
  Plus,
  FileText,
  ClipboardList,
  Package,
  Wrench,
  User,
  Calendar,
  ChevronRight,
  Info,
  Search,
} from 'lucide-react'
import { Card, Button, Badge, Loader, ConfirmDialog } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, NC_SOURCE_LABELS } from '../../config'
import type { Nonconformity } from '../../types'

const DISPOSITION_LABELS: Record<string, string> = {
  USE_AS_IS: 'Использовать как есть',
  REWORK: 'Переработка',
  REPAIR: 'Ремонт',
  SCRAP: 'Утилизация',
  RETURN_TO_SUPPLIER: 'Возврат поставщику',
  CONCESSION: 'Отступление',
}

const NcDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [nc, setNc] = useState<Nonconformity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (id) loadNc()
  }, [id])

  const loadNc = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/nc/${id}`)
      setNc(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    try {
      setClosing(true)
      await api.post(`/nc/${id}/close`)
      setShowCloseDialog(false)
      loadNc()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setClosing(false)
    }
  }

  const getClassificationBadge = (classification: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'neutral'> = {
      CRITICAL: 'danger',
      MAJOR: 'warning',
      MINOR: 'neutral',
    }
    return (
      <Badge variant={variants[classification] || 'neutral'}>
        {STATUS_LABELS[classification] || classification}
      </Badge>
    )
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error || !nc) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Несоответствие не найдено'}</p>
        <Button variant="outline" onClick={() => navigate('/nc')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/nc')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{nc.number}</h1>
          <p className="text-slate-400 text-sm truncate">{nc.title}</p>
        </div>
        <Button variant="ghost" icon={<Edit size={18} />} onClick={() => navigate(`/nc/${id}/edit`)}>
          <span className="hidden sm:inline">Редактировать</span>
        </Button>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-danger/20 flex items-center justify-center">
            <AlertTriangle size={28} className="text-danger" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{nc.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getClassificationBadge(nc.classification)}
              <Badge variant={STATUS_COLORS[nc.status] || 'neutral'}>
                {STATUS_LABELS[nc.status] || nc.status}
              </Badge>
            </div>
          </div>
        </div>
        {nc.description && (
          <p className="text-slate-300 text-sm leading-relaxed">{nc.description}</p>
        )}
      </Card>

      {/* Details */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Info size={18} className="text-slate-500" />
          Детали
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Источник</p>
              <p className="font-medium">{NC_SOURCE_LABELS[nc.source] || nc.source}</p>
            </div>
          </div>

          {nc.disposition && (
            <div className="flex items-center gap-3">
              <ClipboardList size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Решение (диспозиция)</p>
                <p className="font-medium">{DISPOSITION_LABELS[nc.disposition] || nc.disposition}</p>
              </div>
            </div>
          )}

          {nc.productType && (
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Тип продукта</p>
                <p className="font-medium truncate">{nc.productType}</p>
              </div>
            </div>
          )}

          {nc.productSerialNumber && (
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Серийный номер</p>
                <p className="font-medium truncate">{nc.productSerialNumber}</p>
              </div>
            </div>
          )}

          {nc.lotNumber && (
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Номер партии</p>
                <p className="font-medium truncate">{nc.lotNumber}</p>
              </div>
            </div>
          )}

          {nc.processName && (
            <div className="flex items-center gap-3">
              <Wrench size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Процесс</p>
                <p className="font-medium truncate">{nc.processName}</p>
              </div>
            </div>
          )}

          {nc.supplierName && (
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Поставщик</p>
                <p className="font-medium truncate">{nc.supplierName}</p>
              </div>
            </div>
          )}

          {nc.assignedTo && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Ответственный</p>
                <p className="font-medium truncate">{nc.assignedTo.surname} {nc.assignedTo.name}</p>
              </div>
            </div>
          )}

          {nc.reportedBy && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Инициатор</p>
                <p className="font-medium truncate">{nc.reportedBy.surname} {nc.reportedBy.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Дата создания</p>
              <p className="font-medium">
                {new Date(nc.createdAt).toLocaleDateString('ru-RU', {
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

      {/* Root cause */}
      {(nc.rootCause || nc.rootCauseMethod || nc.immediateAction) && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Search size={18} className="text-slate-500" />
            Анализ причин
          </h2>
          <div className="space-y-4">
            {nc.immediateAction && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Немедленное действие</p>
                <p className="text-slate-300 text-sm leading-relaxed">{nc.immediateAction}</p>
              </div>
            )}
            {nc.rootCause && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Коренная причина</p>
                <p className="text-slate-300 text-sm leading-relaxed">{nc.rootCause}</p>
              </div>
            )}
            {nc.rootCauseMethod && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Метод анализа</p>
                <p className="text-slate-300 text-sm leading-relaxed">{nc.rootCauseMethod}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Linked CAPAs */}
      {nc.capas && nc.capas.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-500" />
            Связанные CAPA ({nc.capas.length})
          </h2>
          <div className="space-y-2">
            {nc.capas.map((capa) => (
              <div
                key={capa.id}
                className="flex items-center justify-between py-3 px-3 rounded-xl bg-surface-light/50 cursor-pointer hover:bg-surface-light transition-all"
                onClick={() => navigate(`/capa/${capa.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{capa.number}</span>
                    <Badge
                      variant={capa.type === 'CORRECTIVE' ? 'primary' : 'warning'}
                      size="sm"
                    >
                      {capa.type === 'CORRECTIVE' ? 'Корректирующее' : 'Предупреждающее'}
                    </Badge>
                  </div>
                  <p className="font-medium truncate text-sm">{capa.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_COLORS[capa.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[capa.status] || capa.status}
                  </Badge>
                  <ChevronRight size={16} className="text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {nc.status !== 'CLOSED' && (
          <>
            <Button
              variant="danger"
              className="flex-1"
              icon={<XCircle size={18} />}
              onClick={() => setShowCloseDialog(true)}
            >
              Закрыть NC
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              icon={<Plus size={18} />}
              onClick={() => navigate(`/nc/${id}/create-capa`)}
            >
              Создать CAPA
            </Button>
          </>
        )}
      </div>

      {/* Close confirmation */}
      <ConfirmDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleClose}
        title="Закрытие несоответствия"
        message={`Вы уверены, что хотите закрыть несоответствие ${nc.number}? Это действие нельзя будет отменить.`}
        confirmText="Закрыть NC"
        cancelText="Отмена"
        variant="danger"
        loading={closing}
      />
    </div>
  )
}

export default NcDetailPage
