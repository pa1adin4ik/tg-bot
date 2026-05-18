export const SERVICE_STATUS_FILTERS = ['active', 'inactive', 'all'] as const;

export type ServiceStatusFilter = (typeof SERVICE_STATUS_FILTERS)[number];
