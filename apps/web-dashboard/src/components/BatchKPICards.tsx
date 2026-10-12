'use client';

import React from 'react';
import { BatchKPIResponse } from '../types/batch-flow';

interface BatchKPICardsProps {
  metrics: BatchKPIResponse;
}

export const BatchKPICards: React.FC<BatchKPICardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Kế hoạch Lô */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Kế hoạch Lô (Target)
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
            🎯
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.planWeight.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Tổng định mức sản xuất (100%)
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>Lô: {metrics.batch.id}</span>
          <span className="font-semibold text-blue-600">Chuẩn hóa</span>
        </div>
      </div>

      {/* Card 2: Đã hoàn thành */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase font-bold">
            Đã hoàn thành
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
            ✅
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
            {metrics.completedWeight.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, metrics.completedPct)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 shrink-0">
              {metrics.completedPct}%
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>4 Trạm Cấp Đông cuối</span>
          <span className="font-semibold text-emerald-600">ST12-15 OUT</span>
        </div>
      </div>

      {/* Card 3: WIP dở dang */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-amber-600 uppercase font-bold">
            WIP dở dang
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base">
            ⚙️
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
            {metrics.totalWipWeight.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, metrics.totalWipPct)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-600 shrink-0">
              {metrics.totalWipPct}%
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>Đọng trên 15 trạm cân</span>
          <span className="font-semibold text-amber-600">IN - OUT</span>
        </div>
      </div>

      {/* Card 4: Còn lại */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-purple-600 uppercase font-bold">
            Còn lại
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base">
            ⏳
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight">
            {metrics.remainingWeight.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, metrics.remainingPct)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-purple-600 shrink-0">
              {metrics.remainingPct}%
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>Chưa xuất thành phẩm</span>
          <span className="font-semibold text-purple-600">Kế hoạch - Đã xong</span>
        </div>
      </div>
    </div>
  );
};
