'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  Plus,
} from 'lucide-react';
import { ProcessFlowItem, BatchKPIResponse } from '../types/batch-flow';
import { formatNumber, formatPct } from '../lib/formatters';

interface WIPMatrixTableProps {
  metrics: BatchKPIResponse;
  onOpenConfig?: () => void;
  onOpenAddStep?: () => void;
  onReorderProcesses?: (processIds: string[]) => Promise<boolean>;
}

type SortField = 'processId' | 'processName' | 'weightIn' | 'weightOut' | 'wipWeight' | 'yieldRatePct' | null;
type SortOrder = 'asc' | 'desc';

export const WIPMatrixTable: React.FC<WIPMatrixTableProps> = ({
  metrics,
  onOpenConfig,
  onOpenAddStep,
  onReorderProcesses,
}) => {
  const { processes } = metrics;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_PROGRESS' | 'FINAL'>('ALL');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleMoveRow = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!onReorderProcesses) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= processes.length) return;

    const ids = processes.map((p) => p.processId);
    const temp = ids[index];
    ids[index] = ids[targetIndex];
    ids[targetIndex] = temp;

    await onReorderProcesses(ids);
  };

  const handleMoveRowTo = async (fromIndex: number, toIndex: number) => {
    if (!onReorderProcesses) return;
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= processes.length) return;

    const ids = processes.map((p) => p.processId);
    const [movedId] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, movedId);

    await onReorderProcesses(ids);
  };

  const handleSort = (field: SortField) => {
    if (!field) return;
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder(field === 'wipWeight' || field === 'yieldRatePct' ? 'desc' : 'asc');
    }
  };

  const filteredAndSortedProcesses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = processes.filter((p) => {
      if (!q) return true;
      const matchesSearch =
        (p.processName || '').toLowerCase().includes(q) ||
        (p.processId || '').toLowerCase().includes(q) ||
        (p.stationName || '').toLowerCase().includes(q) ||
        (p.stationId || '').toLowerCase().includes(q) ||
        (p.productType || '').toLowerCase().includes(q) ||
        (p.products &&
          p.products.some((prd) =>
            (prd.productName || '').toLowerCase().includes(q),
          )) ||
        (p.stations &&
          p.stations.some(
            (st) =>
              (st.stationName || '').toLowerCase().includes(q) ||
              (st.stationId || '').toLowerCase().includes(q),
          ));

      if (!matchesSearch) return false;

      if (filterType === 'FINAL') {
        return p.isFinalOutput;
      }
      if (filterType === 'IN_PROGRESS') {
        return !p.isFinalOutput;
      }

      return true;
    });

    if (!sortField) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'processId' || sortField === 'processName') {
        return (a[sortField] || '').localeCompare(b[sortField] || '') * factor;
      }
      return ((Number(a[sortField]) || 0) - (Number(b[sortField]) || 0)) * factor;
    });
  }, [processes, searchQuery, filterType, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-slate-800 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-800 ml-1 inline-block" />
    );
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 flex flex-col gap-3">
      {/* Table Header & Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-900">
            Chi tiết công đoạn ({processes.length})
          </h2>
          {sortField && (
            <button
              type="button"
              onClick={() => setSortField(null)}
              className="text-[11px] text-slate-500 hover:text-slate-900 underline"
              title="Đặt lại về thứ tự quy trình sản xuất mặc định"
            >
              (Khôi phục thứ tự gốc)
            </button>
          )}
          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
              title="Xem danh sách, sửa đổi và thêm trạm cân"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Cấu hình quy trình</span>
            </button>
          )}
        </div>

        {/* Search & Segmented Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-60 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm công đoạn, trạm cân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
            />
          </div>

          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({processes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterType === 'IN_PROGRESS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang xử lý ({processes.filter((p) => !p.isFinalOutput).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('FINAL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterType === 'FINAL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoàn thành ({processes.filter((p) => p.isFinalOutput).length})
            </button>
          </div>

          {(onOpenAddStep || onOpenConfig) && (
            <button
              type="button"
              onClick={onOpenAddStep || onOpenConfig}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bước</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase text-[11px]">
              <th className="py-2.5 px-2 text-center w-20">
                Thứ tự
              </th>
              <th
                onClick={() => handleSort('processId')}
                className="py-2.5 px-3 text-center w-16 cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Mã {renderSortIcon('processId')}
              </th>
              <th
                onClick={() => handleSort('processName')}
                className="py-2.5 px-3 cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Công đoạn {renderSortIcon('processName')}
              </th>
              <th className="py-2.5 px-3 min-w-[170px]">Trạm cân</th>
              <th className="py-2.5 px-3 min-w-[140px]">Chuyển tiếp đến</th>
              <th
                onClick={() => handleSort('weightIn')}
                className="py-2.5 px-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Vào (kg) {renderSortIcon('weightIn')}
              </th>
              <th
                onClick={() => handleSort('weightOut')}
                className="py-2.5 px-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Ra (kg) {renderSortIcon('weightOut')}
              </th>
              <th
                onClick={() => handleSort('wipWeight')}
                className="py-2.5 px-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Đang xử lý (kg) {renderSortIcon('wipWeight')}
              </th>
              <th
                onClick={() => handleSort('yieldRatePct')}
                className="py-2.5 px-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
              >
                Tỷ lệ {renderSortIcon('yieldRatePct')}
              </th>
              <th className="py-2.5 px-3 text-center w-24">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredAndSortedProcesses.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  Không tìm thấy công đoạn nào.
                </td>
              </tr>
            ) : (
              filteredAndSortedProcesses.map((p, pIdx) => {
                const isFinal = p.isFinalOutput;
                const stationsList =
                  p.stations && p.stations.length > 0
                    ? p.stations
                    : p.stationId && p.stationId !== 'ST_NONE'
                    ? [
                        {
                          stationId: p.stationId,
                          stationName: p.stationName,
                          indicatorModel: p.indicatorModel,
                        },
                      ]
                    : [];

                return (
                  <tr
                    key={p.processId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Thứ tự */}
                    <td className="py-2.5 px-2 text-center align-top whitespace-nowrap">
                      {!sortField && !searchQuery.trim() && filterType === 'ALL' && onReorderProcesses ? (
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          <select
                            value={pIdx}
                            onChange={(e) => handleMoveRowTo(pIdx, Number(e.target.value))}
                            className="bg-transparent text-xs font-mono font-semibold text-slate-800 cursor-pointer focus:outline-none"
                            title="Chọn vị trí công đoạn"
                          >
                            {processes.map((_, idx) => (
                              <option key={idx} value={idx}>
                                #{idx + 1}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => handleMoveRow(pIdx, 'UP')}
                              className="text-slate-400 hover:text-slate-900 disabled:opacity-20 leading-none"
                              title="Chuyển lên"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === processes.length - 1}
                              onClick={() => handleMoveRow(pIdx, 'DOWN')}
                              className="text-slate-400 hover:text-slate-900 disabled:opacity-20 leading-none"
                              title="Chuyển xuống"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">
                          #{pIdx + 1}
                        </span>
                      )}
                    </td>

                    {/* Mã */}
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500 align-top">
                      {p.processId}
                    </td>

                    {/* Tên công đoạn & Sản phẩm output */}
                    <td className="py-2.5 px-3 font-medium text-slate-900 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900">
                          {p.processName}
                        </span>
                        {p.products && p.products.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {p.products.map((prd) => (
                              <span
                                key={prd.productId}
                                className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {prd.productName}
                              </span>
                            ))}
                          </div>
                        ) : p.productType ? (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.productType})
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Trạm cân */}
                    <td className="py-2.5 px-3 text-slate-600 align-top">
                      {stationsList.length === 0 ? (
                        <span className="text-slate-400 text-[11px] italic">
                          Chưa gán trạm cân
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {stationsList.map((st, sIdx) => (
                            <div
                              key={st.stationId || sIdx}
                              className="flex items-center gap-1 text-[11px]"
                            >
                              <span className="font-mono text-slate-700 font-semibold">
                                {st.stationId}
                              </span>
                              <span className="truncate">- {st.stationName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Chuyển tiếp đến */}
                    <td className="py-2.5 px-3 text-slate-700 align-top">
                      {(!p.nextProcessIds || p.nextProcessIds.length === 0) ? (
                        <span className="text-slate-400 text-[11px] italic">
                          {isFinal ? 'Kho thành phẩm' : 'Chưa nối bước sau'}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {p.nextProcessIds.map((nextId) => {
                            const target = processes.find((item) => item.processId === nextId);
                            return (
                              <span
                                key={nextId}
                                className="inline-flex items-center gap-0.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors cursor-default"
                                title={target ? `${target.processId} - ${target.processName}` : nextId}
                              >
                                <span className="text-slate-400">→</span>
                                <span>{nextId}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Vào IN */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 align-top">
                      {formatNumber(p.weightIn)}
                    </td>

                    {/* Ra OUT */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 align-top">
                      {formatNumber(p.weightOut)}
                    </td>

                    {/* Đang xử lý */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 align-top">
                      {formatNumber(p.wipWeight)}
                    </td>

                    {/* Tỷ lệ đạt */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 align-top">
                      {formatPct(p.yieldRatePct)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-2.5 px-3 text-center align-top">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          isFinal
                            ? 'bg-slate-100 text-slate-800 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {isFinal ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer: TỔNG CỘNG */}
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
              <td colSpan={5} className="py-2.5 px-3 uppercase text-[11px] text-slate-600">
                Tổng cộng ({processes.length} công đoạn)
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                {formatNumber(metrics.totalWeightIn)} kg
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                {formatNumber(metrics.totalWeightOut)} kg
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                {formatNumber(metrics.totalWipWeight)} kg
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                {formatPct(metrics.overallYieldPct)}
              </td>
              <td className="py-2.5 px-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
