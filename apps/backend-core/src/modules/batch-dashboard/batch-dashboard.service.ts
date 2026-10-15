import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Batch,
  ProcessFlowItem,
  BatchKPIResponse,
  LiveWeighEvent,
  RecordWeighLogDto,
} from './batch-dashboard.interface';
import {
  CompanyItem,
  HubItem,
  CreateProcessDto,
  UpdateProcessDto,
  AddStationToProcessDto,
  AddProductToProcessDto,
  StationWeighItem,
  ProductOutputItem,
  WorkflowDefinition,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  AssignWorkflowToBatchDto,
  UpdateProcessMappingsDto,
} from '@industrial-scale/types';
import { validateWorkflowPath } from './workflow-validator';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface StationTemplate {
  stationId: string;
  stationName: string;
  indicatorModel: string;
  hubId?: string;
  isActive: boolean;
}

export interface ProductTemplate {
  productId: string;
  productName: string;
  isEnd?: boolean;
}

export interface ProcessTemplate {
  processId: string;
  processName: string;
  stations: StationTemplate[];
  products: ProductTemplate[];
  productType?: string;
  isFinalOutput: boolean;
  defaultIn: number;
  defaultOut: number;
  nextProcessIds?: string[];
}

@Injectable()
export class BatchDashboardService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BatchDashboardService.name);
  private isDbAvailable = false;

  // Danh mục Công ty Khách hàng
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

  // Danh mục các công đoạn (Node quy trình), trạm cân và sản phẩm output
  private processCatalog: ProcessTemplate[] = [
    {
      processId: 'CD001',
      processName: 'Tiếp nhận tôm (Material Receiving)',
      stations: [
        {
          stationId: '10244156',
          stationName: 'Trạm cân Tiếp nhận 01',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TOM001', productName: 'Tôm nguyên liệu tươi (Sú/Thẻ)' },
      ],
      productType: 'Tôm nguyên liệu (TOM001)',
      isFinalOutput: false,
      defaultIn: 9500,
      defaultOut: 9300,
      nextProcessIds: ['CD002'],
    },
    {
      processId: 'CD002',
      processName: 'Phân cỡ & Phân loại (Grading)',
      stations: [
        {
          stationId: '10244157',
          stationName: 'Trạm cân Phân cỡ 02',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      // Một node có nhiều sản phẩm đầu ra (nhiều size/loại tôm)
      products: [
        { productId: 'TOM_10_15', productName: 'Tôm cỡ 10-15' },
        { productId: 'TOM_15_20', productName: 'Tôm cỡ 15-20' },
        { productId: 'TOM_20_25', productName: 'Tôm cỡ 20-25' },
        { productId: 'TOM_25_30', productName: 'Tôm cỡ 25-30' },
        { productId: 'TOM_30_40', productName: 'Tôm cỡ 30-40' },
        { productId: 'TOM_DAT', productName: 'Tôm dạt / phế phẩm' },
      ],
      productType: 'Bán thành phẩm theo cỡ (10-15, 15-20, 20-25...)',
      isFinalOutput: false,
      defaultIn: 9300,
      defaultOut: 9100,
      nextProcessIds: ['CD003', 'CD004', 'CD006', 'CD009', 'CD010'],
    },
    {
      processId: 'CD003',
      processName: 'Xếp khuôn & Chia mẻ (Stacking & Divide)',
      stations: [
        {
          stationId: '10244158',
          stationName: 'Trạm cân Xếp khuôn 03',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'KHUON_1.8KG', productName: 'Khuôn tôm 1.8kg' },
        { productId: 'KHUON_2KG', productName: 'Khuôn tôm 2kg' },
      ],
      isFinalOutput: false,
      defaultIn: 9100,
      defaultOut: 9000,
      nextProcessIds: ['CD012', 'CD014'],
    },
    {
      processId: 'CD004',
      processName: 'Bóc vỏ & Rút chỉ (Peeling / EZP / Devein)',
      stations: [
        {
          stationId: '10244159',
          stationName: 'Trạm cân Bóc vỏ 04',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TOM_PTO', productName: 'Tôm PTO còn đuôi' },
        { productId: 'TOM_PD', productName: 'Tôm PD bóc nõn rút chỉ' },
        { productId: 'TOM_HLSO', productName: 'Tôm HLSO vặt đầu' },
      ],
      isFinalOutput: false,
      defaultIn: 9000,
      defaultOut: 8600,
      nextProcessIds: ['CD005', 'CD006'],
    },
    {
      processId: 'CD005',
      processName: 'Ngâm phụ gia (Soaking)',
      stations: [
        {
          stationId: '10244160',
          stationName: 'Trạm cân Ngâm phụ gia 05',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TOM_NGAM_NON_PHOS', productName: 'Tôm ngâm Non-Phosphate' },
        { productId: 'TOM_NGAM_TC', productName: 'Tôm ngâm Tiêu chuẩn' },
      ],
      isFinalOutput: false,
      defaultIn: 8600,
      defaultOut: 8400,
      nextProcessIds: ['CD006', 'CD007', 'CD009'],
    },
    {
      processId: 'CD006',
      processName: 'Định hình Nobashi & Butterfly',
      stations: [
        {
          stationId: '10244161',
          stationName: 'Trạm cân Định hình 06',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'NOBASHI_25C', productName: 'Tôm Nobashi 25 con/khay' },
        { productId: 'NOBASHI_30C', productName: 'Tôm Nobashi 30 con/khay' },
        { productId: 'BUTTERFLY_EU', productName: 'Tôm Butterfly xẻ bướm' },
      ],
      isFinalOutput: false,
      defaultIn: 3000,
      defaultOut: 2900,
      nextProcessIds: ['CD007', 'CD012', 'CD014'],
    },
    {
      processId: 'CD007',
      processName: 'Tẩm bột (Breading)',
      stations: [
        {
          stationId: '10244162',
          stationName: 'Trạm cân Tẩm bột 07',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'BREADED_WHITE', productName: 'Tôm tẩm bột trắng' },
        { productId: 'BREADED_PANKO', productName: 'Tôm tẩm bột xù Panko' },
      ],
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1450,
      nextProcessIds: ['CD008', 'CD013'],
    },
    {
      processId: 'CD008',
      processName: 'Chiên chín (Breaded Fry)',
      stations: [
        {
          stationId: '10244163',
          stationName: 'Trạm cân Chiên 08',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'FRIED_TORPEDO', productName: 'Tôm chiên Torpedo giòn' },
      ],
      isFinalOutput: false,
      defaultIn: 1450,
      defaultOut: 1400,
      nextProcessIds: ['CD013'],
    },
    {
      processId: 'CD009',
      processName: 'Nấu chín PD (PD Cook)',
      stations: [
        {
          stationId: '10244164',
          stationName: 'Trạm cân Nấu PD 09',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'COOKED_PD', productName: 'Tôm PD chín' },
      ],
      isFinalOutput: false,
      defaultIn: 2500,
      defaultOut: 2300,
      nextProcessIds: ['CD011', 'CD015'],
    },
    {
      processId: 'CD010',
      processName: 'Nấu chín HLSO (HLSO Cook)',
      stations: [
        {
          stationId: '10244165',
          stationName: 'Trạm cân Nấu HLSO 10',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'COOKED_HLSO', productName: 'Tôm HLSO chín' },
      ],
      isFinalOutput: false,
      defaultIn: 1500,
      defaultOut: 1400,
      nextProcessIds: ['CD015'],
    },
    {
      processId: 'CD011',
      processName: 'Tách vỏ sau nấu (Peel After Cook)',
      stations: [
        {
          stationId: '10244166',
          stationName: 'Trạm cân Tách vỏ 11',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TACH_VO_SALAD', productName: 'Tôm nõn chín làm salad' },
      ],
      productType: 'Thành phẩm sau nấu',
      isFinalOutput: false,
      defaultIn: 3700,
      defaultOut: 3500,
      nextProcessIds: ['CD015'],
    },
    {
      processId: 'CD012',
      processName: 'Cấp đông xoắn tươi (Raw Spiral Freezer)',
      stations: [
        {
          stationId: '10244167',
          stationName: 'Trạm cân Xoắn tươi 12',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TP_XOAN_1KG', productName: 'Tôm xoắn tươi đông gói 1kg', isEnd: true },
        { productId: 'TP_XOAN_500G', productName: 'Tôm xoắn tươi đông gói 500g', isEnd: true },
      ],
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1000,
      nextProcessIds: [],
    },
    {
      processId: 'CD013',
      processName: 'Cấp đông xoắn chiên (Fried Spiral Freezer)',
      stations: [
        {
          stationId: '10244168',
          stationName: 'Trạm cân Xoắn chiên 13',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TP_CHIEN_HOP', productName: 'Tôm chiên đông hộp 300g', isEnd: true },
      ],
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1400,
      defaultOut: 1100,
      nextProcessIds: [],
    },
    {
      processId: 'CD014',
      processName: 'Cấp đông IQF tươi (Raw IQF)',
      stations: [
        {
          stationId: '10244169',
          stationName: 'Trạm cân IQF tươi 14',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TP_IQF_TUSI', productName: 'Tôm IQF tươi mạ băng 10%', isEnd: true },
        { productId: 'TP_IQF_TUSI_20', productName: 'Tôm IQF tươi mạ băng 20%', isEnd: true },
      ],
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 1500,
      defaultOut: 800,
      nextProcessIds: [],
    },
    {
      processId: 'CD015',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stations: [
        {
          stationId: '10244170',
          stationName: 'Trạm cân IQF chín 15',
          indicatorModel: 'DINI_ARGEO',
          isActive: true,
        },
      ],
      products: [
        { productId: 'TP_IQF_CHIN_1KG', productName: 'Tôm IQF chín gói 1kg', isEnd: true },
        { productId: 'TP_IQF_CHIN_RING', productName: 'Vòng tôm luộc Shrimp Ring kèm sốt', isEnd: true },
      ],
      productType: 'Thành phẩm đóng gói',
      isFinalOutput: true,
      defaultIn: 3500,
      defaultOut: 1200,
      nextProcessIds: [],
    },
  ];

  // In-memory Workflows store (Mỗi Workflow có danh sách Node công đoạn riêng)
  private workflows: Map<string, WorkflowDefinition<ProcessTemplate>> = new Map();

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
        workflowId: 'WF_DEFAULT',
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
        workflowId: 'WF_DEFAULT',
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
        workflowId: 'WF_COOKED_IQF',
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

  // Callback listeners
  private broadcastListener?: (data: BatchKPIResponse, event: LiveWeighEvent) => void;
  private snapshotBroadcaster?: (batchId: string, data: BatchKPIResponse) => void;

  constructor(private readonly prisma: PrismaService) {
    this.initDefaultData();
  }

  async onModuleInit() {
    if (this.prisma.isConnected) {
      this.isDbAvailable = true;
      this.logger.log('✅ Connected to PostgreSQL (PMSL Schema & Multi-Tenant).');
      await this.syncDatabaseCatalog();
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

  setSnapshotBroadcaster(
    broadcaster: (batchId: string, data: BatchKPIResponse) => void,
  ) {
    this.snapshotBroadcaster = broadcaster;
  }

  private broadcastAllBatches() {
    for (const batchId of this.batches.keys()) {
      const summary = this.getBatchSummary(batchId);
      if (this.snapshotBroadcaster) {
        this.snapshotBroadcaster(batchId, summary);
      }
    }
  }

  private async syncDatabaseCatalog() {
    try {
      const dbProcesses = await this.prisma.process.findMany({
        include: { stations: true },
      });
      if (dbProcesses && dbProcesses.length > 0) {
        this.logger.log(`Loaded ${dbProcesses.length} processes from PostgreSQL database.`);
      }
    } catch (err) {
      this.logger.warn(`Could not sync process catalog with DB: ${err.message}`);
    }
  }

  private initDefaultData() {
    // 1. Khởi tạo các Quy trình sản xuất mẫu (Workflow Definitions)
    const defaultWf: WorkflowDefinition = {
      id: 'WF_DEFAULT',
      code: 'WF_STANDARD',
      name: 'Quy trình Tổng hợp Chuẩn (15 công đoạn)',
      description: 'Quy trình đầy đủ 15 công đoạn tiêu chuẩn xuất khẩu, tích hợp trạm cân DINI ARGEO và Loadcell',
      isDefault: true,
      createdAt: '2026-10-12T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      processes: JSON.parse(JSON.stringify(this.processCatalog)),
    };
    this.workflows.set(defaultWf.id, defaultWf);

    const cookedProcessIds = [
      'CD001',
      'CD002',
      'CD004',
      'CD005',
      'CD009',
      'CD011',
      'CD012',
      'CD013',
      'CD014',
    ];
    const cookedProcesses: ProcessTemplate[] = this.processCatalog
      .filter((p) => cookedProcessIds.includes(p.processId))
      .map((p) => {
        const cloned: ProcessTemplate = JSON.parse(JSON.stringify(p));
        cloned.nextProcessIds = (cloned.nextProcessIds || []).filter((id) =>
          cookedProcessIds.includes(id),
        );
        return cloned;
      });
    const cookedWf: WorkflowDefinition = {
      id: 'WF_COOKED_IQF',
      code: 'WF_COOKED',
      name: 'Quy trình Tôm Luộc IQF (9 công đoạn)',
      description: 'Quy trình chuyên luộc chín băng chuyền và cấp đông siêu tốc IQF -40°C',
      isDefault: false,
      createdAt: '2026-10-12T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      processes: cookedProcesses,
    };
    this.workflows.set(cookedWf.id, cookedWf);

    const breadedProcessIds = [
      'CD001',
      'CD002',
      'CD006',
      'CD007',
      'CD008',
      'CD011',
      'CD012',
      'CD013',
      'CD014',
    ];
    const breadedProcesses: ProcessTemplate[] = this.processCatalog
      .filter((p) => breadedProcessIds.includes(p.processId))
      .map((p) => {
        const cloned: ProcessTemplate = JSON.parse(JSON.stringify(p));
        cloned.nextProcessIds = (cloned.nextProcessIds || []).filter((id) =>
          breadedProcessIds.includes(id),
        );
        return cloned;
      });
    const breadedWf: WorkflowDefinition = {
      id: 'WF_BREADED',
      code: 'WF_BREADED',
      name: 'Quy trình Tôm Nobashi & Tẩm Bột (9 công đoạn)',
      description: 'Quy trình hàng giá trị gia tăng (Value-Added) kéo duỗi Nobashi và lăn bột xù',
      isDefault: false,
      createdAt: '2026-10-12T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      processes: breadedProcesses,
    };
    this.workflows.set(breadedWf.id, breadedWf);

    // BATCH_01
    const b01Map = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      b01Map.set(p.processId, {
        weightIn: p.defaultIn,
        weightOut: p.defaultOut,
      });
    }
    this.batchProcessWeights.set('BATCH_01', b01Map);

    // loconc
    const loconcMap = new Map<string, { weightIn: number; weightOut: number }>();
    for (const p of this.processCatalog) {
      loconcMap.set(p.processId, {
        weightIn: p.processId === 'CD001' ? 19.195 : 0,
        weightOut: 0,
      });
    }
    this.batchProcessWeights.set('loconc', loconcMap);

    // test
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

  // ========================================================
  // WORKFLOW MANAGEMENT (Tạo quy trình mới, clone, danh sách, gán cho Lô)
  // ========================================================

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      description: w.description,
      isDefault: w.isDefault,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      processCount: w.processes.length,
    }));
  }

  getWorkflow(id: string): WorkflowDefinition<ProcessTemplate> {
    const wf = this.workflows.get(id);
    if (!wf) {
      throw new NotFoundException(`Không tìm thấy quy trình ${id}`);
    }
    return {
      ...wf,
      processCount: wf.processes.length,
    };
  }

  createWorkflow(dto: CreateWorkflowDto): WorkflowDefinition<ProcessTemplate> {
    const id = `WF_${Date.now()}`;
    const code =
      dto.code && dto.code.trim() !== ''
        ? dto.code.trim()
        : `WF_${String(this.workflows.size + 1).padStart(2, '0')}`;

    let initialProcesses: ProcessTemplate[] = [];
    if (dto.cloneFromWorkflowId && this.workflows.has(dto.cloneFromWorkflowId)) {
      const source = this.workflows.get(dto.cloneFromWorkflowId)!;
      initialProcesses = JSON.parse(JSON.stringify(source.processes));
    }

    const newWf: WorkflowDefinition<ProcessTemplate> = {
      id,
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() || 'Quy trình sản xuất tự định nghĩa',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processes: initialProcesses,
    };

    this.workflows.set(id, newWf);
    this.broadcastAllBatches();
    return {
      ...newWf,
      processCount: newWf.processes.length,
    };
  }

  updateWorkflow(id: string, dto: UpdateWorkflowDto): WorkflowDefinition<ProcessTemplate> {
    const wf = this.workflows.get(id);
    if (!wf) {
      throw new NotFoundException(`Không tìm thấy quy trình ${id}`);
    }
    if (dto.name !== undefined && dto.name.trim() !== '') {
      wf.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      wf.description = dto.description.trim();
    }
    wf.updatedAt = new Date().toISOString();
    this.broadcastAllBatches();
    return {
      ...wf,
      processCount: wf.processes.length,
    };
  }

  deleteWorkflow(id: string): boolean {
    const wf = this.workflows.get(id);
    if (!wf) {
      throw new NotFoundException(`Không tìm thấy quy trình ${id}`);
    }
    if (wf.isDefault || id === 'WF_DEFAULT') {
      throw new Error('Không thể xóa quy trình mặc định của hệ thống');
    }

    // Chuyển các batch đang dùng workflow này về WF_DEFAULT
    for (const batch of this.batches.values()) {
      if (batch.workflowId === id) {
        batch.workflowId = 'WF_DEFAULT';
      }
    }

    this.workflows.delete(id);
    this.broadcastAllBatches();
    return true;
  }

  assignWorkflowToBatch(batchId: string, workflowId: string): BatchKPIResponse {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô ${batchId}`);
    }
    if (!this.workflows.has(workflowId)) {
      throw new NotFoundException(`Không tìm thấy quy trình ${workflowId}`);
    }

    batch.workflowId = workflowId;
    const wf = this.workflows.get(workflowId)!;

    // Khởi tạo weights cho batch nếu chưa có
    let weightsMap = this.batchProcessWeights.get(batchId);
    if (!weightsMap) {
      weightsMap = new Map();
      this.batchProcessWeights.set(batchId, weightsMap);
    }
    for (const p of wf.processes) {
      if (!weightsMap.has(p.processId)) {
        weightsMap.set(p.processId, {
          weightIn: p.defaultIn,
          weightOut: p.defaultOut,
        });
      }
    }

    this.broadcastAllBatches();
    return this.getBatchSummary(batchId);
  }

  // Lấy danh mục node công đoạn theo workflowId chỉ định hoặc mặc định
  getProcessCatalog(workflowId?: string): ProcessTemplate[] {
    if (workflowId && this.workflows.has(workflowId)) {
      return this.workflows.get(workflowId)!.processes;
    }
    return this.workflows.get('WF_DEFAULT')?.processes || this.processCatalog;
  }

  // ========================================================
  // PROCESS MANAGEMENT (Tự do thêm node ở đầu, đuôi, giữa & sửa đổi)
  // ========================================================

  getProcesses(workflowId?: string): ProcessTemplate[] {
    return this.getProcessCatalog(workflowId);
  }

  createProcess(dto: CreateProcessDto, workflowId?: string): ProcessTemplate[] {
    const catalog = this.getProcessCatalog(workflowId);
    const idNum = catalog.length + 1;
    const processId =
      dto.processId && dto.processId.trim() !== ''
        ? dto.processId.trim()
        : `CD${String(idNum).padStart(3, '0')}`;

    // Khởi tạo trạm cân nếu có hoặc tạo 1 trạm mặc định
    let stations: StationTemplate[] = [];
    if (dto.stations && dto.stations.length > 0) {
      stations = dto.stations.map((st, idx) => ({
        stationId: st.stationId || String(10244155 + idNum * 10 + idx),
        stationName: st.stationName || `Trạm cân ${dto.processName}`,
        indicatorModel: st.indicatorModel || 'DINI_ARGEO',
        hubId: st.hubId || 'HUB_01',
        isActive: true,
      }));
    } else {
      stations = [
        {
          stationId: String(10244155 + idNum * 10),
          stationName: `Trạm cân ${dto.processName}`,
          indicatorModel: 'DINI_ARGEO',
          hubId: 'HUB_01',
          isActive: true,
        },
      ];
    }

    // Khởi tạo danh sách sản phẩm output (1 node có thể có nhiều sản phẩm)
    let products: ProductTemplate[] = [];
    if (dto.products && dto.products.length > 0) {
      products = dto.products.map((p, idx) => {
        if (typeof p === 'string') {
          return {
            productId: `PRD_${idNum}_${idx + 1}`,
            productName: p,
            isEnd: Boolean(dto.isFinalOutput),
          };
        }
        return {
          productId: p.productId || `PRD_${idNum}_${idx + 1}`,
          productName: p.productName,
          isEnd: p.isEnd !== undefined ? p.isEnd : Boolean(dto.isFinalOutput),
        };
      });
    } else if (dto.productType && dto.productType.trim() !== '') {
      products = [
        {
          productId: `PRD_${idNum}_1`,
          productName: dto.productType.trim(),
          isEnd: Boolean(dto.isFinalOutput),
        },
      ];
    }

    const newProcess: ProcessTemplate = {
      processId,
      processName: dto.processName,
      stations,
      products,
      productType:
        dto.productType ||
        (products.length > 0
          ? products.map((p) => p.productName).join(', ')
          : undefined),
      isFinalOutput: Boolean(dto.isFinalOutput),
      defaultIn: 0,
      defaultOut: 0,
      nextProcessIds: dto.nextProcessIds || [],
    };

    // Chèn node theo vị trí: Đầu, Đuôi, hoặc Giữa (trước / sau targetProcessId)
    const position = dto.position || 'END';
    if (position === 'START') {
      catalog.unshift(newProcess);
    } else if (position === 'BEFORE' && dto.targetProcessId) {
      const idx = catalog.findIndex((p) => p.processId === dto.targetProcessId);
      if (idx !== -1) {
        catalog.splice(idx, 0, newProcess);
      } else {
        catalog.push(newProcess);
      }
    } else if (position === 'AFTER' && dto.targetProcessId) {
      const idx = catalog.findIndex((p) => p.processId === dto.targetProcessId);
      if (idx !== -1) {
        catalog.splice(idx + 1, 0, newProcess);
      } else {
        catalog.push(newProcess);
      }
    } else {
      catalog.push(newProcess);
    }

    // Khởi tạo weights cho process mới này trong mọi batch
    for (const weightsMap of this.batchProcessWeights.values()) {
      if (!weightsMap.has(processId)) {
        weightsMap.set(processId, { weightIn: 0, weightOut: 0 });
      }
    }

    // Đồng bộ DB nếu có
    if (this.isDbAvailable) {
      this.prisma.process
        .create({
          data: {
            processId: newProcess.processId,
            processName: newProcess.processName,
            stations: {
              create: newProcess.stations.map((st) => ({
                stationId: st.stationId,
                stationName: st.stationName,
                indicatorModel: st.indicatorModel,
                hubId: undefined,
              })),
            },
          },
        })
        .catch((e) =>
          this.logger.warn(`Could not persist process to DB: ${e.message}`),
        );
    }

    this.broadcastAllBatches();
    return catalog;
  }

  updateProcess(
    processId: string,
    dto: UpdateProcessDto,
    workflowId?: string,
  ): ProcessTemplate {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    if (dto.processName !== undefined) process.processName = dto.processName;
    if (dto.isFinalOutput !== undefined)
      process.isFinalOutput = dto.isFinalOutput;

    if (dto.nextProcessIds !== undefined) {
      process.nextProcessIds = dto.nextProcessIds;
    }

    if (dto.products !== undefined) {
      process.products = dto.products.map((p, idx) => {
        if (typeof p === 'string') {
          return {
            productId: `PRD_${processId}_${idx + 1}`,
            productName: p,
            isEnd: process.isFinalOutput,
          };
        }
        return {
          productId: p.productId || `PRD_${processId}_${idx + 1}`,
          productName: p.productName,
          isEnd: p.isEnd !== undefined ? p.isEnd : process.isFinalOutput,
        };
      });
      process.productType = process.products
        .map((p) => p.productName)
        .join(', ');
    } else if (dto.productType !== undefined) {
      process.productType = dto.productType;
    }

    if (this.isDbAvailable) {
      this.prisma.process
        .update({
          where: { processId },
          data: { processName: process.processName },
        })
        .catch(() => {});
    }

    this.broadcastAllBatches();
    return process;
  }

  async updateProcessMappings(
    processId: string,
    nextProcessIds: string[],
    workflowId?: string,
  ): Promise<ProcessTemplate> {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    // Kiểm tra tính hợp lệ của luồng quy trình:
    // Phải luôn có ít nhất 1 đường đi hoàn chỉnh từ bước 1 tới bước final (bước có vào nhưng không có ra)
    const simulatedCatalog = catalog.map((p) =>
      p.processId === processId ? { ...p, nextProcessIds } : p,
    );
    const validation = validateWorkflowPath(simulatedCatalog);
    if (!validation.isValid) {
      throw new BadRequestException(
        validation.message ||
          'Quy trình phải có ít nhất 1 đường đi từ công đoạn đầu tiên đến công đoạn kết thúc.',
      );
    }

    process.nextProcessIds = nextProcessIds;

    if (this.isDbAvailable) {
      try {
        await this.prisma.mappingProcess.deleteMany({
          where: { fromProcessId: processId },
        });
        if (nextProcessIds && nextProcessIds.length > 0) {
          await this.prisma.mappingProcess.createMany({
            data: nextProcessIds.map((toId) => ({
              fromProcessId: processId,
              toProcessId: toId,
            })),
          });
        }
      } catch (err: any) {
        this.logger.warn(`Could not sync process mappings to DB: ${err.message}`);
      }
    }

    this.broadcastAllBatches();
    return process;
  }

  deleteProcess(processId: string, workflowId?: string): ProcessTemplate[] {
    const catalog = this.getProcessCatalog(workflowId);
    const index = catalog.findIndex((p) => p.processId === processId);
    if (index === -1) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    const simulatedCatalog = catalog.filter((p) => p.processId !== processId);
    if (simulatedCatalog.length > 0) {
      const validation = validateWorkflowPath(simulatedCatalog);
      if (!validation.isValid) {
        throw new BadRequestException(
          `Không thể xóa công đoạn ${processId}: Xóa công đoạn này sẽ làm đứt gãy luồng quy trình (không còn đường đi từ bước 1 tới bước thành phẩm cuối).`,
        );
      }
    }

    catalog.splice(index, 1);

    for (const weightsMap of this.batchProcessWeights.values()) {
      weightsMap.delete(processId);
    }

    if (this.isDbAvailable) {
      this.prisma.process.delete({ where: { processId } }).catch(() => {});
    }

    this.broadcastAllBatches();
    return catalog;
  }

  reorderProcesses(
    processIds: string[],
    workflowId?: string,
  ): ProcessTemplate[] {
    const catalog = this.getProcessCatalog(workflowId);
    const map = new Map(catalog.map((p) => [p.processId, p]));
    const reordered: ProcessTemplate[] = [];

    for (const id of processIds) {
      const p = map.get(id);
      if (p) {
        reordered.push(p);
        map.delete(id);
      }
    }
    for (const p of map.values()) {
      reordered.push(p);
    }

    if (workflowId && this.workflows.has(workflowId)) {
      this.workflows.get(workflowId)!.processes = reordered;
    } else {
      const def = this.workflows.get('WF_DEFAULT');
      if (def) def.processes = reordered;
      this.processCatalog = reordered;
    }

    this.broadcastAllBatches();
    return reordered;
  }

  async saveBulkProcesses(
    processes: ProcessTemplate[],
    workflowId?: string,
  ): Promise<ProcessTemplate[]> {
    if (!processes || processes.length === 0) {
      throw new BadRequestException('Danh sách công đoạn không được để trống.');
    }

    // 1. Kiểm tra tính hợp lệ: bắt buộc phải có ít nhất 1 đường đi hoàn chỉnh từ bước 1 tới bước final
    const validation = validateWorkflowPath(processes);
    if (!validation.isValid) {
      throw new BadRequestException(
        validation.message ||
          'Quy trình phải có ít nhất 1 đường đi hoàn chỉnh từ công đoạn đầu tiên đến công đoạn thành phẩm (bước có vào nhưng không có ra).',
      );
    }

    // 2. Chuẩn hóa danh sách processes (đảm bảo đầy đủ thuộc tính stations, products, defaultIn/Out)
    const normalizedProcesses: ProcessTemplate[] = processes.map((p: any) => {
      let stations = Array.isArray(p.stations) ? p.stations : [];
      if (stations.length === 0 && (p.stationName || p.stationId)) {
        stations = [
          {
            stationId: p.stationId || `ST_${p.processId}_01`,
            stationName: p.stationName || 'Trạm cân',
            indicatorModel: p.indicatorModel || 'DINI_ARGEO',
            isActive: true,
          },
        ];
      }
      const products = Array.isArray(p.products) ? p.products : [];
      return {
        processId: p.processId,
        processName: p.processName,
        stations,
        products,
        productType: p.productType,
        isFinalOutput: Boolean(p.isFinalOutput),
        defaultIn: p.defaultIn ?? p.weightIn ?? 1000,
        defaultOut: p.defaultOut ?? p.weightOut ?? 950,
        nextProcessIds: Array.isArray(p.nextProcessIds) ? p.nextProcessIds : [],
      };
    });

    // 3. Cập nhật vào workflow hoặc processCatalog
    if (workflowId && this.workflows.has(workflowId)) {
      this.workflows.get(workflowId)!.processes = normalizedProcesses;
      this.workflows.get(workflowId)!.updatedAt = new Date().toISOString();
    } else {
      const def = this.workflows.get('WF_DEFAULT');
      if (def) {
        def.processes = normalizedProcesses;
        def.updatedAt = new Date().toISOString();
      }
      this.processCatalog = normalizedProcesses;
    }

    // 4. Khởi tạo weights cho các process mới trong batch nếu chưa có
    for (const weightsMap of this.batchProcessWeights.values()) {
      for (const p of normalizedProcesses) {
        if (!weightsMap.has(p.processId)) {
          weightsMap.set(p.processId, {
            weightIn: p.defaultIn || 0,
            weightOut: p.defaultOut || 0,
          });
        }
      }
    }

    // 4. Đồng bộ CSDL nếu có
    if (this.isDbAvailable) {
      try {
        await this.prisma.mappingProcess.deleteMany({});
        const mappingsData: Array<{ fromProcessId: string; toProcessId: string }> = [];
        for (const p of processes) {
          if (p.nextProcessIds && p.nextProcessIds.length > 0) {
            for (const toId of p.nextProcessIds) {
              mappingsData.push({
                fromProcessId: p.processId,
                toProcessId: toId,
              });
            }
          }
        }
        if (mappingsData.length > 0) {
          await this.prisma.mappingProcess.createMany({ data: mappingsData });
        }
      } catch (err: any) {
        this.logger.warn(`Could not sync bulk mappings to DB: ${err.message}`);
      }
    }

    this.broadcastAllBatches();
    return processes;
  }

  // ========================================================
  // PRODUCT MANAGEMENT (Thêm / Gỡ nhiều sản phẩm output ở mỗi node)
  // ========================================================

  addProductToProcess(
    processId: string,
    dto: AddProductToProcessDto,
    workflowId?: string,
  ): ProcessTemplate {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    if (!process.products) {
      process.products = [];
    }

    const productId =
      dto.productId && dto.productId.trim() !== ''
        ? dto.productId.trim()
        : `PRD_${processId}_${Date.now().toString().slice(-4)}`;

    const newProduct: ProductTemplate = {
      productId,
      productName: dto.productName.trim(),
      isEnd: dto.isEnd !== undefined ? dto.isEnd : process.isFinalOutput,
    };

    process.products.push(newProduct);
    process.productType = process.products
      .map((p) => p.productName)
      .join(', ');

    if (this.isDbAvailable) {
      this.prisma.product
        .upsert({
          where: { productId: newProduct.productId },
          update: {
            productName: newProduct.productName,
            isEnd: newProduct.isEnd,
          },
          create: {
            productId: newProduct.productId,
            productName: newProduct.productName,
            isEnd: newProduct.isEnd,
          },
        })
        .catch(() => {});
    }

    this.broadcastAllBatches();
    return process;
  }

  deleteProductFromProcess(
    processId: string,
    productId: string,
    workflowId?: string,
  ): ProcessTemplate {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    if (process.products) {
      process.products = process.products.filter(
        (p) => p.productId !== productId,
      );
      process.productType = process.products
        .map((p) => p.productName)
        .join(', ');
    }

    this.broadcastAllBatches();
    return process;
  }

  // ========================================================
  // STATION MANAGEMENT (Thêm / Gỡ các trạm cân vào quy trình)
  // ========================================================

  addStationToProcess(
    processId: string,
    dto: AddStationToProcessDto,
    workflowId?: string,
  ): ProcessTemplate {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    const stationId =
      dto.stationId && dto.stationId.trim() !== ''
        ? dto.stationId.trim()
        : String(10244180 + Math.floor(Math.random() * 9000));

    const stationName = dto.stationName || `Trạm cân ${process.processName}`;
    const indicatorModel = dto.indicatorModel || 'DINI_ARGEO';

    const newStation: StationTemplate = {
      stationId,
      stationName,
      indicatorModel,
      hubId: dto.hubId || 'HUB_01',
      isActive: true,
    };

    process.stations.push(newStation);

    if (this.isDbAvailable) {
      this.prisma.stationWeigh
        .create({
          data: {
            stationId: newStation.stationId,
            stationName: newStation.stationName,
            processId: process.processId,
            indicatorModel: newStation.indicatorModel,
          },
        })
        .catch(() => {});
    }

    this.broadcastAllBatches();
    return process;
  }

  deleteStationFromProcess(
    processId: string,
    stationId: string,
    workflowId?: string,
  ): ProcessTemplate {
    const catalog = this.getProcessCatalog(workflowId);
    const process = catalog.find((p) => p.processId === processId);
    if (!process) {
      throw new NotFoundException(`Không tìm thấy công đoạn ${processId}`);
    }

    process.stations = process.stations.filter(
      (s) => s.stationId !== stationId,
    );

    if (this.isDbAvailable) {
      this.prisma.stationWeigh
        .delete({ where: { stationId } })
        .catch(() => {});
    }

    this.broadcastAllBatches();
    return process;
  }

  // ========================================================
  // BATCH KPI & SUMMARY
  // ========================================================

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

    const effectiveWfId = batch.workflowId || 'WF_DEFAULT';
    const workflow =
      this.workflows.get(effectiveWfId) || this.workflows.get('WF_DEFAULT')!;
    const catalog = workflow.processes;

    let totalWeightIn = 0;
    let totalWeightOut = 0;
    let totalWipWeight = 0;
    let completedWeight = 0;
    let rawMaterialInput = 0;

    let maxWip = -1;
    let bottleneck = {
      processId: catalog[0]?.processId || 'NONE',
      processName: catalog[0]?.processName || 'Chưa có công đoạn',
      stationName: catalog[0]?.stations[0]?.stationName || 'Chưa gán',
      wipWeight: 0,
    };

    const processes: ProcessFlowItem[] = catalog.map((template, idx) => {
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

      if (idx === 0) {
        rawMaterialInput = inWeight;
      }

      if (template.isFinalOutput) {
        completedWeight += outWeight;
      }

      const primaryStation = template.stations[0];
      const stationId = primaryStation?.stationId || 'ST_NONE';
      const stationName = primaryStation?.stationName || 'Chưa gán trạm cân';
      const indicatorModel = primaryStation?.indicatorModel || 'DINI_ARGEO';

      if (wip > maxWip) {
        maxWip = wip;
        bottleneck = {
          processId: template.processId,
          processName: template.processName,
          stationName,
          wipWeight: wip,
        };
      }

      // Chuỗi tóm tắt loại hàng hoặc các size/sản phẩm
      const productSummary =
        template.products && template.products.length > 0
          ? template.products.map((p) => p.productName).join(', ')
          : template.productType;

      return {
        processId: template.processId,
        processName: template.processName,
        stationId,
        stationName,
        indicatorModel,
        productType: productSummary,
        products: (template.products || []).map((p) => ({
          productId: p.productId,
          productName: p.productName,
          isEnd: p.isEnd,
        })),
        isFinalOutput: template.isFinalOutput,
        nextProcessIds: template.nextProcessIds || [],
        weightIn: inWeight,
        weightOut: outWeight,
        wipWeight: wip,
        yieldRatePct: yieldPct,
        status: 'NORMAL',
        stations: template.stations.map((st) => ({
          stationId: st.stationId,
          stationName: st.stationName,
          processId: template.processId,
          indicatorModel: st.indicatorModel,
          hubId: st.hubId,
          isActive: st.isActive,
          createdAt: new Date(),
        })),
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

    const baseInput = rawMaterialInput > 0 ? rawMaterialInput : planWeight;
    const overallYieldPct =
      baseInput > 0
        ? Number(((completedWeight / baseInput) * 100).toFixed(1))
        : 0;

    return {
      batch,
      activeCompany,
      activeHub,
      activeWorkflow: {
        id: workflow.id,
        code: workflow.code,
        name: workflow.name,
        description: workflow.description,
        isDefault: workflow.isDefault,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        processCount: catalog.length,
      },
      workflows: this.getWorkflows(),
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

    const process = this.processCatalog.find((p) => p.processId === processId);
    const matchedStation = process?.stations.find((s) => s.stationId === stationId);
    const stationName =
      matchedStation?.stationName ||
      process?.stations[0]?.stationName ||
      `Trạm cân ${stationId}`;

    const event: LiveWeighEvent = {
      batchId,
      processId,
      stationId,
      stationName,
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

    const workflow =
      this.workflows.get(batch.workflowId || 'WF_DEFAULT') ||
      this.workflows.get('WF_DEFAULT')!;
    const batchProcesses = workflow.processes;

    if (batchProcesses.length === 0) {
      return {
        summary: this.getBatchSummary(batch.id),
        event: {
          batchId: batch.id,
          processId: 'NONE',
          stationId: 'NONE',
          stationName: 'Chưa có công đoạn',
          type: 'IN',
          addedWeight: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Chọn ngẫu nhiên 1 công đoạn trong quy trình của lô này
    const randomIndex = Math.floor(Math.random() * batchProcesses.length);
    const process = batchProcesses[randomIndex];

    // Chọn ngẫu nhiên 1 trạm cân thuộc công đoạn đó
    const station =
      process.stations.length > 0
        ? process.stations[Math.floor(Math.random() * process.stations.length)]
        : {
            stationId: '10244156',
            stationName: `Trạm cân ${process.processName}`,
            indicatorModel: 'DINI_ARGEO',
          };

    // Chọn ngẫu nhiên 1 sản phẩm thuộc công đoạn đó
    const product =
      process.products && process.products.length > 0
        ? process.products[Math.floor(Math.random() * process.products.length)]
        : {
            productId: 'TOM001',
            productName: 'Tôm bán thành phẩm',
          };

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
            stationId: station.stationId,
            processId: process.processId,
            productId: product.productId,
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
      stationId: station.stationId,
      stationName: station.stationName,
      indicatorModel: station.indicatorModel,
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
