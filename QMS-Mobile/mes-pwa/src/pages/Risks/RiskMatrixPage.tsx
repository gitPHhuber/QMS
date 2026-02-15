

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Grid3X3,
} from 'lucide-react'
import { Card, Button, Badge, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'

interface MatrixCell {
  probability: number
  severity: number
  count: number
  riskIds?: number[]
}

interface MatrixData {
  cells: MatrixCell[]
}

const PROBABILITY_LABELS = ['1', '2', '3', '4', '5']
const SEVERITY_LABELS = ['1', '2', '3', '4', '5']

const getCellColor = (probability: number, severity: number): string => {
  const score = probability * severity
  if (score >= 15) return 'bg-red-500/30 border-red-500/50 hover:bg-red-500/40'
  if (score >= 8) return 'bg-orange-500/30 border-orange-500/50 hover:bg-orange-500/40'
  if (score >= 4) return 'bg-yellow-500/30 border-yellow-500/50 hover:bg-yellow-500/40'
  return 'bg-green-500/30 border-green-500/50 hover:bg-green-500/40'
}

const getCellTextColor = (probability: number, severity: number): string => {
  const score = probability * severity
  if (score >= 15) return 'text-red-300'
  if (score >= 8) return 'text-orange-300'
  if (score >= 4) return 'text-yellow-300'
  return 'text-green-300'
}

const getRiskLevelLabel = (score: number): string => {
  if (score >= 15) return 'Критический'
  if (score >= 8) return 'Высокий'
  if (score >= 4) return 'Средний'
  return 'Низкий'
}

const RiskMatrixPage = () => {
  const navigate = useNavigate()
  const [matrixData, setMatrixData] = useState<MatrixCell[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMatrix()
  }, [])

  const loadMatrix = async () => {
    try {
      setLoading(true)
      const { data } = await api.get<MatrixData | MatrixCell[]>('/risks/matrix')
      const cells = Array.isArray(data) ? data : data.cells || []
      setMatrixData(cells)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки матрицы'))
    } finally {
      setLoading(false)
    }
  }

  const getCellCount = (probability: number, severity: number): number => {
    const cell = matrixData.find(
      (c) => c.probability === probability && c.severity === severity
    )
    return cell?.count || 0
  }

  const handleCellClick = (probability: number, severity: number) => {
    navigate(`/risks?probability=${probability}&severity=${severity}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader text="Загрузка матрицы..." />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/risks')} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Матрица рисков</h1>
          <p className="text-slate-400 text-sm">Визуализация уровней рисков 5x5</p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/20">
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadMatrix}>Повторить</Button>
          </div>
        </Card>
      )}

      {/* Matrix */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-6">
          <Grid3X3 size={18} className="text-slate-500" />
          <h2 className="font-semibold">Вероятность / Серьёзность</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[340px]">
            {/* Column headers (Severity) */}
            <div className="flex items-end mb-2">
              <div className="w-20 shrink-0" />
              {SEVERITY_LABELS.map((label, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-1">Серьёзность</p>
                  <p className="text-sm font-bold">{label}</p>
                </div>
              ))}
            </div>

            {/* Rows (Probability, from 5 to 1) */}
            {[5, 4, 3, 2, 1].map((probability) => (
              <div key={probability} className="flex items-center mb-1">
                {/* Row header */}
                <div className="w-20 shrink-0 pr-2 text-right">
                  {probability === 3 && (
                    <p className="text-xs text-slate-400 -mt-1 mb-0.5">Вероятность</p>
                  )}
                  <p className="text-sm font-bold">{probability}</p>
                </div>

                {/* Cells */}
                {[1, 2, 3, 4, 5].map((severity) => {
                  const count = getCellCount(probability, severity)
                  const score = probability * severity
                  return (
                    <div
                      key={severity}
                      className={`flex-1 aspect-square max-h-16 rounded-lg border cursor-pointer
                        flex flex-col items-center justify-center transition-all mx-0.5
                        ${getCellColor(probability, severity)}`}
                      onClick={() => handleCellClick(probability, severity)}
                      title={`${getRiskLevelLabel(score)} (${score}) - ${count} рисков`}
                    >
                      {count > 0 && (
                        <span className={`text-lg font-bold ${getCellTextColor(probability, severity)}`}>
                          {count}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{score}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Уровень риска</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/50" />
            <span className="text-sm text-slate-300">Низкий (1-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/50" />
            <span className="text-sm text-slate-300">Средний (4-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/50" />
            <span className="text-sm text-slate-300">Высокий (8-14)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/50" />
            <span className="text-sm text-slate-300">Критический (15-25)</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RiskMatrixPage
