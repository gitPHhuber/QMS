import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Select, DateInput, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { EQUIPMENT_TYPE_LABELS } from '../../config'
import type { Equipment } from '../../types'

const EquipmentFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'PRODUCTION',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 'ACTIVE',
    purchaseDate: '',
    calibrationFrequency: '',
  })

  useEffect(() => {
    if (isEdit) {
      loadEquipment()
    }
  }, [id])

  const loadEquipment = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Equipment>(`/equipment/${id}`)
      setForm({
        code: data.code || '',
        name: data.name || '',
        type: data.type || 'PRODUCTION',
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        location: data.location || '',
        status: data.status || 'ACTIVE',
        purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : '',
        calibrationFrequency: data.calibrationFrequency ? String(data.calibrationFrequency) : '',
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
        ...form,
        calibrationFrequency: form.calibrationFrequency ? Number(form.calibrationFrequency) : undefined,
      }

      if (isEdit) {
        await api.put(`/equipment/${id}`, payload)
        navigate(`/equipment/${id}`)
      } else {
        const { data } = await api.post('/equipment', payload)
        navigate(`/equipment/${data.id}`)
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

  const typeOptions = Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(isEdit ? `/equipment/${id}` : '/equipment')}>
          Назад
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Редактировать оборудование' : 'Новое оборудование'}</h1>
        <p className="text-slate-400 text-sm">
          {isEdit ? 'Измените данные оборудования' : 'Заполните данные нового оборудования'}
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
            placeholder="EQ-001"
          />
          <Input
            label="Наименование"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Название оборудования"
          />
          <Select
            label="Тип"
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={typeOptions}
          />
          <Input
            label="Производитель"
            value={form.manufacturer}
            onChange={(e) => updateField('manufacturer', e.target.value)}
            placeholder="Производитель"
          />
          <Input
            label="Модель"
            value={form.model}
            onChange={(e) => updateField('model', e.target.value)}
            placeholder="Модель"
          />
          <Input
            label="Серийный номер"
            value={form.serialNumber}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            placeholder="S/N"
          />
          <Input
            label="Расположение"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="Цех, участок"
          />
          <Select
            label="Статус"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'Активно' },
              { value: 'MAINTENANCE', label: 'На обслуживании' },
              { value: 'INACTIVE', label: 'Неактивно' },
            ]}
          />
          <DateInput
            label="Дата покупки"
            value={form.purchaseDate}
            onChange={(e) => updateField('purchaseDate', e.target.value)}
          />
          <Input
            label="Частота калибровки (дни)"
            type="number"
            value={form.calibrationFrequency}
            onChange={(e) => updateField('calibrationFrequency', e.target.value)}
            placeholder="365"
          />
        </div>
      </Card>

      <Button
        fullWidth
        icon={<Save size={18} />}
        onClick={handleSubmit}
        loading={submitting}
      >
        {isEdit ? 'Сохранить изменения' : 'Создать оборудование'}
      </Button>
    </div>
  )
}

export default EquipmentFormPage
