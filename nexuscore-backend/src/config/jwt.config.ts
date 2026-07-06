import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.NEXUSCORE_JWT_SECRET || 'nexuscore-secret',
  expiresIn: process.env.NEXUSCORE_JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.NEXUSCORE_JWT_REFRESH_SECRET || 'nexuscore-refresh-secret',
  refreshExpiresIn: process.env.NEXUSCORE_JWT_REFRESH_EXPIRES_IN || '30d',
  issuer: process.env.NEXUSCORE_JWT_ISSUER || 'nexuscore',
}));
