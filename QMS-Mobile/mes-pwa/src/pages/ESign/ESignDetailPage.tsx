

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PenTool,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { SignatureRequest, SignatureRequestSigner } from '../../types'

const SIGNER_STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  SIGNED: 'success',
  DECLINED: 'danger',
}

const SIGNER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  SIGNED: 'Подписано',
  DECLINED: 'Отклонено',
}

const ESignDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<SignatureRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showSignModal, setShowSignModal] = useState(false)
  const [password, setPassword] = useState('')
  const [signing, setSigning] = useState(false)

  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [selectedSignerId, setSelectedSignerId] = useState<number | null>(null)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    if (id) loadRequest()
  }, [id])

  const loadRequest = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/esign/requests/${id}`)
      setRequest(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getEntityLabel = (entityType: string): string => {
    const labels: Record<string, string> = {
      DOCUMENT: 'Документ',
      CHANGE_REQUEST: 'Запрос на изменение',
      CAPA: 'CAPA',
      NC: 'Несоответствие',
      AUDIT: 'Аудит',
    }
    return labels[entityType] || entityType
  }

  const handleSign = async () => {
    if (!request || !password.trim()) return

    try {
      setSigning(true)
      await api.post('/esign/sign', {
        entityType: request.entityType,
        entityId: request.entityId,
        password: password,
      })
      setShowSignModal(false)
      setPassword('')
      loadRequest()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSigning(false)
    }
  }

  const openDeclineModal = (signerId: number) => {
    setSelectedSignerId(signerId)
    setDeclineReason('')
    setShowDeclineModal(true)
  }

  const handleDecline = async () => {
    if (!selectedSignerId) return

    try {
      setDeclining(true)
      await api.post(`/esign/requests/signers/${selectedSignerId}/decline`, {
        reason: declineReason.trim() || undefined,
      })
      setShowDeclineModal(false)
      loadRequest()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setDeclining(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Запрос не найден'}</p>
        <Button variant="outline" onClick={() => navigate('/esign')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/esign')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">Запрос на подпись #{request.id}</h1>
          <p className="text-slate-400 text-sm">
            {getEntityLabel(request.entityType)} #{request.entityId}
          </p>
        </div>
      </div>

      {/* Main card */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <PenTool size={28} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">
              {getEntityLabel(request.entityType)} #{request.entityId}
            </h2>
            <Badge variant={STATUS_COLORS[request.status] || 'neutral'}>
              {STATUS_LABELS[request.status] || request.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {request.requestedBy && (
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Запрошено</p>
                <p className="text-sm font-medium">{request.requestedBy.surname} {request.requestedBy.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Дата создания</p>
              <p className="text-sm font-medium">
                {new Date(request.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {request.dueDate && (
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Срок</p>
                <p className={`text-sm font-medium ${new Date(request.dueDate) < new Date() ? 'text-danger' : ''}`}>
                  {new Date(request.dueDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Signers */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-slate-500" />
          Подписанты
        </h2>

        {request.signers && request.signers.length > 0 ? (
          <div className="space-y-3">
            {request.signers.map((signer: SignatureRequestSigner) => (
              <div key={signer.id} className="p-3 border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      signer.status === 'SIGNED' ? 'bg-success/20' :
                      signer.status === 'DECLINED' ? 'bg-danger/20' : 'bg-warning/20'
                    }`}>
                      {signer.status === 'SIGNED' ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : signer.status === 'DECLINED' ? (
                        <XCircle size={16} className="text-danger" />
                      ) : (
                        <Clock size={16} className="text-warning" />
                      )}
                    </div>
                    <div className="min-w-0">
                      {signer.user && (
                        <p className="text-sm font-medium truncate">
                          {signer.user.surname} {signer.user.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={SIGNER_STATUS_COLORS[signer.status] || 'neutral'} size="sm">
                    {SIGNER_STATUS_LABELS[signer.status] || signer.status}
                  </Badge>
                </div>

                {signer.signedAt && (
                  <p className="text-xs text-slate-500">
                    Подписано: {new Date(signer.signedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
                {signer.declinedAt && (
                  <p className="text-xs text-danger">
                    Отклонено: {new Date(signer.declinedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
                {signer.declineReason && (
                  <p className="text-xs text-slate-400 mt-1 italic">Причина: {signer.declineReason}</p>
                )}

                {signer.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      icon={<PenTool size={14} />}
                      className="flex-1"
                      onClick={() => setShowSignModal(true)}
                    >
                      Подписать
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XCircle size={14} />}
                      className="flex-1"
                      onClick={() => openDeclineModal(signer.id)}
                    >
                      Отклонить
                    </Button>
                  </div>
                )}

                {signer.status === 'SIGNED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={14} />}
                    className="mt-2"
                    onClick={() => navigate(`/esign/verify/${signer.id}`)}
                  >
                    Верифицировать подпись
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Нет подписантов</p>
        )}
      </Card>

      {/* Sign Modal */}
      <Modal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        title="Электронная подпись"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Для подтверждения подписи введите пароль вашей учётной записи.
          </p>
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            autoFocus
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowSignModal(false)}>
              Отмена
            </Button>
            <Button
              variant="success"
              className="flex-1"
              icon={<PenTool size={16} />}
              onClick={handleSign}
              loading={signing}
              disabled={!password.trim()}
            >
              Подписать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Modal */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Отклонение подписи"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Причина отклонения"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Укажите причину отклонения (опционально)"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeclineModal(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDecline}
              loading={declining}
            >
              Отклонить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ESignDetailPage
