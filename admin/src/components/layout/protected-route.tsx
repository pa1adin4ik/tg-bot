import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../../app/providers/auth-provider';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
