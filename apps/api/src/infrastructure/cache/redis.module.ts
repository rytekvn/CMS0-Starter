import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

// @Global giong DatabaseModule: 3 consumer that o 3 module khac nhau
// (JwtAuthGuard doc/ghi, UserService + RoleService invalidate).
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
