import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, Button, Input, Select, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { SUPPLIER_TYPE_LABELS } from '../../config'
import type { Supplier } from '../../types'

const SupplierFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'RAW_MATERIAL',
    address: '',
    country: '',
    contactPerson: '',
    email: '',
    phone: '',
    certifications: '',
  })

  useEffect(() => {
    if (isEdit) {
      loadSupplier()
    }
  }, [id])

  const loadSupplier = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Supplier>(`/suppliers/${id}`)
      setForm({
        name: data.name || '',
        code: data.code || '',
        type: data.type || 'RAW_MATERIAL',
        address: data.address || '',
        country: data.country || '',
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        certifications: data.certifications ? data.certifications.join(', ') : '',
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
        certifications: form.certifications
          ? form.certifications.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
      }

      if (isEdit) {
        await api.put(`/suppliers/${id}`, payload)
        navigate(`/suppliers/${id}`)
      } else {
        const { data } = await api.post('/suppliers', payload)
        navigate(`/suppliers/${data.id}`)
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

  const typeOptions = Object.entries(SUPPLIER_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(isEdit ? `/suppliers/${id}` : '/suppliers')}>
          Назад
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Редактировать поставщика' : 'Новый поставщик'}</h1>
        <p className="text-slate-400 text-sm">
          {isEdit ? 'Измените данные поставщика' : 'Заполните данные нового поставщика'}
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
            label="Наименование"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Название поставщика"
          />
          <Input
            label="Код"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="SUP-001"
          />
          <Select
            label="Тип"
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={typeOptions}
          />
          <Input
            label="Адрес"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Юридический адрес"
          />
          <Input
            label="Страна"
            value={form.country}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="Страна"
          />
          <Input
            label="Контактное лицо"
            value={form.contactPerson}
            onChange={(e) => updateField('contactPerson', e.target.value)}
            placeholder="ФИО"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="email@example.com"
          />
          <Input
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
          <Input
            label="Сертификации (через запятую)"
            value={form.certifications}
            onChange={(e) => updateField('certifications', e.target.value)}
            placeholder="ISO 13485, ISO 9001"
          />
        </div>
      </Card>

      <Button
        fullWidth
        icon={<Save size={18} />}
        onClick={handleSubmit}
        loading={submitting}
      >
        {isEdit ? 'Сохранить изменения' : 'Создать поставщика'}
      </Button>
    </div>
  )
}

export default SupplierFormPage
