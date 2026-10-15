'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  Scale,
  Package,
  ArrowRight,
} from 'lucide-react';
import {
  ProcessFlowItem,
  CreateProcessDto,
  ProcessInsertPosition,
  ProductOutputItem,
  StationItem,
  validateWorkflowPath,
} from '../types/batch-flow';

interface ProcessNodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  processes: ProcessFlowItem[];
  initialTab?: 'LIST' | 'ADD';
  onCreateProcess?: (dto: CreateProcessDto) => Promise<boolean>;
  onUpdateProcess?: (
    processId: string,
    dto: { processName?: string; productType?: string; isFinalOutput?: boolean; products?: ProductOutputItem[] },
  ) => Promise<boolean>;
  onDeleteProcess?: (processId: string) => Promise<boolean>;
  onReorderProcesses?: (processIds: string[]) => Promise<boolean>;
  onAddStation?: (
    processId: string,
    dto: { stationName: string; stationId?: string; indicatorModel?: string },
  ) => Promise<boolean>;
  onDeleteStation?: (processId: string, stationId: string) => Promise<boolean>;
  onAddProduct?: (
    processId: string,
    dto: { productName: string; productId?: string },
  ) => Promise<boolean>;
  onDeleteProduct?: (processId: string, productId: string) => Promise<boolean>;
  onUpdateProcessMappings?: (
    processId: string,
    nextProcessIds: string[],
  ) => Promise<boolean>;
  onSaveBulkProcesses?: (processes: ProcessFlowItem[]) => Promise<boolean>;
}

export const ProcessNodeManagerModal: React.FC<ProcessNodeManagerModalProps> = ({
  isOpen,
  onClose,
  processes,
  initialTab = 'LIST',
  onCreateProcess,
  onUpdateProcess,
  onDeleteProcess,
  onReorderProcesses,
  onAddStation,
  onDeleteStation,
  onAddProduct,
  onDeleteProduct,
  onUpdateProcessMappings,
  onSaveBulkProcesses,
}) => {
  // Bản nháp danh sách công đoạn và cờ đánh dấu có thay đổi chưa lưu
  const [draftProcesses, setDraftProcesses] = useState<ProcessFlowItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>('LIST');

  // Form Thêm bước mới
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessId, setNewProcessId] = useState('');
  const [newProductsList, setNewProductsList] = useState<string[]>([]);
  const [newProductInput, setNewProductInput] = useState('');
  const [newIsFinalOutput, setNewIsFinalOutput] = useState(false);
  const [newPosition, setNewPosition] = useState<ProcessInsertPosition>('END');
  const [newTargetProcessId, setNewTargetProcessId] = useState('');
  const [newStationName, setNewStationName] = useState('');
  const [newStationId, setNewStationId] = useState('');
  const [newNextProcessIds, setNewNextProcessIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editing state cho 1 process
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsFinal, setEditIsFinal] = useState(false);

  // Adding station state cho 1 process
  const [addingStationProcessId, setAddingStationProcessId] = useState<string | null>(null);
  const [stationNameInput, setStationNameInput] = useState('');
  const [stationIdInput, setStationIdInput] = useState('');

  // Adding product state cho 1 process
  const [addingProductProcessId, setAddingProductProcessId] = useState<string | null>(null);
  const [productNameInput, setProductNameInput] = useState('');

  // Editing process mappings state (Luồng chuyển tiếp đa nhánh)
  const [editingMappingsProcessId, setEditingMappingsProcessId] = useState<string | null>(null);
  const [selectedNextProcessIds, setSelectedNextProcessIds] = useState<string[]>([]);

  // Kiểm tra tính hợp lệ của luồng quy trình (Đường đi từ bước 1 tới bước final) trên bản nháp
  const workflowPathCheck = useMemo(
    () => validateWorkflowPath(draftProcesses),
    [draftProcesses],
  );

  // Đồng bộ draftProcesses từ processes khi modal mở lên
  useEffect(() => {
    if (isOpen) {
      setDraftProcesses(JSON.parse(JSON.stringify(processes)));
      setIsDirty(false);
      setActiveTab(initialTab);
      setFeedbackMsg(null);
      setEditingProcessId(null);
      setAddingStationProcessId(null);
      setAddingProductProcessId(null);
      setEditingMappingsProcessId(null);
      setSelectedNextProcessIds([]);
      setNewNextProcessIds([]);
      if (processes.length > 0) {
        setNewTargetProcessId((prev) => prev || processes[0]?.processId || '');
      }
    }
  }, [isOpen, initialTab]);

  // Giữ đồng bộ từ backend khi không có thay đổi chưa lưu
  useEffect(() => {
    if (isOpen && !isDirty) {
      setDraftProcesses(JSON.parse(JSON.stringify(processes)));
    }
  }, [processes, isOpen, isDirty]);

  // Xử lý Hủy bỏ thay đổi hoặc Đóng modal
  const handleDiscardOrClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Bạn có thay đổi chưa lưu trong quy trình. Bạn có chắc chắn muốn hủy bỏ mọi thay đổi và đóng cửa sổ?',
      );
      if (!confirmed) return;
    }
    setDraftProcesses(JSON.parse(JSON.stringify(processes)));
    setIsDirty(false);
    onClose();
  };

  // Handle ESC key to close/discard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDiscardOrClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, processes, onClose]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  if (!isOpen) return null;

  const handleAddProductTag = () => {
    const trimmed = newProductInput.trim();
    if (!trimmed) return;
    if (!newProductsList.includes(trimmed)) {
      setNewProductsList([...newProductsList, trimmed]);
    }
    setNewProductInput('');
  };

  const handleRemoveProductTag = (idx: number) => {
    setNewProductsList(newProductsList.filter((_, i) => i !== idx));
  };

  // Thêm công đoạn mới vào bản nháp quy trình
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;

    const targetId =
      newPosition === 'BEFORE' || newPosition === 'AFTER'
        ? newTargetProcessId || draftProcesses[0]?.processId
        : undefined;

    const genId =
      newProcessId.trim() ||
      `CD${String(draftProcesses.length + 1).padStart(3, '0')}`;

    const newStations: StationItem[] = newStationName.trim()
      ? [
          {
            stationId: newStationId.trim() || `ST_${genId}_01`,
            stationName: newStationName.trim(),
            indicatorModel: 'DINI_ARGEO',
            isActive: true,
          },
        ]
      : [];

    const newProducts: ProductOutputItem[] = newProductsList.map((pName, i) => ({
      productId: `PRD_${genId}_${i + 1}`,
      productName: pName,
    }));

    const newItem: ProcessFlowItem = {
      processId: genId,
      processName: newProcessName.trim(),
      stationId: newStations[0]?.stationId || '',
      stationName: newStations[0]?.stationName || '',
      indicatorModel: 'DINI_ARGEO',
      stations: newStations,
      productType: newProductsList.join(', '),
      products: newProducts,
      isFinalOutput: newIsFinalOutput,
      nextProcessIds: newNextProcessIds,
      weightIn: 1000,
      weightOut: 950,
      wipWeight: 50,
      yieldRatePct: 95.0,
      status: 'NORMAL',
    };

    const updated = [...draftProcesses];
    if (newPosition === 'START') {
      updated.unshift(newItem);
    } else if (newPosition === 'BEFORE' && targetId) {
      const idx = updated.findIndex((p) => p.processId === targetId);
      if (idx !== -1) updated.splice(idx, 0, newItem);
      else updated.push(newItem);
    } else if (newPosition === 'AFTER' && targetId) {
      const idx = updated.findIndex((p) => p.processId === targetId);
      if (idx !== -1) updated.splice(idx + 1, 0, newItem);
      else updated.push(newItem);
    } else {
      updated.push(newItem);
    }

    setDraftProcesses(updated);
    setIsDirty(true);

    setNewProcessName('');
    setNewProcessId('');
    setNewProductsList([]);
    setNewProductInput('');
    setNewIsFinalOutput(false);
    setNewStationName('');
    setNewStationId('');
    setNewNextProcessIds([]);
    showFeedback('Đã thêm công đoạn mới vào bản nháp quy trình');
    setActiveTab('LIST');
  };

  const handleStartEdit = (p: ProcessFlowItem) => {
    setEditingProcessId(p.processId);
    setEditName(p.processName);
    setEditIsFinal(p.isFinalOutput);
  };

  const handleSaveEdit = (processId: string) => {
    if (!editName.trim()) return;
    setDraftProcesses((prev) =>
      prev.map((p) =>
        p.processId === processId
          ? { ...p, processName: editName.trim(), isFinalOutput: editIsFinal }
          : p,
      ),
    );
    setIsDirty(true);
    setEditingProcessId(null);
    showFeedback('Đã cập nhật thông tin công đoạn (chưa lưu)');
  };

  const handleStartEditMappings = (p: ProcessFlowItem) => {
    setEditingMappingsProcessId(p.processId);
    setSelectedNextProcessIds(p.nextProcessIds || []);
  };

  const handleToggleNextProcess = (targetId: string) => {
    setSelectedNextProcessIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId],
    );
  };

  // Cập nhật luồng chuyển tiếp trong bản nháp
  const handleSaveMappings = (processId: string) => {
    setDraftProcesses((prev) =>
      prev.map((item) =>
        item.processId === processId
          ? { ...item, nextProcessIds: selectedNextProcessIds }
          : item,
      ),
    );
    setIsDirty(true);
    setEditingMappingsProcessId(null);
    showFeedback('Đã cập nhật luồng chuyển tiếp trong bản nháp');
  };

  // Đổi thứ tự công đoạn lên / xuống trong bản nháp
  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftProcesses.length) return;

    const copy = [...draftProcesses];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setDraftProcesses(copy);
    setIsDirty(true);
    showFeedback('Đã đổi thứ tự công đoạn (chưa lưu)');
  };

  // Chuyển nhanh tới vị trí #x
  const handleMoveTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= draftProcesses.length) return;
    const copy = [...draftProcesses];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    setDraftProcesses(copy);
    setIsDirty(true);
    showFeedback(`Đã chuyển công đoạn tới vị trí #${toIndex + 1} (chưa lưu)`);
  };

  // Xóa công đoạn khỏi bản nháp
  const handleDeleteProcessLocal = (processId: string, processName: string) => {
    if (window.confirm(`Xác nhận xóa công đoạn "${processName}" khỏi quy trình?`)) {
      setDraftProcesses((prev) =>
        prev
          .filter((p) => p.processId !== processId)
          .map((p) => ({
            ...p,
            nextProcessIds: (p.nextProcessIds || []).filter((id) => id !== processId),
          })),
      );
      setIsDirty(true);
      showFeedback(`Đã xóa công đoạn ${processName} khỏi bản nháp`);
    }
  };

  // Thêm trạm cân mới vào bản nháp
  const handleAddStationSubmit = (processId: string) => {
    if (!stationNameInput.trim()) return;
    const newStation: StationItem = {
      stationId:
        stationIdInput.trim() ||
        `ST_${processId}_${Date.now().toString().slice(-4)}`,
      stationName: stationNameInput.trim(),
      indicatorModel: 'DINI_ARGEO',
      isActive: true,
    };
    setDraftProcesses((prev) =>
      prev.map((p) => {
        if (p.processId !== processId) return p;
        const currentStations = p.stations && p.stations.length > 0 ? p.stations : [];
        const nextStations = [...currentStations, newStation];
        return {
          ...p,
          stations: nextStations,
          stationId: p.stationId || newStation.stationId,
          stationName: p.stationName || newStation.stationName,
        };
      }),
    );
    setIsDirty(true);
    setStationNameInput('');
    setStationIdInput('');
    setAddingStationProcessId(null);
    showFeedback('Đã gán trạm cân mới vào công đoạn (chưa lưu)');
  };

  // Gỡ trạm cân khỏi bản nháp
  const handleDeleteStationLocal = (processId: string, stationId: string, stationName: string) => {
    if (window.confirm(`Gỡ trạm cân "${stationName}" khỏi công đoạn?`)) {
      setDraftProcesses((prev) =>
        prev.map((p) => {
          if (p.processId !== processId) return p;
          const currentStations = p.stations || [];
          const nextStations = currentStations.filter((s) => s.stationId !== stationId);
          const first = nextStations[0];
          return {
            ...p,
            stations: nextStations,
            stationId: first ? first.stationId : '',
            stationName: first ? first.stationName : '',
          };
        }),
      );
      setIsDirty(true);
      showFeedback(`Đã gỡ trạm cân ${stationName} (chưa lưu)`);
    }
  };

  // Thêm sản phẩm đầu ra vào bản nháp
  const handleAddProductSubmit = (processId: string) => {
    if (!productNameInput.trim()) return;
    const newProduct: ProductOutputItem = {
      productId: `PRD_${processId}_${Date.now().toString().slice(-4)}`,
      productName: productNameInput.trim(),
    };
    setDraftProcesses((prev) =>
      prev.map((p) => {
        if (p.processId !== processId) return p;
        const currentPrds = p.products || [];
        const nextPrds = [...currentPrds, newProduct];
        return {
          ...p,
          products: nextPrds,
          productType: nextPrds.map((x) => x.productName).join(', '),
        };
      }),
    );
    setIsDirty(true);
    setProductNameInput('');
    setAddingProductProcessId(null);
    showFeedback('Đã thêm sản phẩm đầu ra (chưa lưu)');
  };

  // Gỡ sản phẩm đầu ra khỏi bản nháp
  const handleDeleteProductLocal = (processId: string, productId: string, productName: string) => {
    if (window.confirm(`Xóa sản phẩm "${productName}" khỏi công đoạn?`)) {
      setDraftProcesses((prev) =>
        prev.map((p) => {
          if (p.processId !== processId) return p;
          const currentPrds = p.products || [];
          const nextPrds = currentPrds.filter((x) => x.productId !== productId);
          return {
            ...p,
            products: nextPrds,
            productType: nextPrds.map((x) => x.productName).join(', '),
          };
        }),
      );
      setIsDirty(true);
      showFeedback(`Đã gỡ sản phẩm ${productName} (chưa lưu)`);
    }
  };

  // Lưu tất cả thay đổi bản nháp lên hệ thống
  const handleSaveAllChanges = async () => {
    if (!workflowPathCheck.isValid) {
      showFeedback(
        workflowPathCheck.message ||
          'Quy trình phải có ít nhất 1 đường đi hoàn chỉnh từ bước đầu tiên đến bước thành phẩm.',
        'error',
      );
      return;
    }

    if (!onSaveBulkProcesses) {
      showFeedback('Chức năng lưu thay đổi quy trình chưa sẵn sàng', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveBulkProcesses(draftProcesses);
      setIsDirty(false);
      showFeedback('Đã lưu tất cả thay đổi quy trình thành công!');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      showFeedback(err?.message || 'Không thể lưu thay đổi quy trình. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDiscardOrClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-opacity"
    >
      <div className="bg-white rounded-md border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Cấu hình quy trình & trạm cân
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy biến các bước quy trình, danh sách sản phẩm đầu ra và trạm cân trực thuộc
            </p>
          </div>
          <button
            type="button"
            onClick={handleDiscardOrClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            title="Đóng / Hủy bỏ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMsg && (
          <div
            className={`px-5 py-2 text-xs font-medium flex items-center gap-1.5 border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-slate-700" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tabs Điều Hướng */}
        <div className="px-5 pt-2.5 pb-2 border-b border-slate-100 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'LIST'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Danh sách công đoạn ({draftProcesses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ADD')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'ADD'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm công đoạn mới</span>
          </button>
        </div>

        {/* Thanh trạng thái kiểm tra luồng quy trình (Validation: Đường đi từ bước 1 tới bước final) */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            {workflowPathCheck.isValid ? (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[11px] shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Luồng hợp lệ</span>
                </span>
                <span className="text-[11px] text-slate-600 truncate">
                  Đường đi từ bước 1 tới thành phẩm:{' '}
                  <strong className="font-mono text-slate-800">
                    {workflowPathCheck.examplePathString}
                  </strong>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-[11px] shrink-0">
                  <span>⚠️ Cần hoàn thiện luồng</span>
                </span>
                <span
                  className="text-[11px] text-rose-900 truncate"
                  title={workflowPathCheck.message}
                >
                  {workflowPathCheck.message}
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-500 shrink-0 font-mono">
            {workflowPathCheck.finalProcessIds.length} bước thành phẩm (không có ra)
          </span>
        </div>

        {/* Body Nội Dung */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'ADD' ? (
            /* FORM THÊM BƯỚC MỚI */
            <form onSubmit={handleCreate} className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên công đoạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phân cỡ & Phân loại, Cấp đông..."
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã công đoạn
                  </label>
                  <input
                    type="text"
                    placeholder="Tự động sinh nếu để trống"
                    value={newProcessId}
                    onChange={(e) => setNewProcessId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Vị trí chèn trong quy trình */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Vị trí chèn trong quy trình:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="START"
                      checked={newPosition === 'START'}
                      onChange={() => setNewPosition('START')}
                    />
                    <span>Đầu quy trình</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="END"
                      checked={newPosition === 'END'}
                      onChange={() => setNewPosition('END')}
                    />
                    <span>Cuối quy trình</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="AFTER"
                      checked={newPosition === 'AFTER'}
                      onChange={() => {
                        setNewPosition('AFTER');
                        if (!newTargetProcessId && draftProcesses.length > 0) {
                          setNewTargetProcessId(draftProcesses[0].processId);
                        }
                      }}
                    />
                    <span>Sau bước...</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="BEFORE"
                      checked={newPosition === 'BEFORE'}
                      onChange={() => {
                        setNewPosition('BEFORE');
                        if (!newTargetProcessId && draftProcesses.length > 0) {
                          setNewTargetProcessId(draftProcesses[0].processId);
                        }
                      }}
                    />
                    <span>Trước bước...</span>
                  </label>
                </div>

                {(newPosition === 'AFTER' || newPosition === 'BEFORE') && draftProcesses.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Bước tham chiếu:
                    </label>
                    <select
                      value={newTargetProcessId || draftProcesses[0]?.processId}
                      onChange={(e) => setNewTargetProcessId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      {draftProcesses.map((p, idx) => (
                        <option key={p.processId} value={p.processId}>
                          Bước {idx + 1}: {p.processId} - {p.processName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Thêm nhiều sản phẩm output cho node */}
              <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Sản phẩm đầu ra (Node có thể cho ra nhiều sản phẩm/quy cách):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {newProductsList.length} sản phẩm đã thêm
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: Tôm 10-15, Tôm 15-20, Tôm dạt..."
                    value={newProductInput}
                    onChange={(e) => setNewProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProductTag();
                      }
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddProductTag}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                {/* Danh sách các sản phẩm output đã thêm */}
                {newProductsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {newProductsList.map((prod, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        <Package className="w-3 h-3 text-slate-500" />
                        <span>{prod}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductTag(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Xóa sản phẩm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Đánh dấu công đoạn thành phẩm */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFinal"
                  checked={newIsFinalOutput}
                  onChange={(e) => setNewIsFinalOutput(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isFinal" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Công đoạn thành phẩm (Tính vào khối lượng hoàn thành)
                </label>
              </div>

              {/* Chuyển tiếp đến các công đoạn kế tiếp (Luồng phân nhánh) */}
              <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Chuyển tiếp đến công đoạn kế tiếp (Luồng phân nhánh):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {newNextProcessIds.length} bước được chọn
                  </span>
                </div>
                {draftProcesses.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Chưa có công đoạn nào khác để liên kết.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded bg-slate-50">
                    {draftProcesses.map((target) => {
                      const isChecked = newNextProcessIds.includes(target.processId);
                      return (
                        <label
                          key={target.processId}
                          className={`flex items-center gap-2 p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setNewNextProcessIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== target.processId)
                                  : [...prev, target.processId],
                              );
                            }}
                            className="hidden"
                          />
                          <span
                            className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded ${
                              isChecked
                                ? 'bg-slate-800 text-slate-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {target.processId}
                          </span>
                          <span className="truncate">{target.processName}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trạm cân kèm theo */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="block text-xs font-medium text-slate-700">
                  Gán trạm cân ban đầu (Tùy chọn):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên trạm cân (VD: Trạm cân 01B)"
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Mã trạm cân (Tùy chọn)"
                    value={newStationId}
                    onChange={(e) => setNewStationId(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
                  />
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newProcessName.trim()}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                >
                  Thêm vào bản nháp
                </button>
              </div>
            </form>
          ) : (
            /* DANH SÁCH CÔNG ĐOẠN, SẢN PHẨM & TRẠM CÂN */
            <div className="space-y-3">
              {draftProcesses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded">
                  Quy trình hiện chưa có công đoạn nào. Nhấn tab &quot;Thêm công đoạn mới&quot; để bắt đầu.
                </div>
              ) : (
                draftProcesses.map((p, index) => {
                  const isEditing = editingProcessId === p.processId;
                  const isAddingStation = addingStationProcessId === p.processId;
                  const isAddingProduct = addingProductProcessId === p.processId;
                  const isEditingMappings = editingMappingsProcessId === p.processId;

                  const stationsList =
                    p.stations && p.stations.length > 0
                      ? p.stations
                      : p.stationId && p.stationId !== 'ST_NONE' && p.stationName
                      ? [
                          {
                            stationId: p.stationId,
                            stationName: p.stationName,
                            indicatorModel: p.indicatorModel || 'DINI_ARGEO',
                            isActive: true,
                          },
                        ]
                      : [];

                  const productsList =
                    p.products && p.products.length > 0
                      ? p.products
                      : p.productType
                      ? [{ productId: `${p.processId}_PRD`, productName: p.productType }]
                      : [];

                  return (
                    <div
                      key={p.processId}
                      className="border border-slate-200 rounded bg-white p-3 space-y-3"
                    >
                      {/* Hàng thông tin công đoạn */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        {isEditing ? (
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900"
                              placeholder="Tên công đoạn"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsFinal}
                                  onChange={(e) => setEditIsFinal(e.target.checked)}
                                />
                                <span>Thành phẩm</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(p.processId)}
                                className="px-2.5 py-1 bg-slate-900 text-white text-xs rounded hover:bg-slate-800"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProcessId(null)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium">Vị trí:</span>
                              <select
                                value={index}
                                onChange={(e) => handleMoveTo(index, Number(e.target.value))}
                                className="bg-transparent text-xs font-mono font-bold text-slate-900 cursor-pointer focus:outline-none"
                                title="Đổi vị trí thứ tự công đoạn"
                              >
                                {draftProcesses.map((_, posIdx) => (
                                  <option key={posIdx} value={posIdx}>
                                    #{posIdx + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 font-mono">
                                  [{p.processId}]
                                </span>
                                <span className="text-xs font-medium text-slate-900">
                                  {p.processName}
                                </span>
                                {p.isFinalOutput && (
                                  <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                    Thành phẩm
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Các nút thao tác với công đoạn */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMove(index, 'UP')}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-20"
                              title="Di chuyển lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === draftProcesses.length - 1}
                              onClick={() => handleMove(index, 'DOWN')}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-20"
                              title="Di chuyển xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(p)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Sửa tên công đoạn"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProcessLocal(p.processId, p.processName)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                              title="Xóa công đoạn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* KHỐI 1: SẢN PHẨM OUTPUT CỦA CÔNG ĐOẠN */}
                      <div className="space-y-1.5 p-2 bg-slate-50/70 rounded border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-500" />
                            <span>Sản phẩm đầu ra ({productsList.length}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingProductProcessId(p.processId);
                              setProductNameInput('');
                            }}
                            className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
                          >
                            + Thêm sản phẩm
                          </button>
                        </div>

                        {/* Danh sách sản phẩm chips */}
                        {productsList.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Chưa khai báo sản phẩm đầu ra cho công đoạn này.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {productsList.map((prd) => (
                              <span
                                key={prd.productId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white text-slate-800 border border-slate-200"
                              >
                                <span>{prd.productName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProductLocal(p.processId, prd.productId, prd.productName)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Gỡ sản phẩm"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Form thêm sản phẩm nhanh */}
                        {isAddingProduct && (
                          <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Tên sản phẩm/quy cách (VD: Tôm 10-15, Tôm 15-20...)"
                              value={productNameInput}
                              onChange={(e) => setProductNameInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddProductSubmit(p.processId);
                                }
                              }}
                              className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddProductSubmit(p.processId)}
                              disabled={!productNameInput.trim()}
                              className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                            >
                              Thêm
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingProductProcessId(null)}
                              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>

                      {/* KHỐI 2: CÁC TRẠM CÂN GẮN VÀO CÔNG ĐOẠN */}
                      <div className="space-y-1.5 p-2 bg-slate-50/70 rounded border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-slate-500" />
                            <span>Trạm cân ({stationsList.length}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingStationProcessId(p.processId);
                              setStationNameInput('');
                              setStationIdInput('');
                            }}
                            className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
                          >
                            + Thêm trạm cân
                          </button>
                        </div>

                        {stationsList.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Chưa gán trạm cân cho công đoạn này.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {stationsList.map((st, sIdx) => (
                              <div
                                key={st.stationId || sIdx}
                                className="flex items-center justify-between p-1.5 px-2 bg-white rounded border border-slate-200 text-xs"
                              >
                                <div className="truncate pr-2">
                                  <span className="font-mono text-slate-600 font-semibold mr-1.5">
                                    {st.stationId}
                                  </span>
                                  <span className="text-slate-800 font-medium truncate">
                                    {st.stationName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStationLocal(p.processId, st.stationId, st.stationName)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Gỡ trạm cân"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form thêm trạm cân trực tiếp */}
                        {isAddingStation && (
                          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              placeholder="Tên trạm cân mới (VD: Trạm cân phụ 02)"
                              value={stationNameInput}
                              onChange={(e) => setStationNameInput(e.target.value)}
                              className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900"
                            />
                            <input
                              type="text"
                              placeholder="Mã trạm (Tùy chọn)"
                              value={stationIdInput}
                              onChange={(e) => setStationIdInput(e.target.value)}
                              className="w-full sm:w-32 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-mono"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAddStationSubmit(p.processId)}
                                disabled={!stationNameInput.trim()}
                                className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                              >
                                Thêm
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingStationProcessId(null)}
                                className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* KHỐI 3: LUỒNG CHUYỂN TIẾP (CÁC BƯỚC TIẾP THEO) */}
                      <div className="space-y-1.5 p-2 bg-slate-50/70 rounded border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span>Chuyển tiếp đến ({p.nextProcessIds?.length || 0}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingMappings) {
                                setEditingMappingsProcessId(null);
                              } else {
                                handleStartEditMappings(p);
                              }
                            }}
                            className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
                          >
                            {isEditingMappings ? 'Đóng cấu hình' : '⚙ Cấu hình luồng'}
                          </button>
                        </div>

                        {/* Danh sách các bước tiếp theo dạng chips */}
                        {!isEditingMappings && (
                          <div>
                            {(!p.nextProcessIds || p.nextProcessIds.length === 0) ? (
                              <p className="text-[11px] text-slate-400 italic">
                                {p.isFinalOutput
                                  ? 'Công đoạn thành phẩm cuối (không chuyển tiếp)'
                                  : 'Chưa cấu hình bước tiếp theo (hàng chờ tại chỗ)'}
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {p.nextProcessIds.map((nextId) => {
                                  const target = draftProcesses.find((item) => item.processId === nextId);
                                  return (
                                    <span
                                      key={nextId}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white text-slate-800 border border-slate-300 shadow-sm"
                                      title={target ? `${target.processId} - ${target.processName}` : nextId}
                                    >
                                      <span className="text-slate-400">→</span>
                                      <span className="font-mono font-bold text-slate-900">{nextId}</span>
                                      <span className="text-slate-600 truncate max-w-[140px]">
                                        {target ? target.processName : ''}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Form cấu hình liên kết chuyển tiếp */}
                        {isEditingMappings && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <p className="text-[11px] text-slate-500">
                              Chọn các công đoạn tiếp theo nhận hàng từ bước <strong>[{p.processId}] {p.processName}</strong>:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded bg-white">
                              {draftProcesses
                                .filter((target) => target.processId !== p.processId)
                                .map((target) => {
                                  const isChecked = selectedNextProcessIds.includes(target.processId);
                                  return (
                                    <label
                                      key={target.processId}
                                      className={`flex items-center gap-2 p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                                        isChecked
                                          ? 'bg-slate-900 text-white border-slate-900'
                                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleNextProcess(target.processId)}
                                        className="hidden"
                                      />
                                      <span
                                        className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded ${
                                          isChecked ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {target.processId}
                                      </span>
                                      <span className="truncate">{target.processName}</span>
                                    </label>
                                  );
                                })}
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingMappingsProcessId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveMappings(p.processId)}
                                className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800"
                              >
                                Áp dụng luồng
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">
              Quy trình: {draftProcesses.length} công đoạn
            </span>
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">• Đã đồng bộ</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardOrClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            >
              {isDirty ? 'Hủy bỏ thay đổi' : 'Đóng'}
            </button>
            <button
              type="button"
              disabled={!isDirty || isSubmitting || !workflowPathCheck.isValid}
              onClick={handleSaveAllChanges}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded transition-all shadow-sm ${
                !isDirty || !workflowPathCheck.isValid
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              title={
                !workflowPathCheck.isValid
                  ? 'Quy trình chưa hợp lệ (cần ít nhất một đường đi từ bước 1 tới bước thành phẩm)'
                  : !isDirty
                  ? 'Chưa có thay đổi nào để lưu'
                  : 'Lưu toàn bộ thay đổi quy trình'
              }
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
