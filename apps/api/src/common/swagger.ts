// OpenAPI cho apps/api.
//
// Zod la nguon su that duy nhat cho validation (ADR-0001) nen doc phai sinh tu
// chinh Zod schema dang chay, khong tao DTO class song song. `@nestjs/swagger`
// khong doc duoc Zod -> convert bang `zod-to-json-schema` (chon no thay
// `nestjs-zod`: `nestjs-zod` tra `{}` va `required` sai tren `productQuerySchema`
// vi schema do boc trong `z.preprocess`).
//
// Cac decorator duoi day thuan metadata (`Reflect.defineMetadata` duoi key rieng
// cua Swagger) - khong doi hanh vi runtime cua pipe/guard dang co.
import { applyDecorators, type INestApplication } from "@nestjs/common";
import { ApiBody, ApiQuery, DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// `$refStrategy: "none"` -> inline het, khong sinh `$ref` tro toi `definitions`
// (Draft-07) vi key do khong ton tai trong document OpenAPI 3.
export function toSchema(schema: ZodType): SchemaObject {
  // `as never` cho tham so schema: zod-to-json-schema khai bao tham so la
  // `ZodSchema<any>` import tu "zod/v3", so khop no voi `ZodType` cua "zod" lam
  // tsc bung TS2589 "excessively deep". Runtime khong doi - van la Zod schema.
  const json = zodToJsonSchema(schema as never, { target: "openApi3", $refStrategy: "none" });
  return json as unknown as SchemaObject;
}

export function ApiZodBody(schema: ZodType) {
  return ApiBody({ schema: toSchema(schema) });
}

// Query object phai tach thanh tung `@ApiQuery` roi le thi Swagger UI moi render
// duoc o input rieng cho moi tham so.
export function ApiZodQuery(schema: ZodType) {
  const json = toSchema(schema);
  const required = new Set(json.required ?? []);
  return applyDecorators(
    ...Object.entries(json.properties ?? {}).map(([name, prop]) =>
      ApiQuery({ name, required: required.has(name), schema: prop as SchemaObject })
    )
  );
}

// Goi co dieu kien tu main.ts: /docs la dev tool, tat han o production.
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Rytek Platform API")
    .setDescription("REST API cua apps/api. Validation dung Zod; doc sinh tu chinh Zod schema.")
    .setVersion("0.4.5")
    .addBearerAuth()
    .build();

  // /docs-json va /docs-yaml duoc mount kem theo /docs.
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
}
