import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useAuth } from '../../../app/providers/auth-provider';
import { apiRequest } from '../../../api/client/http-client';
import { PageHeader } from '../../../components/ui/page-header';

interface DashboardData {
  bookingsCount: number;
  revenueFromBookings: string;
  revenueFromPayments: string;
  repeatCustomers: number;
  topServices: Array<{ name: string; count: number }>;
}

export const AnalyticsPage = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    void apiRequest<DashboardData>(
      `/admin/analytics/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`,
      { token: accessToken! },
    ).then(setData);
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Bookings, revenue, and performance metrics." />
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard label="Bookings" value={String(data.bookingsCount)} />
            <KpiCard label="Revenue (bookings)" value={data.revenueFromBookings} />
            <KpiCard label="Revenue (payments)" value={data.revenueFromPayments} />
            <KpiCard label="Repeat customers" value={String(data.repeatCustomers)} />
          </div>
          <div className="h-80 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topServices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="text-slate-500">Loading analytics...</p>
      )}
    </div>
  );
};

const KpiCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);
