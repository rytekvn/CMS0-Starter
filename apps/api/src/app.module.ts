import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppExceptionFilter } from "./common/app-exception.filter";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FileModule } from "./modules/files/file.module";
import { HealthModule } from "./modules/health/health.module";
import { ProductModule } from "./modules/products/product.module";
import { RoleModule } from "./modules/roles/role.module";
import { UserModule } from "./modules/users/user.module";

@Module({
  imports: [
    DatabaseModule,
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
