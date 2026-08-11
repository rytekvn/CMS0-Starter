// Upload / download file. Multipart parse bang multer cua @nestjs/platform-express.
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
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
import type { FileAsset } from "@prisma/client";
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
} from "../../common/auth/auth.guards";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { uploadSchema } from "./file.schema";
import { FileService } from "./file.service";

// Goi .transform() truc tiep (khong @Body(...)): meta duoc ghep tu multer file,
// khong phai body. Qua pipe chu khong .parse() tran vi AppExceptionFilter khong
// bat ZodError -> se ra 500 thay vi 400.
const UploadPipe = new ZodValidationPipe(uploadSchema);

// Khai bao tai cho thay vi @types/multer: multer la dependency giao tiep cua
// @nestjs/platform-express, khong hoist len node_modules cua app nay.
type UploadedAsset = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller("files")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("files")
@ApiBearerAuth()
export class FileController {
  constructor(private readonly files: FileService) {}

  // AnyFilesInterceptor chu khong FileInterceptor("file"): FileInterceptor coi field
  // ten khac la loi cua multer ("Unexpected field"), lech format loi cua legacy.
  // defParamCharset "utf8": mac dinh cua multer la latin1 -> ten file unicode mojibake.
  // Khong set `limits`: file qua 5MB roi vao uploadSchema -> 400 dung nhu legacy.
  @Post()
  @RequirePermission("file.upload")
  @UseInterceptors(AnyFilesInterceptor({ defParamCharset: "utf8" }))
  @ApiOperation({
    summary: "Upload file",
    description:
      "Requires permission `file.upload`. Multipart voi field ten `file`. Chi nhan png/jpeg/gif/webp/pdf/csv, toi da 5MB.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
  })
  @ApiResponse({ status: 201, description: "FileAsset vua tao." })
  @ApiResponse({ status: 400, description: "Thieu field `file`, sai loai file, hoac qua 5MB." })
  upload(
    @UploadedFiles() files: UploadedAsset[] | undefined,
    @CurrentUser() user: AuthUser
  ): Promise<FileAsset> {
    const file = files?.find((f) => f.fieldname === "file");
    if (!file) throw new BadRequestException({ error: "Missing `file` field" });

    const meta = UploadPipe.transform({
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    return this.files.save(meta, file.buffer, user.id);
  }

  // StreamableFile chu khong @Res(): header doi theo tung file, va tra ve gia tri
  // thi Nest van chay duoc interceptor/filter nhu cac route khac.
  @Get(":id")
  @RequirePermission("file.read")
  @ApiOperation({
    summary: "Download file",
    description: "Requires permission `file.read`. Tra byte goc, `Content-Type` theo mime da luu.",
  })
  // Khai content-type cu the: day khong phai JSON nhu cac endpoint con lai.
  @ApiResponse({
    status: 200,
    description: "Noi dung file (attachment).",
    content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
  })
  @ApiResponse({ status: 404, description: "Khong co ban ghi, hoac ban ghi con nhung file mat tren disk." })
  async download(@Param("id") id: string): Promise<StreamableFile> {
    const asset = await this.files.get(id);
    if (!asset) throw new NotFoundException({ error: "Not found" });

    const bytes = await this.files.readBytes(asset.url);
    if (!bytes) throw new NotFoundException({ error: "File missing on disk" });

    return new StreamableFile(bytes, {
      type: asset.mimeType,
      // filename* (RFC 5987) de ten goc co unicode / dau nhay khong pha header.
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    });
  }
}
