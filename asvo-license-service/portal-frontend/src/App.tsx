import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { portalStore } from './store/portalStore';
import PortalLayout from './components/PortalLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentsPage from './pages/PaymentsPage';
import InstancesPage from './pages/InstancesPage';
import LicensesPage from './pages/LicensesPage';
import SupportPage from './pages/SupportPage';

function ProtectedRoute() {
  if (!portalStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/instances" element={<InstancesPage />} />
        <Route path="/licenses" element={<LicensesPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/subscription" replace />} />
    </Routes>
  );
}
