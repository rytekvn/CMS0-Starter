import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";

// PrismaService den tu DatabaseModule (@Global).
@Module({
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
