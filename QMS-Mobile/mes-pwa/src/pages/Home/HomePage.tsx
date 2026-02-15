

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Cpu, CheckCircle2, AlertTriangle, ArrowRight,
  ListTodo, Trophy, Clock, QrCode, TrendingUp,
  FileText, Shield, MessageSquareWarning, Settings,
  ClipboardCheck, BarChart3, GraduationCap
} from 'lucide-react'
import { Card, StatsCard, Badge, Skeleton, Button, Progress } from '../../components/ui'
import { useAuth } from 'react-oidc-context'
import { api } from '../../api/client'
import { STATUS_LABELS, STATUS_COLORS } from '../../config'
import type { Task, UserStats, DashboardSummary, QualityObjective } from '../../types'

interface DashboardData {
  warehouse: { totalBoxes: number; alertsCount: number }
  production: { today: number; inProgress: number }
  userStats: UserStats | null
  recentTasks: Task[]
  qmsSummary: DashboardSummary | null
  qualityObjectives: QualityObjective[]
}

export const HomePage = () => {
  const auth = useAuth()
  const user = auth.user?.profile ? {
    name: auth.user.profile.given_name || '',
    surname: auth.user.profile.family_name || '',
  } : null
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [tasksRes, summaryRes, objectivesRes] = await Promise.allSettled([
        api.get('/tasks', { params: { limit: 5 } }),
        api.get('/dashboard/summary'),
        api.get('/dashboard/quality-objectives'),
      ])

      setData({
        warehouse: {
          totalBoxes: 0,
          alertsCount: 0,
        },
        production: { today: 0, inProgress: 0 },
        userStats: null,
        recentTasks: tasksRes.status === 'fulfilled' ? (tasksRes.value.data?.rows || tasksRes.value.data || []) : [],
        qmsSummary: summaryRes.status === 'fulfilled' ? summaryRes.value.data : null,
        qualityObjectives: objectivesRes.status === 'fulfilled' ? (objectivesRes.value.data?.rows || objectivesRes.value.data || []) : [],
      })
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
  }

  const qms = data?.qmsSummary

  return (
    <div className="space-y-6 animate-fadeIn">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {user?.name}!</h1>
          <p className="text-slate-400 mt-1">Вот что происходит сегодня</p>
        </div>
        <Link to="/production/scan">
          <Button icon={<QrCode size={18} />}>Сканировать</Button>
        </Link>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatsCard title="Открытые NC" value={qms?.openNc || 0} icon={<AlertTriangle size={24} />} variant={qms?.openNc ? 'danger' : 'default'} />
            <StatsCard title="Активные CAPA" value={qms?.activeCapa || 0} icon={<Shield size={24} />} variant={qms?.activeCapa ? 'warning' : 'default'} />
            <StatsCard title="Просрочено док." value={qms?.overdueDocuments || 0} icon={<FileText size={24} />} variant={qms?.overdueDocuments ? 'danger' : 'default'} />
            <StatsCard title="Рекламации" value={qms?.openComplaints || 0} icon={<MessageSquareWarning size={24} />} variant={qms?.openComplaints ? 'warning' : 'default'} />
          </>
        )}
      </div>

      {/* Second row of stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatsCard title="Калибровки" value={qms?.pendingCalibrations || 0} icon={<Settings size={24} />} variant={qms?.pendingCalibrations ? 'warning' : 'default'} />
            <StatsCard title="Открытые риски" value={qms?.openRisks || 0} icon={<AlertTriangle size={24} />} variant={qms?.openRisks ? 'warning' : 'default'} />
            <StatsCard title="Аудиты" value={qms?.upcomingAudits || 0} icon={<ClipboardCheck size={24} />} variant="primary" />
            <StatsCard title="Обучение" value={qms?.trainingDue || 0} icon={<GraduationCap size={24} />} variant={qms?.trainingDue ? 'warning' : 'default'} />
          </>
        )}
      </div>

      {/* Quality Objectives */}
      {data?.qualityObjectives && data.qualityObjectives.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Цели в области качества
          </h2>
          <div className="space-y-4">
            {data.qualityObjectives.slice(0, 5).map((obj) => (
              <div key={obj.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{obj.title}</span>
                  <Badge variant={STATUS_COLORS[obj.status] || 'neutral'} size="sm">
                    {STATUS_LABELS[obj.status] || obj.status}
                  </Badge>
                </div>
                <Progress
                  value={obj.actualValue || 0}
                  max={obj.targetValue || 100}
                  variant={
                    (obj.actualValue || 0) >= (obj.targetValue || 100) ? 'success' :
                    (obj.actualValue || 0) >= (obj.targetValue || 100) * 0.7 ? 'primary' : 'warning'
                  }
                  showLabel
                />
              </div>
            ))}
          </div>
        </Card>
      )}


      {data?.userStats && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Моя статистика
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-surface-light/50 rounded-xl">
              <p className="text-2xl font-bold text-primary">{data.userStats.todayOperations}</p>
              <p className="text-xs text-slate-400 mt-1">Сегодня</p>
            </div>
            <div className="text-center p-3 bg-surface-light/50 rounded-xl">
              <p className="text-2xl font-bold">{data.userStats.weekOperations}</p>
              <p className="text-xs text-slate-400 mt-1">За неделю</p>
            </div>
            <div className="text-center p-3 bg-surface-light/50 rounded-xl">
              <p className="text-2xl font-bold">{data.userStats.monthOperations}</p>
              <p className="text-xs text-slate-400 mt-1">За месяц</p>
            </div>
            <div className="text-center p-3 bg-surface-light/50 rounded-xl">
              <p className="text-2xl font-bold">{data.userStats.totalOperations}</p>
              <p className="text-xs text-slate-400 mt-1">Всего</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Links - expanded */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { to: '/warehouse', icon: Package, label: 'Склад', desc: 'Запасы', color: 'primary' },
          { to: '/production', icon: Cpu, label: 'Производство', desc: 'Сборка', color: 'success' },
          { to: '/nc', icon: AlertTriangle, label: 'NC', desc: 'Несоответствия', color: 'danger' },
          { to: '/documents', icon: FileText, label: 'Документы', desc: 'DMS', color: 'primary' },
          { to: '/risks', icon: Shield, label: 'Риски', desc: 'Управление', color: 'warning' },
          { to: '/audit', icon: ClipboardCheck, label: 'Аудиты', desc: 'Внутренние', color: 'primary' },
          { to: '/suppliers', icon: Package, label: 'Поставщики', desc: 'Управление', color: 'success' },
          { to: '/rankings', icon: Trophy, label: 'Рейтинги', desc: 'Статистика', color: 'warning' },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <Card hover className="p-4 group h-full">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-${item.color}/20 shrink-0`}>
                  <item.icon size={20} className={`text-${item.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>


      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListTodo size={20} className="text-primary" />
            Мои задачи
          </h2>
          <Link to="/tasks" className="text-sm text-primary hover:underline">Все задачи</Link>
        </div>

        {loading ? (
          <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
        ) : data?.recentTasks && data.recentTasks.length > 0 ? (
          <div className="space-y-2">
            {data.recentTasks.map((task) => (
              <Link key={task.id} to="/tasks" className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-light transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-warning'}`} />
                  <span className="font-medium truncate">{task.title}</span>
                </div>
                <Badge variant={STATUS_COLORS[task.status] || 'neutral'}>{STATUS_LABELS[task.status] || task.status}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
            <p>Нет активных задач</p>
          </div>
        )}
      </Card>


      <Card className="p-4">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <Clock size={18} />
          <span>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </Card>
    </div>
  )
}
