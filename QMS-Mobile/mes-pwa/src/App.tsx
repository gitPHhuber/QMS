

import { useEffect, lazy, Suspense } from 'react'
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

// Lazy-loaded QMS modules
const NcListPage = lazy(() => import('./pages/NC/NcListPage'))
const NcDetailPage = lazy(() => import('./pages/NC/NcDetailPage'))
const NcFormPage = lazy(() => import('./pages/NC/NcFormPage'))
const CapaListPage = lazy(() => import('./pages/NC/CapaListPage'))
const CapaDetailPage = lazy(() => import('./pages/NC/CapaDetailPage'))

const ComplaintsListPage = lazy(() => import('./pages/Complaints/ComplaintsListPage'))
const ComplaintDetailPage = lazy(() => import('./pages/Complaints/ComplaintDetailPage'))
const ComplaintFormPage = lazy(() => import('./pages/Complaints/ComplaintFormPage'))

const RiskListPage = lazy(() => import('./pages/Risks/RiskListPage'))
const RiskDetailPage = lazy(() => import('./pages/Risks/RiskDetailPage'))
const RiskFormPage = lazy(() => import('./pages/Risks/RiskFormPage'))
const RiskMatrixPage = lazy(() => import('./pages/Risks/RiskMatrixPage'))

const AuditPlansPage = lazy(() => import('./pages/Audit/AuditPlansPage'))
const AuditDetailPage = lazy(() => import('./pages/Audit/AuditDetailPage'))
const AuditFormPage = lazy(() => import('./pages/Audit/AuditFormPage'))

const ValidationListPage = lazy(() => import('./pages/Validation/ValidationListPage'))
const ValidationDetailPage = lazy(() => import('./pages/Validation/ValidationDetailPage'))
const ValidationFormPage = lazy(() => import('./pages/Validation/ValidationFormPage'))

const DocumentsListPage = lazy(() => import('./pages/Documents/DocumentsListPage'))
const DocumentDetailPage = lazy(() => import('./pages/Documents/DocumentDetailPage'))
const DocumentFormPage = lazy(() => import('./pages/Documents/DocumentFormPage'))
const DocumentUploadPage = lazy(() => import('./pages/Documents/DocumentUploadPage'))

const ChangesListPage = lazy(() => import('./pages/Changes/ChangesListPage'))
const ChangeDetailPage = lazy(() => import('./pages/Changes/ChangeDetailPage'))
const ChangeFormPage = lazy(() => import('./pages/Changes/ChangeFormPage'))

const ESignRequestsPage = lazy(() => import('./pages/ESign/ESignRequestsPage'))
const ESignDetailPage = lazy(() => import('./pages/ESign/ESignDetailPage'))
const ESignVerifyPage = lazy(() => import('./pages/ESign/ESignVerifyPage'))

const EquipmentListPage = lazy(() => import('./pages/Equipment/EquipmentListPage'))
const EquipmentDetailPage = lazy(() => import('./pages/Equipment/EquipmentDetailPage'))
const EquipmentFormPage = lazy(() => import('./pages/Equipment/EquipmentFormPage'))
const EnvironmentPage = lazy(() => import('./pages/Equipment/EnvironmentPage'))

const SuppliersListPage = lazy(() => import('./pages/Suppliers/SuppliersListPage'))
const SupplierDetailPage = lazy(() => import('./pages/Suppliers/SupplierDetailPage'))
const SupplierFormPage = lazy(() => import('./pages/Suppliers/SupplierFormPage'))

const TrainingListPage = lazy(() => import('./pages/Training/TrainingListPage'))
const TrainingDetailPage = lazy(() => import('./pages/Training/TrainingDetailPage'))
const TrainingFormPage = lazy(() => import('./pages/Training/TrainingFormPage'))
const CompetencyPage = lazy(() => import('./pages/Training/CompetencyPage'))
const GapAnalysisPage = lazy(() => import('./pages/Training/GapAnalysisPage'))

const DesignListPage = lazy(() => import('./pages/Design/DesignListPage'))
const DesignDetailPage = lazy(() => import('./pages/Design/DesignDetailPage'))
const DesignFormPage = lazy(() => import('./pages/Design/DesignFormPage'))


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

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex justify-center py-12"><Loader text="Загрузка модуля..." /></div>}>
    {children}
  </Suspense>
)


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

        {/* NC / CAPA */}
        <Route path="nc" element={<LazyPage><NcListPage /></LazyPage>} />
        <Route path="nc/new" element={<LazyPage><NcFormPage /></LazyPage>} />
        <Route path="nc/:id" element={<LazyPage><NcDetailPage /></LazyPage>} />
        <Route path="nc/:id/edit" element={<LazyPage><NcFormPage /></LazyPage>} />
        <Route path="capa" element={<LazyPage><CapaListPage /></LazyPage>} />
        <Route path="capa/new" element={<LazyPage><NcFormPage /></LazyPage>} />
        <Route path="capa/:id" element={<LazyPage><CapaDetailPage /></LazyPage>} />

        {/* Complaints */}
        <Route path="complaints" element={<LazyPage><ComplaintsListPage /></LazyPage>} />
        <Route path="complaints/new" element={<LazyPage><ComplaintFormPage /></LazyPage>} />
        <Route path="complaints/:id" element={<LazyPage><ComplaintDetailPage /></LazyPage>} />
        <Route path="complaints/:id/edit" element={<LazyPage><ComplaintFormPage /></LazyPage>} />

        {/* Risk Management */}
        <Route path="risks" element={<LazyPage><RiskListPage /></LazyPage>} />
        <Route path="risks/new" element={<LazyPage><RiskFormPage /></LazyPage>} />
        <Route path="risks/matrix" element={<LazyPage><RiskMatrixPage /></LazyPage>} />
        <Route path="risks/:id" element={<LazyPage><RiskDetailPage /></LazyPage>} />
        <Route path="risks/:id/edit" element={<LazyPage><RiskFormPage /></LazyPage>} />

        {/* Internal Audit */}
        <Route path="audit" element={<LazyPage><AuditPlansPage /></LazyPage>} />
        <Route path="audit/plans/new" element={<LazyPage><AuditFormPage /></LazyPage>} />
        <Route path="audit/schedules/new" element={<LazyPage><AuditFormPage /></LazyPage>} />
        <Route path="audit/schedules/:id" element={<LazyPage><AuditDetailPage /></LazyPage>} />

        {/* Process Validation */}
        <Route path="validation" element={<LazyPage><ValidationListPage /></LazyPage>} />
        <Route path="validation/new" element={<LazyPage><ValidationFormPage /></LazyPage>} />
        <Route path="validation/:id" element={<LazyPage><ValidationDetailPage /></LazyPage>} />

        {/* DMS */}
        <Route path="documents" element={<LazyPage><DocumentsListPage /></LazyPage>} />
        <Route path="documents/new" element={<LazyPage><DocumentFormPage /></LazyPage>} />
        <Route path="documents/:id" element={<LazyPage><DocumentDetailPage /></LazyPage>} />
        <Route path="documents/:id/edit" element={<LazyPage><DocumentFormPage /></LazyPage>} />
        <Route path="documents/:id/upload" element={<LazyPage><DocumentUploadPage /></LazyPage>} />

        {/* Change Management */}
        <Route path="changes" element={<LazyPage><ChangesListPage /></LazyPage>} />
        <Route path="changes/new" element={<LazyPage><ChangeFormPage /></LazyPage>} />
        <Route path="changes/:id" element={<LazyPage><ChangeDetailPage /></LazyPage>} />
        <Route path="changes/:id/edit" element={<LazyPage><ChangeFormPage /></LazyPage>} />

        {/* Electronic Signatures */}
        <Route path="esign" element={<LazyPage><ESignRequestsPage /></LazyPage>} />
        <Route path="esign/verify/:id" element={<LazyPage><ESignVerifyPage /></LazyPage>} />
        <Route path="esign/:id" element={<LazyPage><ESignDetailPage /></LazyPage>} />

        {/* Equipment & Environment */}
        <Route path="equipment" element={<LazyPage><EquipmentListPage /></LazyPage>} />
        <Route path="equipment/new" element={<LazyPage><EquipmentFormPage /></LazyPage>} />
        <Route path="equipment/:id" element={<LazyPage><EquipmentDetailPage /></LazyPage>} />
        <Route path="equipment/:id/edit" element={<LazyPage><EquipmentFormPage /></LazyPage>} />
        <Route path="environment" element={<LazyPage><EnvironmentPage /></LazyPage>} />

        {/* Suppliers */}
        <Route path="suppliers" element={<LazyPage><SuppliersListPage /></LazyPage>} />
        <Route path="suppliers/new" element={<LazyPage><SupplierFormPage /></LazyPage>} />
        <Route path="suppliers/:id" element={<LazyPage><SupplierDetailPage /></LazyPage>} />
        <Route path="suppliers/:id/edit" element={<LazyPage><SupplierFormPage /></LazyPage>} />

        {/* Training */}
        <Route path="training" element={<LazyPage><TrainingListPage /></LazyPage>} />
        <Route path="training/new" element={<LazyPage><TrainingFormPage /></LazyPage>} />
        <Route path="training/competency" element={<LazyPage><CompetencyPage /></LazyPage>} />
        <Route path="training/gap-analysis" element={<LazyPage><GapAnalysisPage /></LazyPage>} />
        <Route path="training/:id" element={<LazyPage><TrainingDetailPage /></LazyPage>} />

        {/* Design Control */}
        <Route path="design" element={<LazyPage><DesignListPage /></LazyPage>} />
        <Route path="design/new" element={<LazyPage><DesignFormPage /></LazyPage>} />
        <Route path="design/:id" element={<LazyPage><DesignDetailPage /></LazyPage>} />
        <Route path="design/:id/edit" element={<LazyPage><DesignFormPage /></LazyPage>} />
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
