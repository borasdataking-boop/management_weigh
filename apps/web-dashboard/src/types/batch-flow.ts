export interface Batch {
  id: string;
  name: string;
  planWeight: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  createdAt: string;
}

export interface ProcessFlowItem {
  processId: string;
  processName: string;
  stationId: string;
  stationName: string;
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
  type: 'IN' | 'OUT';
  addedWeight: number;
  timestamp: string;
}
