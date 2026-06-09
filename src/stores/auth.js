import { defineStore } from 'pinia'

import { reissueAuth, loginAuth, logoutAuth } from '../api/auth'
import { getDefaultRouteByRole } from '../constants/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    isAuthenticated: false,
    role: null,
    userName: '',
    organizationName: '',
    isAuthInitializing: true,
  }),
  getters: {
    userRole: (state) => state.role,
    displayName: (state) => state.userName,
    defaultRoutePath: (state) => getDefaultRouteByRole(state.role),
    user: (state) => ({
      userName: state.userName,
      organizationName: state.organizationName,
      userRole: state.role,
    }),
  },
  actions: {
    setAuth(loginResult) {
      this.accessToken = loginResult.accessToken
      this.role = loginResult.role
      this.userName = loginResult.userName
      this.organizationName = loginResult.organizationName
      this.isAuthenticated = Boolean(loginResult.accessToken)
    },
    setAccessToken(token) {
      this.accessToken = token
      this.isAuthenticated = Boolean(token)
    },
    clearAuth() {
      this.accessToken = null
      this.isAuthenticated = false
      this.role = null
      this.userName = ''
      this.organizationName = ''
    },
    async login(credentials) {
      const data = await loginAuth(credentials)
      this.setAuth(data.result)
      return data.result
    },
    async restoreSession() {
      this.isAuthInitializing = true

      try {
        const data = await reissueAuth()
        this.setAccessToken(data.result.newAccessToken)
      } catch {
        this.clearAuth()
      } finally {
        this.isAuthInitializing = false
      }
    },
    async logout() {
      try {
        await logoutAuth()
      } finally {
        this.clearAuth()
      }
    },
  },
})
