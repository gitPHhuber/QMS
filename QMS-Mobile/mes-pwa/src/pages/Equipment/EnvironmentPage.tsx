import { useEffect, useState } from 'react'
import {
  Thermometer,
  MapPin,
  Plus,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Card, Button, Badge, Tabs, EmptyState, Loader, Modal, Input, Select } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { MonitoringPoint, EnvironmentalReading } from '../../types'

const EnvironmentPage = () => {
  const [points, setPoints] = useState<MonitoringPoint[]>([])
  const [readings, setReadings] = useState<EnvironmentalReading[]>([])
  const [excursions, setExcursions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('points')

  const [showReadingModal, setShowReadingModal] = useState(false)
  const [readingForm, setReadingForm] = useState({
    monitoringPointId: '',
    value: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'points') {
        const { data } = await api.get('/environment/points')
        setPoints(Array.isArray(data) ? data : data.rows || [])
      } else {
        const [readingsRes, excursionsRes] = await Promise.all([
          api.get('/environment/readings', { params: { limit: 20 } }),
          api.get('/environment/excursions'),
        ])
        setReadings(Array.isArray(readingsRes.data) ? readingsRes.data : readingsRes.data.rows || [])
        setExcursions(Array.isArray(excursionsRes.data) ? excursionsRes.data : excursionsRes.data.rows || [])
      }
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAddReading = async () => {
    try {
      setSubmitting(true)
      await api.post('/environment/readings', {
        monitoringPointId: Number(readingForm.monitoringPointId),
        value: Number(readingForm.value),
      })
      setShowReadingModal(false)
      setReadingForm({ monitoringPointId: '', value: '' })
      loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { key: 'points', label: 'Точки мониторинга', icon: <MapPin size={16} /> },
    { key: 'readings', label: 'Показания', icon: <BarChart3 size={16} /> },
  ]

  const pointTypeLabels: Record<string, string> = {
    TEMPERATURE: 'Температура',
    HUMIDITY: 'Влажность',
    PRESSURE: 'Давление',
    PARTICULATE: 'Частицы',
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Мониторинг среды</h1>
          <p className="text-slate-400 text-sm">Контроль условий окружающей среды</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowReadingModal(true)}>
          Новое показание
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>Повторить</Button>
        </Card>
      ) : activeTab === 'points' ? (
        points.length === 0 ? (
          <EmptyState
            icon={<MapPin size={48} />}
            title="Точки мониторинга не найдены"
            description="Нет зарегистрированных точек мониторинга"
          />
        ) : (
          <div className="space-y-2">
            {points.map((point) => (
              <Card key={point.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Thermometer size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{point.name}</p>
                      <Badge variant="primary" size="sm">
                        {pointTypeLabels[point.type] || point.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {point.location && <span>{point.location}</span>}
                      <span>Ед.: {point.unit}</span>
                      {(point.minLimit !== undefined || point.maxLimit !== undefined) && (
                        <>
                          <span>•</span>
                          <span>
                            Пределы: {point.minLimit ?? '—'} ... {point.maxLimit ?? '—'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={STATUS_COLORS[point.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[point.status] || point.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Excursion alerts */}
          {excursions.length > 0 && (
            <Card className="p-4 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2 mb-2 text-danger">
                <AlertTriangle size={18} />
                <span className="font-semibold">Отклонения ({excursions.length})</span>
              </div>
              <div className="space-y-2">
                {excursions.map((exc: any, idx: number) => (
                  <div key={idx} className="text-sm text-danger/80">
                    {exc.monitoringPoint?.name || `Точка #${exc.monitoringPointId}`}: {exc.value} {exc.monitoringPoint?.unit || ''}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent readings */}
          {readings.length === 0 ? (
            <EmptyState
              icon={<Activity size={48} />}
              title="Показания отсутствуют"
              description="Нет зарегистрированных показаний"
              action={
                <Button icon={<Plus size={18} />} onClick={() => setShowReadingModal(true)}>
                  Добавить показание
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {readings.map((reading) => (
                <Card key={reading.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {reading.monitoringPoint?.name || `Точка #${reading.monitoringPointId}`}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="text-lg font-bold text-white">
                          {reading.value} {reading.monitoringPoint?.unit || ''}
                        </span>
                        <span>
                          {new Date(reading.timestamp).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${reading.isWithinLimit ? 'bg-success' : 'bg-danger'}`} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Reading Modal */}
      <Modal
        isOpen={showReadingModal}
        onClose={() => setShowReadingModal(false)}
        title="Новое показание"
      >
        <div className="space-y-4">
          <Select
            label="Точка мониторинга"
            value={readingForm.monitoringPointId}
            onChange={(e) => setReadingForm({ ...readingForm, monitoringPointId: e.target.value })}
            placeholder="Выберите точку"
            options={points.map((p) => ({ value: String(p.id), label: p.name }))}
          />
          <Input
            label="Значение"
            type="number"
            value={readingForm.value}
            onChange={(e) => setReadingForm({ ...readingForm, value: e.target.value })}
            placeholder="Введите значение"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowReadingModal(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAddReading} loading={submitting}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EnvironmentPage
