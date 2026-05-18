import jwt, { type SignOptions } from 'jsonwebtoken';

import { authConfig } from '../../config';
import { AUTH_TOKEN_TYPES } from './auth.constants';
import type { AdminRoleCode } from './auth.constants';
import type { TokenPayload } from './auth.types';

interface SignTokenInput {
  userId: string;
  adminId: string;
  role: AdminRoleCode;
  permissions: string[];
  tokenVersion: number;
}

export class TokenService {
  public signAccessToken(input: SignTokenInput): string {
    return jwt.sign(
      {
        adminId: input.adminId,
        type: AUTH_TOKEN_TYPES.ACCESS,
        role: input.role,
        permissions: input.permissions,
        tokenVersion: input.tokenVersion,
      },
      authConfig.accessTokenSecret,
      {
        subject: input.userId,
        expiresIn: authConfig.accessTokenTtl as SignOptions['expiresIn'],
      },
    );
  }

  public signRefreshToken(input: SignTokenInput): string {
    return jwt.sign(
      {
        adminId: input.adminId,
        type: AUTH_TOKEN_TYPES.REFRESH,
        role: input.role,
        permissions: input.permissions,
        tokenVersion: input.tokenVersion,
      },
      authConfig.refreshTokenSecret,
      {
        subject: input.userId,
        expiresIn: authConfig.refreshTokenTtl as SignOptions['expiresIn'],
      },
    );
  }

  public verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, authConfig.accessTokenSecret) as TokenPayload;
  }

  public verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, authConfig.refreshTokenSecret) as TokenPayload;
  }
}

export const tokenService = new TokenService();
