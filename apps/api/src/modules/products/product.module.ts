import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";

// PrismaService den tu DatabaseModule (@Global).
@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
