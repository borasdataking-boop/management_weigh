'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Batch,
  BatchKPIResponse,
  LiveWeighEvent,
  CompanyItem,
  ProcessFlowItem,
  WorkflowDefinition,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from '../types/batch-flow';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const DEFAULT_COMPANIES: CompanyItem[] = [
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

const DEFAULT_BATCHES: Batch[] = [
  {
    id: 'BATCH_01',
    name: 'Lô Thủy Sản Tôm A01',
    planWeight: 10000,
    status: 'IN_PROGRESS',
    companyId: 'COMP_01',
    createdAt: '2026-10-12T07:00:00.000Z',
  },
  {
    id: 'loconc',
    name: 'Lô Côn Tôm B02 (PMSL Database)',
    planWeight: 15000,
    status: 'IN_PROGRESS',
    companyId: 'COMP_01',
    createdAt: '2026-10-12T08:00:00.000Z',
  },
  {
    id: 'test',
    name: 'Lô Cân Mẫu Test Trạm Cân',
    planWeight: 5000,
    status: 'PENDING',
    companyId: 'COMP_02',
    createdAt: '2026-10-12T08:30:00.000Z',
  },
];

export const DEFAULT_PMSL_METRICS: BatchKPIResponse = {
  batch: {
    id: 'BATCH_01',
    name: 'Lô Thủy Sản Tôm A01 (Xuất khẩu EU)',
    planWeight: 10000,
    status: 'IN_PROGRESS',
    companyId: 'COMP_01',
    hubId: 'HUB_01',
    createdAt: '2026-10-12T07:00:00.000Z',
  },
  activeCompany: {
    id: 'COMP_01',
    code: 'SAOTA-FOODS',
    name: 'Công ty CP Thực phẩm Sao Ta (FIMEX VN)',
    status: 'ACTIVE',
  },
  activeHub: {
    id: 'HUB_01',
    companyId: 'COMP_01',
    code: 'HUB-XUONG-01',
    name: 'Máy Hub Quản lý Xưởng Sóc Trăng',
    ipAddress: '192.168.1.100',
    status: 'ONLINE',
    firmwareVersion: 'v2.1-DINI-ARGEO',
  },
  planWeight: 10000,
  completedWeight: 4100,
  completedPct: 41.0,
  totalWipWeight: 5500,
  totalWipPct: 55.0,
  remainingWeight: 5900,
  remainingPct: 59.0,
  totalWeightIn: 66950,
  totalWeightOut: 61450,
  overallYieldPct: 43.2,
  bottleneckProcess: {
    processId: 'CD015',
    processName: 'Cấp đông IQF chín (Cook IQF)',
    stationName: 'Trạm cân IQF chín 15',
    wipWeight: 2300,
  },
  processes: [
    {
      processId: 'CD001',
      processName: 'Tiếp nhận tôm (Material Receiving)',
      stationId: '10244156',
      stationName: 'Trạm cân Tiếp nhận 01',
      indicatorModel: 'DINI ARGEO',
      productType: 'Tôm nguyên liệu (TOM001)',
      products: [
        { productId: 'TOM001', productName: 'Tôm nguyên liệu tươi (Sú/Thẻ)' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD002'],
      weightIn: 9500,
      weightOut: 9300,
      wipWeight: 200,
      yieldRatePct: 97.9,
      status: 'NORMAL',
    },
    {
      processId: 'CD002',
      processName: 'Phân cỡ & Phân loại (Grading)',
      stationId: '10244157',
      stationName: 'Trạm cân Phân cỡ 02',
      indicatorModel: 'DINI ARGEO',
      productType: 'Bán thành phẩm (TOM002)',
      products: [
        { productId: 'TOM_10_15', productName: 'Tôm cỡ 10-15' },
        { productId: 'TOM_15_20', productName: 'Tôm cỡ 15-20' },
        { productId: 'TOM_20_25', productName: 'Tôm cỡ 20-25' },
        { productId: 'TOM_25_30', productName: 'Tôm cỡ 25-30' },
        { productId: 'TOM_30_40', productName: 'Tôm cỡ 30-40' },
        { productId: 'TOM_DAT', productName: 'Tôm dạt / phế phẩm' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD003', 'CD004', 'CD006', 'CD009', 'CD010'],
      weightIn: 9300,
      weightOut: 9100,
      wipWeight: 200,
      yieldRatePct: 97.8,
      status: 'NORMAL',
    },
    {
      processId: 'CD003',
      processName: 'Xếp khuôn & Chia mẻ (Stacking & Divide)',
      stationId: '10244158',
      stationName: 'Trạm cân Xếp khuôn 03',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'KHUON_1.8KG', productName: 'Khuôn tôm 1.8kg' },
        { productId: 'KHUON_2KG', productName: 'Khuôn tôm 2kg' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD012', 'CD014'],
      weightIn: 9100,
      weightOut: 9000,
      wipWeight: 100,
      yieldRatePct: 98.9,
      status: 'NORMAL',
    },
    {
      processId: 'CD004',
      processName: 'Bóc vỏ & Rút chỉ (Peeling / EZP / Devein)',
      stationId: '10244159',
      stationName: 'Trạm cân Bóc vỏ 04',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'TOM_PTO', productName: 'Tôm PTO còn đuôi' },
        { productId: 'TOM_PD', productName: 'Tôm PD bóc nõn rút chỉ' },
        { productId: 'TOM_HLSO', productName: 'Tôm HLSO vặt đầu' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD005', 'CD006'],
      weightIn: 9000,
      weightOut: 8600,
      wipWeight: 400,
      yieldRatePct: 95.6,
      status: 'NORMAL',
    },
    {
      processId: 'CD005',
      processName: 'Ngâm phụ gia (Soaking)',
      stationId: '10244160',
      stationName: 'Trạm cân Ngâm phụ gia 05',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'TOM_NGAM_NON_PHOS', productName: 'Tôm ngâm Non-Phosphate' },
        { productId: 'TOM_NGAM_TC', productName: 'Tôm ngâm Tiêu chuẩn' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD006', 'CD007', 'CD009'],
      weightIn: 8600,
      weightOut: 8400,
      wipWeight: 200,
      yieldRatePct: 97.7,
      status: 'NORMAL',
    },
    {
      processId: 'CD006',
      processName: 'Định hình Nobashi & Butterfly',
      stationId: '10244161',
      stationName: 'Trạm cân Định hình 06',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'NOBASHI_25C', productName: 'Tôm Nobashi 25 con/khay' },
        { productId: 'NOBASHI_30C', productName: 'Tôm Nobashi 30 con/khay' },
        { productId: 'BUTTERFLY_EU', productName: 'Tôm Butterfly xẻ bướm' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD007', 'CD012', 'CD014'],
      weightIn: 3000,
      weightOut: 2900,
      wipWeight: 100,
      yieldRatePct: 96.7,
      status: 'NORMAL',
    },
    {
      processId: 'CD007',
      processName: 'Tẩm bột (Breading)',
      stationId: '10244162',
      stationName: 'Trạm cân Tẩm bột 07',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'BREADED_WHITE', productName: 'Tôm tẩm bột trắng' },
        { productId: 'BREADED_PANKO', productName: 'Tôm tẩm bột xù Panko' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD008', 'CD013'],
      weightIn: 1500,
      weightOut: 1450,
      wipWeight: 50,
      yieldRatePct: 96.7,
      status: 'NORMAL',
    },
    {
      processId: 'CD008',
      processName: 'Chiên chín (Breaded Fry)',
      stationId: '10244163',
      stationName: 'Trạm cân Chiên 08',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'FRIED_TORPEDO', productName: 'Tôm chiên Torpedo giòn' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD013'],
      weightIn: 1450,
      weightOut: 1400,
      wipWeight: 50,
      yieldRatePct: 96.6,
      status: 'NORMAL',
    },
    {
      processId: 'CD009',
      processName: 'Nấu chín PD (PD Cook)',
      stationId: '10244164',
      stationName: 'Trạm cân Nấu PD 09',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'COOKED_PD', productName: 'Tôm PD chín' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD011', 'CD015'],
      weightIn: 2500,
      weightOut: 2300,
      wipWeight: 200,
      yieldRatePct: 92.0,
      status: 'NORMAL',
    },
    {
      processId: 'CD010',
      processName: 'Nấu chín HLSO (HLSO Cook)',
      stationId: '10244165',
      stationName: 'Trạm cân Nấu HLSO 10',
      indicatorModel: 'DINI ARGEO',
      products: [
        { productId: 'COOKED_HLSO', productName: 'Tôm HLSO chín' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD015'],
      weightIn: 1500,
      weightOut: 1400,
      wipWeight: 100,
      yieldRatePct: 93.3,
      status: 'NORMAL',
    },
    {
      processId: 'CD011',
      processName: 'Tách vỏ sau nấu (Peel After Cook)',
      stationId: '10244166',
      stationName: 'Trạm cân Tách vỏ 11',
      indicatorModel: 'DINI ARGEO',
      productType: 'Thành phẩm sau nấu',
      products: [
        { productId: 'TACH_VO_SALAD', productName: 'Tôm nõn chín làm salad' },
      ],
      isFinalOutput: false,
      nextProcessIds: ['CD015'],
      weightIn: 3700,
      weightOut: 3500,
      wipWeight: 200,
      yieldRatePct: 94.6,
      status: 'NORMAL',
    },
    {
      processId: 'CD012',
      processName: 'Cấp đông xoắn tươi (Raw Spiral Freezer)',
      stationId: '10244167',
      stationName: 'Trạm cân Xoắn tươi 12',
      indicatorModel: 'DINI ARGEO',
      productType: 'Thành phẩm đóng gói',
      products: [
        { productId: 'TP_XOAN_1KG', productName: 'Tôm xoắn tươi đông gói 1kg', isEnd: true },
        { productId: 'TP_XOAN_500G', productName: 'Tôm xoắn tươi đông gói 500g', isEnd: true },
      ],
      isFinalOutput: true,
      nextProcessIds: [],
      weightIn: 1400,
      weightOut: 1000,
      wipWeight: 400,
      yieldRatePct: 71.4,
      status: 'NORMAL',
    },
    {
      processId: 'CD013',
      processName: 'Cấp đông xoắn chiên (Fried Spiral Freezer)',
      stationId: '10244168',
      stationName: 'Trạm cân Xoắn chiên 13',
      indicatorModel: 'DINI ARGEO',
      productType: 'Thành phẩm đóng gói',
      products: [
        { productId: 'TP_CHIEN_HOP', productName: 'Tôm chiên đông hộp 300g', isEnd: true },
      ],
      isFinalOutput: true,
      nextProcessIds: [],
      weightIn: 1400,
      weightOut: 1100,
      wipWeight: 300,
      yieldRatePct: 78.6,
      status: 'NORMAL',
    },
    {
      processId: 'CD014',
      processName: 'Cấp đông IQF tươi (Raw IQF)',
      stationId: '10244169',
      stationName: 'Trạm cân IQF tươi 14',
      indicatorModel: 'DINI ARGEO',
      productType: 'Thành phẩm đóng gói',
      products: [
        { productId: 'TP_IQF_TUSI', productName: 'Tôm IQF tươi mạ băng 10%', isEnd: true },
        { productId: 'TP_IQF_TUSI_20', productName: 'Tôm IQF tươi mạ băng 20%', isEnd: true },
      ],
      isFinalOutput: true,
      nextProcessIds: [],
      weightIn: 1500,
      weightOut: 800,
      wipWeight: 700,
      yieldRatePct: 53.3,
      status: 'NORMAL',
    },
    {
      processId: 'CD015',
      processName: 'Cấp đông IQF chín (Cook IQF)',
      stationId: '10244170',
      stationName: 'Trạm cân IQF chín 15',
      indicatorModel: 'DINI ARGEO',
      productType: 'Thành phẩm đóng gói',
      products: [
        { productId: 'TP_IQF_CHIN_1KG', productName: 'Tôm IQF chín gói 1kg', isEnd: true },
        { productId: 'TP_IQF_CHIN_RING', productName: 'Vòng tôm luộc Shrimp Ring kèm sốt', isEnd: true },
      ],
      isFinalOutput: true,
      nextProcessIds: [],
      weightIn: 3500,
      weightOut: 1200,
      wipWeight: 2300,
      yieldRatePct: 34.3,
      status: 'BOTTLENECK',
    },
  ],
  isSimulating: false,
  lastUpdated: new Date().toISOString(),
};

export interface UseBatchDashboardOptions {
  initialBatchId?: string;
  fixedCompanyId?: string;
}

export function useBatchDashboard(options?: string | UseBatchDashboardOptions) {
  const initialBatchId =
    typeof options === 'string'
      ? options
      : options?.initialBatchId || 'BATCH_01';
  const fixedCompanyId =
    typeof options === 'object' ? options?.fixedCompanyId : undefined;

  const [companies, setCompanies] = useState<CompanyItem[]>(DEFAULT_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    fixedCompanyId || 'COMP_01',
  );
  const [allBatches, setAllBatches] = useState<Batch[]>(DEFAULT_BATCHES);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [metrics, setMetrics] = useState<BatchKPIResponse>(DEFAULT_PMSL_METRICS);
  const [recentEvent, setRecentEvent] = useState<LiveWeighEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedBatchIdRef = useRef<string>(initialBatchId);

  useEffect(() => {
    selectedBatchIdRef.current = selectedBatchId;
  }, [selectedBatchId]);

  // Keep fixedCompanyId in sync if provided
  useEffect(() => {
    if (fixedCompanyId) {
      setSelectedCompanyId(fixedCompanyId);
      // Auto select appropriate batch
      const companyBatches = allBatches.filter(
        (b) => !b.companyId || b.companyId === fixedCompanyId,
      );
      if (
        companyBatches.length > 0 &&
        !companyBatches.some((b) => b.id === selectedBatchId)
      ) {
        setSelectedBatchId(companyBatches[0].id);
      }
    }
  }, [fixedCompanyId, allBatches, selectedBatchId]);

  // 1. Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/companies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);
        }
      }
    } catch {
      // Keep DEFAULT_COMPANIES
    }
  }, []);

  // 2. Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batches`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAllBatches(data);
        }
      }
    } catch {
      // Keep DEFAULT_BATCHES
    }
  }, []);

  // 3. Fetch summary for selected batch
  const fetchSummary = useCallback(
    async (batchId: string) => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/batches/${batchId}/summary`);
        if (res.ok) {
          const data: BatchKPIResponse = await res.json();
          setMetrics(data);
          setIsSimulating(data.isSimulating);
          if (data.batch?.companyId && !fixedCompanyId) {
            setSelectedCompanyId(data.batch.companyId);
          }
        }
      } catch {
        // Offline fallback
      } finally {
        setIsLoading(false);
      }
    },
    [fixedCompanyId],
  );

  // 4. Socket.IO connection on mount
  useEffect(() => {
    fetchCompanies();
    fetchBatches();
    fetchWorkflows();
    fetchSummary(selectedBatchIdRef.current);

    const socket: Socket = io(`${API_BASE}/batch-flow`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_batch', { batchId: selectedBatchIdRef.current });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('batch_snapshot', (data: BatchKPIResponse) => {
      if (data.batch.id === selectedBatchIdRef.current) {
        setMetrics(data);
        setIsSimulating(data.isSimulating);
      }
    });

    socket.on(
      'batch_metrics_stream',
      (payload: { data: BatchKPIResponse; event: LiveWeighEvent }) => {
        if (payload.data.batch.id === selectedBatchIdRef.current) {
          setMetrics(payload.data);
          setIsSimulating(payload.data.isSimulating);
          setRecentEvent(payload.event);
        }
      },
    );

    return () => {
      if (socket) {
        socket.emit('leave_batch', { batchId: selectedBatchIdRef.current });
        socket.disconnect();
      }
    };
  }, [fetchCompanies, fetchBatches, fetchSummary]);

  // 5. Select Company (only if not fixed)
  const selectCompany = (companyId: string) => {
    if (fixedCompanyId) return; // Disallowed if company is fixed
    setSelectedCompanyId(companyId);
    const companyBatches = allBatches.filter(
      (b) => !b.companyId || b.companyId === companyId,
    );
    if (companyBatches.length > 0) {
      selectBatch(companyBatches[0].id);
    }
  };

  // 6. Select Batch
  const selectBatch = (batchId: string) => {
    const oldBatchId = selectedBatchId;
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_batch', { batchId: oldBatchId });
      socketRef.current.emit('join_batch', { batchId });
    }
    setSelectedBatchId(batchId);
    fetchSummary(batchId);
  };

  // 7. Toggle Simulator
  const toggleSimulator = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/batches/${selectedBatchId}/simulate-toggle`,
        { method: 'POST' },
      );
      if (res.ok) {
        const data = await res.json();
        setIsSimulating(data.isSimulating);
      }
    } catch (err) {
      console.error('Failed to toggle simulator:', err);
    }
  };

  // 8. Trigger manual tick
  const triggerManualTick = async () => {
    try {
      await fetch(
        `${API_BASE}/api/batches/${selectedBatchId}/simulate-tick`,
        { method: 'POST' },
      );
    } catch (err) {
      console.error('Failed to trigger manual tick:', err);
    }
  };

  // 9. Process Node & Station Management APIs
  const createProcess = async (dto: any) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to create process:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProcess = async (processId: string, dto: any) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update process:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProcess = async (processId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes/${processId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete process:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reorderProcesses = async (processIds: string[]) => {
    // 1. Optimistic update local state immediately
    setMetrics((prev) => {
      const pMap = new Map(prev.processes.map((p) => [p.processId, p]));
      const newProcesses: ProcessFlowItem[] = [];
      for (const id of processIds) {
        const item = pMap.get(id);
        if (item) {
          newProcesses.push(item);
          pMap.delete(id);
        }
      }
      pMap.forEach((item) => {
        newProcesses.push(item);
      });
      return {
        ...prev,
        processes: newProcesses,
      };
    });

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processIds }),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to reorder processes:', err);
      await fetchSummary(selectedBatchId);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addStationToProcess = async (processId: string, dto: any) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes/${processId}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add station:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStationFromProcess = async (processId: string, stationId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/processes/${processId}/stations/${stationId}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete station:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addProductToProcess = async (processId: string, dto: any) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/processes/${processId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add product:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProductFromProcess = async (processId: string, productId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/processes/${processId}/products/${productId}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete product:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProcessMappings = async (
    processId: string,
    nextProcessIds: string[],
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const activeWfId = metrics.activeWorkflow?.id || metrics.batch?.workflowId;
      const url = activeWfId
        ? `${API_BASE}/api/processes/${processId}/mappings?workflowId=${activeWfId}`
        : `${API_BASE}/api/processes/${processId}/mappings`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextProcessIds }),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update process mappings:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveBulkProcesses = async (
    processes: ProcessFlowItem[],
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const activeWfId = metrics.activeWorkflow?.id || metrics.batch?.workflowId;
      const url = activeWfId
        ? `${API_BASE}/api/processes/bulk?workflowId=${activeWfId}`
        : `${API_BASE}/api/processes/bulk`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes }),
      });
      if (res.ok) {
        await fetchSummary(selectedBatchId);
        return true;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể lưu danh mục quy trình');
    } catch (err: any) {
      console.error('Failed to save bulk processes:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Multi-Workflow Management APIs
  const [workflowsList, setWorkflowsList] = useState<WorkflowDefinition[]>([]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWorkflowsList(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  }, []);

  const selectWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/workflows/${workflowId}/assign-batch/${selectedBatchId}`,
        { method: 'POST' },
      );
      if (res.ok) {
        const data: BatchKPIResponse = await res.json();
        setMetrics(data);
        await fetchWorkflows();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to select workflow:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflow = async (
    dto: CreateWorkflowDto,
  ): Promise<WorkflowDefinition | null> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const newWf: WorkflowDefinition = await res.json();
        await fetchWorkflows();
        if (newWf && newWf.id) {
          await selectWorkflow(newWf.id);
        }
        return newWf;
      }
      return null;
    } catch (err) {
      console.error('Failed to create workflow:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkflow = async (
    workflowId: string,
    dto: UpdateWorkflowDto,
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        await fetchWorkflows();
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update workflow:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchWorkflows();
        await fetchSummary(selectedBatchId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter batches for current active company
  const activeCompanyId = fixedCompanyId || selectedCompanyId;
  const filteredBatches = allBatches.filter(
    (b) => !b.companyId || b.companyId === activeCompanyId,
  );

  const currentCompany =
    companies.find((c) => c.id === activeCompanyId) || companies[0];

  const availableWorkflows =
    metrics.workflows && metrics.workflows.length > 0
      ? metrics.workflows
      : workflowsList;

  const currentWorkflow =
    metrics.activeWorkflow ||
    availableWorkflows.find((w) => w.id === metrics.batch?.workflowId) ||
    availableWorkflows[0] ||
    null;

  return {
    isSuperAdmin: !fixedCompanyId,
    companies,
    selectedCompanyId: activeCompanyId,
    currentCompany,
    selectCompany,
    batches: filteredBatches.length > 0 ? filteredBatches : allBatches,
    allBatches,
    selectedBatchId,
    selectBatch,
    workflows: availableWorkflows,
    activeWorkflow: currentWorkflow,
    fetchWorkflows,
    selectWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    metrics,
    recentEvent,
    isLoading,
    isSimulating,
    isConnected,
    toggleSimulator,
    triggerManualTick,
    refreshSummary: () => fetchSummary(selectedBatchId),
    createProcess,
    updateProcess,
    deleteProcess,
    reorderProcesses,
    addStationToProcess,
    deleteStationFromProcess,
    addProductToProcess,
    deleteProductFromProcess,
    updateProcessMappings,
    saveBulkProcesses,
  };
}


