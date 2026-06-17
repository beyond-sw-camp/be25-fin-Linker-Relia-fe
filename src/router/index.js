import { createRouter, createWebHistory } from 'vue-router'

import { DEFAULT_ROUTE_BY_ROLE } from '../constants/auth'
import { APP_PAGE_SPECS } from '../constants/navigation'
import AppLayout from '../layouts/AppLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'
import FpSignupView from '../views/auth/FpSignupView.vue'
import LoginView from '../views/auth/LoginView.vue'
import PlaceholderView from '../views/common/PlaceholderView.vue'
import BranchCommissionView from '../views/commission/BranchCommissionView.vue'
import FpCommissionView from '../views/commission/FpCommissionView.vue'
import HqCommissionView from '../views/commission/HqCommissionView.vue'
import BranchContractListView from '../views/contract/BranchContractListView.vue'
import ContractCreateView from '../views/contract/ContractCreateView.vue'
import ContractDetailView from '../views/contract/ContractDetailView.vue'
import FpContractListView from '../views/contract/FpContractListView.vue'
import HqContractListView from '../views/contract/HqContractListView.vue'
import CustomerDetailView from '../views/customer/CustomerDetailView.vue'
import CustomerListView from '../views/customer/CustomerListView.vue'
import InterestCustomerListView from '../views/customer/InterestCustomerListView.vue'
import HandoverDetailView from '../views/handover/HandoverDetailView.vue'
import HandoverReceivedListView from '../views/handover/HandoverReceivedListView.vue'
import HandoverRequestListView from '../views/handover/HandoverRequestListView.vue'
import ForbiddenView from '../views/system/ForbiddenView.vue'

function resolveProtectedComponent(page) {
  if (['fp-customers', 'branch-customers', 'hq-customers'].includes(page.name)) {
    return CustomerListView
  }

  if (['fp-customer-interests', 'branch-customer-interests', 'hq-customer-interests'].includes(page.name)) {
    return InterestCustomerListView
  }

  if (page.name === 'fp-contracts') {
    return FpContractListView
  }

  if (page.name === 'contract-create') {
    return ContractCreateView
  }

  if (page.name === 'branch-contracts') {
    return BranchContractListView
  }

  if (page.name === 'hq-contracts') {
    return HqContractListView
  }

  if (['handover-requests', 'handover-monitoring'].includes(page.name)) {
    return HandoverRequestListView
  }

  if (page.name === 'handover-received') {
    return HandoverReceivedListView
  }

  if (page.name === 'fp-commissions') {
    return FpCommissionView
  }

  if (page.name === 'branch-commissions') {
    return BranchCommissionView
  }

  if (page.name === 'hq-commissions') {
    return HqCommissionView
  }

  return PlaceholderView
}

const protectedChildren = APP_PAGE_SPECS.map((page) => ({
  path: page.path,
  name: page.name,
  component: resolveProtectedComponent(page),
  props: {
    title: page.title,
    description: page.description,
    roles: page.roles,
  },
  meta: {
    requiresAuth: true,
    roles: page.roles,
    title: page.title,
  },
})).concat([
  {
    path: 'handovers/:handoverRequestId',
    name: 'handover-detail',
    component: HandoverDetailView,
    meta: {
      requiresAuth: true,
      roles: ['FP', 'BRANCH_MANAGER', 'HQ_MANAGER', 'SYSTEM_ADMIN'],
      title: '인수인계 요청 상세',
    },
  },
  {
    path: 'customers/detail/:customerId',
    name: 'customer-detail',
    component: CustomerDetailView,
    meta: {
      requiresAuth: true,
      roles: ['FP', 'BRANCH_MANAGER', 'HQ_MANAGER'],
      title: '고객 상세',
    },
  },
  {
    path: 'contracts/:contractId',
    name: 'contract-detail',
    component: ContractDetailView,
    meta: {
      requiresAuth: true,
      roles: ['FP', 'BRANCH_MANAGER', 'HQ_MANAGER'],
      title: '계약 상세',
    },
  },
])

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: {
        requiresAuth: true,
      },
      children: protectedChildren,
    },
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginView,
          meta: {
            title: '로그인',
          },
        },
      ],
    },
    {
      path: '/signup/fp',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'fp-signup',
          component: FpSignupView,
          meta: {
            title: '설계사 회원가입',
          },
        },
      ],
    },
    {
      path: '/403',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'forbidden',
          component: ForbiddenView,
          meta: {
            title: '접근 권한 없음',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

async function waitForAuthInitialization(authStore) {
  while (authStore.isAuthInitializing) {
    await new Promise((resolve) => window.setTimeout(resolve, 10))
  }
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const allowedRoles = to.matched.flatMap((record) => record.meta.roles ?? [])

  if (authStore.isAuthInitializing) {
    await waitForAuthInitialization(authStore)
  }

  if (to.path === '/') {
    if (!authStore.accessToken) {
      return '/login'
    }

    return DEFAULT_ROUTE_BY_ROLE[authStore.userRole]
  }

  if (requiresAuth && !authStore.accessToken) {
    return '/login'
  }

  if (authStore.accessToken && ['/login', '/signup/fp'].includes(to.path)) {
    return authStore.defaultRoutePath
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.userRole)) {
    return '/403'
  }

  return true
})

export default router
