export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  branchId?: string;
  iss?: string;
  iat?: number;
  exp?: number;
}
