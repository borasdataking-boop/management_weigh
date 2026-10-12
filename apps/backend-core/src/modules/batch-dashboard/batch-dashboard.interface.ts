export interface Batch {
  id: string;
  name: string;
  planWeight: number; // in kg e.g. 10000
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING';
  createdAt: string;
}

export interface ProcessFlowItem {
  processId: string; // e.g. PROC01
  processName: string; // e.g. Tiếp nhận nguyên liệu (Material Receiving)
  stationId: string; // e.g. ST01
  stationName: string; // e.g. Trạm cân Tiếp nhận
  productType?: string; // e.g. Cá nguyên liệu (PRD01), Bán thành phẩm (PRD02), Thành phẩm (PRD03)
  isFinalOutput: boolean; // true for PROC12, PROC13, PROC14, PROC15
  weightIn: number; // Tổng cân IN (kg)
  weightOut: number; // Tổng cân OUT (kg)
  wipWeight: number; // max(0, IN - OUT)
  yieldRatePct: number; // (OUT / IN) * 100%
  status: 'NORMAL' | 'BOTTLENECK' | 'COMPLETED';
}

export interface BatchKPIResponse {
  batch: Batch;
  planWeight: number;
  completedWeight: number; // Sum of OUT from PROC12, PROC13, PROC14, PROC15
  completedPct: number; // (completedWeight / planWeight) * 100
  totalWipWeight: number; // Sum of WIP across all 15 processes
  totalWipPct: number; // (totalWipWeight / planWeight) * 100
  remainingWeight: number; // max(0, planWeight - completedWeight)
  remainingPct: number;
  totalWeightIn: number; // Sum of IN across all 15 processes
  totalWeightOut: number; // Sum of OUT across all 15 processes
  overallYieldPct: number; // (totalWeightOut / totalWeightIn) * 100
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
