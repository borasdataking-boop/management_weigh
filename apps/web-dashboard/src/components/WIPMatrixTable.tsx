'use client';

import React from 'react';
import { ProcessFlowItem, BatchKPIResponse } from '../types/batch-flow';

interface WIPMatrixTableProps {
  metrics: BatchKPIResponse;
}

export const WIPMatrixTable: React.FC<WIPMatrixTableProps> = ({ metrics }) => {
  const { processes, bottleneckProcess } = metrics;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            📋 Bảng Chi Tiết Cân Vào / Cân Ra & Bán Thành Phẩm Dở Dang (WIP)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu cân chuẩn hóa 15 công đoạn sản xuất (Tương đương C62:I78 Excel Model)
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
          Tổng cộng: 15 Công đoạn
        </div>
      </div>

      {/* Table container with horizontal scroll for responsiveness */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-3.5 text-center w-16">Mã CĐ</th>
              <th className="py-3 px-4">Công đoạn sản xuất</th>
              <th className="py-3 px-4">Trạm cân</th>
              <th className="py-3 px-3.5 text-right">Cân Vào IN (kg)</th>
              <th className="py-3 px-3.5 text-right">Cân Ra OUT (kg)</th>
              <th className="py-3 px-3.5 text-right">WIP Đọng (kg)</th>
              <th className="py-3 px-3.5 text-right">Tỷ lệ đầu ra (%)</th>
              <th className="py-3 px-3.5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {processes.map((p) => {
              const isBottleneck = p.processId === bottleneckProcess.processId;
              const isFinal = p.isFinalOutput;

              return (
                <tr
                  key={p.processId}
                  className={`transition-colors ${
                    isBottleneck
                      ? 'bg-rose-50/60 font-medium hover:bg-rose-50'
                      : isFinal
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Mã CĐ */}
                  <td className="py-2.5 px-3.5 text-center font-bold text-slate-500">
                    {p.processId}
                  </td>

                  {/* Tên công đoạn */}
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{p.processName}</span>
                      {p.productType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                          {p.productType}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Trạm cân */}
                  <td className="py-2.5 px-4 text-slate-600">
                    <span className="font-mono text-slate-500 font-semibold mr-1">
                      {p.stationId}
                    </span>
                    - {p.stationName}
                  </td>

                  {/* Cân Vào IN */}
                  <td className="py-2.5 px-3.5 text-right font-medium text-blue-700">
                    {p.weightIn.toLocaleString()}
                  </td>

                  {/* Cân Ra OUT */}
                  <td className="py-2.5 px-3.5 text-right font-medium text-teal-700">
                    {p.weightOut.toLocaleString()}
                  </td>

                  {/* WIP Đọng */}
                  <td
                    className={`py-2.5 px-3.5 text-right font-bold ${
                      isBottleneck
                        ? 'text-rose-600 text-sm'
                        : p.wipWeight > 500
                        ? 'text-amber-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {p.wipWeight.toLocaleString()}
                  </td>

                  {/* Tỷ lệ đầu ra */}
                  <td className="py-2.5 px-3.5 text-right font-semibold text-slate-700">
                    {p.yieldRatePct.toFixed(1)}%
                  </td>

                  {/* Trạng thái */}
                  <td className="py-2.5 px-3.5 text-center">
                    {isBottleneck ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                        ⚠️ Điểm nghẽn
                      </span>
                    ) : isFinal ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                        ✨ Cấp đông
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-normal bg-slate-100 text-slate-600">
                        Bình thường
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer: TỔNG CỘNG */}
          <tfoot>
            <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <td colSpan={3} className="py-3 px-4 text-left uppercase tracking-wider">
                TỔNG CỘNG (15 CÔNG ĐOẠN)
              </td>
              <td className="py-3 px-3.5 text-right text-blue-900">
                {metrics.totalWeightIn.toLocaleString()} kg
              </td>
              <td className="py-3 px-3.5 text-right text-teal-900">
                {metrics.totalWeightOut.toLocaleString()} kg
              </td>
              <td className="py-3 px-3.5 text-right text-amber-900">
                {metrics.totalWipWeight.toLocaleString()} kg
              </td>
              <td className="py-3 px-3.5 text-right text-slate-900">
                {metrics.overallYieldPct.toFixed(1)}%
              </td>
              <td className="py-3 px-3.5 text-center text-xs text-slate-500 font-medium">
                100% Khớp
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Thông báo điểm nghẽn nhận xét */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold mb-0.5">Nhận xét vận hành dây chuyền:</p>
          <p>
            Công đoạn đang đọng WIP lớn nhất là{' '}
            <strong className="text-amber-950 underline decoration-amber-400">
              {bottleneckProcess.processName} ({bottleneckProcess.processId})
            </strong>{' '}
            với khối lượng{' '}
            <strong className="text-rose-700 font-extrabold">
              {bottleneckProcess.wipWeight.toLocaleString()} kg
            </strong>{' '}
            (chiếm{' '}
            {metrics.totalWipWeight > 0
              ? (
                  (bottleneckProcess.wipWeight / metrics.totalWipWeight) *
                  100
                ).toFixed(1)
              : 0}
            % tổng WIP toàn xưởng). Cần điều phối công nhân hoặc tăng công suất tại{' '}
            {bottleneckProcess.stationName} để giải tỏa ách tắc.
          </p>
        </div>
      </div>
    </div>
  );
};
