import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { metricsRegistry } from "../../common/metrics";

// KHONG co JwtAuthGuard: scraper (Prometheus, agent cua SaaS) khong cam token.
// Day la thong le chuan — /metrics chi mo trong mang noi bo, khong publish ra
// internet; chan o tang ingress/firewall, khong phai o tang app. Xem ADR-0004.
//
// @SkipThrottle giong /health*: scraper goi dinh ky (15-60s), khong phai traffic
// can chan, va bi 429 se lam thung du lieu do.
@SkipThrottle()
@Controller("metrics")
@ApiTags("metrics")
export class MetricsController {
  @Get()
  @Header("Content-Type", metricsRegistry.contentType)
  @ApiOperation({
    summary: "Prometheus metrics",
    description: "Public trong mang noi bo. Text format cua Prometheus, khong phai JSON.",
  })
  metrics(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
