export const ROLE_PERMISSIONS = {
  Admin: [
    '/dashboard',
    '/leads', '/clients',
    '/events', '/calendar', '/assignments',
    '/venues-mgmt', '/suppliers-mgmt', '/employees-mgmt',
    '/budget', '/billing', '/payment-review',
    '/reports',
  ],
  Manager: [
    '/dashboard',
    '/leads', '/clients',
    '/events', '/calendar', '/assignments',
    '/venues-mgmt', '/suppliers-mgmt', '/employees-mgmt',
    '/budget', '/payment-review',
    '/reports',
  ],
  Finance: [
    '/dashboard',
    '/budget', '/billing', '/payment-review',
    '/reports',
  ],
  Staff: [
    '/dashboard',
    '/calendar',
  ],
}

export function canAccess(role, path) {
  return (ROLE_PERMISSIONS[role] || []).includes(path)
}