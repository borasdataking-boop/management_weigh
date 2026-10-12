'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ProcessFlowItem } from '../types/batch-flow';

interface WIPFlowChartProps {
  processes: ProcessFlowItem[];
}

export const WIPFlowChart: React.FC<WIPFlowChartProps> = ({ processes }) => {
  const chartData = processes.map((p) => ({
    name: p.processId,
    fullName: p.processName,
    station: p.stationName,
    'Cân Vào (IN)': p.weightIn,
    'Cân Ra (OUT)': p.weightOut,
    'WIP Đọng': p.wipWeight,
  }));

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            📊 Biểu Đồ Cân Đối Khối Lượng Dòng Chảy (IN vs OUT)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            So sánh khối lượng nguyên liệu vào (IN) và khối lượng bán thành phẩm ra (OUT) qua 15 trạm cân
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="text-slate-600">Cân Vào (IN)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-400 inline-block" />
            <span className="text-slate-600">Cân Ra (OUT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
            <span className="text-slate-600">WIP Đọng</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
            barSize={14}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = processes.find((p) => p.processId === label);
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700/50 backdrop-blur-md">
                      <p className="font-bold text-sky-300">
                        {label} — {item?.processName}
                      </p>
                      <p className="text-slate-300">Trạm: {item?.stationName}</p>
                      <div className="pt-1.5 border-t border-slate-700/80 space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-blue-400">Cân Vào (IN):</span>
                          <span className="font-bold">
                            {Number(payload[0]?.value).toLocaleString()} kg
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-teal-400">Cân Ra (OUT):</span>
                          <span className="font-bold">
                            {Number(payload[1]?.value).toLocaleString()} kg
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-amber-400">WIP đọng:</span>
                          <span className="font-bold">
                            {Number(payload[2]?.value).toLocaleString()} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="Cân Vào (IN)" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cân Ra (OUT)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="WIP Đọng" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
