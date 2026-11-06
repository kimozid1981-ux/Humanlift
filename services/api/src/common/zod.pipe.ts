import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/** Validates a request body against a zod schema and returns field-level errors. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        error: 'validation_failed',
        fields: result.error.issues.map((i) => ({ field: i.path.join('.'), code: i.code, message: i.message })),
      });
    }
    return result.data;
  }
}
