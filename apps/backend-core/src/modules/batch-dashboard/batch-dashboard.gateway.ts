import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BatchDashboardService } from './batch-dashboard.service';
import { BatchKPIResponse, LiveWeighEvent } from './batch-dashboard.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/batch-flow',
})
export class BatchDashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BatchDashboardGateway.name);

  constructor(private readonly dashboardService: BatchDashboardService) {}

  onModuleInit() {
    // Hook up real-time stream broadcast listener from service
    this.dashboardService.setBroadcastListener(
      (data: BatchKPIResponse, event: LiveWeighEvent) => {
        if (!this.server) return;
        const room = `batch:${data.batch.id}`;
        this.server.to(room).emit('batch_metrics_stream', {
          data,
          event,
        });
      },
    );

    // Hook up snapshot broadcaster when process or station catalog changes
    this.dashboardService.setSnapshotBroadcaster(
      (batchId: string, data: BatchKPIResponse) => {
        if (!this.server) return;
        const room = `batch:${batchId}`;
        this.server.to(room).emit('batch_snapshot', data);
      },
    );
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to /batch-flow: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from /batch-flow: ${client.id}`);
  }

  @SubscribeMessage('join_batch')
  handleJoinBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { batchId: string },
  ) {
    const room = `batch:${payload.batchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);

    // Send immediate snapshot of current batch metrics
    const currentSummary = this.dashboardService.getBatchSummary(
      payload.batchId,
    );
    client.emit('batch_snapshot', currentSummary);

    return { event: 'joined_batch', room };
  }

  @SubscribeMessage('leave_batch')
  handleLeaveBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { batchId: string },
  ) {
    const room = `batch:${payload.batchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left_batch', room };
  }
}
