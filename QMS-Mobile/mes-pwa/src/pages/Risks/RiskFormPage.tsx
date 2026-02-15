

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { Card, Input, Button, Loader, Select, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { RiskRegister } from '../../types'

interface RiskFormData {
  title: string
  description: string
  source: string
  classification: string
  initialProbability: string
  initialSeverity: string
}

const INITIAL_FORM: RiskFormData = {
  title: '',
  description: '',
  source: '',
  classification: '',
  initialProbability: '',
  initialSeverity: '',
}

const PROBABILITY_OPTIONS = [
  { value: '1', label: '1 - Очень низкая' },
  { value: '2', label: '2 - Низкая' },
  { value: '3', label: '3 - Средняя' },
  { value: '4', label: '4 - Высокая' },
  { value: '5', label: '5 - Очень высокая' },
]

const SEVERITY_OPTIONS = [
  { value: '1', label: '1 - Незначительная' },
  { value: '2', label: '2 - Малая' },
  { value: '3', label: '3 - Средняя' },
  { value: '4', label: '4 - Серьёзная' },
  { value: '5', label: '5 - Катастрофическая' },
]

const RiskFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<RiskFormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) loadRisk()
  }, [id])

  const loadRisk = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<RiskRegister>(`/risks/${id}`)
      setForm({
        title: data.title || '',
        description: data.description || '',
        source: data.source || '',
        classification: data.classification || '',
        initialProbability: data.initialProbability != null ? String(data.initialProbability) : '',
        initialSeverity: data.initialSeverity != null ? String(data.initialSeverity) : '',
      })
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof RiskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const getRiskScore = (): number | null => {
    const p = parseInt(form.initialProbability)
    const s = parseInt(form.initialSeverity)
    if (isNaN(p) || isNaN(s)) return null
    return p * s
  }

  const getRiskLevel = (score: number | null): string => {
    if (score === null) return ''
    if (score >= 15) return 'Критический'
    if (score >= 8) return 'Высокий'
    if (score >= 4) return 'Средний'
    return 'Низкий'
  }

  const getRiskLevelColor = (score: number | null): string => {
    if (score === null) return 'text-slate-500'
    if (score >= 15) return 'text-danger'
    if (score >= 8) return 'text-warning'
    if (score >= 4) return 'text-yellow-400'
    return 'text-success'
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Укажите название риска')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        ...form,
        initialProbability: form.initialProbability ? parseInt(form.initialProbability) : undefined,
        initialSeverity: form.initialSeverity ? parseInt(form.initialSeverity) : undefined,
      }

      if (isEdit) {
        await api.put(`/risks/${id}`, payload)
      } else {
        await api.post('/risks', payload)
      }

      navigate('/risks')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка..." />
      </div>
    )
  }

  const riskScore = getRiskScore()

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(-1)} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">
            {isEdit ? 'Редактирование риска' : 'Новый риск'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isEdit ? 'Изменение данных риска' : 'Регистрация нового риска'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Основная информация */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Основная информация</h2>
        <div className="space-y-4">
          <Input
            label="Название *"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Введите название риска"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Опишите риск"
          />
          <Input
            label="Источник"
            value={form.source}
            onChange={(e) => handleChange('source', e.target.value)}
            placeholder="Укажите источник риска"
          />
          <Input
            label="Классификация"
            value={form.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
            placeholder="Классификация риска"
          />
        </div>
      </Card>

      {/* Начальная оценка */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Начальная оценка</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Вероятность"
              options={PROBABILITY_OPTIONS}
              value={form.initialProbability}
              onChange={(e) => handleChange('initialProbability', e.target.value)}
              placeholder="Выберите"
            />
            <Select
              label="Серьёзность"
              options={SEVERITY_OPTIONS}
              value={form.initialSeverity}
              onChange={(e) => handleChange('initialSeverity', e.target.value)}
              placeholder="Выберите"
            />
          </div>

          {riskScore !== null && (
            <div className="p-4 rounded-xl bg-surface-light border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Уровень риска</p>
                  <p className={`text-lg font-bold ${getRiskLevelColor(riskScore)}`}>
                    {getRiskLevel(riskScore)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Балл</p>
                  <p className={`text-2xl font-bold ${getRiskLevelColor(riskScore)}`}>
                    {riskScore}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Submit */}
      <div className="flex gap-3 pb-6">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => navigate(-1)}
        >
          Отмена
        </Button>
        <Button
          className="flex-1"
          icon={<Save size={18} />}
          onClick={handleSubmit}
          loading={saving}
          disabled={!form.title.trim()}
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  )
}

export default RiskFormPage
