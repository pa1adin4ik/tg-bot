export const ADMIN_ROLE_CODES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] as const;

export type AdminRoleCode = (typeof ADMIN_ROLE_CODES)[number];

export const AUTH_TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];
