'use client';

import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { WorkflowDefinition } from '../types/batch-flow';

interface WorkflowSelectorProps {
  workflows: WorkflowDefinition[];
  activeWorkflow: WorkflowDefinition | null;
  onSelectWorkflow: (workflowId: string) => Promise<boolean>;
  onOpenCreateModal: () => void;
  onDeleteWorkflow?: (workflowId: string) => Promise<boolean>;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  activeWorkflow,
  onSelectWorkflow,
  onOpenCreateModal,
  onDeleteWorkflow,
}) => {
  const currentWfId = activeWorkflow?.id || workflows[0]?.id || 'WF_DEFAULT';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs">
        <Layers className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-500 font-medium">Quy trình:</span>
        <select
          value={currentWfId}
          onChange={(e) => onSelectWorkflow(e.target.value)}
          className="bg-transparent font-semibold text-slate-900 cursor-pointer focus:outline-none"
        >
          {workflows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.processCount || 0} công đoạn){w.isDefault ? ' [Chuẩn]' : ''}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onOpenCreateModal}
        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 rounded transition-colors"
        title="Tự định nghĩa quy trình sản xuất mới hoặc nhân bản từ quy trình có sẵn"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Tạo quy trình mới</span>
      </button>

      {activeWorkflow && !activeWorkflow.isDefault && activeWorkflow.id !== 'WF_DEFAULT' && onDeleteWorkflow && (
        <button
          type="button"
          onClick={async () => {
            if (
              window.confirm(
                `Xác nhận xóa quy trình "${activeWorkflow.name}"? Lô hiện tại sẽ được chuyển về quy trình mặc định.`,
              )
            ) {
              await onDeleteWorkflow(activeWorkflow.id);
            }
          }}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
          title="Xóa quy trình tùy chỉnh này"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
