import { Module } from "@nestjs/common";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";

// PrismaService den tu DatabaseModule (@Global).
@Module({
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
