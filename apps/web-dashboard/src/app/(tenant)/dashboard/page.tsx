'use client';

import React from 'react';
import { useBatchDashboard } from '../../../hooks/useBatchDashboard';
import { BatchFilterBar } from '../../../components/BatchFilterBar';
import { BatchKPICards } from '../../../components/BatchKPICards';
import { WIPFlowChart } from '../../../components/WIPFlowChart';
import { WIPMatrixTable } from '../../../components/WIPMatrixTable';

export default function TenantDashboardPage() {
  const {
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
  } = useBatchDashboard('BATCH_01');

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-12 font-sans antialiased">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              ⚖️
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Hệ Thống Giám Sát Cân Công Nghiệp Đa Tầng
              </h1>
              <p className="text-xs text-slate-400">
                Quản lý Dòng Chảy WIP & 15 Trạm Cân IN/OUT Chế Biến Thủy Sản
              </p>
            </div>
          </div>

          {/* Quick info / live notification pill */}
          {recentEvent && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>
                Vừa cân <strong>+{recentEvent.addedWeight} kg</strong> tại{' '}
                <strong>{recentEvent.stationName}</strong> ({recentEvent.type})
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. Filter & Controls Bar */}
        <BatchFilterBar
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelectBatch={selectBatch}
          isSimulating={isSimulating}
          onToggleSimulator={toggleSimulator}
          onTriggerTick={triggerManualTick}
          isConnected={isConnected}
        />

        {/* 2. Loading State */}
        {isLoading && !metrics ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400 mt-3">
              Đang tải dữ liệu lô và dòng chảy 15 trạm cân...
            </p>
          </div>
        ) : metrics ? (
          <>
            {/* 3. KPI Summary 4 Cards */}
            <BatchKPICards metrics={metrics} />

            {/* 4. WIP Flow Bar Chart (IN vs OUT comparison) */}
            <WIPFlowChart processes={metrics.processes} />

            {/* 5. WIP 15-Process Matrix Table (Excel Model C62:I78) */}
            <WIPMatrixTable metrics={metrics} />
          </>
        ) : null}
      </main>
    </div>
  );
}
