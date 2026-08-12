import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { RedisModule } from "./infrastructure/cache/redis.module";
import { REDIS_URL } from "./infrastructure/cache/redis.service";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FileModule } from "./modules/files/file.module";
import { HealthModule } from "./modules/health/health.module";
import { NotificationModule } from "./modules/notifications/notification.module";
import { ProductModule } from "./modules/products/product.module";
import { RoleModule } from "./modules/roles/role.module";
import { UserModule } from "./modules/users/user.module";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    // Connection RIENG, khong dung chung client cua RedisService: worker BullMQ
    // BAT BUOC maxRetriesPerRequest: null (blocking command BRPOPLPUSH phai cho
    // vo han). Cache thi nguoc lai - phai fail nhanh. Cung 1 Redis server, khac
    // policy. BullMQ tu namespace key theo ten queue (`bull:notification:*`).
    BullModule.forRoot({ connection: { url: REDIS_URL, maxRetriesPerRequest: null } }),
    NotificationModule,
    HealthModule,
    AuthModule,
    ProductModule,
    UserModule,
    RoleModule,
    FileModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
})
export class AppModule {}
