/**
 * QMS API — barrel re-export
 *
 * Все типы и API-клиенты доступны через единый импорт:
 *   import { ncApi, NcShort } from "api/qms";
 */

export * from "./types";
export { auditApi } from "./audit";
export { documentsApi } from "./documents";
export { ncApi, capaApi } from "./nc";
export { risksApi } from "./risks";
export { riskManagementApi } from "./riskManagement";
export { suppliersApi } from "./suppliers";
export { internalAuditsApi } from "./internalAudits";
export { trainingApi } from "./training";
export { equipmentApi } from "./equipment";
export { reviewsApi } from "./reviews";
export { complaintsApi } from "./complaints";
export { changeRequestsApi, validationsApi, productsApi, notificationsApi } from "./misc";
export { dashboardApi } from "./dashboard";
export { designApi } from "./design";
export { esignApi } from "./esign";
export { dhrApi } from "./dhr";
export { dmrApi } from "./dmr";
export { workOrderApi } from "./workOrders";
export { routeSheetApi } from "./routeSheets";
export { mesQualityApi } from "./mesQuality";
export { acceptanceTestApi } from "./acceptanceTests";
export { mesKpiApi } from "./mesKpi";
