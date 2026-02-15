import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronRight,
  PenTool,
  Lightbulb,
  Code2,
  FileSearch,
  CheckCircle2,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS } from '../../config'
import type { DesignProject } from '../../types'

export const DesignListPage = () => {
  const navigate = useNavigate()

  const [projects, setProjects] = useState<DesignProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadProjects()
  }, [debouncedSearch, activeTab])

  const loadProjects = async () => {
    try {
      setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'concept') params.status = 'CONCEPT'
      if (activeTab === 'development') params.status = 'IN_DEVELOPMENT'
      if (activeTab === 'review') params.status = 'REVIEW'
      if (activeTab === 'approved') params.status = 'APPROVED'

      const { data } = await api.get('/design', { params })
      setProjects(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'concept', label: 'Концепция', icon: <Lightbulb size={16} /> },
    { key: 'development', label: 'Разработка', icon: <Code2 size={16} /> },
    { key: 'review', label: 'На рассмотрении', icon: <FileSearch size={16} /> },
    { key: 'approved', label: 'Утверждённые', icon: <CheckCircle2 size={16} /> },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Управление дизайном</h1>
          <p className="text-slate-400 text-sm">Проекты разработки и контроль дизайна</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/design/new')}>
          Новый проект
        </Button>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск проектов..."
          icon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка проектов..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadProjects}>Повторить</Button>
        </Card>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<PenTool size={48} />}
          title="Проекты не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Нет проектов разработки'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/design/new')}>
              Новый проект
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card key={project.id} hover className="p-4" onClick={() => navigate(`/design/${project.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <PenTool size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{project.code}</span>
                  </div>
                  <p className="font-medium truncate">{project.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    {project.deviceType && <span className="truncate">{project.deviceType}</span>}
                    {project.initiator && (
                      <>
                        {project.deviceType && <span>•</span>}
                        <span className="truncate">{project.initiator.surname} {project.initiator.name}</span>
                      </>
                    )}
                    {project.startDate && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(project.startDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[project.status] || 'neutral'}>
                    {STATUS_LABELS[project.status] || project.status}
                  </Badge>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DesignListPage
