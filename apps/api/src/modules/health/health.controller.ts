import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../../infrastructure/database/prisma.service";

// Bo qua rate limit toan cuc: orchestrator/k8s goi /health/live, /health/ready
// lien tuc, khong phai traffic can chan.
@SkipThrottle()
@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health root", description: "Public. Khong cham DB." })
  root(): { status: string } {
    return { status: "ok" };
  }

  // Liveness: process con song, khong cham DB.
  @Get("live")
  @ApiOperation({ summary: "Liveness", description: "Public. Process con song; khong cham DB." })
  live(): { status: string } {
    return { status: "ok" };
  }

  // Readiness: co phuc vu duoc request that khong -> phai cham DB.
  @Get("ready")
  @ApiOperation({ summary: "Readiness", description: "Public. Cham DB; 503 khi DB down." })
  @ApiResponse({ status: 200, description: "`{ status: \"ok\", db: \"up\" }`." })
  @ApiResponse({ status: 503, description: "`{ status: \"error\", db: \"down\" }`." })
  async ready(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up" };
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
  }
}
