import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global: PrismaService duoc dung o nhieu module (health, products) va ca trong
// JwtAuthGuard - khai bao 1 lan thay vi import lai o tung module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
