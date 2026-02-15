

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Select, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'

const ValidationFormPage = () => {
  const navigate = useNavigate()

  const [processName, setProcessName] = useState('')
  const [scope, setScope] = useState('')
  const [validationType, setValidationType] = useState('IQ')
  const [responsibleId, setResponsibleId] = useState('')
  const [startDate, setStartDate] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!processName.trim()) {
      setError('Укажите наименование процесса')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.post('/process-validations', {
        processName: processName.trim(),
        scope: scope.trim() || undefined,
        validationType,
        responsibleId: responsibleId ? parseInt(responsibleId) : undefined,
        startDate: startDate || undefined,
      })
      navigate('/validation')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/validation')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Новая валидация</h1>
          <p className="text-slate-400 text-sm">Создание валидации процесса</p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="space-y-4">
          <Input
            label="Наименование процесса *"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            placeholder="Например: Стерилизация, Литьё, Сборка"
          />

          <Textarea
            label="Область (scope)"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Опишите область валидации..."
          />

          <Select
            label="Тип валидации *"
            value={validationType}
            onChange={(e) => setValidationType(e.target.value)}
            options={[
              { value: 'IQ', label: 'IQ (квалификация монтажа)' },
              { value: 'OQ', label: 'OQ (операционная квалификация)' },
              { value: 'PQ', label: 'PQ (эксплуатационная квалификация)' },
            ]}
          />

          <Input
            label="ID ответственного"
            type="number"
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            placeholder="ID сотрудника"
            min="1"
          />

          <Input
            label="Дата начала"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => navigate('/validation')}>
          Отмена
        </Button>
        <Button
          className="flex-1"
          icon={<Save size={18} />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!processName.trim()}
        >
          Создать
        </Button>
      </div>
    </div>
  )
}

export default ValidationFormPage
