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

export const DEMO_USERS = Object.freeze([
  {
    userId: 'fp-001',
    loginId: 'fp01',
    password: 'relia1234',
    userName: '김설계',
    userRole: USER_ROLES.FP,
    organizationId: 'org-fp-001',
    organizationCode: 'FP-SEOUL-01',
    organizationName: '서울강남지점',
  },
  {
    userId: 'branch-001',
    loginId: 'branch01',
    password: 'relia1234',
    userName: '박지점',
    userRole: USER_ROLES.BRANCH_MANAGER,
    organizationId: 'org-branch-001',
    organizationCode: 'BR-SEOUL-01',
    organizationName: '서울강남지점',
  },
  {
    userId: 'hq-001',
    loginId: 'hq01',
    password: 'relia1234',
    userName: '이본사',
    userRole: USER_ROLES.HQ_MANAGER,
    organizationId: 'org-hq-001',
    organizationCode: 'HQ-SALES',
    organizationName: '본사 영업본부',
  },
  {
    userId: 'admin-001',
    loginId: 'admin01',
    password: 'relia1234',
    userName: '최관리',
    userRole: USER_ROLES.SYSTEM_ADMIN,
    organizationId: 'org-admin-001',
    organizationCode: 'SYS-ADMIN',
    organizationName: '시스템관리팀',
  },
])

export function getDefaultRouteByRole(role) {
  return DEFAULT_ROUTE_BY_ROLE[role] ?? '/login'
}

export function sanitizeUser(user) {
  if (!user) {
    return null
  }

  const { password, ...safeUser } = user
  return safeUser
}
