import { Module } from "@nestjs/common";
import { UserModule } from "../users/user.module";
import { AuthController } from "./auth.controller";

// imports UserModule: auth doc user qua UserService duoc export, khong tu goi Prisma.
@Module({
  imports: [UserModule],
  controllers: [AuthController],
})
export class AuthModule {}
