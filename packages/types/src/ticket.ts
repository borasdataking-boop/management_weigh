export interface CreateTicketDto {
  transactionUuid: string; // Idempotency key from Hub
  scaleId: string;
  vehiclePlate: string;
  driverName?: string;
  customerName?: string;
  productType?: string;
  grossWeight: number;
  tareWeight: number;
  netWeight?: number;
  unit?: 'KG' | 'TON' | 'LB';
  capturedImageUrls?: string[];
  syncedFromOffline?: boolean;
  weighedAt?: string;
}

export interface TicketResponseDto {
  id: string;
  companyId: string;
  scaleId: string;
  transactionUuid: string;
  ticketNumber: string;
  vehiclePlate: string;
  driverName?: string | null;
  customerName?: string | null;
  productType?: string | null;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  unit: string;
  status: string;
  capturedImageUrls: string[];
  syncedFromOffline: boolean;
  weighedAt: Date;
  createdAt: Date;
}
