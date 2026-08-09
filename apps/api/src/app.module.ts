import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { ProductModule } from "./modules/products/product.module";

@Module({
  imports: [DatabaseModule, HealthModule, ProductModule],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }],
})
export class AppModule {}
