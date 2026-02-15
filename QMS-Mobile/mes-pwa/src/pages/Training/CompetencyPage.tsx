import { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, Button, Badge, EmptyState, Loader, Modal, Input } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import type { CompetencyMatrix } from '../../types'

const CompetencyPage = () => {
  const [competencies, setCompetencies] = useState<CompetencyMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    userId: '',
    role: '',
    position: '',
    isCompetent: true,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCompetencies()
  }, [])

  const loadCompetencies = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/training/competency')
      setCompetencies(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      setSubmitting(true)
      await api.post('/training/competency', {
        userId: Number(form.userId),
        role: form.role || undefined,
        position: form.position || undefined,
        isCompetent: form.isCompetent,
      })
      setShowModal(false)
      setForm({ userId: '', role: '', position: '', isCompetent: true })
      loadCompetencies()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Group competencies by user
  const groupedByUser = competencies.reduce<Record<number, CompetencyMatrix[]>>((acc, comp) => {
    const key = comp.userId
    if (!acc[key]) acc[key] = []
    acc[key].push(comp)
    return acc
  }, {})

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Матрица компетенций</h1>
          <p className="text-slate-400 text-sm">Оценка компетенций сотрудников</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
          Добавить
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка компетенций..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadCompetencies}>Повторить</Button>
        </Card>
      ) : competencies.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="Записи компетенций не найдены"
          description="Нет данных о компетенциях"
          action={
            <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
              Добавить
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByUser).map(([userId, items]) => {
            const firstItem = items[0]
            const userName = firstItem.user
              ? `${firstItem.user.surname} ${firstItem.user.name}`
              : `Пользователь #${userId}`

            return (
              <Card key={userId} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    {firstItem.user?.role && (
                      <p className="text-sm text-slate-400">{firstItem.user.role}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-surface-light rounded-xl">
                      <div className="flex-1 min-w-0">
                        {comp.role && <p className="text-sm font-medium truncate">{comp.role}</p>}
                        {comp.position && <p className="text-xs text-slate-500">{comp.position}</p>}
                        {comp.assessmentDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(comp.assessmentDate).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-3">
                        {comp.isCompetent ? (
                          <CheckCircle2 size={22} className="text-success" />
                        ) : (
                          <XCircle size={22} className="text-danger" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add competency modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Новая запись компетенции"
      >
        <div className="space-y-4">
          <Input
            label="ID пользователя"
            type="number"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            placeholder="ID сотрудника"
          />
          <Input
            label="Роль"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Должностная роль"
          />
          <Input
            label="Позиция"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Позиция"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Компетентен</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCompetent}
                onChange={(e) => setForm({ ...form, isCompetent: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 bg-surface-light text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-slate-300">
                {form.isCompetent ? 'Да' : 'Нет'}
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleAdd} loading={submitting}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CompetencyPage
