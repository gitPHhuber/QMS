

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { Card, Input, Button, Badge, Loader, Select, Textarea } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { Complaint } from '../../types'

interface ComplaintFormData {
  title: string
  description: string
  complaintType: string
  source: string
  severity: string
  category: string
  reporterName: string
  reporterContact: string
  reporterOrganization: string
  receivedDate: string
  eventDate: string
  countryOfOccurrence: string
  productName: string
  productModel: string
  serialNumber: string
  lotNumber: string
  quantityAffected: string
  patientInvolved: boolean
  healthHazard: boolean
  isReportable: boolean
}

const INITIAL_FORM: ComplaintFormData = {
  title: '',
  description: '',
  complaintType: '',
  source: '',
  severity: '',
  category: '',
  reporterName: '',
  reporterContact: '',
  reporterOrganization: '',
  receivedDate: '',
  eventDate: '',
  countryOfOccurrence: '',
  productName: '',
  productModel: '',
  serialNumber: '',
  lotNumber: '',
  quantityAffected: '',
  patientInvolved: false,
  healthHazard: false,
  isReportable: false,
}

const COMPLAINT_TYPE_OPTIONS = [
  { value: 'COMPLAINT', label: 'Жалоба' },
  { value: 'RECLAMATION', label: 'Рекламация' },
  { value: 'FEEDBACK', label: 'Обратная связь' },
]

const SOURCE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Заказчик' },
  { value: 'DISTRIBUTOR', label: 'Дистрибьютор' },
  { value: 'INTERNAL', label: 'Внутренний' },
  { value: 'REGULATOR', label: 'Регулятор' },
  { value: 'FIELD_REPORT', label: 'Полевой отчёт' },
]

const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Критическая' },
  { value: 'MAJOR', label: 'Значительная' },
  { value: 'MINOR', label: 'Незначительная' },
  { value: 'INFORMATIONAL', label: 'Информационная' },
]

const CATEGORY_OPTIONS = [
  { value: 'SAFETY', label: 'Безопасность' },
  { value: 'PERFORMANCE', label: 'Производительность' },
  { value: 'LABELING', label: 'Маркировка' },
  { value: 'PACKAGING', label: 'Упаковка' },
  { value: 'DOCUMENTATION', label: 'Документация' },
  { value: 'DELIVERY', label: 'Доставка' },
  { value: 'SERVICE', label: 'Сервис' },
  { value: 'OTHER', label: 'Прочее' },
]

const ComplaintFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<ComplaintFormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) loadComplaint()
  }, [id])

  const loadComplaint = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Complaint>(`/complaints/${id}`)
      setForm({
        title: data.title || '',
        description: data.description || '',
        complaintType: data.complaintType || '',
        source: data.source || '',
        severity: data.severity || '',
        category: data.category || '',
        reporterName: data.reporterName || '',
        reporterContact: data.reporterContact || '',
        reporterOrganization: data.reporterOrganization || '',
        receivedDate: data.receivedDate ? data.receivedDate.split('T')[0] : '',
        eventDate: data.eventDate ? data.eventDate.split('T')[0] : '',
        countryOfOccurrence: data.countryOfOccurrence || '',
        productName: data.productName || '',
        productModel: data.productModel || '',
        serialNumber: data.serialNumber || '',
        lotNumber: data.lotNumber || '',
        quantityAffected: data.quantityAffected != null ? String(data.quantityAffected) : '',
        patientInvolved: data.patientInvolved || false,
        healthHazard: data.healthHazard || false,
        isReportable: data.isReportable || false,
      })
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ComplaintFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Укажите название рекламации')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        ...form,
        quantityAffected: form.quantityAffected ? parseInt(form.quantityAffected) : undefined,
        eventDate: form.eventDate || undefined,
        receivedDate: form.receivedDate || undefined,
      }

      if (isEdit) {
        await api.put(`/complaints/${id}`, payload)
      } else {
        await api.post('/complaints', payload)
      }

      navigate('/complaints')
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

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(-1)} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">
            {isEdit ? 'Редактирование рекламации' : 'Новая рекламация'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isEdit ? 'Изменение данных рекламации' : 'Создание новой рекламации'}
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
            placeholder="Введите название рекламации"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Опишите суть рекламации"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Тип"
              options={COMPLAINT_TYPE_OPTIONS}
              value={form.complaintType}
              onChange={(e) => handleChange('complaintType', e.target.value)}
              placeholder="Выберите тип"
            />
            <Select
              label="Источник"
              options={SOURCE_OPTIONS}
              value={form.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="Выберите источник"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Серьёзность"
              options={SEVERITY_OPTIONS}
              value={form.severity}
              onChange={(e) => handleChange('severity', e.target.value)}
              placeholder="Выберите серьёзность"
            />
            <Select
              label="Категория"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Выберите категорию"
            />
          </div>
        </div>
      </Card>

      {/* Заявитель */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Заявитель</h2>
        <div className="space-y-4">
          <Input
            label="Имя заявителя"
            value={form.reporterName}
            onChange={(e) => handleChange('reporterName', e.target.value)}
            placeholder="Укажите имя"
          />
          <Input
            label="Контакт"
            value={form.reporterContact}
            onChange={(e) => handleChange('reporterContact', e.target.value)}
            placeholder="Телефон или email"
          />
          <Input
            label="Организация"
            value={form.reporterOrganization}
            onChange={(e) => handleChange('reporterOrganization', e.target.value)}
            placeholder="Наименование организации"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Дата получения"
              type="date"
              value={form.receivedDate}
              onChange={(e) => handleChange('receivedDate', e.target.value)}
            />
            <Input
              label="Дата события"
              type="date"
              value={form.eventDate}
              onChange={(e) => handleChange('eventDate', e.target.value)}
            />
          </div>
          <Input
            label="Страна происшествия"
            value={form.countryOfOccurrence}
            onChange={(e) => handleChange('countryOfOccurrence', e.target.value)}
            placeholder="Укажите страну"
          />
        </div>
      </Card>

      {/* Продукт */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Продукт</h2>
        <div className="space-y-4">
          <Input
            label="Наименование продукта"
            value={form.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
            placeholder="Название продукта"
          />
          <Input
            label="Модель"
            value={form.productModel}
            onChange={(e) => handleChange('productModel', e.target.value)}
            placeholder="Модель продукта"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Серийный номер"
              value={form.serialNumber}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              placeholder="S/N"
            />
            <Input
              label="Номер партии"
              value={form.lotNumber}
              onChange={(e) => handleChange('lotNumber', e.target.value)}
              placeholder="Lot #"
            />
          </div>
          <Input
            label="Затронутое количество"
            type="number"
            value={form.quantityAffected}
            onChange={(e) => handleChange('quantityAffected', e.target.value)}
            placeholder="Количество единиц"
            min="0"
          />
        </div>
      </Card>

      {/* Дополнительно */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Дополнительно</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.patientInvolved}
              onChange={(e) => handleChange('patientInvolved', e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
            />
            <span className="text-slate-300">Пациент вовлечён</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.healthHazard}
              onChange={(e) => handleChange('healthHazard', e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
            />
            <span className="text-slate-300">Угроза здоровью</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isReportable}
              onChange={(e) => handleChange('isReportable', e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
            />
            <span className="text-slate-300">Подлежит надзорной отчётности</span>
          </label>
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

export default ComplaintFormPage
