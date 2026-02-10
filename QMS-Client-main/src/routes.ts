import { AdminPanel } from "./pages/Admin/AdminPanel";
import { AdminPCs } from "./pages/Admin/AdminPCs/AdminPCs";
import { AdminUsers } from "./pages/Admin/AdminUsers/AdminUsers";
import { StructurePage } from "./pages/Admin/Structure/StructurePage";
import { AuditLogPage } from "./pages/Admin/Audit/AuditLogPage";
import { SelectPC } from "./pages/PCs/SelectPC";
import { Profile } from "./pages/Profile/Profile";
import { StartPage } from "./pages/StartPage/StartPage";
import { Users } from "./pages/Users/Users";
import { Login } from "./pages/Login/Login";
import { Registration } from "./pages/Login/Registration";

import { WarehousePage as AdminWarehousePage } from "./pages/Admin/Warehouse/WarehousePage";
import { WarehousePage as UserWarehousePage } from "./pages/Warehouse/WarehousePage";
import { AnalyticsPage } from "./pages/Warehouse/AnalyticsPage";
import { InventoryPage } from "./pages/Warehouse/InventoryPage";

import TasksPage from "./pages/Tasks/TasksPage";

import { AdminRightsPage } from "./pages/Admin/RBAC/AdminRightsPage";

// QMS страницы
import { QmsDashboardPage } from "./pages/QMS/QmsDashboardPage";
import { DocumentsPage } from "./pages/Documents/DocumentsPage";
import { NonconformityPage } from "./pages/Nonconformity/NonconformityPage";
import { CapaPage } from "./pages/CAPA/CapaPage";

import {
  ADMIN_PCs_ROUTE,
  ADMIN_ROUTE,
  ADMIN_USERS_ROUTE,
  PROFILE_ROUTE,
  SELECT_PC_ROUTE,
  START_ROUTE,
  USERS_ROUTE,
  STRUCTURE_ROUTE,
  AUDIT_LOG_ROUTE,
  ADMIN_WAREHOUSE_ROUTE,
  WAREHOUSE_ROUTE,
  WAREHOUSE_ANALYTICS_ROUTE,
  WAREHOUSE_INVENTORY_ROUTE,
  TASKS_ROUTE,
  ADMIN_RBAC_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
  QMS_DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  NC_ROUTE,
  CAPA_ROUTE,
} from "./utils/consts";

export const authRoutes = [
  { path: SELECT_PC_ROUTE, Component: SelectPC },
  { path: PROFILE_ROUTE, Component: Profile },
  { path: WAREHOUSE_ROUTE, Component: UserWarehousePage },
  { path: WAREHOUSE_ANALYTICS_ROUTE, Component: AnalyticsPage },
  { path: WAREHOUSE_INVENTORY_ROUTE, Component: InventoryPage },
  { path: TASKS_ROUTE, Component: TasksPage },
  { path: QMS_DASHBOARD_ROUTE, Component: QmsDashboardPage },
  { path: DOCUMENTS_ROUTE, Component: DocumentsPage },
  { path: NC_ROUTE, Component: NonconformityPage },
  { path: CAPA_ROUTE, Component: CapaPage },
];

export const adminRoutes = [
  { path: ADMIN_ROUTE, Component: AdminPanel },
  { path: STRUCTURE_ROUTE, Component: StructurePage },
  { path: AUDIT_LOG_ROUTE, Component: AuditLogPage },
  { path: ADMIN_PCs_ROUTE, Component: AdminPCs },
  { path: ADMIN_USERS_ROUTE, Component: AdminUsers },
  { path: ADMIN_WAREHOUSE_ROUTE, Component: AdminWarehousePage },
  { path: ADMIN_RBAC_ROUTE, Component: AdminRightsPage },
];

export const publicRoutes = [
  { path: START_ROUTE, Component: StartPage },
  { path: USERS_ROUTE, Component: Users },
  { path: LOGIN_ROUTE, Component: Login },
  { path: REGISTRATION_ROUTE, Component: Registration },
];
