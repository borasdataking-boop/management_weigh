import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { MqttService } from './mqtt.service';
import { ScaleTelemetryPayload, HubHeartbeatPayload } from '@industrial-scale/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/scales',
})
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private telemetrySub: Subscription;
  private heartbeatSub: Subscription;

  constructor(private readonly mqttService: MqttService) {}

  onModuleInit() {
    // 1. Subscribe to MQTT Telemetry stream and broadcast to rooms
    this.telemetrySub = this.mqttService.telemetry$.subscribe({
      next: (telemetry: ScaleTelemetryPayload) => {
        this.broadcastScaleTelemetry(telemetry);
      },
      error: (err) => this.logger.error(`Telemetry stream error: ${err.message}`),
    });

    // 2. Subscribe to Hub Heartbeat stream and broadcast status
    this.heartbeatSub = this.mqttService.heartbeat$.subscribe({
      next: (heartbeat: HubHeartbeatPayload) => {
        this.broadcastHubHeartbeat(heartbeat);
      },
      error: (err) => this.logger.error(`Heartbeat stream error: ${err.message}`),
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSockets: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a specific Tenant Room to listen for company updates
   */
  @SubscribeMessage('join_tenant')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string },
  ) {
    const room = `tenant_${data.companyId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room: ${room}`);
    return { event: 'joined_tenant', room };
  }

  /**
   * Client joins a specific Scale Room for real-time live weighing gauge updates (2-5Hz)
   */
  @SubscribeMessage('join_scale')
  handleJoinScale(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { scaleId: string },
  ) {
    const room = `scale_${data.scaleId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room: ${room}`);
    return { event: 'joined_scale', room };
  }

  @SubscribeMessage('leave_scale')
  handleLeaveScale(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { scaleId: string },
  ) {
    const room = `scale_${data.scaleId}`;
    client.leave(room);
    return { event: 'left_scale', room };
  }

  /**
   * Broadcast live telemetry data to both the specific scale room and the tenant room
   */
  private broadcastScaleTelemetry(telemetry: ScaleTelemetryPayload) {
    if (!this.server) return;

    // Emitted to the specific scale live gauge room
    const scaleRoom = `scale_${telemetry.scaleId}`;
    this.server.to(scaleRoom).emit('scale_telemetry', telemetry);

    // Emitted to tenant overview room for dashboard summary widgets
    const tenantRoom = `tenant_${telemetry.companyId}`;
    this.server.to(tenantRoom).emit('tenant_scale_update', {
      scaleId: telemetry.scaleId,
      weight: telemetry.weight,
      isStable: telemetry.isStable,
      timestamp: telemetry.timestamp,
    });
  }

  /**
   * Broadcast hub heartbeat to the tenant room
   */
  private broadcastHubHeartbeat(heartbeat: HubHeartbeatPayload) {
    if (!this.server) return;

    const tenantRoom = `tenant_${heartbeat.companyId}`;
    this.server.to(tenantRoom).emit('hub_heartbeat', heartbeat);
  }

  onModuleDestroy() {
    if (this.telemetrySub) this.telemetrySub.unsubscribe();
    if (this.heartbeatSub) this.heartbeatSub.unsubscribe();
  }
}
