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
import { ModulesPage } from "./pages/Admin/Modules/ModulesPage";

// QMS страницы
import { QmsDashboardPage } from "./pages/QMS/QmsDashboardPage";
import { DocumentsPage } from "./pages/Documents/DocumentsPage";
import { NonconformityPage } from "./pages/Nonconformity/NonconformityPage";
import { CapaPage } from "./pages/CAPA/CapaPage";
import RisksPage from "./pages/Quality/RisksPage";
import RiskManagementPage from "./pages/Quality/RiskManagementPage";
import SuppliersPage from "./pages/Quality/SuppliersPage";
import AuditsPage from "./pages/Quality/AuditsPage";
import TrainingPage from "./pages/Quality/TrainingPage";
import EquipmentPage from "./pages/Quality/EquipmentPage";
import ReviewPage from "./pages/Quality/ReviewPage";
import ComplaintsPage from "./pages/Quality/ComplaintsPage";
import ChangeControlPage from "./pages/Quality/ChangeControlPage";
import ValidationPage from "./pages/Quality/ValidationPage";
import ProductRegistryPage from "./pages/Quality/ProductRegistryPage";
import { DesignControlPage } from "./pages/DesignControl/DesignControlPage";
import { ESignPage } from "./pages/ESign/ESignPage";
import DhrPage from "./pages/Quality/DhrPage";

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
  ADMIN_MODULES_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
  QMS_DASHBOARD_ROUTE,
  DOCUMENTS_ROUTE,
  DOCUMENT_DETAIL_ROUTE,
  NC_ROUTE,
  CAPA_ROUTE,
  RISKS_ROUTE,
  RISK_MANAGEMENT_ROUTE,
  SUPPLIERS_ROUTE,
  INTERNAL_AUDITS_ROUTE,
  TRAINING_ROUTE,
  EQUIPMENT_ROUTE,
  REVIEW_ROUTE,
  COMPLAINTS_ROUTE,
  CHANGE_CONTROL_ROUTE,
  VALIDATION_ROUTE,
  PRODUCT_REGISTRY_ROUTE,
  DESIGN_CONTROL_ROUTE,
  ESIGN_ROUTE,
  DHR_ROUTE,
} from "./utils/consts";

// QMS routes (rendered inside QmsLayout)
export const qmsRoutes = [
  { path: QMS_DASHBOARD_ROUTE, Component: QmsDashboardPage },
  { path: DOCUMENTS_ROUTE, Component: DocumentsPage },
  { path: DOCUMENT_DETAIL_ROUTE, Component: DocumentsPage },
  { path: NC_ROUTE, Component: NonconformityPage },
  { path: CAPA_ROUTE, Component: CapaPage },
  { path: RISKS_ROUTE, Component: RisksPage },
  { path: RISK_MANAGEMENT_ROUTE, Component: RiskManagementPage },
  { path: SUPPLIERS_ROUTE, Component: SuppliersPage },
  { path: INTERNAL_AUDITS_ROUTE, Component: AuditsPage },
  { path: TRAINING_ROUTE, Component: TrainingPage },
  { path: EQUIPMENT_ROUTE, Component: EquipmentPage },
  { path: REVIEW_ROUTE, Component: ReviewPage },
  { path: COMPLAINTS_ROUTE, Component: ComplaintsPage },
  { path: CHANGE_CONTROL_ROUTE, Component: ChangeControlPage },
  { path: VALIDATION_ROUTE, Component: ValidationPage },
  { path: PRODUCT_REGISTRY_ROUTE, Component: ProductRegistryPage },
  { path: DESIGN_CONTROL_ROUTE, Component: DesignControlPage },
  { path: ESIGN_ROUTE, Component: ESignPage },
  { path: DHR_ROUTE, Component: DhrPage },
];

export const authRoutes = [
  { path: SELECT_PC_ROUTE, Component: SelectPC },
  { path: PROFILE_ROUTE, Component: Profile },
  { path: WAREHOUSE_ROUTE, Component: UserWarehousePage },
  { path: WAREHOUSE_ANALYTICS_ROUTE, Component: AnalyticsPage },
  { path: WAREHOUSE_INVENTORY_ROUTE, Component: InventoryPage },
  { path: TASKS_ROUTE, Component: TasksPage },
];

export const adminRoutes = [
  { path: ADMIN_ROUTE, Component: AdminPanel },
  { path: STRUCTURE_ROUTE, Component: StructurePage },
  { path: AUDIT_LOG_ROUTE, Component: AuditLogPage },
  { path: ADMIN_PCs_ROUTE, Component: AdminPCs },
  { path: ADMIN_USERS_ROUTE, Component: AdminUsers },
  { path: ADMIN_WAREHOUSE_ROUTE, Component: AdminWarehousePage },
  { path: ADMIN_RBAC_ROUTE, Component: AdminRightsPage },
  { path: ADMIN_MODULES_ROUTE, Component: ModulesPage },
];

export const publicRoutes = [
  { path: START_ROUTE, Component: StartPage },
  { path: USERS_ROUTE, Component: Users },
  { path: LOGIN_ROUTE, Component: Login },
  { path: REGISTRATION_ROUTE, Component: Registration },
];
