import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// Khong $connect() o onModuleInit: Prisma connect lazy, nho vay app van boot
// duoc khi DB dang down va /health/live tra loi duoc.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
