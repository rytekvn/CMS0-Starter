// Hanh vi khop route role cua stack Hono cu truoc khi migrate, cong them GET /roles/permissions
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Permission } from "@prisma/client";
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
import { createRoleSchema, updateRoleSchema } from "./role.schema";
import { RoleService, type RoleResponse } from "./role.service";

const CreatePipe = new ZodValidationPipe(createRoleSchema);
const UpdatePipe = new ZodValidationPipe(updateRoleSchema);

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("roles")
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get()
  @RequirePermission("role.read")
  @ApiOperation({ summary: "List roles", description: "Requires permission `role.read`." })
  @ApiResponse({ status: 200, description: "Danh sach role kem quyen cua tung role." })
  list(): Promise<RoleResponse[]> {
    return this.roles.list();
  }

  // Dat TRUOC "/:id" de khong bi route param nuot mat.
  @Get("permissions")
  @RequirePermission("role.read")
  @ApiOperation({
    summary: "List all permission keys",
    description: "Requires permission `role.read`. Nguon de dung form gan quyen cho role.",
  })
  @ApiResponse({ status: 200, description: "Toan bo Permission trong DB." })
  listPermissions(): Promise<Permission[]> {
    return this.roles.listPermissions();
  }

  @Get(":id")
  @RequirePermission("role.read")
  @ApiOperation({ summary: "Get one role", description: "Requires permission `role.read`." })
  @ApiResponse({ status: 200, description: "Role kem danh sach quyen." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async get(@Param("id") id: string): Promise<RoleResponse> {
    const role = await this.roles.get(id);
    if (!role) throw new NotFoundException({ error: "Not found" });
    return role;
  }

  @Post()
  @RequirePermission("role.create")
  @ApiOperation({
    summary: "Create role",
    description: "Requires permission `role.create`. Gan quyen bang key, vi du `product.create`.",
  })
  @ApiZodBody(createRoleSchema)
  @ApiResponse({ status: 201, description: "Role vua tao." })
  create(
    @Body(CreatePipe) data: z.infer<typeof createRoleSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<RoleResponse> {
    return this.roles.create(data, actor.id);
  }

  @Patch(":id")
  @RequirePermission("role.update")
  @ApiOperation({
    summary: "Update role",
    description:
      "Requires permission `role.update`. Khong gui `permissionKeys` = giu nguyen danh sach quyen hien tai.",
  })
  @ApiZodBody(updateRoleSchema)
  @ApiResponse({ status: 200, description: "Role sau khi sua." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  update(
    @Param("id") id: string,
    @Body(UpdatePipe) data: z.infer<typeof updateRoleSchema>,
    @CurrentUser() actor: AuthUser
  ): Promise<RoleResponse> {
    return this.roles.update(id, data, actor.id);
  }

  @Delete(":id")
  @RequirePermission("role.delete")
  @ApiOperation({
    summary: "Soft delete role",
    description:
      "Requires permission `role.delete`. Set `deletedAt`; role da xoa mem khong con cap quyen.",
  })
  @ApiResponse({ status: 200, description: "`{ ok: true }`." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async remove(
    @Param("id") id: string,
    @CurrentUser() actor: AuthUser
  ): Promise<{ ok: true }> {
    await this.roles.softDelete(id, actor.id);
    return { ok: true };
  }
}
