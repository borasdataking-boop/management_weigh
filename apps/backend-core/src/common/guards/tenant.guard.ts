import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, AuthenticatedUser } from '@industrial-scale/types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // 1. Superadmin can access across tenants or simulate any tenant
    if (user.role === UserRole.SUPERADMIN) {
      // If superadmin specifies tenant via query/header/param, map it as active context
      const targetCompanyId =
        request.headers['x-company-id'] ||
        request.query?.companyId ||
        request.params?.companyId;

      request.tenantId = targetCompanyId || null;
      return true;
    }

    // 2. Normal tenant users MUST belong to a company
    if (!user.companyId) {
      throw new ForbiddenException(
        'User is not associated with any Company / Tenant',
      );
    }

    // 3. Inspect requested tenant ID in params / query / body to prevent cross-tenant access
    const requestedCompanyId =
      request.params?.companyId ||
      request.query?.companyId ||
      request.body?.companyId;

    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new ForbiddenException(
        'Cross-tenant violation: Access to resources outside your company is forbidden',
      );
    }

    // 4. Attach companyId firmly to request for ORM queries (Prisma/Drizzle isolation)
    request.tenantId = user.companyId;

    return true;
  }
}
