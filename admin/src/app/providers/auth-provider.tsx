import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { apiRequest } from '../../api/client/http-client';

interface AuthState {
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('admin-access-token'),
  );

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      login: async (email, password) => {
        const response = await apiRequest<{ tokens: { accessToken: string } }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('admin-access-token', response.tokens.accessToken);
        setAccessToken(response.tokens.accessToken);
      },
      logout: () => {
        localStorage.removeItem('admin-access-token');
        setAccessToken(null);
      },
    }),
    [accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
