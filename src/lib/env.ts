// Centralized, validated access to environment variables.
// Throws early at boot if a required variable is missing.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: optional('NODE_ENV') === 'production',
  port: parseInt(optional('PORT', '3000'), 10),
  appUrl: optional('APP_URL', 'http://localhost:3000'),

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  storageDriver: optional('STORAGE_DRIVER', 'local') as 'local' | 's3',
  aws: {
    region: optional('AWS_REGION'),
    accessKeyId: optional('AWS_ACCESS_KEY_ID'),
    secretAccessKey: optional('AWS_SECRET_ACCESS_KEY'),
    bucket: optional('AWS_S3_BUCKET'),
    publicUrl: optional('AWS_S3_PUBLIC_URL'),
  },

  mailDriver: optional('MAIL_DRIVER', 'console'),
  mailFrom: optional('MAIL_FROM', 'no-reply@marketplace.local'),
};
