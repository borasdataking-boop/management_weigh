'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Copy, FilePlus2 } from 'lucide-react';
import { WorkflowDefinition, CreateWorkflowDto } from '../types/batch-flow';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflows: WorkflowDefinition[];
  onCreateWorkflow: (dto: CreateWorkflowDto) => Promise<WorkflowDefinition | null>;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflows,
  onCreateWorkflow,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'BLANK' | 'CLONE'>('BLANK');
  const [cloneFromId, setCloneFromId] = useState<string>(workflows[0]?.id || 'WF_DEFAULT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setDescription('');
      setMode('BLANK');
      setCloneFromId(workflows[0]?.id || 'WF_DEFAULT');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, workflows]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên quy trình sản xuất.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const dto: CreateWorkflowDto = {
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      cloneFromWorkflowId: mode === 'CLONE' ? cloneFromId : undefined,
    };

    const result = await onCreateWorkflow(dto);
    setIsSubmitting(false);

    if (result) {
      onClose();
    } else {
      setErrorMsg('Không thể tạo quy trình. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Tạo quy trình sản xuất mới
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Tên quy trình */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên quy trình sản xuất <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Quy trình Tôm Hấp IQF, Quy trình Tôm Chiên Torpedo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Mã quy trình & Mô tả */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mã quy trình (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: WF_COOKED_01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                placeholder="VD: Dành cho chuyền hấp công nghiệp"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Lựa chọn phương thức tạo */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Phương thức khởi tạo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  mode === 'BLANK'
                    ? 'bg-white border-slate-900 ring-1 ring-slate-900 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="wf_mode"
                  checked={mode === 'BLANK'}
                  onChange={() => setMode('BLANK')}
                  className="mt-0.5 text-slate-900"
                />
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tự định nghĩa từ đầu</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bắt đầu với 0 công đoạn, tự do thêm node và trạm cân theo ý muốn.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  mode === 'CLONE'
                    ? 'bg-white border-slate-900 ring-1 ring-slate-900 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="wf_mode"
                  checked={mode === 'CLONE'}
                  onChange={() => setMode('CLONE')}
                  className="mt-0.5 text-slate-900"
                />
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Nhân bản quy trình cũ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sao chép toàn bộ các bước từ quy trình có sẵn để chỉnh sửa tiếp.
                  </p>
                </div>
              </label>
            </div>

            {mode === 'CLONE' && (
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Chọn quy trình mẫu để sao chép:
                </label>
                <select
                  value={cloneFromId}
                  onChange={(e) => setCloneFromId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.processCount || 0} bước)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo quy trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
