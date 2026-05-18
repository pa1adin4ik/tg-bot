import { type RequestHandler } from 'express';

import { AppError } from '../errors/app-error';

export interface AuthContext {
  userId: string;
  adminId: string;
  roles: string[];
  permissions?: string[];
}

export interface TokenVerifier {
  verify(accessToken: string): Promise<AuthContext>;
}

interface AuthMiddlewareOptions {
  verifier: TokenVerifier;
  optional?: boolean;
  requiredRoles?: string[];
}

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const createAuthMiddleware = ({
  verifier,
  optional = false,
  requiredRoles = [],
}: AuthMiddlewareOptions): RequestHandler => {
  return async (request, _response, next) => {
    try {
      const token = extractBearerToken(request.header('authorization'));

      if (!token) {
        if (optional) {
          next();
          return;
        }

        next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
        return;
      }

      const auth = await verifier.verify(token);
      request.auth = auth;

      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) => auth.roles.includes(role));

        if (!hasRequiredRole) {
          next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
          return;
        }
      }

      next();
    } catch (error) {
      next(new AppError(401, 'UNAUTHORIZED', 'Access token is invalid', error));
    }
  };
};
