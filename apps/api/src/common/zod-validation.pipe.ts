// Validate bang Zod (khong class-validator): 1 nguon su that dung chung voi
// importProductsCsv - noi tai dung `.safeParse()` cho tung dong CSV.
import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new BadRequestException({
        error: "Validation failed",
        issues: result.error.issues,
      });
    return result.data;
  }
}
