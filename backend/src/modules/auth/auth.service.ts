import { Prisma, UserStatus } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { AuthContext, TokenVerifier } from '../../common/middleware';
import { authConfig } from '../../config';
import { prisma } from '../../database';
import type { AdminRoleCode } from './auth.constants';
import { ADMIN_ROLE_CODES, AUTH_TOKEN_TYPES } from './auth.constants';
import type { LoginDto, RefreshTokenDto } from './dto';
import { passwordService } from './password.service';
import { tokenService } from './token.service';
import type { AuthResponse, AuthenticatedAdminProfile, TokenPayload } from './auth.types';

const AUTH_SELECT = {
  id: true,
  passwordHash: true,
  tokenVersion: true,
  isActive: true,
  deletedAt: true,
  lastLoginAt: true,
  role: {
    select: {
      code: true,
      permissions: true,
      deletedAt: true,
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      deletedAt: true,
    },
  },
} as const;

type AdminAuthRecord = Prisma.AdminGetPayload<{
  select: typeof AUTH_SELECT;
}>;

export class AuthService implements TokenVerifier {
  public async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const admin = await prisma.admin.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        user: {
          email,
          deletedAt: null,
          status: UserStatus.ACTIVE,
        },
        role: {
          deletedAt: null,
        },
      },
      select: AUTH_SELECT,
    });

    if (!admin?.user.email) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    this.assertValidRole(admin.role.code);

    const passwordMatches = await passwordService.compare(dto.password, admin.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const userProfile = this.toAuthenticatedProfile(admin);

    return {
      user: userProfile,
      tokens: this.issueTokens({
        userId: userProfile.userId,
        adminId: userProfile.adminId,
        role: userProfile.role,
        permissions: userProfile.permissions ?? [],
        tokenVersion: admin.tokenVersion,
      }),
    };
  }

  public async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const payload = this.validateTokenPayload(tokenService.verifyRefreshToken(dto.refreshToken));

    if (payload.type !== AUTH_TOKEN_TYPES.REFRESH) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
    }

    const admin = await this.getActiveAdminById(payload.adminId);

    if (admin.tokenVersion !== payload.tokenVersion) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid');
    }

    const userProfile = this.toAuthenticatedProfile(admin);

    return {
      user: userProfile,
      tokens: this.issueTokens({
        userId: userProfile.userId,
        adminId: userProfile.adminId,
        role: userProfile.role,
        permissions: userProfile.permissions ?? [],
        tokenVersion: admin.tokenVersion,
      }),
    };
  }

  public async logout(adminId: string): Promise<void> {
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }

  public async getCurrentUser(adminId: string): Promise<AuthenticatedAdminProfile> {
    const admin = await this.getActiveAdminById(adminId);
    return this.toAuthenticatedProfile(admin);
  }

  public async verify(accessToken: string): Promise<AuthContext> {
    const payload = this.validateTokenPayload(tokenService.verifyAccessToken(accessToken));

    if (payload.type !== AUTH_TOKEN_TYPES.ACCESS) {
      throw new AppError(401, 'UNAUTHORIZED', 'Access token is invalid');
    }

    const admin = await this.getActiveAdminById(payload.adminId);

    if (admin.tokenVersion !== payload.tokenVersion) {
      throw new AppError(401, 'UNAUTHORIZED', 'Access token has been revoked');
    }

    const role = admin.role.code;
    this.assertValidRole(role);

    return {
      userId: admin.user.id,
      adminId: admin.id,
      roles: [role],
      permissions: admin.role.permissions,
    };
  }

  private issueTokens(input: {
    userId: string;
    adminId: string;
    role: AdminRoleCode;
    permissions: string[];
    tokenVersion: number;
  }) {
    return {
      accessToken: tokenService.signAccessToken(input),
      refreshToken: tokenService.signRefreshToken(input),
      accessTokenExpiresIn: authConfig.accessTokenTtl,
      refreshTokenExpiresIn: authConfig.refreshTokenTtl,
    };
  }

  private async getActiveAdminById(adminId: string): Promise<NonNullable<AdminAuthRecord>> {
    const admin = await prisma.admin.findFirst({
      where: {
        id: adminId,
        deletedAt: null,
        isActive: true,
        user: {
          deletedAt: null,
          status: UserStatus.ACTIVE,
        },
        role: {
          deletedAt: null,
        },
      },
      select: AUTH_SELECT,
    });

    if (!admin) {
      throw new AppError(401, 'UNAUTHORIZED', 'Admin account is inactive or missing');
    }

    if (!admin.user.email) {
      throw new AppError(401, 'UNAUTHORIZED', 'Admin account email is missing');
    }

    this.assertValidRole(admin.role.code);

    return admin;
  }

  private toAuthenticatedProfile(admin: NonNullable<AdminAuthRecord>): AuthenticatedAdminProfile {
    const role = admin.role.code;
    this.assertValidRole(role);

    if (!admin.user.email) {
      throw new AppError(401, 'UNAUTHORIZED', 'Admin account email is missing');
    }

    return {
      userId: admin.user.id,
      adminId: admin.id,
      email: admin.user.email,
      firstName: admin.user.firstName,
      lastName: admin.user.lastName,
      role,
      roles: [role],
      permissions: admin.role.permissions,
    };
  }

  private validateTokenPayload(payload: TokenPayload): TokenPayload {
    if (!payload.sub || !payload.adminId || !payload.type) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token payload is invalid');
    }

    return payload;
  }

  private assertValidRole(role: string): asserts role is AdminRoleCode {
    if (!ADMIN_ROLE_CODES.includes(role as AdminRoleCode)) {
      throw new AppError(403, 'INVALID_ROLE', 'Admin role is not allowed');
    }
  }
}

export const authService = new AuthService();
