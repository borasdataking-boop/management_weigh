import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || null;
  },
);
