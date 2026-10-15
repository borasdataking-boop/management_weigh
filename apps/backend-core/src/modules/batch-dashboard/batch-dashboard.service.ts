import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  Batch,
  ProcessFlowItem,
  BatchKPIResponse,
  LiveWeighEvent,
  RecordWeighLogDto,
} from './batch-dashboard.interface';
import { CompanyItem, HubItem } from '@industrial-scale/types';
import { PrismaService } from '../../common/prisma/prisma.service';

interface ProcessTemplate {
  processId: string;
  processName: string;
  stationId: string;
  stationName: string;
  indicatorModel: string;
  productType?: string;
  isFinalOutput: boolean;
  defaultIn: number;
  defaultOut: number;
}

@Injectable()
export class BatchDashboardService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BatchDashboardService.name);
  private isDbAvailable = false;

  // Danh mục Công ty Khách hàng (Superadmin quản lý)
  private readonly companies: CompanyItem[] = [
    {
      id: 'COMP_01',
      code: 'SAOTA-FOODS',
      name: 'Công ty CP Thực phẩm Sao Ta (FIMEX VN)',
      status: 'ACTIVE',
    },
    {
      id: 'COMP_02',
      code: 'MINHPHU-SEAFOOD',
      name: 'Tập đoàn Thủy sản Minh Phú',
      status: 'ACTIVE',
    },
  ];

  // Danh mục Máy Hub tại xưởng chế biến
  private readonly hubs: HubItem[] = [
    {
      id: 'HUB_01',
      companyId: 'COMP_01',
      code: 'HUB-XUONG-01',
      name: 'Máy Hub Quản lý Xưởng Sóc Trăng',
      ipAddress: '192.168.1.100',
      status: 'ONLINE',
      firmwareVersion: 'v2.1-DINI-ARGEO',
    },
    {
      id: 'HUB_02',
      companyId: 'COMP_02',
      code: 'HUB-XUONG-02',
      name: 'Máy Hub Quản lý Xưởng Cà Mau',
      ipAddress: '192.168.2.100',
      status: 'ONLINE',
      firmwareVersion: 'v2.1-DINI-ARGEO',
    },
  ];

  // 15 công đoạn chế biến thủy sản chuẩn PMSL (Tôm / Thủy hải sản)
  // Kết nối trực tiếp qua Đầu cân DINI & Loadcell tại từng trạm cân
  private readonly processCatalog: ProcessTemplate[] = [
    {
      processId: 'CD001',
      processName: 'Tiếp nhận tôm (Material Receiving)',
      stationId: '10244156',
      stationName: 'Trạm cân Tiếp nhận 01',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Tôm nguyên liệu (TOM001)',
      isFinalOutput: false,
      defaultIn: 9500,
      defaultOut: 9300,
    },
    {
      processId: 'CD002',
      processName: 'Phân cỡ & Phân loại (Grading)',
      stationId: '10244157',
      stationName: 'Trạm cân Phân cỡ 02',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Bán thành phẩm (TOM002)',
      isFinalOutput: false,
      defaultIn: 9300,
      defaultOut: 9100,
    },
    {
      processId: 'CD003',
      processName: 'Xếp khuôn & Chia mẻ (Stacking & Divide)',
      stationId: '10244158',
      stationName: 'Trạm cân Xếp khuôn 03',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 9100,
      defaultOut: 9000,
    },
    {
      processId: 'CD004',
      processName: 'Bóc vỏ & Rút chỉ (Peeling / EZP / Devein)',
      stationId: '10244159',
      stationName: 'Trạm cân Bóc vỏ 04',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 9000,
      defaultOut: 8600,
    },
    {
      processId: 'CD005',
      processName: 'Ngâm phụ gia (Soaking)',
      stationId: '10244160',
      stationName: 'Trạm cân Ngâm phụ gia 05',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 8600,
      defaultOut: 8400,
    },
    {
      processId: 'CD006',
      processName: 'Định hình Nobashi & Butterfly',
      stationId: '10244161',
      stationName: 'Trạm cân Định hình 06',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 3000,
      defaultOut: 2900,
    },
    {
      processId: 'CD007',
      processName: 'Tẩm bột (Breading)',
      stationId: '10244162',
      stationName: 'Trạm cân Tẩm bột 07',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1450,
    },
    {
      processId: 'CD008',
      processName: 'Chiên chín (Breaded Fry)',
      stationId: '10244163',
      stationName: 'Trạm cân Chiên 08',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 1450,
      defaultOut: 1400,
    },
    {
      processId: 'CD009',
      processName: 'Nấu chín PD (PD Cook)',
      stationId: '10244164',
      stationName: 'Trạm cân Nấu PD 09',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 2500,
      defaultOut: 2300,
    },
    {
      processId: 'CD010',
      processName: 'Nấu chín HLSO (HLSO Cook)',
      stationId: '10244165',
      stationName: 'Trạm cân Nấu HLSO 10',
      indicatorModel: 'DINI_ARGEO',
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1400,
    },
    {
      processId: 'CD011',
      processName: 'Tách vỏ sau nấu (Peel After Cook)',
      stationId: '10244166',
      stationName: 'Trạm cân Tách vỏ 11',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Thành phẩm sau nấu',
      isFinalOutput: false,
      defaultIn: 3700,
      defaultOut: 3500,
    },
    {
      processId: 'CD012',
      processName: 'Cấp đông xoắn tươi (Raw Spiral Freezer)',
      stationId: '10244167',
      stationName: 'Trạm cân Xoắn tươi 12',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1000,
    },
    {
      processId: 'CD013',
      processName: 'Cấp đông xoắn chiên (Fried Spiral Freezer)',
      stationId: '10244168',
      stationName: 'Trạm cân Xoắn chiên 13',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1100,
    },
    {
      processId: 'CD014',
      processName: 'Cấp đông IQF tươi (Raw IQF)',
      stationId: '10244169',
      stationName: 'Trạm cân IQF tươi 14',
      indicatorModel: 'DINI_ARGEO',
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1500,
      defaultOut: 800,
    },
    {
      processId: 'CD015',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stationId: '10244170',
      stationName: 'Trạm cân IQF chín 15',
      indicatorModel: 'DINI_ARGEO',
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
        name: 'Lô Thủy Sản Tôm A01 (Xuất khẩu EU)',
        planWeight: 10000,
        status: 'IN_PROGRESS',
        companyId: 'COMP_01',
        hubId: 'HUB_01',
        createdAt: '2026-10-12T07:00:00.000Z',
      },
    ],
    [
      'loconc',
      {
        id: 'loconc',
        name: 'Lô Côn Tôm B02 (PMSL Database)',
        planWeight: 15000,
        status: 'IN_PROGRESS',
        companyId: 'COMP_01',
        hubId: 'HUB_01',
        createdAt: '2026-10-12T08:00:00.000Z',
      },
    ],
    [
      'test',
      {
        id: 'test',
        name: 'Lô Cân Mẫu Test Trạm Cân',
        planWeight: 5000,
        status: 'PENDING',
        companyId: 'COMP_02',
        hubId: 'HUB_02',
        createdAt: '2026-10-12T08:30:00.000Z',
      },
    ],
  ]);

  // In-memory process weights: batchId -> processId -> { weightIn, weightOut }
  private batchProcessWeights: Map<
    string,
    Map<string, { weightIn: number; weightOut: number }>
  > = new Map();

  // Active simulation interval timers
  private simulationTimers: Map<string, NodeJS.Timeout> = new Map();

  // Callback listener for websocket broadcasting
  private broadcastListener?: (data: BatchKPIResponse, event: LiveWeighEvent) => void;

  constructor(private readonly prisma: PrismaService) {
    this.initDefaultData();
  }

  async onModuleInit() {
    if (this.prisma.isConnected) {
      this.isDbAvailable = true;
      this.logger.log('✅ Connected to PostgreSQL (PMSL Schema & Multi-Tenant).');
    } else {
      this.isDbAvailable = false;
      this.logger.warn(
        '⚠️ PostgreSQL not connected. Running with PMSL Multi-Tenant In-Memory Engine.',
      );
    }
  }

  onModuleDestroy() {
    for (const [batchId, timer] of this.simulationTimers.entries()) {
      clearInterval(timer);
      this.logger.log(`Simulation timer cleared for batch ${batchId}`);
    }
    this.simulationTimers.clear();
  }

  setBroadcastListener(
    listener: (data: BatchKPIResponse, event: LiveWeighEvent) => void,
  ) {
    this.broadcastListener = listener;
  }

  private initDefaultData() {
    // BATCH_01
    const b01Map = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      b01Map.set(p.processId, {
        weightIn: p.defaultIn,
        weightOut: p.defaultOut,
      });
    }
    this.batchProcessWeights.set('BATCH_01', b01Map);

    // loconc (từ PMSL.sql)
    const loconcMap = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      loconcMap.set(p.processId, {
        weightIn: p.processId === 'CD001' ? 19.195 : 0,
        weightOut: 0,
      });
    }
    this.batchProcessWeights.set('loconc', loconcMap);

    // test (từ PMSL.sql)
    const testMap = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      testMap.set(p.processId, {
        weightIn: p.processId === 'CD001' ? 45.0 : 0,
        weightOut: 0,
      });
    }
    this.batchProcessWeights.set('test', testMap);
  }

  getCompanies(): CompanyItem[] {
    return this.companies;
  }

  getHubs(companyId?: string): HubItem[] {
    if (companyId) {
      return this.hubs.filter((h) => h.companyId === companyId);
    }
    return this.hubs;
  }

  getBatches(companyId?: string): Batch[] {
    const all = Array.from(this.batches.values());
    if (companyId) {
      return all.filter((b) => !b.companyId || b.companyId === companyId);
    }
    return all;
  }

  getBatchSummary(batchId: string): BatchKPIResponse {
    const batch = this.batches.get(batchId) || this.batches.get('BATCH_01')!;
    let weightsMap = this.batchProcessWeights.get(batch.id);
    if (!weightsMap) {
      weightsMap = new Map();
      this.batchProcessWeights.set(batch.id, weightsMap);
    }

    const activeCompany =
      this.companies.find((c) => c.id === batch.companyId) || this.companies[0];
    const activeHub =
      this.hubs.find((h) => h.id === batch.hubId) || this.hubs[0];

    let totalWeightIn = 0;
    let totalWeightOut = 0;
    let totalWipWeight = 0;
    let completedWeight = 0;
    let rawMaterialInput = 0;

    let maxWip = -1;
    let bottleneck = {
      processId: 'CD015',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stationName: 'Trạm cân IQF chín 15',
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

      if (template.processId === 'CD001') {
        rawMaterialInput = inWeight;
      }

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
        indicatorModel: template.indicatorModel,
        productType: template.productType,
        isFinalOutput: template.isFinalOutput,
        weightIn: inWeight,
        weightOut: outWeight,
        wipWeight: wip,
        yieldRatePct: yieldPct,
        status: 'NORMAL',
      };
    });

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

    // Tỷ lệ thu hồi mẻ chuẩn: Tổng thành phẩm ra (ST12-15) / Tổng nguyên liệu vào (CD001)
    const baseInput = rawMaterialInput > 0 ? rawMaterialInput : planWeight;
    const overallYieldPct =
      baseInput > 0
        ? Number(((completedWeight / baseInput) * 100).toFixed(1))
        : 0;

    return {
      batch,
      activeCompany,
      activeHub,
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

  /**
   * Tiếp nhận lượt cân từ Đầu cân DINI & Loadcell qua Máy Hub tại xưởng
   */
  async recordWeighLog(dto: RecordWeighLogDto): Promise<{
    summary: BatchKPIResponse;
    event: LiveWeighEvent;
  }> {
    const {
      companyId,
      hubId,
      batchId,
      stationId,
      processId,
      productId,
      typeWeight,
      valueWeight,
      tareWeight = 0,
      employeeId = 'OPERATOR',
      indicatorModel = 'DINI_ARGEO',
    } = dto;

    const netWeight = Math.max(0, valueWeight - tareWeight);

    // 1. Lưu vào PostgreSQL nếu DB sẵn sàng
    if (this.isDbAvailable) {
      try {
        await this.prisma.productionWeightLog.create({
          data: {
            companyId,
            hubId,
            batchId,
            stationId,
            processId,
            productId,
            typeWeight,
            valueWeight,
            tareWeight,
            employeeId,
            timeAction: new Date(),
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to write weight log to DB: ${err.message}`);
      }
    }

    // 2. Cập nhật state in-memory
    let weightsMap = this.batchProcessWeights.get(batchId);
    if (!weightsMap) {
      weightsMap = new Map();
      this.batchProcessWeights.set(batchId, weightsMap);
    }

    const current = weightsMap.get(processId) || { weightIn: 0, weightOut: 0 };
    if (typeWeight === 'IN') {
      current.weightIn += netWeight;
    } else {
      current.weightOut += netWeight;
      if (current.weightOut > current.weightIn) {
        current.weightIn = current.weightOut;
      }
    }
    weightsMap.set(processId, current);

    const station = this.processCatalog.find((p) => p.stationId === stationId);
    const event: LiveWeighEvent = {
      batchId,
      processId,
      stationId,
      stationName: station?.stationName || `Trạm cân ${stationId}`,
      indicatorModel,
      hubId: hubId || 'HUB_01',
      hubName: 'Máy Hub Xưởng Chế Biến',
      companyId: companyId || 'COMP_01',
      type: typeWeight,
      addedWeight: netWeight,
      tareWeight,
      netWeight,
      timestamp: new Date().toISOString(),
    };

    const summary = this.getBatchSummary(batchId);

    if (this.broadcastListener) {
      this.broadcastListener(summary, event);
    }

    return { summary, event };
  }

  simulateWeighTick(batchId: string): {
    summary: BatchKPIResponse;
    event: LiveWeighEvent;
  } {
    const batch = this.batches.get(batchId) || this.batches.get('BATCH_01')!;
    const weightsMap = this.batchProcessWeights.get(batch.id)!;

    // Chọn ngẫu nhiên 1 trong 15 công đoạn chuẩn PMSL
    const randomIndex = Math.floor(Math.random() * this.processCatalog.length);
    const process = this.processCatalog[randomIndex];

    // Khối lượng cân dao động 10 - 50 kg, bì 1 - 2 kg từ Loadcell & Dini
    const addedWeight = Math.floor(Math.random() * 41) + 10;
    const tareWeight = Math.floor(Math.random() * 2) + 1;
    const netWeight = addedWeight;
    const type: 'IN' | 'OUT' = Math.random() > 0.4 ? 'OUT' : 'IN';

    const current = weightsMap.get(process.processId) || {
      weightIn: 0,
      weightOut: 0,
    };
    if (type === 'IN') {
      current.weightIn += netWeight;
    } else {
      current.weightOut += netWeight;
      if (current.weightOut > current.weightIn) {
        current.weightIn = current.weightOut;
      }
    }
    weightsMap.set(process.processId, current);

    if (this.isDbAvailable) {
      this.prisma.productionWeightLog
        .create({
          data: {
            batchId: batch.id,
            stationId: process.stationId,
            processId: process.processId,
            productId: process.processId === 'CD001' ? 'TOM001' : 'TOM002',
            typeWeight: type,
            valueWeight: netWeight + tareWeight,
            tareWeight: tareWeight,
            employeeId: 'DINI_SIMULATOR',
            timeAction: new Date(),
          },
        })
        .catch(() => {});
    }

    const event: LiveWeighEvent = {
      batchId: batch.id,
      processId: process.processId,
      stationId: process.stationId,
      stationName: process.stationName,
      indicatorModel: process.indicatorModel,
      hubId: batch.hubId || 'HUB_01',
      hubName: 'Máy Hub Xưởng Chế Biến',
      companyId: batch.companyId || 'COMP_01',
      type,
      addedWeight: netWeight,
      tareWeight,
      netWeight,
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
      const timer = setInterval(() => {
        try {
          this.simulateWeighTick(batchId);
        } catch (e) {
          this.logger.error(`Simulation tick error: ${e.message}`);
        }
      }, 1500);

      this.simulationTimers.set(batchId, timer);
      this.logger.log(
        `Simulation started for batch ${batchId} (interval 1.5s, PMSL DINI model)`,
      );
      return { isSimulating: true };
    }
  }

  isSimulating(batchId: string): boolean {
    return this.simulationTimers.has(batchId);
  }
}
