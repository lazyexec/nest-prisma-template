import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PrismaTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    operation: (tx: unknown) => Promise<T>,
    timeoutMs = 10_000,
  ): Promise<T> {
    const prismaClient = this.prisma as unknown as {
      $transaction: (
        fn: (tx: unknown) => Promise<T>,
        options?: { timeout?: number },
      ) => Promise<T>;
    };

    return prismaClient.$transaction(operation, { timeout: timeoutMs });
  }
}
