import { Injectable, Logger } from '@nestjs/common';
import {
  Batch,
  ProcessFlowItem,
  BatchKPIResponse,
  LiveWeighEvent,
} from './batch-dashboard.interface';

interface ProcessTemplate {
  processId: string;
  processName: string;
  stationId: string;
  stationName: string;
  productType?: string;
  isFinalOutput: boolean;
  defaultIn: number;
  defaultOut: number;
}

@Injectable()
export class BatchDashboardService {
  private readonly logger = new Logger(BatchDashboardService.name);

  // In-memory definition of 15 processes
  private readonly processCatalog: ProcessTemplate[] = [
    {
      processId: 'PROC01',
      processName: 'Tiếp nhận nguyên liệu (Material Receiving)',
      stationId: 'ST01',
      stationName: 'Trạm cân Tiếp nhận',
      productType: 'Cá nguyên liệu (PRD01)',
      isFinalOutput: false,
      defaultIn: 9500,
      defaultOut: 9300,
    },
    {
      processId: 'PROC02',
      processName: 'Phân cỡ & Phân loại (Grading)',
      stationId: 'ST02',
      stationName: 'Trạm cân Phân cỡ',
      productType: 'Bán thành phẩm (PRD02)',
      isFinalOutput: false,
      defaultIn: 9300,
      defaultOut: 9100,
    },
    {
      processId: 'PROC03',
      processName: 'Xếp khuôn & Chia mẻ (Stacking & Divide)',
      stationId: 'ST03',
      stationName: 'Trạm cân Xếp khuôn',
      isFinalOutput: false,
      defaultIn: 9100,
      defaultOut: 9000,
    },
    {
      processId: 'PROC04',
      processName: 'Bóc vỏ & Rút chỉ (Peeling / EZP / Devein)',
      stationId: 'ST04',
      stationName: 'Trạm cân Bóc vỏ',
      isFinalOutput: false,
      defaultIn: 9000,
      defaultOut: 8600,
    },
    {
      processId: 'PROC05',
      processName: 'Ngâm phụ gia (Soaking)',
      stationId: 'ST05',
      stationName: 'Trạm cân Ngâm phụ gia',
      isFinalOutput: false,
      defaultIn: 8600,
      defaultOut: 8400,
    },
    {
      processId: 'PROC06',
      processName: 'Định hình Nobashi & Butterfly',
      stationId: 'ST06',
      stationName: 'Trạm cân Định hình',
      isFinalOutput: false,
      defaultIn: 3000,
      defaultOut: 2900,
    },
    {
      processId: 'PROC07',
      processName: 'Tẩm bột (Breading)',
      stationId: 'ST07',
      stationName: 'Trạm cân Tẩm bột',
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1450,
    },
    {
      processId: 'PROC08',
      processName: 'Chiên chín (Breaded Fry)',
      stationId: 'ST08',
      stationName: 'Trạm cân Chiên',
      isFinalOutput: false,
      defaultIn: 1450,
      defaultOut: 1400,
    },
    {
      processId: 'PROC09',
      processName: 'Nấu chín PD (PD Cook)',
      stationId: 'ST09',
      stationName: 'Trạm cân Nấu PD',
      isFinalOutput: false,
      defaultIn: 2500,
      defaultOut: 2300,
    },
    {
      processId: 'PROC10',
      processName: 'Nấu chín HLSO (HLSO Cook)',
      stationId: 'ST10',
      stationName: 'Trạm cân Nấu HLSO',
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1400,
    },
    {
      processId: 'PROC11',
      processName: 'Tách vỏ sau nấu (Peel After Cook)',
      stationId: 'ST11',
      stationName: 'Trạm cân Tách vỏ',
      productType: 'Thành phẩm (PRD03)',
      isFinalOutput: false,
      defaultIn: 3700,
      defaultOut: 3500,
    },
    {
      processId: 'PROC12',
      processName: 'Cấp đông xoắn tươi (Raw Spiral Freezer)',
      stationId: 'ST12',
      stationName: 'Trạm cân Cấp đông xoắn tươi',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1000,
    },
    {
      processId: 'PROC13',
      processName: 'Cấp đông xoắn chiên (Fried Spiral Freezer)',
      stationId: 'ST13',
      stationName: 'Trạm cân Cấp đông xoắn chiên',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1100,
    },
    {
      processId: 'PROC14',
      processName: 'Cấp đông IQF tươi (Raw IQF)',
      stationId: 'ST14',
      stationName: 'Trạm cân Cấp đông IQF tươi',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1500,
      defaultOut: 800,
    },
    {
      processId: 'PROC15',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stationId: 'ST15',
      stationName: 'Trạm cân Cấp đông IQF chín',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 3500,
      defaultOut: 1200,
    },
  ];

  // In-memory Batches store
  private batches: Map<string, Batch> = new Map([
    [
      'BATCH_01',
      {
        id: 'BATCH_01',
        name: 'Lô Thủy Sản A01',
        planWeight: 10000,
        status: 'IN_PROGRESS',
        createdAt: '2026-10-12T07:00:00.000Z',
      },
    ],
    [
      'BATCH_02',
      {
        id: 'BATCH_02',
        name: 'Lô Nông Sản B02',
        planWeight: 15000,
        status: 'IN_PROGRESS',
        createdAt: '2026-10-12T08:00:00.000Z',
      },
    ],
    [
      'BATCH_03',
      {
        id: 'BATCH_03',
        name: 'Lô Đóng Hộp C03',
        planWeight: 8000,
        status: 'PENDING',
        createdAt: '2026-10-12T08:30:00.000Z',
      },
    ],
  ]);

  // In-memory mapping of batchId -> processId -> { weightIn, weightOut }
  private batchProcessWeights: Map<
    string,
    Map<string, { weightIn: number; weightOut: number }>
  > = new Map();

  // Active simulation interval timers
  private simulationTimers: Map<string, NodeJS.Timeout> = new Map();

  // Callback listener for websocket broadcasting
  private broadcastListener?: (data: BatchKPIResponse, event: LiveWeighEvent) => void;

  constructor() {
    this.initDefaultData();
  }

  setBroadcastListener(
    listener: (data: BatchKPIResponse, event: LiveWeighEvent) => void,
  ) {
    this.broadcastListener = listener;
  }

  private initDefaultData() {
    // Khởi tạo dữ liệu chuẩn xác cho BATCH_01 theo đề bài
    const b01Map = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      b01Map.set(p.processId, {
        weightIn: p.defaultIn,
        weightOut: p.defaultOut,
      });
    }
    this.batchProcessWeights.set('BATCH_01', b01Map);

    // BATCH_02 scale theo tỷ lệ 1.5
    const b02Map = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      b02Map.set(p.processId, {
        weightIn: Math.round(p.defaultIn * 1.5),
        weightOut: Math.round(p.defaultOut * 1.5),
      });
    }
    this.batchProcessWeights.set('BATCH_02', b02Map);

    // BATCH_03 mới bắt đầu
    const b03Map = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      b03Map.set(p.processId, {
        weightIn: p.processId === 'PROC01' ? 1200 : 0,
        weightOut: p.processId === 'PROC01' ? 800 : 0,
      });
    }
    this.batchProcessWeights.set('BATCH_03', b03Map);
  }

  getBatches(): Batch[] {
    return Array.from(this.batches.values());
  }

  getBatchSummary(batchId: string): BatchKPIResponse {
    const batch = this.batches.get(batchId) || this.batches.get('BATCH_01')!;
    let weightsMap = this.batchProcessWeights.get(batch.id);
    if (!weightsMap) {
      weightsMap = new Map();
      this.batchProcessWeights.set(batch.id, weightsMap);
    }

    let totalWeightIn = 0;
    let totalWeightOut = 0;
    let totalWipWeight = 0;
    let completedWeight = 0;

    let maxWip = -1;
    let bottleneck = {
      processId: 'PROC15',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stationName: 'Trạm cân Cấp đông IQF chín',
      wipWeight: 0,
    };

    const processes: ProcessFlowItem[] = this.processCatalog.map((template) => {
      const current = weightsMap!.get(template.processId) || {
        weightIn: template.defaultIn,
        weightOut: template.defaultOut,
      };

      const inWeight = current.weightIn;
      const outWeight = current.weightOut;
      const wip = Math.max(0, inWeight - outWeight);
      const yieldPct =
        inWeight > 0 ? Number(((outWeight / inWeight) * 100).toFixed(1)) : 0;

      totalWeightIn += inWeight;
      totalWeightOut += outWeight;
      totalWipWeight += wip;

      if (template.isFinalOutput) {
        completedWeight += outWeight;
      }

      if (wip > maxWip) {
        maxWip = wip;
        bottleneck = {
          processId: template.processId,
          processName: template.processName,
          stationName: template.stationName,
          wipWeight: wip,
        };
      }

      return {
        processId: template.processId,
        processName: template.processName,
        stationId: template.stationId,
        stationName: template.stationName,
        productType: template.productType,
        isFinalOutput: template.isFinalOutput,
        weightIn: inWeight,
        weightOut: outWeight,
        wipWeight: wip,
        yieldRatePct: yieldPct,
        status: 'NORMAL',
      };
    });

    // Gán trạng thái BOTTLENECK cho công đoạn có WIP lớn nhất
    for (const p of processes) {
      if (p.processId === bottleneck.processId) {
        p.status = 'BOTTLENECK';
      }
    }

    const planWeight = batch.planWeight;
    const completedPct = Number(
      ((completedWeight / planWeight) * 100).toFixed(1),
    );
    const totalWipPct = Number(
      ((totalWipWeight / planWeight) * 100).toFixed(1),
    );
    const remainingWeight = Math.max(0, planWeight - completedWeight);
    const remainingPct = Number(
      ((remainingWeight / planWeight) * 100).toFixed(1),
    );
    const overallYieldPct =
      totalWeightIn > 0
        ? Number(((totalWeightOut / totalWeightIn) * 100).toFixed(1))
        : 0;

    return {
      batch,
      planWeight,
      completedWeight,
      completedPct,
      totalWipWeight,
      totalWipPct,
      remainingWeight,
      remainingPct,
      totalWeightIn,
      totalWeightOut,
      overallYieldPct,
      bottleneckProcess: bottleneck,
      processes,
      isSimulating: this.simulationTimers.has(batch.id),
      lastUpdated: new Date().toISOString(),
    };
  }

  simulateWeighTick(batchId: string): {
    summary: BatchKPIResponse;
    event: LiveWeighEvent;
  } {
    const batch = this.batches.get(batchId) || this.batches.get('BATCH_01')!;
    const weightsMap = this.batchProcessWeights.get(batch.id)!;

    // Chọn ngẫu nhiên 1 công đoạn trong 15 công đoạn
    const randomIndex = Math.floor(Math.random() * this.processCatalog.length);
    const process = this.processCatalog[randomIndex];

    // Sinh lượng cân nhảy ngẫu nhiên từ 10 đến 50 kg
    const addedWeight = Math.floor(Math.random() * 41) + 10;
    // 60% xác suất là OUT, 40% là IN để dòng chảy WIP liên tục luân chuyển
    const type: 'IN' | 'OUT' = Math.random() > 0.4 ? 'OUT' : 'IN';

    const current = weightsMap.get(process.processId) || {
      weightIn: 0,
      weightOut: 0,
    };
    if (type === 'IN') {
      current.weightIn += addedWeight;
    } else {
      current.weightOut += addedWeight;
      // Đảm bảo OUT không vượt quá IN để WIP không âm
      if (current.weightOut > current.weightIn) {
        current.weightIn = current.weightOut;
      }
    }
    weightsMap.set(process.processId, current);

    const event: LiveWeighEvent = {
      batchId: batch.id,
      processId: process.processId,
      stationId: process.stationId,
      stationName: process.stationName,
      type,
      addedWeight,
      timestamp: new Date().toISOString(),
    };

    const summary = this.getBatchSummary(batch.id);

    if (this.broadcastListener) {
      this.broadcastListener(summary, event);
    }

    return { summary, event };
  }

  toggleSimulation(batchId: string): { isSimulating: boolean } {
    const existingTimer = this.simulationTimers.get(batchId);
    if (existingTimer) {
      clearInterval(existingTimer);
      this.simulationTimers.delete(batchId);
      this.logger.log(`Simulation stopped for batch ${batchId}`);
      return { isSimulating: false };
    } else {
      // Stream liên tục mỗi 1.5 giây
      const timer = setInterval(() => {
        try {
          this.simulateWeighTick(batchId);
        } catch (e) {
          this.logger.error(`Simulation tick error: ${e.message}`);
        }
      }, 1500);

      this.simulationTimers.set(batchId, timer);
      this.logger.log(`Simulation started for batch ${batchId} (interval 1.5s)`);
      return { isSimulating: true };
    }
  }

  isSimulating(batchId: string): boolean {
    return this.simulationTimers.has(batchId);
  }
}
