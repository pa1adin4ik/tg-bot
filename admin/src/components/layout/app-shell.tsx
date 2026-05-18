import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../../app/providers/auth-provider';
import { useTheme } from '../../app/providers/theme-provider';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/masters', label: 'Masters' },
  { to: '/analytics', label: 'Analytics' },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 text-lg font-semibold">Salon Admin</div>
        <nav className="flex flex-wrap gap-2 lg:flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};
