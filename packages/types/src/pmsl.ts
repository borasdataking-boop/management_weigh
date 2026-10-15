export type WeightType = 'IN' | 'OUT';

export interface CompanyItem {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HubItem {
  id: string;
  companyId: string;
  code: string;
  name: string;
  ipAddress?: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt?: string | Date | null;
  firmwareVersion?: string;
}

export interface ProcessItem {
  processId: string;
  processName: string;
}

export interface ProductItem {
  productId: string;
  productName: string;
  isEnd?: boolean | null;
}

export interface StationWeighItem {
  stationId: string;
  stationName: string;
  processId: string;
  hubId?: string;
  indicatorModel: string; // VD: 'DINI_ARGEO'
  isActive: boolean;
  lastSeenAt?: string | Date | null;
  createdAt: string | Date;
}

export interface MappingProcessItem {
  mappingId: number;
  fromProcessId: string;
  toProcessId: string;
}

export interface PmshubOperatorItem {
  operatorId: string;
  hubId?: string;
  username: string;
  isActive: boolean;
  authVersion: number;
  failedAttempts: number;
  lockedUntil?: string | Date | null;
  createdAt: string | Date;
  lastLoginAt?: string | Date | null;
}

export interface ProductionWeightLogItem {
  logId: string; // Serialized string for BigInt
  companyId?: string | null;
  hubId?: string | null;
  batchId: string;
  stationId: string;
  processId: string;
  productId: string;
  typeWeight: WeightType;
  valueWeight: number; // Gross weight in kg từ Loadcell & Dini
  tareWeight: number;  // Tare weight in kg
  netWeight: number;   // Gross - Tare
  timeAction: string;
  employeeId?: string | null;
  sourceMessageId?: string | null;
}

export interface BatchInfo {
  id: string;
  name: string;
  planWeight: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  companyId?: string;
  hubId?: string;
  createdAt: string;
}

export interface ProcessFlowItem {
  processId: string;
  processName: string;
  stationId: string;
  stationName: string;
  indicatorModel?: string; // e.g. Dini Argeo
  productType?: string;
  isFinalOutput: boolean;
  weightIn: number;
  weightOut: number;
  wipWeight: number;
  yieldRatePct: number;
  status: 'NORMAL' | 'BOTTLENECK';
}

export interface BottleneckProcess {
  processId: string;
  processName: string;
  stationName: string;
  wipWeight: number;
}

export interface BatchKPIResponse {
  batch: BatchInfo;
  activeCompany?: CompanyItem;
  activeHub?: HubItem;
  planWeight: number;
  completedWeight: number;
  completedPct: number;
  totalWipWeight: number;
  totalWipPct: number;
  remainingWeight: number;
  remainingPct: number;
  totalWeightIn: number;
  totalWeightOut: number;
  overallYieldPct: number;
  bottleneckProcess: BottleneckProcess;
  processes: ProcessFlowItem[];
  isSimulating: boolean;
  lastUpdated: string;
}

export interface LiveWeighEvent {
  batchId: string;
  processId: string;
  stationId: string;
  stationName: string;
  indicatorModel?: string; // Dini Argeo loadcell
  hubId?: string;
  hubName?: string;
  companyId?: string;
  type: WeightType;
  addedWeight: number;
  tareWeight?: number;
  netWeight?: number;
  timestamp: string;
}

export interface RecordWeighLogDto {
  companyId?: string;
  hubId?: string;
  batchId: string;
  stationId: string;
  processId: string;
  productId: string;
  typeWeight: WeightType;
  valueWeight: number;
  tareWeight?: number;
  employeeId?: string;
  sourceMessageId?: string;
  indicatorModel?: string;
}
