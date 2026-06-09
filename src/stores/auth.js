import { defineStore } from 'pinia'

import { DEMO_USERS, getDefaultRouteByRole, sanitizeUser } from '../constants/auth'

const STORAGE_KEY = 'relia-auth-user'

function loadStoredUser() {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function persistUser(user) {
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadStoredUser(),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    userRole: (state) => state.user?.userRole ?? null,
    displayName: (state) => state.user?.userName ?? '',
    defaultRoutePath: (state) => getDefaultRouteByRole(state.user?.userRole),
  },
  actions: {
    login(credentials) {
      const matchedUser = DEMO_USERS.find(
        (user) => user.loginId === credentials.loginId && user.password === credentials.password,
      )

      if (!matchedUser) {
        throw new Error('로그인 ID 또는 비밀번호를 다시 확인해 주세요.')
      }

      this.user = sanitizeUser(matchedUser)
      persistUser(this.user)

      return this.user
    },
    logout() {
      this.user = null
      persistUser(null)
    },
    signUpFp(payload) {
      const loginTaken = DEMO_USERS.some((user) => user.loginId === payload.loginId)

      if (loginTaken) {
        throw new Error('이미 사용 중인 로그인 ID입니다.')
      }

      return {
        success: true,
        message: '회원가입이 완료되었습니다. 로그인 후 이용해 주세요.',
      }
    },
  },
})
