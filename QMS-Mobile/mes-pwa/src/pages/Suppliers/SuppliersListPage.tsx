import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { Card, Input, Button, Badge, Tabs, EmptyState, Loader } from '../../components/ui'
import { api, getErrorMessage } from '../../api/client'
import { useDebounce } from '../../hooks'
import { STATUS_COLORS, STATUS_LABELS, SUPPLIER_TYPE_LABELS } from '../../config'
import type { Supplier } from '../../types'

export const SuppliersListPage = () => {
  const navigate = useNavigate()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadSuppliers()
  }, [debouncedSearch, activeTab])

  const loadSuppliers = async () => {
    try {
      setLoading(true)

      const params: Record<string, any> = { limit: 50 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeTab === 'approved') params.status = 'APPROVED'
      if (activeTab === 'conditional') params.status = 'CONDITIONAL'
      if (activeTab === 'rejected') params.status = 'REJECTED'

      const { data } = await api.get('/suppliers', { params })
      setSuppliers(Array.isArray(data) ? data : data.rows || [])
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'approved', label: 'Одобренные', icon: <CheckCircle2 size={16} /> },
    { key: 'conditional', label: 'Условные', icon: <AlertTriangle size={16} /> },
    { key: 'rejected', label: 'Отклонённые', icon: <XCircle size={16} /> },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Поставщики</h1>
          <p className="text-slate-400 text-sm">Управление поставщиками</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => navigate('/suppliers/new')}>
          Новый поставщик
        </Button>
      </div>

      <Card className="p-3">
        <Input
          placeholder="Поиск поставщиков..."
          icon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Загрузка поставщиков..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="outline" onClick={loadSuppliers}>Повторить</Button>
        </Card>
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={<Truck size={48} />}
          title="Поставщики не найдены"
          description={search ? 'Попробуйте изменить запрос' : 'Нет зарегистрированных поставщиков'}
          action={
            <Button icon={<Plus size={18} />} onClick={() => navigate('/suppliers/new')}>
              Новый поставщик
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} hover className="p-4" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Truck size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">{supplier.code}</span>
                    <Badge variant="primary" size="sm">
                      {SUPPLIER_TYPE_LABELS[supplier.type] || supplier.type}
                    </Badge>
                  </div>
                  <p className="font-medium truncate">{supplier.name}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    {supplier.country && <span>{supplier.country}</span>}
                    {supplier.evaluationScore !== undefined && supplier.evaluationScore !== null && (
                      <>
                        {supplier.country && <span>•</span>}
                        <span className="font-medium">
                          {supplier.evaluationScore}/100
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_COLORS[supplier.status] || 'neutral'}>
                    {STATUS_LABELS[supplier.status] || supplier.status}
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

export default SuppliersListPage
