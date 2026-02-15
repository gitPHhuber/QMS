

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Edit,
  Upload,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, DOCUMENT_TYPE_LABELS } from '../../config'
import type { QmsDocument, DocumentVersion, DocumentApproval } from '../../types'

const DECISION_COLORS: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  RETURNED: 'warning',
}

const DECISION_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  APPROVED: 'Утверждён',
  REJECTED: 'Отклонён',
  RETURNED: 'Возвращён',
}

const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [document, setDocument] = useState<QmsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED' | 'RETURNED'>('APPROVED')
  const [decisionComment, setDecisionComment] = useState('')
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null)

  const [creatingVersion, setCreatingVersion] = useState(false)

  useEffect(() => {
    if (id) loadDocument()
  }, [id])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/documents/${id}`)
      setDocument(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const toggleVersion = (versionId: number) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev)
      if (next.has(versionId)) next.delete(versionId)
      else next.add(versionId)
      return next
    })
  }

  const openDecisionModal = (approvalId: number, decision: 'APPROVED' | 'REJECTED' | 'RETURNED') => {
    setSelectedApprovalId(approvalId)
    setDecisionType(decision)
    setDecisionComment('')
    setShowDecisionModal(true)
  }

  const handleDecision = async () => {
    if (!selectedApprovalId) return
    try {
      setSubmitting(true)
      await api.post(`/documents/approvals/${selectedApprovalId}/decide`, {
        decision: decisionType,
        comment: decisionComment || undefined,
      })
      setShowDecisionModal(false)
      loadDocument()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateVersion = async () => {
    try {
      setCreatingVersion(true)
      await api.post(`/documents/${id}/versions`)
      loadDocument()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setCreatingVersion(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Документ не найден'}</p>
        <Button variant="outline" onClick={() => navigate('/documents')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/documents')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{document.title}</h1>
          <p className="text-slate-400 text-sm font-mono truncate">{document.code}</p>
        </div>
        {document.status === 'DRAFT' && (
          <Button variant="ghost" icon={<Edit size={18} />} onClick={() => navigate(`/documents/${id}/edit`)}>
            <span className="hidden sm:inline">Редактировать</span>
          </Button>
        )}
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <FileText size={28} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{document.title}</h2>
            <p className="text-sm text-slate-400 font-mono">{document.code}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={STATUS_COLORS[document.status] || 'neutral'}>
            {STATUS_LABELS[document.status] || document.status}
          </Badge>
          <Badge variant="neutral">
            {DOCUMENT_TYPE_LABELS[document.type] || document.type}
          </Badge>
        </div>

        {document.isoSection && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Tag size={14} className="shrink-0" />
            <span>ISO раздел: {document.isoSection}</span>
          </div>
        )}

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {document.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Owner & Dates */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Владелец и сроки</h2>
        <div className="space-y-4">
          {document.owner && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Владелец</p>
                <p className="font-medium truncate">{document.owner.surname} {document.owner.name}</p>
              </div>
            </div>
          )}
          {document.effectiveDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Дата вступления в силу</p>
                <p className="font-medium">{new Date(document.effectiveDate).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
          )}
          {document.nextReviewDate && (
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Следующий пересмотр</p>
                <p className={`font-medium ${new Date(document.nextReviewDate) < new Date() ? 'text-danger' : ''}`}>
                  {new Date(document.nextReviewDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          )}
          {document.reviewCycleMonths && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Цикл пересмотра</p>
                <p className="font-medium">{document.reviewCycleMonths} мес.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-5">
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            icon={<Plus size={18} />}
            onClick={handleCreateVersion}
            loading={creatingVersion}
          >
            Новая версия
          </Button>
          <Button
            icon={<Upload size={18} />}
            onClick={() => navigate(`/documents/${id}/upload`)}
          >
            Загрузить файл
          </Button>
        </div>
      </Card>

      {/* Versions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Версии документа</h2>
        {document.versions && document.versions.length > 0 ? (
          <div className="space-y-3">
            {document.versions.map((version: DocumentVersion) => (
              <div key={version.id} className="border border-slate-700/50 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-light/30 transition-all"
                  onClick={() => toggleVersion(version.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">v{version.versionNumber}</span>
                      <Badge variant={STATUS_COLORS[version.status] || 'neutral'} size="sm">
                        {STATUS_LABELS[version.status] || version.status}
                      </Badge>
                    </div>
                    {version.changeDescription && (
                      <p className="text-sm text-slate-400 truncate">{version.changeDescription}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{new Date(version.createdAt).toLocaleDateString('ru-RU')}</span>
                      {version.createdBy && (
                        <>
                          <span>·</span>
                          <span>{version.createdBy.surname} {version.createdBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {expandedVersions.has(version.id) ? (
                      <ChevronUp size={18} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-500" />
                    )}
                  </div>
                </div>

                {expandedVersions.has(version.id) && version.approvals && version.approvals.length > 0 && (
                  <div className="border-t border-slate-700/50 p-3 space-y-2 bg-surface-light/20">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Цепочка согласования</p>
                    {version.approvals.map((approval: DocumentApproval) => (
                      <div key={approval.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{approval.role}</span>
                            <Badge variant={DECISION_COLORS[approval.decision] || 'neutral'} size="sm">
                              {DECISION_LABELS[approval.decision] || approval.decision}
                            </Badge>
                          </div>
                          {approval.assignedTo && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {approval.assignedTo.surname} {approval.assignedTo.name}
                            </p>
                          )}
                          {approval.comment && (
                            <p className="text-xs text-slate-400 mt-1 italic">{approval.comment}</p>
                          )}
                        </div>
                        {approval.decision === 'PENDING' && (
                          <div className="flex gap-1.5 shrink-0 ml-2">
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircle2 size={14} />}
                              onClick={(e) => { e.stopPropagation(); openDecisionModal(approval.id, 'APPROVED') }}
                            >
                              Утвердить
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<XCircle size={14} />}
                              onClick={(e) => { e.stopPropagation(); openDecisionModal(approval.id, 'REJECTED') }}
                            >
                              Отклонить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<RotateCcw size={14} />}
                              onClick={(e) => { e.stopPropagation(); openDecisionModal(approval.id, 'RETURNED') }}
                            >
                              Вернуть
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Нет версий</p>
        )}
      </Card>

      {/* Decision Modal */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title={
          decisionType === 'APPROVED' ? 'Утверждение' :
          decisionType === 'REJECTED' ? 'Отклонение' : 'Возврат'
        }
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Комментарий"
            value={decisionComment}
            onChange={(e) => setDecisionComment(e.target.value)}
            placeholder="Введите комментарий (опционально)"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDecisionModal(false)}>
              Отмена
            </Button>
            <Button
              variant={decisionType === 'APPROVED' ? 'success' : decisionType === 'REJECTED' ? 'danger' : 'primary'}
              className="flex-1"
              onClick={handleDecision}
              loading={submitting}
            >
              {decisionType === 'APPROVED' ? 'Утвердить' :
               decisionType === 'REJECTED' ? 'Отклонить' : 'Вернуть'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentDetailPage
