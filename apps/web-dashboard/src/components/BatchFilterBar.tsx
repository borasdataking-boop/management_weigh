'use client';

import React from 'react';
import {
  ChevronDown,
} from 'lucide-react';
import { Batch, CompanyItem, HubItem } from '../types/batch-flow';
import { formatNumber } from '../lib/formatters';

interface BatchFilterBarProps {
  isSuperAdmin?: boolean;
  companies: CompanyItem[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  batches: Batch[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  activeCompany?: CompanyItem;
  activeHub?: HubItem;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  onTriggerTick: () => void;
  isConnected: boolean;
}

export const BatchFilterBar: React.FC<BatchFilterBarProps> = ({
  isSuperAdmin = true,
  companies,
  selectedCompanyId,
  onSelectCompany,
  batches,
  selectedBatchId,
  onSelectBatch,
  activeCompany,
  activeHub,
  isSimulating,
  onToggleSimulator,
  onTriggerTick,
  isConnected,
}) => {
  const currentBatch = batches.find((b) => b.id === selectedBatchId);
  const currentCompany = companies.find((c) => c.id === selectedCompanyId) || activeCompany;

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3">
      {/* Hàng chọn thông tin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
        {/* 1. Công ty / Đơn vị */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Đơn vị
          </label>
          {isSuperAdmin ? (
            <div className="relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="w-full appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-md pl-3 pr-8 py-2 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 truncate">
              {currentCompany?.name || 'Công ty CP Thực phẩm Sao Ta'}
            </div>
          )}
        </div>

        {/* 2. Mẻ cân */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Mẻ cân
          </label>
          <div className="relative">
            <select
              value={selectedBatchId}
              onChange={(e) => onSelectBatch(e.target.value)}
              className="w-full appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-md pl-3 pr-8 py-2 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
            >
              {batches.length === 0 ? (
                <option value={selectedBatchId}>{selectedBatchId}</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.id} - {batch.name} ({formatNumber(batch.planWeight)} kg)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. Trạm kết nối */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Trạm kết nối
          </span>
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
            <span className="font-medium text-slate-800 truncate">
              {activeHub?.name || 'Trạm trung tâm'}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {activeHub?.ipAddress || '192.168.1.100'}
            </span>
          </div>
        </div>
      </div>

      {/* Hàng trạng thái & Thao tác */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Trạng thái kết nối */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                currentBatch?.status === 'IN_PROGRESS' ? 'bg-slate-700' : 'bg-slate-400'
              }`}
            />
            <span>
              {currentBatch?.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Sẵn sàng'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-600' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isConnected ? 'Kết nối trực tiếp' : 'Mất kết nối'}
            </span>
          </div>
        </div>

        {/* Thao tác mô phỏng */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onTriggerTick}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            Mô phỏng cân
          </button>

          <button
            type="button"
            onClick={onToggleSimulator}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isSimulating
                ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSimulating ? 'Dừng tự động' : 'Bật tự động'}
          </button>
        </div>
      </div>
    </div>
  );
};
