

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { Loader } from './components/ui'


import { Layout } from './components/common/Layout'


import { LoginPage } from './pages/Auth/LoginPage'
import { HomePage } from './pages/Home/HomePage'
import { WarehousePage } from './pages/Warehouse/WarehousePage'
import { BoxDetailPage } from './pages/Warehouse/BoxDetailPage'
import { ProductionPage } from './pages/Production/ProductionPage'
import { ProductScanPage } from './pages/Production/ProductScanPage'
import { ChecklistPage } from './pages/Production/ChecklistPage'
import { RankingsPage } from './pages/Rankings/RankingsPage'
import { TasksPage } from './pages/Tasks/TasksPage'
import { ProfilePage } from './pages/Profile/ProfilePage'


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth()

  if (auth.isLoading) {
    return <Loader fullScreen text="Проверка авторизации..." />
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


function App() {
  const auth = useAuth()


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('Доступна новая версия приложения. Обновить?')) {
                  window.location.reload()
                }
              }
            })
          }
        })
      })
    }
  }, [])


  if (auth.isLoading) {
    return <Loader fullScreen text="Инициализация..." />
  }

  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />


      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />


        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="warehouse/:id" element={<BoxDetailPage />} />


        <Route path="production" element={<ProductionPage />} />
        <Route path="production/scan" element={<ProductScanPage />} />
        <Route path="production/:id" element={<ProductionPage />} />
        <Route path="production/checklist/:productId/:stepId" element={<ChecklistPage />} />


        <Route path="tasks" element={<TasksPage />} />


        <Route path="rankings" element={<RankingsPage />} />


        <Route path="profile" element={<ProfilePage />} />
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
