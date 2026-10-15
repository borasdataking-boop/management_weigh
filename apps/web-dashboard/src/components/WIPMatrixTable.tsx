'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ProcessFlowItem, BatchKPIResponse } from '../types/batch-flow';
import { formatNumber, formatPct } from '../lib/formatters';

interface WIPMatrixTableProps {
  metrics: BatchKPIResponse;
}

type SortField = 'processId' | 'processName' | 'weightIn' | 'weightOut' | 'wipWeight' | 'yieldRatePct';
type SortOrder = 'asc' | 'desc';

export const WIPMatrixTable: React.FC<WIPMatrixTableProps> = ({ metrics }) => {
  const { processes } = metrics;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_PROGRESS' | 'FINAL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('processId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'wipWeight' || field === 'yieldRatePct' ? 'desc' : 'asc');
    }
  };

  const filteredAndSortedProcesses = useMemo(() => {
    return processes
      .filter((p) => {
        const matchesSearch =
          p.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.processId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.stationId.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'FINAL') {
          return p.isFinalOutput;
        }
        if (filterType === 'IN_PROGRESS') {
          return !p.isFinalOutput;
        }

        return true;
      })
      .sort((a, b) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'processId' || sortField === 'processName') {
          return a[sortField].localeCompare(b[sortField]) * factor;
        }
        return ((a[sortField] as number) - (b[sortField] as number)) * factor;
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
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Chi tiết công đoạn
          </h2>
        </div>

        {/* Search & Segmented Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-60">
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
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium uppercase text-[11px]">
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
              <th className="py-2.5 px-3">Trạm cân</th>
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
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              filteredAndSortedProcesses.map((p) => {
                const isFinal = p.isFinalOutput;

                return (
                  <tr
                    key={p.processId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Mã */}
                    <td className="py-2 px-3 text-center font-mono font-medium text-slate-500">
                      {p.processId}
                    </td>

                    {/* Tên công đoạn */}
                    <td className="py-2 px-3 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{p.processName}</span>
                        {p.productType && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.productType})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trạm cân */}
                    <td className="py-2 px-3 text-slate-600">
                      <span className="font-mono text-slate-700 mr-1">
                        {p.stationId}
                      </span>
                      <span>- {p.stationName}</span>
                    </td>

                    {/* Vào IN */}
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {formatNumber(p.weightIn)}
                    </td>

                    {/* Ra OUT */}
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {formatNumber(p.weightOut)}
                    </td>

                    {/* Đang xử lý */}
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                      {formatNumber(p.wipWeight)}
                    </td>

                    {/* Tỷ lệ đạt */}
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatPct(p.yieldRatePct)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-2 px-3 text-center">
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
              <td colSpan={3} className="py-2.5 px-3 uppercase text-[11px] text-slate-600">
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
