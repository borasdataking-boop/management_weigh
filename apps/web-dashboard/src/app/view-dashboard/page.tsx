'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, RefreshCw } from 'lucide-react';
import { useBatchDashboard } from '../../hooks/useBatchDashboard';
import { BatchFilterBar } from '../../components/BatchFilterBar';
import { BatchKPICards } from '../../components/BatchKPICards';
import { WIPFlowChart } from '../../components/WIPFlowChart';
import { WIPMatrixTable } from '../../components/WIPMatrixTable';
import { formatNumber, formatTime } from '../../lib/formatters';

interface ViewDashboardPageProps {
  searchParams?: {
    companyId?: string;
  };
}

export default function ViewDashboardPage({ searchParams }: ViewDashboardPageProps) {
  const companyId = searchParams?.companyId || 'COMP_01';

  const {
    companies,
    selectedCompanyId,
    selectCompany,
    selectedBatchId,
    batches,
    metrics,
    recentEvent,
    isLoading,
    isSimulating,
    isConnected,
    selectBatch,
    toggleSimulator,
    triggerManualTick,
    refreshSummary,
    currentCompany,
  } = useBatchDashboard({
    fixedCompanyId: companyId,
    initialBatchId: 'BATCH_01',
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans antialiased">
      {/* Thanh điều hướng trên */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                  Quản lý cân mẻ
                </h1>
                <span className="text-[11px] text-slate-500 font-medium border-l border-slate-300 pl-2">
                  {currentCompany?.name || 'Xưởng chế biến'}
                </span>
              </div>
            </div>
          </div>

          {/* Khu vực thao tác bên phải */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboardsuper"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <span>Về trang quản trị</span>
            </Link>

            {recentEvent && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-600 font-mono border-l border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>
                  Vừa cân: +{formatNumber(recentEvent.addedWeight)} kg ({recentEvent.type === 'IN' ? 'Vào' : 'Ra'}) - {recentEvent.stationName} ({formatTime(recentEvent.timestamp)})
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={refreshSummary}
              title="Làm mới"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        {/* Bộ lọc xưởng (cố định công ty) */}
        <BatchFilterBar
          isSuperAdmin={false}
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={selectCompany}
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelectBatch={selectBatch}
          activeCompany={currentCompany || metrics.activeCompany}
          activeHub={metrics.activeHub}
          isSimulating={isSimulating}
          onToggleSimulator={toggleSimulator}
          onTriggerTick={triggerManualTick}
          isConnected={isConnected}
        />

        {/* 4 Thẻ KPI */}
        <BatchKPICards metrics={metrics} />

        {/* Biểu đồ */}
        <WIPFlowChart processes={metrics.processes} />

        {/* Bảng chi tiết công đoạn */}
        <WIPMatrixTable metrics={metrics} />
      </main>
    </div>
  );
}
