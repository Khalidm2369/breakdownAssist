export const APP_ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN', 'FLEET_MANAGER'] as const;
export type Role = (typeof APP_ROLES)[number];