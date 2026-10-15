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
  firmwareVersion?: string;
}

export interface Batch {
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
  indicatorModel?: string; // DINI ARGEO
  productType?: string;
  isFinalOutput: boolean;
  weightIn: number;
  weightOut: number;
  wipWeight: number;
  yieldRatePct: number;
  status: 'NORMAL' | 'BOTTLENECK' | 'COMPLETED';
}

export interface BatchKPIResponse {
  batch: Batch;
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
  bottleneckProcess: {
    processId: string;
    processName: string;
    stationName: string;
    wipWeight: number;
  };
  processes: ProcessFlowItem[];
  isSimulating: boolean;
  lastUpdated: string;
}

export interface LiveWeighEvent {
  batchId: string;
  processId: string;
  stationId: string;
  stationName: string;
  indicatorModel?: string; // Dini Argeo
  hubId?: string;
  hubName?: string;
  companyId?: string;
  type: 'IN' | 'OUT';
  addedWeight: number;
  tareWeight?: number;
  netWeight?: number;
  timestamp: string;
}
