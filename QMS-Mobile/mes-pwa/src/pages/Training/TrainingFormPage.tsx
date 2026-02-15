import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Select, Textarea, DateInput } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { TRAINING_TYPE_LABELS } from '../../config'

const TrainingFormPage = () => {
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    userId: '',
    title: '',
    description: '',
    type: 'INITIAL',
    trainingDate: '',
    duration: '',
    provider: '',
    certificateNumber: '',
    expiryDate: '',
  })

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        userId: Number(form.userId),
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        trainingDate: form.trainingDate,
        duration: form.duration ? Number(form.duration) : undefined,
        provider: form.provider || undefined,
        certificateNumber: form.certificateNumber || undefined,
        expiryDate: form.expiryDate || undefined,
      }

      const { data } = await api.post('/training/records', payload)
      navigate(`/training/${data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const typeOptions = Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/training')}>
          Назад
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Новая запись обучения</h1>
        <p className="text-slate-400 text-sm">Заполните данные о прохождении обучения</p>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="space-y-4">
          <Input
            label="ID пользователя"
            type="number"
            value={form.userId}
            onChange={(e) => updateField('userId', e.target.value)}
            placeholder="ID обучающегося"
          />
          <Input
            label="Название"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Тема обучения"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Описание обучения"
          />
          <Select
            label="Тип обучения"
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={typeOptions}
          />
          <DateInput
            label="Дата обучения"
            value={form.trainingDate}
            onChange={(e) => updateField('trainingDate', e.target.value)}
          />
          <Input
            label="Продолжительность (часы)"
            type="number"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            placeholder="8"
          />
          <Input
            label="Провайдер"
            value={form.provider}
            onChange={(e) => updateField('provider', e.target.value)}
            placeholder="Организация-провайдер"
          />
          <Input
            label="Номер сертификата"
            value={form.certificateNumber}
            onChange={(e) => updateField('certificateNumber', e.target.value)}
            placeholder="Номер сертификата"
          />
          <DateInput
            label="Срок действия"
            value={form.expiryDate}
            onChange={(e) => updateField('expiryDate', e.target.value)}
          />
        </div>
      </Card>

      <Button
        fullWidth
        icon={<Save size={18} />}
        onClick={handleSubmit}
        loading={submitting}
      >
        Создать запись
      </Button>
    </div>
  )
}

export default TrainingFormPage
