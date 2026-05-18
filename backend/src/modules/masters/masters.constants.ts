export const MASTER_VISIBILITY_FILTERS = ['visible', 'hidden', 'all'] as const;

export type MasterVisibilityFilter = (typeof MASTER_VISIBILITY_FILTERS)[number];

export const MASTER_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] as const;
