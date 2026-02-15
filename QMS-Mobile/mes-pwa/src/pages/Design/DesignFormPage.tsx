import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Textarea, DateInput, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { DesignProject } from '../../types'

const DesignFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    deviceType: '',
    startDate: '',
    plannedCompletionDate: '',
  })

  useEffect(() => {
    if (isEdit) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<DesignProject>(`/design/${id}`)
      setForm({
        code: data.code || '',
        title: data.title || '',
        description: data.description || '',
        deviceType: data.deviceType || '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        plannedCompletionDate: data.plannedCompletionDate ? data.plannedCompletionDate.split('T')[0] : '',
      })
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        code: form.code,
        title: form.title,
        description: form.description || undefined,
        deviceType: form.deviceType || undefined,
        startDate: form.startDate || undefined,
        plannedCompletionDate: form.plannedCompletionDate || undefined,
      }

      if (isEdit) {
        await api.put(`/design/${id}`, payload)
        navigate(`/design/${id}`)
      } else {
        const { data } = await api.post('/design', payload)
        navigate(`/design/${data.id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(isEdit ? `/design/${id}` : '/design')}>
          Назад
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Редактировать проект' : 'Новый проект'}</h1>
        <p className="text-slate-400 text-sm">
          {isEdit ? 'Измените данные проекта' : 'Заполните данные нового проекта разработки'}
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="space-y-4">
          <Input
            label="Код"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="DC-001"
          />
          <Input
            label="Название"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Название проекта"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Описание проекта разработки"
          />
          <Input
            label="Тип устройства"
            value={form.deviceType}
            onChange={(e) => updateField('deviceType', e.target.value)}
            placeholder="Тип медицинского изделия"
          />
          <DateInput
            label="Дата начала"
            value={form.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
          <DateInput
            label="Плановая дата завершения"
            value={form.plannedCompletionDate}
            onChange={(e) => updateField('plannedCompletionDate', e.target.value)}
          />
        </div>
      </Card>

      <Button
        fullWidth
        icon={<Save size={18} />}
        onClick={handleSubmit}
        loading={submitting}
      >
        {isEdit ? 'Сохранить изменения' : 'Создать проект'}
      </Button>
    </div>
  )
}

export default DesignFormPage
