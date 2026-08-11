// Mirror apps/api-legacy/src/routes/user.routes.ts.
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { z } from "zod";
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { UserService, type UserResponse } from "./user.service";

const CreatePipe = new ZodValidationPipe(createUserSchema);
const UpdatePipe = new ZodValidationPipe(updateUserSchema);

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @RequirePermission("user.read")
  list(): Promise<UserResponse[]> {
    return this.users.list();
  }

  @Get(":id")
  @RequirePermission("user.read")
  async get(@Param("id") id: string): Promise<UserResponse> {
    const user = await this.users.get(id);
    if (!user) throw new NotFoundException({ error: "Not found" });
    return user;
  }

  @Post()
  @RequirePermission("user.create")
  create(
    @Body(CreatePipe) data: z.infer<typeof createUserSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<UserResponse> {
    return this.users.create(data, actor.id);
  }

  @Patch(":id")
  @RequirePermission("user.update")
  update(
    @Param("id") id: string,
    @Body(UpdatePipe) data: z.infer<typeof updateUserSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<UserResponse> {
    return this.users.update(id, data, actor.id);
  }

  @Delete(":id")
  @RequirePermission("user.delete")
  async remove(
    @Param("id") id: string,
    @CurrentUser() actor: AuthUser
  ): Promise<{ ok: true }> {
    await this.users.softDelete(id, actor.id);
    return { ok: true };
  }
}
