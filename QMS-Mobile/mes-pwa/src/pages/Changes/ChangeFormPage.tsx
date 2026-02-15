

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Input, Button, Select, Textarea, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { ChangeRequest } from '../../types'

interface ChangeFormData {
  title: string
  description: string
  justification: string
  type: string
  priority: string
  category: string
  regulatoryImpact: boolean
}

const INITIAL_FORM: ChangeFormData = {
  title: '',
  description: '',
  justification: '',
  type: '',
  priority: '',
  category: '',
  regulatoryImpact: false,
}

const typeOptions = [
  { value: 'DESIGN', label: 'Конструкция' },
  { value: 'PROCESS', label: 'Процесс' },
  { value: 'DOCUMENT', label: 'Документ' },
  { value: 'SUPPLIER', label: 'Поставщик' },
  { value: 'SOFTWARE', label: 'ПО' },
  { value: 'MATERIAL', label: 'Материал' },
  { value: 'OTHER', label: 'Прочее' },
]

const priorityOptions = [
  { value: 'CRITICAL', label: 'Критический' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'LOW', label: 'Низкий' },
]

const categoryOptions = [
  { value: 'MAJOR', label: 'Значительное' },
  { value: 'MINOR', label: 'Незначительное' },
]

const ChangeFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<ChangeFormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) loadChange()
  }, [id])

  const loadChange = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<ChangeRequest>(`/change/${id}`)
      setForm({
        title: data.title || '',
        description: data.description || '',
        justification: data.justification || '',
        type: data.type || '',
        priority: data.priority || '',
        category: data.category || '',
        regulatoryImpact: data.regulatoryImpact || false,
      })
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ChangeFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.type || !form.priority || !form.category) {
      setError('Заполните обязательные поля: название, тип, приоритет и категория')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        justification: form.justification.trim() || undefined,
        type: form.type,
        priority: form.priority,
        category: form.category,
        regulatoryImpact: form.regulatoryImpact,
      }

      if (isEdit) {
        await api.put(`/change/${id}`, payload)
        navigate(`/changes/${id}`)
      } else {
        const { data } = await api.post('/change', payload)
        navigate(`/changes/${data.id}`)
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
          onClick={() => isEdit ? navigate(`/changes/${id}`) : navigate('/changes')}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{isEdit ? 'Редактирование ECR' : 'Новый запрос на изменение'}</h1>
          <p className="text-slate-400 text-sm">
            {isEdit ? 'Изменение параметров запроса' : 'Создание нового ECR'}
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
          label="Название *"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Краткое название изменения"
        />

        <Textarea
          label="Описание"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Подробное описание предлагаемого изменения"
        />

        <Textarea
          label="Обоснование"
          value={form.justification}
          onChange={(e) => handleChange('justification', e.target.value)}
          placeholder="Почему это изменение необходимо"
        />

        <Select
          label="Тип изменения *"
          value={form.type}
          onChange={(e) => handleChange('type', e.target.value)}
          options={typeOptions}
          placeholder="Выберите тип"
        />

        <Select
          label="Приоритет *"
          value={form.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={priorityOptions}
          placeholder="Выберите приоритет"
        />

        <Select
          label="Категория *"
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          options={categoryOptions}
          placeholder="Выберите категорию"
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="regulatoryImpact"
            checked={form.regulatoryImpact}
            onChange={(e) => handleChange('regulatoryImpact', e.target.checked)}
            className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
          />
          <label htmlFor="regulatoryImpact" className="text-sm text-slate-300 cursor-pointer">
            Влияние на регуляторные требования
          </label>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => isEdit ? navigate(`/changes/${id}`) : navigate('/changes')}
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

export default ChangeFormPage
