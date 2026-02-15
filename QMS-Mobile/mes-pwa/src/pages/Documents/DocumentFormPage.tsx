

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Input, Button, Select, Textarea, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { DOCUMENT_TYPE_LABELS } from '../../config'
import type { QmsDocument } from '../../types'

interface DocumentFormData {
  code: string
  title: string
  type: string
  description: string
  isoSection: string
  reviewCycleMonths: string
  tags: string
}

const INITIAL_FORM: DocumentFormData = {
  code: '',
  title: '',
  type: '',
  description: '',
  isoSection: '',
  reviewCycleMonths: '',
  tags: '',
}

const typeOptions = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const DocumentFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<DocumentFormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) loadDocument()
  }, [id])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<QmsDocument>(`/documents/${id}`)
      setForm({
        code: data.code || '',
        title: data.title || '',
        type: data.type || '',
        description: '',
        isoSection: data.isoSection || '',
        reviewCycleMonths: data.reviewCycleMonths?.toString() || '',
        tags: data.tags?.join(', ') || '',
      })
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof DocumentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.type) {
      setError('Заполните обязательные поля: код, название и тип')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
        isoSection: form.isoSection.trim() || undefined,
        reviewCycleMonths: form.reviewCycleMonths ? parseInt(form.reviewCycleMonths) : undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      }

      if (isEdit) {
        await api.put(`/documents/${id}`, payload)
        navigate(`/documents/${id}`)
      } else {
        const { data } = await api.post('/documents', payload)
        navigate(`/documents/${data.id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={20} />}
          onClick={() => isEdit ? navigate(`/documents/${id}`) : navigate('/documents')}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{isEdit ? 'Редактирование документа' : 'Новый документ'}</h1>
          <p className="text-slate-400 text-sm">
            {isEdit ? 'Изменение параметров документа' : 'Создание нового документа СМК'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <Input
          label="Код документа *"
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder="Например: SOP-QMS-001"
        />

        <Input
          label="Название *"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Введите название документа"
        />

        <Select
          label="Тип документа *"
          value={form.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={typeOptions}
          placeholder="Выберите тип"
        />

        <Textarea
          label="Описание"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Описание документа"
        />

        <Input
          label="Раздел ISO"
          value={form.isoSection}
          onChange={(e) => handleChange('isoSection', e.target.value)}
          placeholder="Например: 7.5.1"
        />

        <Input
          label="Цикл пересмотра (месяцы)"
          type="number"
          value={form.reviewCycleMonths}
          onChange={(e) => handleChange('reviewCycleMonths', e.target.value)}
          placeholder="12"
          min="1"
        />

        <Input
          label="Теги"
          value={form.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="Через запятую: качество, процедура, СМК"
        />
      </Card>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => isEdit ? navigate(`/documents/${id}`) : navigate('/documents')}
        >
          Отмена
        </Button>
        <Button
          className="flex-1"
          icon={<Save size={18} />}
          onClick={handleSubmit}
          loading={saving}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  )
}

export default DocumentFormPage
