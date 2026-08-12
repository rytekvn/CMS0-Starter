import { Module } from "@nestjs/common";
import { NotificationModule } from "../notifications/notification.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

// exports UserService: AuthModule can doc user (login/me) ma khong duoc tu goi Prisma.
// imports NotificationModule: enqueue job user.welcome qua NotificationService.
@Module({
  imports: [NotificationModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
