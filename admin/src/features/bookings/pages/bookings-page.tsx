import { useEffect, useState } from 'react';

import { useAuth } from '../../../app/providers/auth-provider';
import { apiRequest } from '../../../api/client/http-client';
import { DataTable } from '../../../components/ui/data-table';
import { PageHeader } from '../../../components/ui/page-header';
import { StatusBadge } from '../../../components/ui/status-badge';

interface BookingRow {
  id: string;
  status: string;
  service: { name: string };
  master: { fullName: string };
  startAt: string;
  totalPrice: string;
  currency: string;
}

export const BookingsPage = () => {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (search) {
        params.set('q', search);
      }

      const data = await apiRequest<{ items: BookingRow[] }>(`/admin/bookings?${params.toString()}`, {
        token: accessToken!,
      });

      setRows(data.items);
    };

    void load();
  }, [accessToken, statusFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage appointments, statuses, and cancellations." />
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="AWAITING_PREPAYMENT">Awaiting prepayment</option>
          <option value="CANCELED">Canceled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'service', header: 'Service', render: (row) => row.service.name },
          { key: 'master', header: 'Master', render: (row) => row.master.fullName },
          {
            key: 'startAt',
            header: 'Start',
            render: (row) => new Date(row.startAt).toLocaleString(),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'total',
            header: 'Total',
            render: (row) => `${row.totalPrice} ${row.currency}`,
          },
        ]}
        rows={rows}
      />
    </div>
  );
};
