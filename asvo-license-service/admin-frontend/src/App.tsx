import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import OrgDetailPage from './pages/OrgDetailPage';
import InstancesPage from './pages/InstancesPage';
import LicenseGenPage from './pages/LicenseGenPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orgs" element={<OrganizationsPage />} />
          <Route path="/orgs/:id" element={<OrgDetailPage />} />
          <Route path="/instances" element={<InstancesPage />} />
          <Route path="/licenses/new" element={<LicenseGenPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
