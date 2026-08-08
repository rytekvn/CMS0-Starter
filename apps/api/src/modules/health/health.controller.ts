import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root(): { status: string } {
    return { status: "ok" };
  }

  // Liveness: process con song, khong cham DB.
  @Get("live")
  live(): { status: string } {
    return { status: "ok" };
  }

  // Readiness: co phuc vu duoc request that khong -> phai cham DB.
  @Get("ready")
  async ready(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up" };
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
  }
}
