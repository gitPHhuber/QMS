export interface WarehouseUserShort {
  id: number;
  login: string;
  name: string;
  surname: string;
}

export interface WarehouseSectionShort {
  id: number;
  title: string;
}

export interface WarehouseTeamShort {
  id: number;
  title: string;
}


export interface SupplyModel {
  id: number;
  supplier: string | null;
  docNumber: string | null;
  status: string;
  comment: string | null;
  expectedDate: string | null;
  createdAt: string;
  updatedAt: string;
}


export interface InventoryBoxModel {
  id: number;
  supplyId: number | null;

  qrCode: string;
  shortCode: string | null;

  label: string;
  displayName?: string;
  labelCode?: string;

  originType: string | null;
  originId: number | null;

  quantity: number;
  unit: string;

  parentBoxId: number | null;

  boxNumber: string | null;
  kitNumber: string | null;
  projectName: string | null;
  batchName: string | null;

  status: string;
  notes: string | null;

  currentSectionId: number | null;
  currentTeamId: number | null;

  createdAt: string;
  updatedAt: string;

  section?: WarehouseSectionShort | null;
  team?: WarehouseTeamShort | null;
  currentSection?: WarehouseSectionShort | null;
  currentTeam?: WarehouseTeamShort | null;
  supply?: SupplyModel | null;
}

export interface WarehouseMovement {
  id: number;
  boxId: number;
  documentId?: number | null;

  fromSectionId: number | null;
  toSectionId: number | null;
  fromTeamId: number | null;
  toTeamId: number | null;

  operation: string;
  statusAfter: string | null;

  deltaQty: number;
  goodQty?: number | null;
  scrapQty?: number | null;

  performedAt: string;
  comment: string | null;

  performedBy?: WarehouseUserShort;
  fromSection?: WarehouseSectionShort;
  toSection?: WarehouseSectionShort;
  fromTeam?: WarehouseTeamShort;
  toTeam?: WarehouseTeamShort;
}

export interface WarehouseDocument {
  id: number;
  boxId: number | null;
  number: string;
  type: string | null;
  date: string | null;
  fileUrl: string | null;
  comment: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: WarehouseUserShort;
}

export interface StockBalanceItem {
  label: string;
  originType: string | null;
  originId: number | null;
  unit: string;
  totalQuantity: string;
  boxCount: string;
}

export interface InventoryLimitModel {
  id: number;
  label: string;
  min: number;
  originType?: string;
  originId?: number;
}

export interface DailyOperationSummary {
  operation: string;
  count: string;
  sumGood: string;
  sumScrap: string;
}

export interface ChartDataPoint {
  date: string;
  count: string;
}

export interface StockSummary {
  totalItems: number;
  totalBoxes: number;
}

export interface DashboardStats {
  stock: StockSummary;
  today: DailyOperationSummary[];
  chart: ChartDataPoint[];
}

// ═══ ISO 13485 Models ═══

export interface StorageZoneModel {
  id: number;
  name: string;
  type: "INCOMING" | "QUARANTINE" | "MAIN" | "FINISHED_GOODS" | "DEFECT" | "SHIPPING";
  parentZoneId: number | null;
  conditions: { temp_min?: number; temp_max?: number; humidity_min?: number; humidity_max?: number } | null;
  capacity: number | null;
  isActive: boolean;
  boxCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneTransitionRuleModel {
  id: number;
  fromZoneType: string;
  toZoneType: string;
  requiresApproval: boolean;
  requiredRole: string | null;
  isActive: boolean;
}

export interface QuarantineDecisionModel {
  id: number;
  boxId: number;
  reason: string;
  decisionType: "RELEASE" | "REWORK" | "SCRAP" | "RETURN_TO_SUPPLIER";
  decidedById: number;
  decidedAt: string;
  ncId: number | null;
  notes: string | null;
  decidedBy?: WarehouseUserShort;
  box?: InventoryBoxModel;
}

export interface IncomingInspectionModel {
  id: number;
  supplyId: number;
  inspectorId: number;
  date: string;
  status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED" | "CONDITIONAL";
  overallResult: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supply?: SupplyModel;
  inspector?: WarehouseUserShort;
  checklistItems?: InspectionChecklistItemModel[];
}

export interface InspectionChecklistItemModel {
  id: number;
  inspectionId: number;
  checkItem: string;
  result: "OK" | "NOK" | "NA" | "CONDITIONAL" | null;
  value: string | null;
  comment: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

export interface InspectionTemplateModel {
  id: number;
  name: string;
  productType: string | null;
  items: Array<{ checkItem: string; description?: string; required?: boolean }>;
  isActive: boolean;
}

export interface DeviceHistoryRecordModel {
  id: number;
  productId: number | null;
  serialNumber: string;
  batchNumber: string | null;
  status: "IN_PRODUCTION" | "QC_PASSED" | "QC_FAILED" | "RELEASED" | "SHIPPED" | "RETURNED";
  manufacturingDate: string | null;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  components?: DHRComponentModel[];
  records?: DHRRecordModel[];
}

export interface DHRComponentModel {
  id: number;
  dhrId: number;
  boxId: number | null;
  componentName: string;
  quantity: number;
  supplierLot: string | null;
  certificateRef: string | null;
  box?: InventoryBoxModel;
}

export interface DHRRecordModel {
  id: number;
  dhrId: number;
  recordType: string;
  referenceId: number | null;
  description: string | null;
  recordedAt: string;
  recordedById: number | null;
  recordedBy?: WarehouseUserShort;
}

export interface EnvironmentReadingModel {
  id: number;
  zoneId: number;
  temperature: number | null;
  humidity: number | null;
  measuredAt: string;
  measuredById: number;
  equipmentId: number | null;
  isWithinLimits: boolean | null;
  notes: string | null;
  zone?: StorageZoneModel;
  measuredBy?: WarehouseUserShort;
}

export interface EnvironmentAlertModel {
  id: number;
  zoneId: number;
  readingId: number;
  alertType: "TEMP_HIGH" | "TEMP_LOW" | "HUMIDITY_HIGH" | "HUMIDITY_LOW";
  acknowledgedById: number | null;
  acknowledgedAt: string | null;
  actionTaken: string | null;
  zone?: StorageZoneModel;
  reading?: EnvironmentReadingModel;
}

export interface StorageLocationModel {
  id: number;
  zoneId: number;
  rack: string;
  shelf: string;
  cell: string | null;
  barcode: string;
  capacity: number | null;
  isOccupied: boolean;
  isActive: boolean;
  zone?: StorageZoneModel;
  boxCount?: number;
}

export interface ShipmentModel {
  id: number;
  number: string;
  date: string;
  customerId: number | null;
  contractNumber: string | null;
  status: "DRAFT" | "PICKING" | "PACKED" | "SHIPPED" | "DELIVERED";
  shippedById: number | null;
  verifiedById: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ShipmentItemModel[];
  shippedBy?: WarehouseUserShort;
  verifiedBy?: WarehouseUserShort;
}

export interface ShipmentItemModel {
  id: number;
  shipmentId: number;
  boxId: number;
  quantity: number;
  packageCondition: "OK" | "DAMAGED" | null;
  verifiedAt: string | null;
  box?: InventoryBoxModel;
}

export interface ReturnModel {
  id: number;
  number: string;
  date: string;
  customerId: number | null;
  shipmentId: number | null;
  reason: string | null;
  status: "RECEIVED" | "INSPECTING" | "DECIDED" | "CLOSED";
  complaintId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ReturnItemModel[];
}

export interface ReturnItemModel {
  id: number;
  returnId: number;
  boxId: number | null;
  serialNumber: string | null;
  quantity: number;
  condition: string | null;
  disposition: "RESTOCK" | "REWORK" | "SCRAP" | "DESTROY" | null;
}
