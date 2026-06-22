import { USER_ROLES } from './auth'

const ORGANIZATION_ROLES = [
  USER_ROLES.HQ_MANAGER,
  USER_ROLES.SYSTEM_ADMIN,
]

const ORGANIZATION_MENU_SECTION = {
  title: '조직 및 인사 관리',
  icon: 'mdi-domain',
  children: [
    { title: '조직도', to: { name: 'organization-chart' } },
    { title: '전체 설계사 목록', to: { name: 'hq-advisors' } },
  ],
}

export const APP_PAGE_SPECS = [
  {
    path: 'dashboard/fp',
    name: 'fp-dashboard',
    title: '내 대시보드',
    description: 'FP 사용자의 기본 진입 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'customers/fp',
    name: 'fp-customers',
    title: '설계사 고객 목록',
    description: '본인이 담당하는 고객을 조회하는 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'consultations/fp',
    name: 'fp-consultations',
    title: '고객별 상담 목록',
    description: '설계사 관점의 상담 목록 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'consultations/new',
    name: 'consultation-create',
    title: '상담 등록',
    description: '새 상담을 등록하는 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'consultations/drafts',
    name: 'consultation-drafts',
    title: '임시저장 상담일지 조회',
    description: '임시저장한 상담일지를 목록으로 조회합니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'contracts/fp',
    name: 'fp-contracts',
    title: '보유 계약 목록',
    description: '설계사의 계약 현황을 조회하는 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'contracts/fp/new',
    name: 'contract-create',
    title: '계약 등록',
    description: '설계사가 새 계약을 등록하는 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'handovers/received',
    name: 'handover-received',
    title: '받은 인수인계 목록',
    description: 'FP가 본인이 인수받은 인수인계 목록을 조회하는 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'commissions/fp',
    name: 'fp-commissions',
    title: '설계사 지급 수수료 현황',
    description: '설계사 수수료 지급 현황 화면입니다.',
    roles: [USER_ROLES.FP],
  },
  {
    path: 'dashboard/branch',
    name: 'branch-dashboard',
    title: '지점 대시보드',
    description: '지점장의 기본 진입 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'customers/branch',
    name: 'branch-customers',
    title: '지점 고객 목록',
    description: '지점 전체 고객을 조회하는 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'consultations/branch',
    name: 'branch-consultations',
    title: '지점 상담 목록',
    description: '지점 전체 상담을 모니터링하는 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'contracts/branch',
    name: 'branch-contracts',
    title: '지점 계약 목록',
    description: '지점 계약을 조회하는 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'handovers/requests',
    name: 'handover-requests',
    title: '인수인계 요청 목록',
    description: '지점 인수인계 요청을 관리하는 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'advisors/branch',
    name: 'branch-advisors',
    title: '지점 설계사 목록',
    description: '소속 지점 설계사 관리 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'commissions/branch',
    name: 'branch-commissions',
    title: '지점 수수료 현황',
    description: '지점 단위 수수료 현황 화면입니다.',
    roles: [USER_ROLES.BRANCH_MANAGER],
  },
  {
    path: 'dashboard/hq',
    name: 'hq-dashboard',
    title: '본사 대시보드',
    description: '본사 영업 담당자의 기본 진입 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'customers/hq',
    name: 'hq-customers',
    title: '전체 고객 목록',
    description: '전사 고객 데이터를 조회하는 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'customers/hq/interests',
    name: 'hq-customer-interests',
    title: '전체 관심 고객 목록',
    description: '전체 관심 고객 목록을 조회하는 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'contracts/hq',
    name: 'hq-contracts',
    title: '전체 계약 목록',
    description: '전사 계약을 조회하는 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'consultations/hq',
    name: 'hq-consultations',
    title: '전체 상담 목록',
    description: '전사 상담을 조회하는 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'handovers/monitoring',
    name: 'handover-monitoring',
    title: '전체 인수인계 현황',
    description: '전사 인수인계 현황 모니터링 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'organizations/chart',
    name: 'organization-chart',
    title: '조직도',
    description: '조직 구조를 관리하는 화면입니다.',
    roles: ORGANIZATION_ROLES,
    props: {
      mode: 'chart',
    },
  },
  {
    path: 'organizations/branches',
    name: 'organization-branches',
    title: '지점 목록 조회',
    description: '지점 목록과 지점별 현황을 관리합니다.',
    roles: ORGANIZATION_ROLES,
    props: {
      mode: 'branches',
    },
  },
  {
    path: 'advisors/hq',
    name: 'hq-advisors',
    title: '전체 설계사 목록',
    description: '전사 설계사 목록을 조회하는 화면입니다.',
    roles: ORGANIZATION_ROLES,
    props: {
      mode: 'fps',
    },
  },
  {
    path: 'organizations/branches/:organizationId/advisors',
    name: 'organization-branch-advisors',
    title: '지점 설계사 목록 조회',
    description: '선택한 지점에 소속된 설계사 목록을 조회합니다.',
    roles: ORGANIZATION_ROLES,
    props: {
      mode: 'fps',
    },
  },
  {
    path: 'insurance/partners',
    name: 'insurance-partners',
    title: '제휴 보험사 목록',
    description: '제휴 보험사 목록 관리 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'insurance/products',
    name: 'insurance-products',
    title: '보험 상품 목록',
    description: '보험 상품 관리 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'commissions/hq',
    name: 'hq-commissions',
    title: '수수료 대시보드',
    description: '전사 수수료 대시보드 화면입니다.',
    roles: [USER_ROLES.HQ_MANAGER],
  },
  {
    path: 'admin/users',
    name: 'admin-users',
    title: '사용자 관리',
    description: '시스템 관리자의 사용자 관리 화면입니다.',
    roles: [USER_ROLES.SYSTEM_ADMIN],
  },
  {
    path: 'admin/organizations',
    name: 'admin-organizations',
    title: '조직 관리',
    description: '시스템 관리자의 조직 관리 화면입니다.',
    roles: [USER_ROLES.SYSTEM_ADMIN],
    props: {
      mode: 'chart',
    },
  },
  {
    path: 'admin/roles',
    name: 'admin-roles',
    title: '권한 관리',
    description: '시스템 관리자의 권한 관리 화면입니다.',
    roles: [USER_ROLES.SYSTEM_ADMIN],
  },
]

export const MENU_BY_ROLE = {
  [USER_ROLES.FP]: [
    {
      title: '내 대시보드',
      icon: 'mdi-view-dashboard-outline',
      to: { name: 'fp-dashboard' },
    },
    {
      title: '고객 관리',
      icon: 'mdi-account-group-outline',
      children: [
        { title: '설계사 고객 목록', to: { name: 'fp-customers' } },
        { title: '관심 고객 목록', to: { name: 'fp-customer-interests' } },
      ],
    },
    {
      title: '상담 관리',
      icon: 'mdi-clipboard-text-outline',
      children: [
        { title: '고객별 상담 목록', to: { name: 'fp-consultations' } },
        { title: '상담 등록', to: { name: 'consultation-create' } },
      ],
    },
    {
      title: '계약 관리',
      icon: 'mdi-file-document-outline',
      children: [
        { title: '보유 계약 목록', to: { name: 'fp-contracts' } },
      ],
    },
    {
      title: '인수인계 관리',
      icon: 'mdi-cash-multiple',
      children: [
        { title: '받은 인수인계 목록', to: { name: 'handover-received' } },
      ],
    },
    {
      title: '수수료 관리',
      icon: 'mdi-trending-up',
      children: [
        { title: '설계사 지급 수수료 현황', to: { name: 'fp-commissions' } },
      ],
    },
  ],
  [USER_ROLES.BRANCH_MANAGER]: [
    {
      title: '지점 대시보드',
      icon: 'mdi-view-dashboard-outline',
      to: { name: 'branch-dashboard' },
    },
    {
      title: '고객 관리',
      icon: 'mdi-account-group-outline',
      children: [
        { title: '지점 고객 목록', to: { name: 'branch-customers' } },
        { title: '지점 관심 고객 목록', to: { name: 'branch-customer-interests' } },
      ],
    },
    {
      title: '상담 관리',
      icon: 'mdi-clipboard-text-outline',
      children: [
        { title: '지점 상담 목록', to: { name: 'branch-consultations' } },
      ],
    },
    {
      title: '계약 관리',
      icon: 'mdi-file-document-outline',
      children: [
        { title: '지점 계약 목록', to: { name: 'branch-contracts' } },
      ],
    },
    {
      title: '인수인계',
      icon: 'mdi-swap-horizontal',
      children: [
        { title: '인수인계 요청 목록', to: { name: 'handover-requests' } },
      ],
    },
    {
      title: '지점 설계사 관리',
      icon: 'mdi-account-tie-outline',
      children: [
        { title: '지점 설계사 목록', to: { name: 'branch-advisors' } },
      ],
    },
    {
      title: '수수료 관리',
      icon: 'mdi-cash-multiple',
      children: [
        { title: '지점 수수료 현황', to: { name: 'branch-commissions' } },
      ],
    },
  ],
  [USER_ROLES.HQ_MANAGER]: [
    {
      title: '본사 대시보드',
      icon: 'mdi-view-dashboard-outline',
      to: { name: 'hq-dashboard' },
    },
    {
      title: '고객 관리',
      icon: 'mdi-account-group-outline',
      children: [
        { title: '전체 고객 목록', to: { name: 'hq-customers' } },
        { title: '전체 관심 고객 목록', to: { name: 'hq-customer-interests' } },
      ],
    },
    {
      title: '계약 관리',
      icon: 'mdi-file-document-outline',
      children: [
        { title: '전체 계약 목록', to: { name: 'hq-contracts' } },
      ],
    },
    {
      title: '상담 관리',
      icon: 'mdi-clipboard-text-outline',
      children: [
        { title: '전체 상담 목록', to: { name: 'hq-consultations' } },
      ],
    },
    {
      title: '인수인계 관리',
      icon: 'mdi-monitor-eye',
      children: [
        { title: '전체 인수인계 현황', to: { name: 'handover-monitoring' } },
      ],
    },
    ORGANIZATION_MENU_SECTION,
    {
      title: '보험 상품 관리',
      icon: 'mdi-shield-check-outline',
      children: [
        { title: '제휴 보험사 목록', to: { name: 'insurance-partners' } },
        { title: '보험 상품 목록', to: { name: 'insurance-products' } },
      ],
    },
    {
      title: '수수료 관리',
      icon: 'mdi-cash-multiple',
      children: [
        { title: '수수료 대시보드', to: { name: 'hq-commissions' } },
      ],
    },
  ],
  [USER_ROLES.SYSTEM_ADMIN]: [
    {
      title: '시스템 관리',
      icon: 'mdi-cog-outline',
      children: [
        { title: '사용자 관리', to: { name: 'admin-users' } },
        { title: '조직 관리', to: { name: 'admin-organizations' } },
        { title: '권한 관리', to: { name: 'admin-roles' } },
      ],
    },
  ],
}
