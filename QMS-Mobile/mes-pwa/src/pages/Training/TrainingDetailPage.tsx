import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Clock,
  User,
  Award,
} from 'lucide-react'
import { Card, Button, Badge, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, TRAINING_TYPE_LABELS } from '../../config'
import type { TrainingRecord } from '../../types'

const TrainingDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [record, setRecord] = useState<TrainingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecord()
  }, [id])

  const loadRecord = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/training/records', { params: { id } })
      const items = Array.isArray(data) ? data : data.rows || []
      const found = items.find((r: TrainingRecord) => r.id === Number(id)) || items[0] || null
      setRecord(found)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка записи..." />
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/training')}>
          Назад
        </Button>
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error || 'Запись не найдена'}</p>
          <Button variant="outline" onClick={loadRecord}>Повторить</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/training')}>
        Назад
      </Button>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <GraduationCap size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary" size="sm">
                {TRAINING_TYPE_LABELS[record.type] || record.type}
              </Badge>
              <Badge variant={STATUS_COLORS[record.status] || 'neutral'}>
                {STATUS_LABELS[record.status] || record.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-2">{record.title}</h1>
            {record.description && (
              <p className="text-slate-400 text-sm">{record.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">
          <Calendar size={18} className="inline mr-2" />
          Детали обучения
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Дата обучения</span>
            <span>{new Date(record.trainingDate).toLocaleDateString('ru-RU')}</span>
          </div>
          {record.duration && (
            <div className="flex justify-between">
              <span className="text-slate-400">
                <Clock size={14} className="inline mr-1" />
                Продолжительность
              </span>
              <span>{record.duration} ч.</span>
            </div>
          )}
          {record.provider && (
            <div className="flex justify-between">
              <span className="text-slate-400">Провайдер</span>
              <span>{record.provider}</span>
            </div>
          )}
          {record.certificateNumber && (
            <div className="flex justify-between">
              <span className="text-slate-400">
                <Award size={14} className="inline mr-1" />
                Номер сертификата
              </span>
              <span className="font-mono">{record.certificateNumber}</span>
            </div>
          )}
          {record.expiryDate && (
            <div className="flex justify-between">
              <span className="text-slate-400">Срок действия</span>
              <span>{new Date(record.expiryDate).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* User info */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">
          <User size={18} className="inline mr-2" />
          Участник и инструктор
        </h2>
        <div className="space-y-2 text-sm">
          {record.user && (
            <div className="flex justify-between">
              <span className="text-slate-400">Обучающийся</span>
              <span>{record.user.surname} {record.user.name}</span>
            </div>
          )}
          {record.trainer && (
            <div className="flex justify-between">
              <span className="text-slate-400">Инструктор</span>
              <span>{record.trainer.surname} {record.trainer.name}</span>
            </div>
          )}
          {record.competency && (
            <div className="flex justify-between">
              <span className="text-slate-400">Компетенция</span>
              <span>{record.competency}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default TrainingDetailPage
