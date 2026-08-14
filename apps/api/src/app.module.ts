import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { RedisModule } from "./infrastructure/cache/redis.module";
import { REDIS_URL } from "./infrastructure/cache/redis.service";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FileModule } from "./modules/files/file.module";
import { HealthModule } from "./modules/health/health.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { NotificationModule } from "./modules/notifications/notification.module";
import { ProductModule } from "./modules/products/product.module";
import { RoleModule } from "./modules/roles/role.module";
import { UserModule } from "./modules/users/user.module";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    // Rate limit toan cuc chong spam request; /auth/login siet rieng bang
    // @Throttle o controller (chong brute-force). Health controller bo qua
    // bang @SkipThrottle - orchestrator/k8s goi lien tuc khong duoc chan.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // Connection RIENG, khong dung chung client cua RedisService: worker BullMQ
    // BAT BUOC maxRetriesPerRequest: null (blocking command BRPOPLPUSH phai cho
    // vo han). Cache thi nguoc lai - phai fail nhanh. Cung 1 Redis server, khac
    // policy. BullMQ tu namespace key theo ten queue (`bull:notification:*`).
    BullModule.forRoot({ connection: { url: REDIS_URL, maxRetriesPerRequest: null } }),
    NotificationModule,
    HealthModule,
    MetricsModule,
    AuthModule,
    ProductModule,
    UserModule,
    RoleModule,
    FileModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AppExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
