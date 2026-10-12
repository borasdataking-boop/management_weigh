export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SCALE_OPERATOR = 'SCALE_OPERATOR',
  VIEWER = 'VIEWER',
}

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  companyId?: string | null; // null if SUPERADMIN
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
}
