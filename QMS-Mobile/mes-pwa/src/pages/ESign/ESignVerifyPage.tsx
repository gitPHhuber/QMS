

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  User,
  Clock,
  FileText,
} from 'lucide-react'
import { Card, Button, Badge, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { ESignature } from '../../types'

const VERIFICATION_COLORS: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  VALID: 'success',
  INVALIDATED: 'danger',
  EXPIRED: 'warning',
  SIGNED: 'success',
}

const VERIFICATION_LABELS: Record<string, string> = {
  VALID: 'Действительна',
  INVALIDATED: 'Недействительна',
  EXPIRED: 'Истекла',
  SIGNED: 'Подписано',
}

const ESignVerifyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [signature, setSignature] = useState<ESignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadSignature()
  }, [id])

  const loadSignature = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/esign/verify/${id}`)
      setSignature(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
      case 'SIGNED':
        return <ShieldCheck size={48} className="text-success" />
      case 'INVALIDATED':
        return <ShieldX size={48} className="text-danger" />
      case 'EXPIRED':
        return <ShieldAlert size={48} className="text-warning" />
      default:
        return <ShieldAlert size={48} className="text-slate-500" />
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'VALID':
      case 'SIGNED':
        return 'bg-success/20'
      case 'INVALIDATED':
        return 'bg-danger/20'
      case 'EXPIRED':
        return 'bg-warning/20'
      default:
        return 'bg-slate-600/20'
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Проверка подписи..." /></div>

  if (error || !signature) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Подпись не найдена'}</p>
        <Button variant="outline" onClick={() => navigate('/esign')}>Назад</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(-1 as any)} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Верификация подписи</h1>
          <p className="text-slate-400 text-sm">Проверка электронной подписи #{signature.id}</p>
        </div>
      </div>

      {/* Verification result */}
      <Card className="p-5">
        <div className="flex flex-col items-center text-center py-4">
          <div className={`w-20 h-20 rounded-2xl ${getStatusBg(signature.status)} flex items-center justify-center mb-4`}>
            {getStatusIcon(signature.status)}
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {signature.status === 'VALID' || signature.status === 'SIGNED'
              ? 'Подпись действительна'
              : signature.status === 'INVALIDATED'
              ? 'Подпись недействительна'
              : signature.status === 'EXPIRED'
              ? 'Подпись истекла'
              : 'Статус неизвестен'}
          </h2>
          <Badge variant={VERIFICATION_COLORS[signature.status] || 'neutral'}>
            {VERIFICATION_LABELS[signature.status] || signature.status}
          </Badge>
        </div>
      </Card>

      {/* Signature details */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Детали подписи</h2>
        <div className="space-y-4">
          {signature.signedBy && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Подписант</p>
                <p className="font-medium">{signature.signedBy.surname} {signature.signedBy.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Время подписания</p>
              <p className="font-medium">
                {new Date(signature.timestamp).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Объект</p>
              <p className="font-medium">{signature.entityType} #{signature.entityId}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Certificate info */}
      {signature.certificateInfo && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-500" />
            Информация о сертификате
          </h2>
          <div className="p-3 bg-surface-light rounded-xl">
            <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
              {signature.certificateInfo}
            </p>
          </div>
        </Card>
      )}

      <Button
        variant="outline"
        fullWidth
        onClick={() => navigate('/esign')}
      >
        Вернуться к запросам
      </Button>
    </div>
  )
}

export default ESignVerifyPage
