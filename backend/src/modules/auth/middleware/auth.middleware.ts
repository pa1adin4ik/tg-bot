import { createAuthMiddleware } from '../../../common/middleware';
import type { AdminRoleCode } from '../auth.constants';
import { authService } from '../auth.service';

export const authenticate = createAuthMiddleware({
  verifier: authService,
});

export const optionalAuthenticate = createAuthMiddleware({
  verifier: authService,
  optional: true,
});

export const authorize = (...requiredRoles: AdminRoleCode[]) =>
  createAuthMiddleware({
    verifier: authService,
    requiredRoles,
  });
