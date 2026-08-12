// Hanh vi khop route user cua stack Hono cu truoc khi migrate.
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { z } from "zod";
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { ApiZodBody } from "../../common/swagger";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { UserService, type UserResponse } from "./user.service";

const CreatePipe = new ZodValidationPipe(createUserSchema);
const UpdatePipe = new ZodValidationPipe(updateUserSchema);

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("users")
@ApiBearerAuth()
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @RequirePermission("user.read")
  @ApiOperation({ summary: "List users", description: "Requires permission `user.read`." })
  @ApiResponse({ status: 200, description: "Danh sach user (khong kem password)." })
  list(): Promise<UserResponse[]> {
    return this.users.list();
  }

  @Get(":id")
  @RequirePermission("user.read")
  @ApiOperation({ summary: "Get one user", description: "Requires permission `user.read`." })
  @ApiResponse({ status: 200, description: "User." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async get(@Param("id") id: string): Promise<UserResponse> {
    const user = await this.users.get(id);
    if (!user) throw new NotFoundException({ error: "Not found" });
    return user;
  }

  @Post()
  @RequirePermission("user.create")
  @ApiOperation({
    summary: "Create user",
    description: "Requires permission `user.create`. Bo qua `roleIds` = user khong co role nao.",
  })
  @ApiZodBody(createUserSchema)
  @ApiResponse({ status: 201, description: "User vua tao." })
  create(
    @Body(CreatePipe) data: z.infer<typeof createUserSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<UserResponse> {
    return this.users.create(data, actor.id);
  }

  @Patch(":id")
  @RequirePermission("user.update")
  @ApiOperation({
    summary: "Update user",
    description:
      "Requires permission `user.update`. Khong gui `password` = giu mat khau cu; khong gui `roleIds` = giu role cu.",
  })
  @ApiZodBody(updateUserSchema)
  @ApiResponse({ status: 200, description: "User sau khi sua." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  update(
    @Param("id") id: string,
    @Body(UpdatePipe) data: z.infer<typeof updateUserSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<UserResponse> {
    return this.users.update(id, data, actor.id);
  }

  @Delete(":id")
  @RequirePermission("user.delete")
  @ApiOperation({
    summary: "Soft delete user",
    description: "Requires permission `user.delete`. Set `deletedAt`, khong xoa cung.",
  })
  @ApiResponse({ status: 200, description: "`{ ok: true }`." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async remove(
    @Param("id") id: string,
    @CurrentUser() actor: AuthUser
  ): Promise<{ ok: true }> {
    await this.users.softDelete(id, actor.id);
    return { ok: true };
  }
}
