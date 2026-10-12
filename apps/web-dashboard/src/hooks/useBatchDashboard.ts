'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Batch, BatchKPIResponse, LiveWeighEvent } from '../types/batch-flow';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useBatchDashboard(initialBatchId: string = 'BATCH_01') {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [metrics, setMetrics] = useState<BatchKPIResponse | null>(null);
  const [recentEvent, setRecentEvent] = useState<LiveWeighEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch batches list
  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batches`);
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  }, []);

  // 2. Fetch specific batch summary snapshot
  const fetchSummary = useCallback(async (batchId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/summary`);
      if (res.ok) {
        const data: BatchKPIResponse = await res.json();
        setMetrics(data);
        setIsSimulating(data.isSimulating);
      }
    } catch (err) {
      console.error(`Failed to fetch summary for batch ${batchId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Connect to Socket.IO and listen for live ticks
  useEffect(() => {
    fetchBatches();
    fetchSummary(selectedBatchId);

    const socket: Socket = io(`${API_BASE}/batch-flow`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_batch', { batchId: selectedBatchId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('batch_snapshot', (data: BatchKPIResponse) => {
      setMetrics(data);
      setIsSimulating(data.isSimulating);
    });

    socket.on(
      'batch_metrics_stream',
      (payload: { data: BatchKPIResponse; event: LiveWeighEvent }) => {
        setMetrics(payload.data);
        setIsSimulating(payload.data.isSimulating);
        setRecentEvent(payload.event);
      },
    );

    return () => {
      if (socket) {
        socket.emit('leave_batch', { batchId: selectedBatchId });
        socket.disconnect();
      }
    };
  }, [selectedBatchId, fetchBatches, fetchSummary]);

  // 4. Change selected batch
  const selectBatch = (batchId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_batch', { batchId: selectedBatchId });
      socketRef.current.emit('join_batch', { batchId });
    }
    setSelectedBatchId(batchId);
    fetchSummary(batchId);
  };

  // 5. Toggle Live Simulator
  const toggleSimulator = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/batches/${selectedBatchId}/simulate-toggle`,
        { method: 'POST' },
      );
      if (res.ok) {
        const data = await res.json();
        setIsSimulating(data.isSimulating);
      }
    } catch (err) {
      console.error('Failed to toggle simulator:', err);
    }
  };

  // 6. Trigger one-off manual tick
  const triggerManualTick = async () => {
    try {
      await fetch(
        `${API_BASE}/api/batches/${selectedBatchId}/simulate-tick`,
        { method: 'POST' },
      );
    } catch (err) {
      console.error('Failed to trigger manual tick:', err);
    }
  };

  return {
    selectedBatchId,
    batches,
    metrics,
    recentEvent,
    isLoading,
    isSimulating,
    isConnected,
    selectBatch,
    toggleSimulator,
    triggerManualTick,
    refreshSummary: () => fetchSummary(selectedBatchId),
  };
}
