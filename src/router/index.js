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
import ForbiddenView from '../views/system/ForbiddenView.vue'

const protectedChildren = APP_PAGE_SPECS.map((page) => ({
  path: page.path,
  name: page.name,
  component: PlaceholderView,
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
}))

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
