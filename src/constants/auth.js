export const USER_ROLES = Object.freeze({
  FP: 'FP',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  HQ_MANAGER: 'HQ_MANAGER',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
})

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.FP]: '설계사',
  [USER_ROLES.BRANCH_MANAGER]: '지점장',
  [USER_ROLES.HQ_MANAGER]: '본사 영업 관리자',
  [USER_ROLES.SYSTEM_ADMIN]: '시스템 관리자',
})

export const DEFAULT_ROUTE_BY_ROLE = Object.freeze({
  [USER_ROLES.FP]: '/dashboard/fp',
  [USER_ROLES.BRANCH_MANAGER]: '/dashboard/branch',
  [USER_ROLES.HQ_MANAGER]: '/dashboard/hq',
  [USER_ROLES.SYSTEM_ADMIN]: '/admin/users',
})

export function getDefaultRouteByRole(role) {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? '/login'
}
