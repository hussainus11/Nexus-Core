import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.NEXUSCORE_DATABASE_URL,
}));
