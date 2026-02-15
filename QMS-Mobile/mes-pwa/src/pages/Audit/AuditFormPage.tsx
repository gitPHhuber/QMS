

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Select, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { InternalAuditPlan } from '../../types'

const AuditFormPage = () => {
  const navigate = useNavigate()

  const [plans, setPlans] = useState<InternalAuditPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  const [auditPlanId, setAuditPlanId] = useState('')
  const [auditType, setAuditType] = useState('SYSTEM')
  const [scheduledDate, setScheduledDate] = useState('')
  const [area, setArea] = useState('')
  const [department, setDepartment] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoadingPlans(true)
      const { data } = await api.get('/internal-audit/plans', { params: { limit: 100 } })
      setPlans(Array.isArray(data) ? data : data.rows || [])
    } catch (err) {
      console.error('Ошибка загрузки планов:', getErrorMessage(err))
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleSubmit = async () => {
    if (!auditPlanId || !scheduledDate) {
      setError('Заполните обязательные поля: план аудита и дату')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.post('/internal-audit/schedules', {
        auditPlanId: parseInt(auditPlanId),
        auditType,
        scheduledDate,
        area: area.trim() || undefined,
        department: department.trim() || undefined,
      })
      navigate('/audit')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/audit')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Новый аудит</h1>
          <p className="text-slate-400 text-sm">Создание записи в расписании</p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="space-y-4">
          {loadingPlans ? (
            <div className="flex justify-center py-4">
              <Loader size="sm" text="Загрузка планов..." />
            </div>
          ) : (
            <Select
              label="План аудита *"
              value={auditPlanId}
              onChange={(e) => setAuditPlanId(e.target.value)}
              placeholder="Выберите план"
              options={plans.map((p) => ({
                value: String(p.id),
                label: `План ${p.year}${p.scope ? ' - ' + p.scope : ''}`,
              }))}
            />
          )}

          <Select
            label="Тип аудита *"
            value={auditType}
            onChange={(e) => setAuditType(e.target.value)}
            options={[
              { value: 'SYSTEM', label: 'Системный' },
              { value: 'PROCESS', label: 'Процессный' },
              { value: 'PRODUCT', label: 'Продуктовый' },
            ]}
          />

          <Input
            label="Дата проведения *"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />

          <Input
            label="Область"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Область аудита"
          />

          <Input
            label="Подразделение"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Наименование подразделения"
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/audit')}>
          Отмена
        </Button>
        <Button
          className="flex-1"
          icon={<Save size={18} />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!auditPlanId || !scheduledDate}
        >
          Создать
        </Button>
      </div>
    </div>
  )
}

export default AuditFormPage
