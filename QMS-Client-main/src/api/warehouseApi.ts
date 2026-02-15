import { $authHost } from "./index";
import {
  SupplyModel,
  InventoryBoxModel,
  WarehouseMovement,
  WarehouseDocument,
  StockBalanceItem,
  DashboardStats,
  StorageZoneModel, ZoneTransitionRuleModel, IncomingInspectionModel,
  InspectionTemplateModel, DeviceHistoryRecordModel, EnvironmentReadingModel,
  EnvironmentAlertModel, StorageLocationModel, ShipmentModel, ReturnModel
} from "src/types/WarehouseModels";

export type { WarehouseMovement };
export type WarehouseBox = InventoryBoxModel;

export interface SupplyCreateDto {
  supplier?: string;
  docNumber?: string;
  expectedDate?: string;
  comment?: string;
}

export interface BoxCreateDto {
  supplyId: number;
  sectionId: number;
  itemName: string;
  quantity: number;
  unit: string;
  kitNumber?: string;
  comment?: string;
}

export interface CreateBoxesBatchPayload {
  label: string;
  projectName?: string;
  batchName?: string;
  originType?: string;
  originId?: number | null;
  quantity: number;
  itemsPerBox: number;
  unit: string;
  status?: string;
  currentSectionId?: number | null;
  currentTeamId?: number | null;
  notes?: string;
}

export interface FetchBoxesParams {
  page?: number;
  limit?: number;
  search?: string;
  batchName?: string;
  projectName?: string;
  originType?: string;
  status?: string;
  sectionId?: number;
  teamId?: number;
  supplyId?: number;
}

export interface MoveBoxPayload {
  boxId: number;
  toSectionId?: number | null;
  toTeamId?: number | null;
  operation: string;
  statusAfter?: string;
  comment?: string;
  goodQty?: number;
  scrapQty?: number;
  deltaQty?: number;
}

export interface BatchMovePayload {
    movements: Array<{
        boxId: number;
        operation: string;
        toSectionId?: number | null;
        toTeamId?: number | null;
        statusAfter?: string;
        deltaQty?: number;
        goodQty?: number;
        scrapQty?: number;
        comment?: string;
    }>;
    documentData?: {
        createNew: boolean;
        number?: string;
        type?: string;
        comment?: string;
        documentId?: number;
    };
}

export interface FetchDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  boxId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateDocumentPayload {
  boxId?: number | null;
  number: string;
  type?: string;
  date?: string;
  fileUrl?: string;
  comment?: string;
}

export interface InventoryLimitModel {
    id: number;
    label: string;
    originType?: string;
    originId?: number;
    minQuantity: number;
}

export interface StockAlertModel {
    id: number;
    label: string;
    min: number;
    current: number;
    deficit: number;
}

export interface RankingResponse {
    users: {
        id: number;
        name: string;
        surname: string;
        teamName: string;
        avatar: string | null;
        output: number;
        defects: number;
        efficiency: number;
        place: number;
    }[];
    teams: {
        id: number;
        title: string;
        section: string;
        teamLead: string;
        totalOutput: number;
        avgEfficiency: number;
        progress: number;
        membersCount: number;
    }[];
}


export const createSupply = async (data: SupplyCreateDto): Promise<SupplyModel> => {
  const { data: response } = await $authHost.post('api/warehouse/supplies', data);
  return response;
};

export const fetchSupplies = async (): Promise<SupplyModel[]> => {
  const { data } = await $authHost.get('api/warehouse/supplies');
  return data;
};

export const createBox = async (data: BoxCreateDto): Promise<InventoryBoxModel> => {
  const { data: response } = await $authHost.post('api/warehouse/boxes/single', data);
  return response;
};

export const createBoxesBatch = async (payload: CreateBoxesBatchPayload) => {
  const { data } = await $authHost.post("api/warehouse/boxes/batch", payload);
  return data as { boxes: InventoryBoxModel[] };
};

export const updateBoxesBatch = async (ids: number[], updates: Partial<InventoryBoxModel>) => {
    const { data } = await $authHost.put("api/warehouse/boxes/batch", { ids, updates });
    return data;
};

export const fetchBoxes = async (params: FetchBoxesParams): Promise<any> => {
  const { data } = await $authHost.get("api/warehouse/boxes", { params });
  if (Array.isArray(data)) return data;
  return data as { rows: InventoryBoxModel[]; count: number; page: number; limit: number };
};

export const fetchBoxById = async (id: number) => {
  const { data } = await $authHost.get(`api/warehouse/boxes/${id}`);
  return data as {
    box: InventoryBoxModel;
    movements: WarehouseMovement[];
    documents: WarehouseDocument[];
  };
};

export const fetchBoxByQr = async (qrCode: string) => {
  const encoded = encodeURIComponent(qrCode);
  const { data } = await $authHost.get(`api/warehouse/boxes/by-qr/${encoded}`);
  return data as {
    box: InventoryBoxModel;
    movements: WarehouseMovement[];
    documents: WarehouseDocument[];
  };
};


export const fetchStockBalance = async () => {
    const { data } = await $authHost.get("api/warehouse/balance");
    return data as StockBalanceItem[];
};


export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const { data } = await $authHost.get("api/warehouse/analytics/dashboard");
    return data as DashboardStats;
};

export const fetchAlerts = async () => {
    const { data } = await $authHost.get("api/warehouse/alerts");
    return data as StockAlertModel[];
};

export const fetchAllLimits = async () => {
    const { data } = await $authHost.get("api/warehouse/limits");
    return data as InventoryLimitModel[];
};

export const saveLimit = async (payload: { label: string, min: number, originType?: string, originId?: number }) => {
    const { data } = await $authHost.post("api/warehouse/limits", payload);
    return data;
};


export const moveBox = async (payload: MoveBoxPayload) => {
  const { data } = await $authHost.post("api/warehouse/movements", payload);
  return data as { box: InventoryBoxModel; movement: WarehouseMovement };
};

export const moveBoxesBatch = async (payload: BatchMovePayload) => {
    const { data } = await $authHost.post("api/warehouse/movements/batch", payload);
    return data;
};


export const downloadBoxesExcel = async (ids: number[]) => {
  const { data } = await $authHost.post(
    "api/warehouse/boxes/export",
    { ids },
    { responseType: 'blob' }
  );
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `labels_export_${date}.csv`);
  document.body.appendChild(link); link.click(); link.remove();
};

export const printBoxesPdf = async (ids: number[]) => {
  const { data } = await $authHost.post(
    "api/warehouse/boxes/print-pdf",
    { ids },
    { responseType: 'blob' }
  );
  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `labels_print_${date}.pdf`);
  document.body.appendChild(link); link.click(); link.remove();
};

export const printSpecialLabel = async (data: Record<string, unknown>) => {
  const response = await $authHost.post("api/warehouse/boxes/print-special", data, {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
      iframe.contentWindow?.print();
  };
};


export const fetchPrintHistory = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    template?: string;
    dateFrom?: string;
    dateTo?: string;
}) => {
    const { data } = await $authHost.get("api/warehouse/print-history", { params });
    return data as { rows: any[]; count: number; page: number; limit: number };
};


export const fetchDocuments = async (params: FetchDocumentsParams) => {
  const { data } = await $authHost.get("api/warehouse/documents", { params });
  return data as { rows: WarehouseDocument[]; count: number; page: number; limit: number };
};

export const createDocument = async (payload: CreateDocumentPayload) => {
  const { data } = await $authHost.post("api/warehouse/documents", payload);
  return data as WarehouseDocument;
};

export const exportLabelsCsv = async (supplyId: number): Promise<Blob> => {
  const { data } = await $authHost.get(`api/warehouse/supplies/${supplyId}/export-csv`, {
    responseType: 'blob',
  });
  return data;
};

export const fetchRankings = async (period: 'day' | 'week' | 'month') => {
    const { data } = await $authHost.get("api/warehouse/rankings", {
        params: { period }
    });
    return data as RankingResponse;
};

// ═══ ISO 13485: Storage Zones ═══

export const fetchZones = async (): Promise<StorageZoneModel[]> => {
  const { data } = await $authHost.get("api/warehouse/zones");
  return data;
};

export const createZone = async (payload: Partial<StorageZoneModel>): Promise<StorageZoneModel> => {
  const { data } = await $authHost.post("api/warehouse/zones", payload);
  return data;
};

export const updateZone = async (id: number, payload: Partial<StorageZoneModel>): Promise<StorageZoneModel> => {
  const { data } = await $authHost.put(`api/warehouse/zones/${id}`, payload);
  return data;
};

export const fetchTransitionRules = async (): Promise<ZoneTransitionRuleModel[]> => {
  const { data } = await $authHost.get("api/warehouse/zones/transitions");
  return data;
};

// ═══ ISO 13485: Quarantine ═══

export const fetchQuarantinedBoxes = async (params?: { page?: number; limit?: number }) => {
  const { data } = await $authHost.get("api/warehouse/quarantine", { params });
  return data as { rows: any[]; count: number; page: number; limit: number; summary: any[] };
};

export const makeQuarantineDecision = async (payload: {
  boxId: number; reason: string; decisionType: string; ncId?: number; notes?: string;
}) => {
  const { data } = await $authHost.post("api/warehouse/quarantine/decide", payload);
  return data;
};

// ═══ ISO 13485: Incoming Inspection ═══

export const createInspection = async (payload: { supplyId: number; templateId?: number; notes?: string }): Promise<IncomingInspectionModel> => {
  const { data } = await $authHost.post("api/warehouse/inspections", payload);
  return data;
};

export const fetchInspections = async (params?: { page?: number; limit?: number; supplyId?: number; status?: string }) => {
  const { data } = await $authHost.get("api/warehouse/inspections", { params });
  return data as { rows: IncomingInspectionModel[]; count: number; page: number; limit: number };
};

export const updateInspection = async (id: number, payload: any): Promise<IncomingInspectionModel> => {
  const { data } = await $authHost.put(`api/warehouse/inspections/${id}`, payload);
  return data;
};

export const completeInspection = async (id: number, payload: { status: string; overallResult?: string }) => {
  const { data } = await $authHost.post(`api/warehouse/inspections/${id}/complete`, payload);
  return data;
};

export const fetchInspectionTemplates = async (): Promise<InspectionTemplateModel[]> => {
  const { data } = await $authHost.get("api/warehouse/inspection-templates");
  return data;
};

export const createInspectionTemplate = async (payload: Partial<InspectionTemplateModel>): Promise<InspectionTemplateModel> => {
  const { data } = await $authHost.post("api/warehouse/inspection-templates", payload);
  return data;
};

// ═══ ISO 13485: DHR / Traceability ═══

export const fetchDHR = async (serialNumber: string) => {
  const { data } = await $authHost.get(`api/warehouse/dhr/${encodeURIComponent(serialNumber)}`);
  return data as { dhr: DeviceHistoryRecordModel; movements: any[] };
};

export const fetchDHRTraceBack = async (batchNumber: string) => {
  const { data } = await $authHost.get(`api/warehouse/dhr/trace-back/${encodeURIComponent(batchNumber)}`);
  return data as { batchNumber: string; affectedBoxes: any[]; affectedDevices: DeviceHistoryRecordModel[]; totalDevices: number };
};

export const createDHR = async (payload: { productId?: number; serialNumber: string; batchNumber?: string; manufacturingDate?: string }): Promise<DeviceHistoryRecordModel> => {
  const { data } = await $authHost.post("api/warehouse/dhr", payload);
  return data;
};

export const addDHRComponents = async (id: number, components: Array<{ boxId?: number; componentName: string; quantity?: number; supplierLot?: string; certificateRef?: string }>) => {
  const { data } = await $authHost.post(`api/warehouse/dhr/${id}/components`, { components });
  return data;
};

export const addDHRRecord = async (id: number, record: { recordType: string; referenceId?: number; description?: string }) => {
  const { data } = await $authHost.post(`api/warehouse/dhr/${id}/records`, record);
  return data;
};

// ═══ ISO 13485: Environment Monitoring ═══

export const createEnvironmentReading = async (payload: { zoneId: number; temperature?: number; humidity?: number; equipmentId?: number; notes?: string }) => {
  const { data } = await $authHost.post("api/warehouse/environment", payload);
  return data as { reading: EnvironmentReadingModel; alerts: EnvironmentAlertModel[] };
};

export const fetchEnvironmentReadings = async (params?: { page?: number; limit?: number; zoneId?: number; fromDate?: string; toDate?: string }) => {
  const { data } = await $authHost.get("api/warehouse/environment", { params });
  return data as { rows: EnvironmentReadingModel[]; count: number; page: number; limit: number };
};

export const fetchEnvironmentAlerts = async (params?: { zoneId?: number }): Promise<EnvironmentAlertModel[]> => {
  const { data } = await $authHost.get("api/warehouse/environment/alerts", { params });
  return data;
};

export const acknowledgeEnvironmentAlert = async (id: number, actionTaken?: string) => {
  const { data } = await $authHost.put(`api/warehouse/environment/alerts/${id}/acknowledge`, { actionTaken });
  return data;
};

// ═══ ISO 13485: Expiry & FEFO ═══

export const fetchExpiryAlerts = async (days?: number) => {
  const { data } = await $authHost.get("api/warehouse/expiry-alerts", { params: { days } });
  return data as any[];
};

// ═══ ISO 13485: Address Storage ═══

export const fetchLocations = async (params?: { zoneId?: number }): Promise<StorageLocationModel[]> => {
  const { data } = await $authHost.get("api/warehouse/locations", { params });
  return data;
};

export const createLocation = async (payload: { zoneId: number; rack: string; shelf: string; cell?: string; barcode?: string; capacity?: number }): Promise<StorageLocationModel> => {
  const { data } = await $authHost.post("api/warehouse/locations", payload);
  return data;
};

export const fetchLocationByBarcode = async (barcode: string) => {
  const { data } = await $authHost.get(`api/warehouse/locations/by-barcode/${encodeURIComponent(barcode)}`);
  return data as { location: StorageLocationModel; boxes: any[] };
};

export const fetchLocationOccupancy = async (zoneId?: number) => {
  const { data } = await $authHost.get("api/warehouse/locations/occupancy", { params: { zoneId } });
  return data as StorageLocationModel[];
};

// ═══ ISO 13485: Shipments ═══

export const createShipment = async (payload: { number: string; date?: string; customerId?: number; contractNumber?: string; notes?: string }): Promise<ShipmentModel> => {
  const { data } = await $authHost.post("api/warehouse/shipments", payload);
  return data;
};

export const fetchShipments = async (params?: { page?: number; limit?: number; status?: string }) => {
  const { data } = await $authHost.get("api/warehouse/shipments", { params });
  return data as { rows: ShipmentModel[]; count: number; page: number; limit: number };
};

export const fetchShipmentById = async (id: number): Promise<ShipmentModel> => {
  const { data } = await $authHost.get(`api/warehouse/shipments/${id}`);
  return data;
};

export const shipmentPick = async (id: number, items: Array<{ boxId: number; quantity?: number }>) => {
  const { data } = await $authHost.post(`api/warehouse/shipments/${id}/pick`, { items });
  return data;
};

export const shipmentVerify = async (id: number, items: Array<{ itemId: number; packageCondition: string }>) => {
  const { data } = await $authHost.post(`api/warehouse/shipments/${id}/verify`, { items });
  return data;
};

export const shipmentShip = async (id: number) => {
  const { data } = await $authHost.post(`api/warehouse/shipments/${id}/ship`);
  return data;
};

// ═══ ISO 13485: Returns ═══

export const createReturn = async (payload: { number: string; customerId?: number; shipmentId?: number; reason?: string; notes?: string; items?: any[] }): Promise<ReturnModel> => {
  const { data } = await $authHost.post("api/warehouse/returns", payload);
  return data;
};

export const fetchReturns = async (params?: { page?: number; limit?: number; status?: string }) => {
  const { data } = await $authHost.get("api/warehouse/returns", { params });
  return data as { rows: ReturnModel[]; count: number; page: number; limit: number };
};

export const inspectReturn = async (id: number, items: Array<{ itemId: number; condition?: string; disposition?: string }>) => {
  const { data } = await $authHost.post(`api/warehouse/returns/${id}/inspect`, { items });
  return data;
};

export const decideReturn = async (id: number) => {
  const { data } = await $authHost.post(`api/warehouse/returns/${id}/decide`);
  return data;
};
