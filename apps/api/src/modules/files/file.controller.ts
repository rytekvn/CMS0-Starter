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
export class FileController {
  constructor(private readonly files: FileService) {}

  // AnyFilesInterceptor chu khong FileInterceptor("file"): FileInterceptor coi field
  // ten khac la loi cua multer ("Unexpected field"), lech format loi cua legacy.
  // defParamCharset "utf8": mac dinh cua multer la latin1 -> ten file unicode mojibake.
  // Khong set `limits`: file qua 5MB roi vao uploadSchema -> 400 dung nhu legacy.
  @Post()
  @RequirePermission("file.upload")
  @UseInterceptors(AnyFilesInterceptor({ defParamCharset: "utf8" }))
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
