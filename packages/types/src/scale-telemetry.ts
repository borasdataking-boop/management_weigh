export interface ScaleTelemetryPayload {
  companyId: string;
  hubId: string;
  scaleId: string;
  weight: number;
  unit: 'KG' | 'TON' | 'LB';
  isStable: boolean;
  isOverload: boolean;
  isZero: boolean;
  timestamp: number;
  rawString?: string;
}

export interface HubHeartbeatPayload {
  companyId: string;
  hubId: string;
  status: 'ONLINE' | 'OFFLINE';
  ipAddress?: string;
  firmwareVersion?: string;
  scalesCount?: number;
  timestamp: number;
}
