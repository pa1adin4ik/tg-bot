import { env } from './env';

const parseTrustProxy = (value: string): boolean | number | string => {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  const asNumber = Number(normalizedValue);
  if (Number.isInteger(asNumber) && asNumber >= 0) {
    return asNumber;
  }

  return value;
};

const parseCorsOrigin = (value: string): boolean | string[] => {
  if (value.trim() === '*') {
    return true;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  host: env.HOST,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  bodySizeLimit: env.BODY_SIZE_LIMIT,
  corsOrigin: parseCorsOrigin(env.CORS_ORIGIN),
  trustProxy: parseTrustProxy(env.TRUST_PROXY),
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
} as const;
