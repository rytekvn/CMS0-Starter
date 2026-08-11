// Mirror apps/api-legacy/src/routes/role.routes.ts, cong them GET /roles/permissions
// (endpoint moi, chi co o apps/api - xem spec/acceptance/role.feature.md).
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
import type { Permission } from "@prisma/client";
import type { z } from "zod";
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { createRoleSchema, updateRoleSchema } from "./role.schema";
import { RoleService, type RoleResponse } from "./role.service";

const CreatePipe = new ZodValidationPipe(createRoleSchema);
const UpdatePipe = new ZodValidationPipe(updateRoleSchema);

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get()
  @RequirePermission("role.read")
  list(): Promise<RoleResponse[]> {
    return this.roles.list();
  }

  // Dat TRUOC "/:id" de khong bi route param nuot mat.
  @Get("permissions")
  @RequirePermission("role.read")
  listPermissions(): Promise<Permission[]> {
    return this.roles.listPermissions();
  }

  @Get(":id")
  @RequirePermission("role.read")
  async get(@Param("id") id: string): Promise<RoleResponse> {
    const role = await this.roles.get(id);
    if (!role) throw new NotFoundException({ error: "Not found" });
    return role;
  }

  @Post()
  @RequirePermission("role.create")
  create(
    @Body(CreatePipe) data: z.infer<typeof createRoleSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<RoleResponse> {
    return this.roles.create(data, actor.id);
  }

  @Patch(":id")
  @RequirePermission("role.update")
  update(
    @Param("id") id: string,
    @Body(UpdatePipe) data: z.infer<typeof updateRoleSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<RoleResponse> {
    return this.roles.update(id, data, actor.id);
  }

  @Delete(":id")
  @RequirePermission("role.delete")
  async remove(
    @Param("id") id: string,
    @CurrentUser() actor: AuthUser
  ): Promise<{ ok: true }> {
    await this.roles.softDelete(id, actor.id);
    return { ok: true };
  }
}
