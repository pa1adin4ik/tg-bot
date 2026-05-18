import type { JwtPayload } from 'jsonwebtoken';

import type { AuthContext } from '../../common/middleware';
import type { AdminRoleCode, AuthTokenType } from './auth.constants';

export interface TokenPayload extends JwtPayload {
  sub: string;
  adminId: string;
  type: AuthTokenType;
  role: AdminRoleCode;
  permissions: string[];
  tokenVersion: number;
}

export interface AuthenticatedAdminProfile extends AuthContext {
  email: string;
  firstName: string;
  lastName: string | null;
  role: AdminRoleCode;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthResponse {
  user: AuthenticatedAdminProfile;
  tokens: AuthTokens;
}
