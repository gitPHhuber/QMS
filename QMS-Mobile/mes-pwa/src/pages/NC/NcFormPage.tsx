


import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { Card, Input, Button, Select, Textarea, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { NC_SOURCE_LABELS } from '../../config'
import type { Nonconformity } from '../../types'

const CLASSIFICATION_OPTIONS = [
  { value: 'CRITICAL', label: 'Критическое' },
  { value: 'MAJOR', label: 'Значительное' },
  { value: 'MINOR', label: 'Незначительное' },
]

const DISPOSITION_OPTIONS = [
  { value: 'USE_AS_IS', label: 'Использовать как есть' },
  { value: 'REWORK', label: 'Переработка' },
  { value: 'REPAIR', label: 'Ремонт' },
  { value: 'SCRAP', label: 'Утилизация' },
  { value: 'RETURN_TO_SUPPLIER', label: 'Возврат поставщику' },
  { value: 'CONCESSION', label: 'Отступление' },
]

const SOURCE_OPTIONS = Object.entries(NC_SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const NcFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [classification, setClassification] = useState('')
  const [disposition, setDisposition] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [capaRequired, setCapaRequired] = useState(false)
  const [productType, setProductType] = useState('')
  const [productSerialNumber, setProductSerialNumber] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [processName, setProcessName] = useState('')
  const [supplierName, setSupplierName] = useState('')

  useEffect(() => {
    if (isEdit && id) loadNc()
  }, [id])

  const loadNc = async () => {
    try {
      setLoadingData(true)
      const { data } = await api.get<Nonconformity>(`/nc/${id}`)
      setTitle(data.title)
      setDescription(data.description)
      setSource(data.source)
      setClassification(data.classification)
      setDisposition(data.disposition || '')
      setAssignedToId(data.assignedToId ? String(data.assignedToId) : '')
      setCapaRequired(data.capaRequired)
      setProductType(data.productType || '')
      setProductSerialNumber(data.productSerialNumber || '')
      setLotNumber(data.lotNumber || '')
      setProcessName(data.processName || '')
      setSupplierName(data.supplierName || '')
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !source || !classification) {
      setError('Заполните все обязательные поля')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        source,
        classification,
        capaRequired,
      }

      if (disposition) payload.disposition = disposition
      if (assignedToId) payload.assignedToId = parseInt(assignedToId)
      if (productType.trim()) payload.productType = productType.trim()
      if (productSerialNumber.trim()) payload.productSerialNumber = productSerialNumber.trim()
      if (lotNumber.trim()) payload.lotNumber = lotNumber.trim()
      if (processName.trim()) payload.processName = processName.trim()
      if (supplierName.trim()) payload.supplierName = supplierName.trim()

      let result
      if (isEdit) {
        result = await api.put(`/nc/${id}`, payload)
      } else {
        result = await api.post('/nc', payload)
      }

      const ncId = result.data?.id || id
      navigate(`/nc/${ncId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="flex justify-center py-12"><Loader text="Загрузка..." /></div>

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(isEdit ? `/nc/${id}` : '/nc')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{isEdit ? 'Редактирование NC' : 'Новое несоответствие'}</h1>
          <p className="text-slate-400 text-sm">{isEdit ? 'Измените данные несоответствия' : 'Заполните форму для регистрации NC'}</p>
        </div>
      </div>

      {error && (
        <Card className="p-4">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Required fields */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Основная информация</h2>
        <div className="space-y-4">
          <Input
            label="Название *"
            placeholder="Краткое описание несоответствия"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Описание *"
            placeholder="Подробное описание несоответствия"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Select
            label="Источник *"
            placeholder="Выберите источник"
            options={SOURCE_OPTIONS}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />

          <Select
            label="Классификация *"
            placeholder="Выберите классификацию"
            options={CLASSIFICATION_OPTIONS}
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          />

          <Select
            label="Диспозиция"
            placeholder="Выберите решение"
            options={DISPOSITION_OPTIONS}
            value={disposition}
            onChange={(e) => setDisposition(e.target.value)}
          />

          <Input
            label="ID ответственного"
            type="number"
            placeholder="Введите ID пользователя"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={capaRequired}
              onChange={(e) => setCapaRequired(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-slate-300">Требуется CAPA</span>
          </label>
        </div>
      </Card>

      {/* Optional fields */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Дополнительная информация</h2>
        <div className="space-y-4">
          <Input
            label="Тип продукта"
            placeholder="Введите тип продукта"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          />

          <Input
            label="Серийный номер"
            placeholder="Введите серийный номер"
            value={productSerialNumber}
            onChange={(e) => setProductSerialNumber(e.target.value)}
          />

          <Input
            label="Номер партии"
            placeholder="Введите номер партии"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
          />

          <Input
            label="Название процесса"
            placeholder="Введите название процесса"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
          />

          <Input
            label="Поставщик"
            placeholder="Введите название поставщика"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </div>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => navigate(isEdit ? `/nc/${id}` : '/nc')}
        >
          Отмена
        </Button>
        <Button
          className="flex-1"
          icon={<Save size={18} />}
          onClick={handleSubmit}
          loading={loading}
        >
          {isEdit ? 'Сохранить' : 'Создать NC'}
        </Button>
      </div>
    </div>
  )
}

export default NcFormPage
