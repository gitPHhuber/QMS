import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Settings,
  Calendar,
  MapPin,
  Plus,
  Award,
  AlertTriangle,
} from 'lucide-react'
import { Card, Button, Badge, Loader, Modal, Input, Select, Textarea, DateInput } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '../../config'
import type { Equipment, Calibration } from '../../types'

const EquipmentDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [calibrationForm, setCalibrationForm] = useState({
    calibrationDate: '',
    calibrationMethod: '',
    certificateNumber: '',
    status: 'IN_TOLERANCE',
    result: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadEquipment()
  }, [id])

  const loadEquipment = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/equipment/${id}`)
      setEquipment(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (date?: string) => {
    if (!date) return false
    return date < new Date().toISOString().split('T')[0]
  }

  const handleAddCalibration = async () => {
    try {
      setSubmitting(true)
      await api.post(`/equipment/${id}/calibrations`, calibrationForm)
      setShowCalibrationModal(false)
      setCalibrationForm({
        calibrationDate: '',
        calibrationMethod: '',
        certificateNumber: '',
        status: 'IN_TOLERANCE',
        result: '',
      })
      loadEquipment()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка оборудования..." />
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/equipment')}>
          Назад
        </Button>
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error || 'Оборудование не найдено'}</p>
          <Button variant="outline" onClick={loadEquipment}>Повторить</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate('/equipment')}>
          Назад
        </Button>
        <Button variant="outline" icon={<Edit size={18} />} onClick={() => navigate(`/equipment/${id}/edit`)}>
          Редактировать
        </Button>
      </div>

      {/* Main info */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Settings size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-slate-500 font-mono">{equipment.code}</span>
              <Badge variant="primary" size="sm">
                {EQUIPMENT_TYPE_LABELS[equipment.type] || equipment.type}
              </Badge>
              <Badge variant={STATUS_COLORS[equipment.status] || 'neutral'}>
                {STATUS_LABELS[equipment.status] || equipment.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mb-3">{equipment.name}</h1>

            <div className="space-y-2 text-sm">
              {equipment.manufacturer && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Производитель</span>
                  <span>{equipment.manufacturer}</span>
                </div>
              )}
              {equipment.model && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Модель</span>
                  <span>{equipment.model}</span>
                </div>
              )}
              {equipment.serialNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Серийный номер</span>
                  <span className="font-mono">{equipment.serialNumber}</span>
                </div>
              )}
              {equipment.location && (
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    <MapPin size={14} className="inline mr-1" />
                    Расположение
                  </span>
                  <span>{equipment.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Dates */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">
          <Calendar size={18} className="inline mr-2" />
          Даты и калибровка
        </h2>
        <div className="space-y-2 text-sm">
          {equipment.purchaseDate && (
            <div className="flex justify-between">
              <span className="text-slate-400">Дата покупки</span>
              <span>{new Date(equipment.purchaseDate).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
          {equipment.lastCalibrationDate && (
            <div className="flex justify-between">
              <span className="text-slate-400">Последняя калибровка</span>
              <span>{new Date(equipment.lastCalibrationDate).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
          {equipment.nextCalibrationDate && (
            <div className="flex justify-between">
              <span className="text-slate-400">Следующая калибровка</span>
              <span className={isOverdue(equipment.nextCalibrationDate) ? 'text-danger font-medium' : ''}>
                {new Date(equipment.nextCalibrationDate).toLocaleDateString('ru-RU')}
                {isOverdue(equipment.nextCalibrationDate) && (
                  <AlertTriangle size={14} className="inline ml-1 text-danger" />
                )}
              </span>
            </div>
          )}
          {equipment.calibrationFrequency && (
            <div className="flex justify-between">
              <span className="text-slate-400">Частота калибровки</span>
              <span>{equipment.calibrationFrequency} дней</span>
            </div>
          )}
        </div>
      </Card>

      {/* Calibrations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            <Award size={18} className="inline mr-2" />
            Калибровки
          </h2>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCalibrationModal(true)}>
            Добавить
          </Button>
        </div>

        {equipment.calibrations && equipment.calibrations.length > 0 ? (
          <div className="space-y-3">
            {equipment.calibrations.map((cal: Calibration) => (
              <div key={cal.id} className="p-3 bg-surface-light rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {new Date(cal.calibrationDate).toLocaleDateString('ru-RU')}
                  </span>
                  <Badge
                    variant={cal.status === 'IN_TOLERANCE' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {STATUS_LABELS[cal.status] || cal.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {cal.certificateNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Сертификат</span>
                      <span className="font-mono">{cal.certificateNumber}</span>
                    </div>
                  )}
                  {cal.calibratedBy && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Калибровщик</span>
                      <span>{cal.calibratedBy.surname} {cal.calibratedBy.name}</span>
                    </div>
                  )}
                  {cal.result && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Результат</span>
                      <span className="text-right max-w-[60%]">{cal.result}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">Записи калибровок отсутствуют</p>
        )}
      </Card>

      {/* Add Calibration Modal */}
      <Modal
        isOpen={showCalibrationModal}
        onClose={() => setShowCalibrationModal(false)}
        title="Новая калибровка"
      >
        <div className="space-y-4">
          <DateInput
            label="Дата калибровки"
            value={calibrationForm.calibrationDate}
            onChange={(e) => setCalibrationForm({ ...calibrationForm, calibrationDate: e.target.value })}
          />
          <Input
            label="Метод калибровки"
            value={calibrationForm.calibrationMethod}
            onChange={(e) => setCalibrationForm({ ...calibrationForm, calibrationMethod: e.target.value })}
            placeholder="Укажите метод"
          />
          <Input
            label="Номер сертификата"
            value={calibrationForm.certificateNumber}
            onChange={(e) => setCalibrationForm({ ...calibrationForm, certificateNumber: e.target.value })}
            placeholder="Номер сертификата калибровки"
          />
          <Select
            label="Статус"
            value={calibrationForm.status}
            onChange={(e) => setCalibrationForm({ ...calibrationForm, status: e.target.value })}
            options={[
              { value: 'IN_TOLERANCE', label: 'В допуске' },
              { value: 'OUT_OF_TOLERANCE', label: 'Вне допуска' },
            ]}
          />
          <Textarea
            label="Результат"
            value={calibrationForm.result}
            onChange={(e) => setCalibrationForm({ ...calibrationForm, result: e.target.value })}
            placeholder="Опишите результат калибровки"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCalibrationModal(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAddCalibration} loading={submitting}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EquipmentDetailPage
