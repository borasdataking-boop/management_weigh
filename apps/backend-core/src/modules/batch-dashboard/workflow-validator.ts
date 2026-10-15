export interface WorkflowNodeForValidation {
  processId: string;
  processName?: string;
  nextProcessIds?: string[];
  isFinalOutput?: boolean;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  message?: string;
  startProcessId?: string;
  finalProcessIds: string[];
  examplePath?: string[];
  examplePathString?: string;
}

/**
 * Kiểm tra tính hợp lệ của quy trình sản xuất dạng đồ thị:
 * BẮT BUỘC phải tồn tại ít nhất 1 đường đi hoàn chỉnh từ bước đầu tiên (Step 1)
 * tới một bước kết thúc / thành phẩm (bước có vào nhưng không có ra).
 */
export function validateWorkflowPath(
  processes: WorkflowNodeForValidation[],
): WorkflowValidationResult {
  if (!processes || processes.length === 0) {
    return {
      isValid: false,
      message: 'Quy trình chưa có công đoạn nào.',
      finalProcessIds: [],
    };
  }

  const startProcess = processes[0];
  const startProcessId = startProcess.processId;

  // Nếu chỉ có 1 công đoạn duy nhất trong quy trình
  if (processes.length === 1) {
    const isSink =
      !startProcess.nextProcessIds ||
      startProcess.nextProcessIds.length === 0 ||
      Boolean(startProcess.isFinalOutput);

    if (isSink) {
      return {
        isValid: true,
        startProcessId,
        finalProcessIds: [startProcessId],
        examplePath: [startProcessId],
        examplePathString: `[${startProcessId}] ${startProcess.processName || ''}`,
      };
    }
    return {
      isValid: false,
      message: `Công đoạn duy nhất [${startProcessId}] có khai báo chuyển tiếp nhưng không có bước tiếp theo hợp lệ.`,
      startProcessId,
      finalProcessIds: [],
    };
  }

  // Bước final (bước có vào nhưng không có ra):
  // 1. Không có các bước tiếp theo (nextProcessIds rỗng hoặc không khai báo)
  // 2. Hoặc được đánh dấu isFinalOutput = true
  const sinkProcesses = processes.slice(1).filter((p) => {
    const hasNoOutgoing = !p.nextProcessIds || p.nextProcessIds.length === 0;
    return hasNoOutgoing || Boolean(p.isFinalOutput);
  });

  const finalProcessIds = sinkProcesses.map((p) => p.processId);

  if (finalProcessIds.length === 0) {
    return {
      isValid: false,
      message:
        'Quy trình chưa có công đoạn kết thúc (bước thành phẩm có vào nhưng không có ra). Vui lòng cấu hình ít nhất 1 công đoạn không có bước tiếp theo hoặc đánh dấu Thành phẩm.',
      startProcessId,
      finalProcessIds: [],
    };
  }

  // Xây dựng danh sách kề (Adjacency list)
  const adjMap = new Map<string, string[]>();
  const processMap = new Map<string, WorkflowNodeForValidation>();
  for (const p of processes) {
    adjMap.set(p.processId, p.nextProcessIds || []);
    processMap.set(p.processId, p);
  }

  // BFS tìm đường đi từ bước 1 tới bất kỳ bước final nào
  const sinkSet = new Set(finalProcessIds);
  const queue: { currentId: string; path: string[] }[] = [
    { currentId: startProcessId, path: [startProcessId] },
  ];
  const visited = new Set<string>([startProcessId]);

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;
    const neighbors = adjMap.get(currentId) || [];

    for (const nextId of neighbors) {
      if (sinkSet.has(nextId)) {
        const fullPath = [...path, nextId];
        const pathStr = fullPath
          .map((id) => {
            const node = processMap.get(id);
            return node?.processName ? `[${id}] ${node.processName}` : `[${id}]`;
          })
          .join(' ➔ ');

        return {
          isValid: true,
          startProcessId,
          finalProcessIds,
          examplePath: fullPath,
          examplePathString: pathStr,
        };
      }

      if (!visited.has(nextId) && processMap.has(nextId)) {
        visited.add(nextId);
        queue.push({
          currentId: nextId,
          path: [...path, nextId],
        });
      }
    }
  }

  const startName = startProcess.processName || startProcessId;
  return {
    isValid: false,
    message: `Không tìm thấy đường đi từ công đoạn đầu tiên [${startProcessId} - ${startName}] tới bất kỳ công đoạn thành phẩm cuối nào (bước có vào nhưng không có ra: ${finalProcessIds.map((id) => `[${id}]`).join(', ')}).`,
    startProcessId,
    finalProcessIds,
  };
}
