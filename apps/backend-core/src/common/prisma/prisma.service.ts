import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@industrial-scale/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout 2000ms')), 2000),
        ),
      ]);
      this.isConnected = true;
      this.logger.log('✅ Connected successfully to PostgreSQL via Prisma.');
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Could not connect to PostgreSQL (${err.message}). Application running with in-memory fallback.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Prisma disconnected.');
    }
  }
}
