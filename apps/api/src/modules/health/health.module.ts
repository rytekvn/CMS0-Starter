import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

// PrismaService den tu DatabaseModule (@Global).
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
