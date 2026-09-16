import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { prisma } from './client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = prisma;

  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }
}
