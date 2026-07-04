const DEFAULT_JWT_SECRET = 'super-secret-change-in-production';
const DEFAULT_REFRESH_SECRET = 'refresh-secret-change-in-production';

function requireProductionSecret(name: string, fallback: string) {
  const value = process.env[name] ?? fallback;
  if (process.env.NODE_ENV === 'production' && value === fallback) {
    throw new Error(`${name} must be configured in production`);
  }
  return value;
}

export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: requireProductionSecret('JWT_SECRET', DEFAULT_JWT_SECRET),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshSecret: requireProductionSecret('JWT_REFRESH_SECRET', DEFAULT_REFRESH_SECRET),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
  },
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  auth: {
    allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION === 'true',
  },
});
