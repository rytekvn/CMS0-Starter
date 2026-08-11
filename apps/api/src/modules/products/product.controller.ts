// Controller mau cho module CRUD - copy pattern nay khi tao module moi.
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Product } from "@prisma/client";
import type { z } from "zod";
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { ApiZodBody, ApiZodQuery } from "../../common/swagger";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  bulkActionSchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  type ProductFilter,
} from "./product.schema";
import { ProductService, type ImportResult } from "./product.service";

const QueryPipe = new ZodValidationPipe(productQuerySchema);
const CreatePipe = new ZodValidationPipe(createProductSchema);
const UpdatePipe = new ZodValidationPipe(updateProductSchema);
const BulkPipe = new ZodValidationPipe(bulkActionSchema);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Khai bao tai cho thay vi @types/multer: multer la dependency giao tiep cua
// @nestjs/platform-express, khong hoist len node_modules cua app nay.
// Khong set `limits` cho multer (se nem loi 500 khac dang) - tu check size de
// tra dung 413 nhu legacy.
type UploadedCsv = { fieldname: string; size: number; buffer: Buffer };

@Controller("products")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("products")
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Get()
  @RequirePermission("product.read")
  @ApiOperation({
    summary: "List products",
    description: "Requires permission `product.read`. Khong truyen tham so = khong loc.",
  })
  @ApiZodQuery(productQuerySchema)
  @ApiResponse({ status: 200, description: "Danh sach product chua bi xoa mem." })
  list(@Query(QueryPipe) filter: ProductFilter): Promise<Product[]> {
    return this.products.list(filter);
  }

  // Dat TRUOC "/:id" de khong bi route param nuot mat.
  @Get("export")
  @RequirePermission("product.export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="products.csv"')
  @ApiOperation({
    summary: "Export products to CSV",
    description: "Requires permission `product.export`. Nhan cung bo filter voi `GET /products`.",
  })
  @ApiZodQuery(productQuerySchema)
  @ApiResponse({
    status: 200,
    description: "File CSV (`text/csv; charset=utf-8`), tai ve ten `products.csv`.",
    content: { "text/csv": { schema: { type: "string" } } },
  })
  exportCsv(@Query(QueryPipe) filter: ProductFilter): Promise<string> {
    return this.products.exportCsv(filter);
  }

  // AnyFilesInterceptor chu khong FileInterceptor("file"): FileInterceptor coi
  // field ten khac la loi cua multer ("Unexpected field"), lech format loi cua
  // legacy. Nhan het roi tu tim field `file` -> mot loi duy nhat cho ca 2 case.
  @Post("import")
  @HttpCode(200)
  @RequirePermission("product.import")
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: "Import products from CSV",
    description: "Requires permission `product.import`. Gui multipart voi field ten `file` (toi da 5MB).",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
  })
  // 200 chu khong 201: handler co @HttpCode(200).
  @ApiResponse({ status: 200, description: "So dong da tao va danh sach dong loi." })
  @ApiResponse({ status: 400, description: "Thieu field `file`." })
  @ApiResponse({ status: 413, description: "File lon hon 5MB." })
  importCsv(
    @UploadedFiles() files: UploadedCsv[] | undefined,
    @CurrentUser() user: AuthUser
  ): Promise<ImportResult> {
    const file = files?.find((f) => f.fieldname === "file");
    if (!file) throw new BadRequestException({ error: "Missing `file` field" });
    if (file.size > MAX_UPLOAD_BYTES)
      throw new PayloadTooLargeException({ error: "File too large (max 5MB)" });
    return this.products.importCsv(file.buffer.toString("utf8"), user.id);
  }

  @Post("bulk")
  @HttpCode(200)
  @RequirePermission("product.bulk")
  @ApiOperation({
    summary: "Bulk delete / activate / deactivate",
    description: "Requires permission `product.bulk`. Toi da 500 id moi lan.",
  })
  @ApiZodBody(bulkActionSchema)
  // 200 chu khong 201: handler co @HttpCode(200).
  @ApiResponse({ status: 200, description: "So ban ghi bi tac dong." })
  bulk(
    @Body(BulkPipe) body: z.infer<typeof bulkActionSchema>,
    @CurrentUser() user: AuthUser
  ): Promise<{ count: number }> {
    return this.products.bulkAction(body, user.id);
  }

  @Get(":id")
  @RequirePermission("product.read")
  @ApiOperation({ summary: "Get one product", description: "Requires permission `product.read`." })
  @ApiResponse({ status: 200, description: "Product." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async get(@Param("id") id: string): Promise<Product> {
    const product = await this.products.get(id);
    if (!product) throw new NotFoundException({ error: "Not found" });
    return product;
  }

  @Post()
  @RequirePermission("product.create")
  @ApiOperation({ summary: "Create product", description: "Requires permission `product.create`." })
  @ApiZodBody(createProductSchema)
  @ApiResponse({ status: 201, description: "Product vua tao." })
  create(
    @Body(CreatePipe) data: z.infer<typeof createProductSchema>,
    @CurrentUser() user: AuthUser
  ): Promise<Product> {
    return this.products.create(data, user.id);
  }

  @Patch(":id")
  @RequirePermission("product.update")
  @ApiOperation({ summary: "Update product", description: "Requires permission `product.update`." })
  @ApiZodBody(updateProductSchema)
  @ApiResponse({ status: 200, description: "Product sau khi sua." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  update(
    @Param("id") id: string,
    @Body(UpdatePipe) data: z.infer<typeof updateProductSchema>,
    @CurrentUser() user: AuthUser
  ): Promise<Product> {
    return this.products.update(id, data, user.id);
  }

  @Delete(":id")
  @RequirePermission("product.delete")
  @ApiOperation({
    summary: "Soft delete product",
    description: "Requires permission `product.delete`. Set `deletedAt`, khong xoa cung.",
  })
  @ApiResponse({ status: 200, description: "`{ ok: true }`." })
  @ApiResponse({ status: 404, description: "Khong ton tai hoac da xoa mem." })
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser
  ): Promise<{ ok: true }> {
    await this.products.softDelete(id, user.id);
    return { ok: true };
  }
}
