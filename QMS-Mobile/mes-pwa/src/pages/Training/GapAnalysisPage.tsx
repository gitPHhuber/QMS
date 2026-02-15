import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  GraduationCap,
  User,
} from 'lucide-react'
import { Card, Button, Badge, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'

interface TrainingGap {
  userId?: number
  userName?: string
  user?: { id: number; name: string; surname: string; role: string }
  missingCompetencies?: string[]
  recommendedTraining?: string[]
  gaps?: string[]
}

const GapAnalysisPage = () => {
  const [gaps, setGaps] = useState<TrainingGap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGaps()
  }, [])

  const loadGaps = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/training/gap-analysis')
      setGaps(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Анализ пробелов</h1>
        <p className="text-slate-400 text-sm">Выявление недостающих компетенций и рекомендации</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Анализ данных..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadGaps}>Повторить</Button>
        </Card>
      ) : gaps.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="Пробелы не выявлены"
          description="Все сотрудники обладают необходимыми компетенциями"
        />
      ) : (
        <div className="space-y-3">
          {gaps.map((gap, idx) => {
            const name = gap.user
              ? `${gap.user.surname} ${gap.user.name}`
              : gap.userName || `Пользователь #${gap.userId || idx}`

            return (
              <Card key={idx} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                    <User size={20} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-2">{name}</p>

                    {gap.missingCompetencies && gap.missingCompetencies.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-1">
                          <AlertTriangle size={14} className="inline mr-1 text-danger" />
                          Недостающие компетенции:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.missingCompetencies.map((comp, i) => (
                            <Badge key={i} variant="danger" size="sm">{comp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {gap.gaps && gap.gaps.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-1">
                          <AlertTriangle size={14} className="inline mr-1 text-warning" />
                          Пробелы:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.gaps.map((g, i) => (
                            <Badge key={i} variant="warning" size="sm">{g}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {gap.recommendedTraining && gap.recommendedTraining.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-400 mb-1">
                          <GraduationCap size={14} className="inline mr-1 text-primary" />
                          Рекомендуемое обучение:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.recommendedTraining.map((training, i) => (
                            <Badge key={i} variant="primary" size="sm">{training}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GapAnalysisPage
