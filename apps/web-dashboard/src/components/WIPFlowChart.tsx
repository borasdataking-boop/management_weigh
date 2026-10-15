'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { ProcessFlowItem } from '../types/batch-flow';
import { formatNumber } from '../lib/formatters';

interface WIPFlowChartProps {
  processes: ProcessFlowItem[];
}

type ViewFilter = 'ALL' | 'TOP_WIP';

export const WIPFlowChart: React.FC<WIPFlowChartProps> = ({ processes }) => {
  const [filter, setFilter] = useState<ViewFilter>('ALL');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredProcesses = useMemo(() => {
    if (filter === 'TOP_WIP') {
      return [...processes].sort((a, b) => b.wipWeight - a.wipWeight).slice(0, 6);
    }
    return processes;
  }, [processes, filter]);

  const chartData = filteredProcesses.map((p) => ({
    name: p.processId,
    fullName: p.processName,
    station: p.stationName,
    weightIn: p.weightIn,
    weightOut: p.weightOut,
    wipWeight: p.wipWeight,
  }));

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            Khối lượng theo công đoạn
          </h2>
        </div>

        {/* Filters & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc hiển thị */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({processes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('TOP_WIP')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filter === 'TOP_WIP'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 6 WIP cao nhất
            </button>
          </div>

          {/* Chú thích màu */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" />
              <span>Vào</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
              <span>Ra</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
              <span>Đang xử lý</span>
            </span>
          </div>
        </div>
      </div>

      {/* Vùng biểu đồ */}
      <div className="w-full h-72">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                tickLine={false}
                dy={8}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = processes.find((p) => p.processId === label);
                    return (
                      <div className="bg-slate-900 text-slate-100 p-3 rounded shadow-lg text-xs space-y-1.5 border border-slate-800 min-w-[200px]">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-mono">
                          <span className="font-bold text-slate-100">{label}</span>
                          <span className="text-[11px] text-slate-400">{item?.stationName}</span>
                        </div>
                        <p className="text-slate-300">{item?.processName}</p>
                        <div className="space-y-1 pt-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vào:</span>
                            <span className="font-medium text-slate-100">
                              {formatNumber(Number(payload[0]?.value))} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ra:</span>
                            <span className="font-medium text-slate-100">
                              {formatNumber(Number(payload[1]?.value))} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Đang xử lý:</span>
                            <span className="font-medium text-slate-100">
                              {formatNumber(Number(payload[2]?.value))} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="weightIn" name="Vào" fill="#0f172a" radius={[2, 2, 0, 0]} maxBarSize={16} />
              <Bar dataKey="weightOut" name="Ra" fill="#64748b" radius={[2, 2, 0, 0]} maxBarSize={16} />
              <Bar dataKey="wipWeight" name="Đang xử lý" fill="#cbd5e1" radius={[2, 2, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded text-xs text-slate-400 font-mono">
            Đang tải dữ liệu biểu đồ...
          </div>
        )}
      </div>
    </div>
  );
};
