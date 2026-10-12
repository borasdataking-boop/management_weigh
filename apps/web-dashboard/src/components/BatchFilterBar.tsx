'use client';

import React from 'react';
import { Batch } from '../types/batch-flow';

interface BatchFilterBarProps {
  batches: Batch[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onTriggerTick: () => void;
  isConnected: boolean;
}

export const BatchFilterBar: React.FC<BatchFilterBarProps> = ({
  batches,
  selectedBatchId,
  onSelectBatch,
  isSimulating,
  onToggleSimulator,
  onTriggerTick,
  isConnected,
}) => {
  const currentBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-2xl p-4 sm:p-5">
      {/* Left: Batch Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Lô sản xuất:
        </label>
        <div className="relative">
          <select
            value={selectedBatchId}
            onChange={(e) => onSelectBatch(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.id} — {batch.name} ({batch.planWeight.toLocaleString()} kg)
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentBatch?.status === 'IN_PROGRESS' ? 'Đang sản xuất' : 'Hoạt động'}</span>
        </div>

        {/* WebSocket Connection indicator */}
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-sky-400' : 'bg-rose-400'
            }`}
          />
          <span>{isConnected ? 'Real-time Live (Socket.IO)' : 'Mất kết nối'}</span>
        </div>
      </div>

      {/* Right: Simulator Controls */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onTriggerTick}
          className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
          title="Nhảy số cân thử 1 lần (+10~50kg)"
        >
          <span>⚡ Nhảy cân 1 lần</span>
        </button>

        <button
          type="button"
          onClick={onToggleSimulator}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
            isSimulating
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 shadow-md'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulating ? 'bg-rose-500 animate-ping' : 'bg-emerald-200'
            }`}
          />
          <span>{isSimulating ? 'Dừng Live Simulator' : '▶ Bật Live Simulator (1.5s)'}</span>
        </button>
      </div>
    </div>
  );
};
