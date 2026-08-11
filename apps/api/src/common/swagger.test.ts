// Doc OpenAPI sinh tu chinh Zod schema dang chay -> rui ro that nam o buoc
// convert: neu converter im lang lam mat kieu, doc van build duoc nhung sai.
// Day la dung cho `nestjs-zod` da hong (tra `{}` va `required` sai) nen loai no.
// Khong boot Nest o day: `pnpm test` chay qua tsx/esbuild, ma esbuild khong ho tro
// `emitDecoratorMetadata` -> document dung tsx sinh ra khac voi ban `tsc` that.
// Chay: pnpm --filter @rytek/api test
import assert from "node:assert/strict";
import { loginSchema } from "../modules/auth/auth.schema";
import { createProductSchema, productQuerySchema } from "../modules/products/product.schema";
import { toSchema } from "./swagger";

// 1. productQuerySchema boc trong `z.preprocess` (ZodEffects) - cho converter
// nhin xuyen qua duoc lop do hay khong la khac biet giua "co doc" va "doc rong".
const query = toSchema(productQuerySchema);
assert.deepEqual(Object.keys(query.properties ?? {}), [
  "status",
  "search",
  "createdFrom",
  "createdTo",
]);
// Chi tiet kieu phai con nguyen (`nestjs-zod` tra `{}` o dung cho nay).
assert.deepEqual(query.properties?.status, { type: "string", enum: ["active", "inactive"] });

// 2. Moi field cua query deu optional -> khong duoc bia ra `required`.
assert.equal(query.required, undefined);

// 3. `status` co `.default()` nen KHONG required; `name` thi co.
assert.deepEqual(toSchema(createProductSchema).required, ["name"]);
assert.deepEqual(toSchema(loginSchema).required, ["email", "password"]);

// 4. Khong duoc de lot `$ref`/`definitions`: chung tro toi nhanh "definitions"
// cua JSON Schema Draft-07, khong ton tai trong document OpenAPI 3.
assert.equal(JSON.stringify(toSchema(productQuerySchema)).includes("$ref"), false);
assert.equal("definitions" in toSchema(createProductSchema), false);
