

import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Package, Cpu, ListTodo, Trophy, User, LogOut,
  Menu, X, Bell, QrCode, Wifi, WifiOff, ChevronDown,
  AlertTriangle, FileText, Users, ClipboardCheck, Shield,
  Settings, Truck, GraduationCap, Pencil, PenTool,
  FlaskConical, BarChart3, MessageSquareWarning, Search as SearchIcon
} from 'lucide-react'
import { useAuth } from 'react-oidc-context'
import { USER_ROLES } from '../../config'

interface NavItem {
  to: string
  icon: any
  label: string
}

interface NavGroup {
  key: string
  label: string
  icon: any
  items: NavItem[]
}

const directNavItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Главная' },
]

const navGroups: NavGroup[] = [
  {
    key: 'production',
    label: 'Производство',
    icon: Cpu,
    items: [
      { to: '/warehouse', icon: Package, label: 'Склад' },
      { to: '/production', icon: Cpu, label: 'Производство' },
      { to: '/equipment', icon: Settings, label: 'Оборудование' },
    ],
  },
  {
    key: 'quality',
    label: 'Качество',
    icon: ClipboardCheck,
    items: [
      { to: '/nc', icon: AlertTriangle, label: 'Несоответствия' },
      { to: '/capa', icon: Shield, label: 'CAPA' },
      { to: '/complaints', icon: MessageSquareWarning, label: 'Рекламации' },
      { to: '/audit', icon: SearchIcon, label: 'Аудиты' },
      { to: '/risks', icon: AlertTriangle, label: 'Риски' },
      { to: '/validation', icon: FlaskConical, label: 'Валидация' },
    ],
  },
  {
    key: 'documents',
    label: 'Документы',
    icon: FileText,
    items: [
      { to: '/documents', icon: FileText, label: 'Документы' },
      { to: '/changes', icon: PenTool, label: 'Изменения' },
      { to: '/esign', icon: Pencil, label: 'Эл. подписи' },
    ],
  },
  {
    key: 'resources',
    label: 'Ресурсы',
    icon: Users,
    items: [
      { to: '/suppliers', icon: Truck, label: 'Поставщики' },
      { to: '/training', icon: GraduationCap, label: 'Обучение' },
      { to: '/design', icon: BarChart3, label: 'Проектирование' },
    ],
  },
]

const bottomNavItems: NavItem[] = [
  { to: '/tasks', icon: ListTodo, label: 'Задачи' },
  { to: '/rankings', icon: Trophy, label: 'Рейтинги' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Главная',
  '/warehouse': 'Склад',
  '/production': 'Производство',
  '/equipment': 'Оборудование',
  '/environment': 'Мониторинг среды',
  '/nc': 'Несоответствия',
  '/capa': 'CAPA',
  '/complaints': 'Рекламации',
  '/audit': 'Аудиты',
  '/risks': 'Риски',
  '/validation': 'Валидация',
  '/documents': 'Документы',
  '/changes': 'Изменения',
  '/esign': 'Эл. подписи',
  '/suppliers': 'Поставщики',
  '/training': 'Обучение',
  '/design': 'Проектирование',
  '/tasks': 'Задачи',
  '/rankings': 'Рейтинги',
  '/profile': 'Профиль',
}

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [openGroups, setOpenGroups] = useState<string[]>(['production', 'quality'])
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()


  const user = auth.user?.profile ? {
    name: auth.user.profile.given_name || '',
    surname: auth.user.profile.family_name || '',
    role: (auth.user.profile as any).realm_access?.roles?.[0] || 'USER',
    img: (auth.user.profile as any).picture,
  } : null

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogout = () => {
    if (confirm('Выйти из системы?')) {
      auth.signoutRedirect()
    }
  }

  const toggleGroup = (key: string) => {
    setOpenGroups(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const isGroupActive = (group: NavGroup) =>
    group.items.some(item => location.pathname.startsWith(item.to))

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Главная'
    const match = Object.keys(PAGE_TITLES)
      .filter(k => k !== '/')
      .sort((a, b) => b.length - a.length)
      .find(k => path.startsWith(k))
    return match ? PAGE_TITLES[match] : 'QMS'
  }

  return (
    <div className="min-h-screen bg-background flex">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-surface border-r border-slate-700/50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>

        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">ASVO-</span>
              <span className="text-primary font-light">QMS</span>
            </div>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-surface-light rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>


        <div className="p-4 shrink-0">
          <button
            onClick={() => { navigate('/production/scan'); setSidebarOpen(false) }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3
              bg-gradient-to-r from-primary to-primary-dark text-white
              rounded-xl font-medium shadow-lg shadow-primary/25
              hover:shadow-primary/40 transition-all active:scale-[0.98]"
          >
            <QrCode size={20} />
            Сканировать
          </button>
        </div>


        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {/* Direct nav items (Home) */}
          {directNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-150
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-slate-400 hover:bg-surface-light hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Grouped nav items with accordion */}
          {navGroups.map((group) => (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                  transition-all duration-150 text-left
                  ${isGroupActive(group) ? 'text-white' : 'text-slate-400 hover:bg-surface-light hover:text-white'}
                `}
              >
                <group.icon size={18} />
                <span className="font-medium text-sm flex-1">{group.label}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${openGroups.includes(group.key) ? 'rotate-180' : ''}`}
                />
              </button>
              {openGroups.includes(group.key) && (
                <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5 mt-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-150 text-sm
                        ${isActive
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-slate-400 hover:bg-surface-light hover:text-white'
                        }
                      `}
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Bottom direct items (Tasks, Rankings) */}
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-150
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-slate-400 hover:bg-surface-light hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>


        <div className="p-4 border-t border-slate-700/50 shrink-0">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl mb-2
              transition-all duration-150
              ${isActive
                ? 'bg-primary/20 text-primary'
                : 'text-slate-400 hover:bg-surface-light hover:text-white'
              }
            `}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
              {user?.img ? (
                <img src={user.img} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={18} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-white">
                {user?.surname} {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {USER_ROLES[user?.role || ''] || user?.role}
              </p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-slate-400 hover:bg-danger/10 hover:text-danger
              transition-all duration-150"
          >
            <LogOut size={20} />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>


      <div className="flex-1 flex flex-col min-w-0">

        <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <button
            className="lg:hidden p-2 hover:bg-surface-light rounded-lg mr-3 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <h1 className="text-lg font-semibold lg:hidden">{getPageTitle()}</h1>

          <div className="flex-1" />


          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mr-3 ${isOnline ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-xs font-medium hidden sm:inline">
              {isOnline ? 'Онлайн' : 'Офлайн'}
            </span>
          </div>


          <button className="p-2 hover:bg-surface-light rounded-lg relative transition-colors">
            <Bell size={20} className="text-slate-400" />
          </button>
        </header>


        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
