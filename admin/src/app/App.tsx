import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/layout/app-shell';
import { ProtectedRoute } from '../components/layout/protected-route';
import { AnalyticsPage } from '../features/analytics/pages/analytics-page';
import { BookingsPage } from '../features/bookings/pages/bookings-page';
import { LoginPage } from '../features/auth/pages/login-page';
import { MastersCrudPage } from '../features/masters/pages/masters-crud-page';
import { DashboardPage } from '../features/dashboard/pages/dashboard-page';
import { useAuth } from './providers/auth-provider';

export const App = () => {
  const { accessToken } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/masters" element={<MastersCrudPage accessToken={accessToken!} />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
