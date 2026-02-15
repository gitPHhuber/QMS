

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Users,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Select, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, AUDIT_TYPE_LABELS } from '../../config'
import type { AuditSchedule, AuditFinding } from '../../types'

const FINDING_TYPE_LABELS: Record<string, string> = {
  NC: 'Несоответствие',
  OBSERVATION: 'Наблюдение',
}

const FINDING_TYPE_COLORS: Record<string, 'danger' | 'warning'> = {
  NC: 'danger',
  OBSERVATION: 'warning',
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критическое',
  MAJOR: 'Значительное',
  MINOR: 'Незначительное',
}

const AuditDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [schedule, setSchedule] = useState<AuditSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showFindingModal, setShowFindingModal] = useState(false)
  const [findingType, setFindingType] = useState('NC')
  const [findingDescription, setFindingDescription] = useState('')
  const [findingSeverity, setFindingSeverity] = useState('MAJOR')
  const [submitting, setSubmitting] = useState(false)

  const [capaCreating, setCapaCreating] = useState<number | null>(null)

  useEffect(() => {
    if (id) loadSchedule()
  }, [id])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/internal-audit/schedules/${id}`)
      setSchedule(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAddFinding = async () => {
    if (!findingDescription.trim()) return
    try {
      setSubmitting(true)
      await api.post(`/internal-audit/schedules/${id}/findings`, {
        findingType,
        description: findingDescription.trim(),
        severity: findingSeverity,
      })
      setShowFindingModal(false)
      setFindingDescription('')
      setFindingType('NC')
      setFindingSeverity('MAJOR')
      loadSchedule()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateCapa = async (findingId: number) => {
    try {
      setCapaCreating(findingId)
      await api.post(`/internal-audit/findings/${findingId}/create-capa`)
      loadSchedule()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setCapaCreating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Аудит не найден'}</p>
        <Button variant="outline" onClick={() => navigate('/audit')}>Назад к списку</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/audit')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {schedule.area || 'Аудит'} #{schedule.id}
          </h1>
          <p className="text-slate-400 text-sm">Детали аудита</p>
        </div>
      </div>

      {/* Main info card */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={STATUS_COLORS[schedule.auditType] || 'primary'}>
            {AUDIT_TYPE_LABELS[schedule.auditType] || schedule.auditType}
          </Badge>
          <Badge variant={STATUS_COLORS[schedule.status] || 'neutral'}>
            {STATUS_LABELS[schedule.status] || schedule.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Запланированная дата</p>
              <p className="font-medium">
                {new Date(schedule.scheduledDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {schedule.actualDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Фактическая дата</p>
                <p className="font-medium">
                  {new Date(schedule.actualDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {schedule.area && (
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Область</p>
                <p className="font-medium truncate">{schedule.area}</p>
              </div>
            </div>
          )}

          {schedule.department && (
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Подразделение</p>
                <p className="font-medium truncate">{schedule.department}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Auditors card */}
      {schedule.auditors && schedule.auditors.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            Аудиторы
          </h2>
          <div className="space-y-2">
            {schedule.auditors.map((auditor, index) => (
              <div key={index} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary text-sm font-medium">
                    {auditor.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-medium truncate">{auditor}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Findings card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-500" />
            Замечания
            {schedule.findings && schedule.findings.length > 0 && (
              <Badge variant="warning" size="sm">{schedule.findings.length}</Badge>
            )}
          </h2>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowFindingModal(true)}>
            Добавить
          </Button>
        </div>

        {schedule.findings && schedule.findings.length > 0 ? (
          <div className="space-y-3">
            {schedule.findings.map((finding: AuditFinding) => (
              <div
                key={finding.id}
                className="p-3 bg-surface-light rounded-xl border border-slate-700/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={FINDING_TYPE_COLORS[finding.findingType] || 'warning'}
                    size="sm"
                  >
                    {FINDING_TYPE_LABELS[finding.findingType] || finding.findingType}
                  </Badge>
                  <Badge
                    variant={STATUS_COLORS[finding.severity] || 'neutral'}
                    size="sm"
                  >
                    {SEVERITY_LABELS[finding.severity] || finding.severity}
                  </Badge>
                  <Badge
                    variant={STATUS_COLORS[finding.status] || 'neutral'}
                    size="sm"
                  >
                    {STATUS_LABELS[finding.status] || finding.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {new Date(finding.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {!finding.capaId && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<ShieldAlert size={14} />}
                      onClick={() => handleCreateCapa(finding.id)}
                      loading={capaCreating === finding.id}
                    >
                      Создать CAPA из замечания
                    </Button>
                  )}
                  {finding.capaId && (
                    <Badge variant="success" size="sm">CAPA #{finding.capaId}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Замечания не зарегистрированы</p>
        )}
      </Card>

      {/* Add Finding Modal */}
      <Modal
        isOpen={showFindingModal}
        onClose={() => setShowFindingModal(false)}
        title="Новое замечание"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Тип замечания"
            value={findingType}
            onChange={(e) => setFindingType(e.target.value)}
            options={[
              { value: 'NC', label: 'Несоответствие (NC)' },
              { value: 'OBSERVATION', label: 'Наблюдение' },
            ]}
          />

          <Textarea
            label="Описание"
            value={findingDescription}
            onChange={(e) => setFindingDescription(e.target.value)}
            placeholder="Опишите замечание..."
          />

          <Select
            label="Серьёзность"
            value={findingSeverity}
            onChange={(e) => setFindingSeverity(e.target.value)}
            options={[
              { value: 'CRITICAL', label: 'Критическое' },
              { value: 'MAJOR', label: 'Значительное' },
              { value: 'MINOR', label: 'Незначительное' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowFindingModal(false)}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddFinding}
              loading={submitting}
              disabled={!findingDescription.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AuditDetailPage
