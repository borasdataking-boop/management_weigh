'use client';

import React from 'react';
import { Target, CheckCircle2, Layers, Clock } from 'lucide-react';
import { BatchKPIResponse } from '../types/batch-flow';
import { formatNumber, formatPct } from '../lib/formatters';

interface BatchKPICardsProps {
  metrics: BatchKPIResponse;
}

interface MetricCardConfig {
  id: string;
  label: string;
  value: number;
  pct?: number;
  subText: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BatchKPICards: React.FC<BatchKPICardsProps> = ({ metrics }) => {
  const cards: MetricCardConfig[] = [
    {
      id: 'plan',
      label: 'Kế hoạch',
      value: metrics.planWeight,
      subText: `Mẻ: ${metrics.batch.id}`,
      icon: Target,
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      value: metrics.completedWeight,
      pct: metrics.completedPct,
      subText: 'Đầu ra công đoạn cuối',
      icon: CheckCircle2,
    },
    {
      id: 'wip',
      label: 'Đang xử lý (WIP)',
      value: metrics.totalWipWeight,
      pct: metrics.totalWipPct,
      subText: 'Trên các công đoạn',
      icon: Layers,
    },
    {
      id: 'remaining',
      label: 'Còn lại',
      value: metrics.remainingWeight,
      pct: metrics.remainingPct,
      subText: 'Chưa hoàn thành',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="bg-white rounded-md border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {formatNumber(card.value)}
                </span>
                <span className="text-xs text-slate-500">kg</span>
              </div>

              {card.pct !== undefined ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{card.subText}</span>
                    <span className="font-mono font-medium text-slate-700">
                      {formatPct(card.pct)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, card.pct))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  {card.subText}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
