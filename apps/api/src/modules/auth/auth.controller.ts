// Mirror apps/api-legacy/src/routes/auth.routes.ts.
// ponytail: khong co auth.service - logic con lai chi la bcrypt.compare + signToken,
// qua mong de tach them mot tang. Moi truy cap DB di qua UserService (module exports).
import { Body, Controller, Get, HttpCode, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import bcrypt from "bcryptjs";
import type { z } from "zod";
import { CurrentUser, JwtAuthGuard } from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { permissionKeys } from "../../common/auth/can";
import { signToken } from "../../common/auth/jwt";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { UserService, type UserResponse } from "../users/user.service";
import { loginSchema } from "./auth.schema";

const LoginPipe = new ZodValidationPipe(loginSchema);

@Controller("auth")
export class AuthController {
  constructor(private readonly users: UserService) {}

  // Route public duy nhat ngoai /health*: khong gan JwtAuthGuard.
  // Email khong ton tai / user da xoa mem / sai mat khau -> cung mot message.
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(LoginPipe) body: z.infer<typeof loginSchema>
  ): Promise<{ token: string }> {
    const user = await this.users.findByEmail(body.email);
    if (!user || !(await bcrypt.compare(body.password, user.password)))
      throw new UnauthorizedException({ error: "Invalid credentials" });

    return { token: signToken({ userId: user.id }) };
  }

  // Kem `permissions` (danh sach key phang) de frontend an/hien UI, khoi goi them /roles.
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser): Promise<UserResponse & { permissions: string[] }> {
    // JwtAuthGuard vua load chinh user nay tu DB voi cung dieu kien (deletedAt: null),
    // nen o day chac chan tim thay - doc lai de dung dung shape cua userSelect.
    const profile = (await this.users.get(user.id)) as UserResponse;
    return { ...profile, permissions: permissionKeys(user) };
  }
}
