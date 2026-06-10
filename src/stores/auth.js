import { defineStore } from 'pinia'

import { reissueAuth, loginAuth, logoutAuth } from '../api/auth'
import { getDefaultRouteByRole } from '../constants/auth'

const AUTH_PROFILE_STORAGE_KEY = 'relia.auth.profile'

function readStoredAuthProfile() {
  if (typeof window === 'undefined') {
    return {
      role: null,
      userName: '',
      organizationName: '',
    }
  }

  try {
    const rawValue = window.sessionStorage.getItem(AUTH_PROFILE_STORAGE_KEY)

    if (!rawValue) {
      return {
        role: null,
        userName: '',
        organizationName: '',
      }
    }

    const parsedValue = JSON.parse(rawValue)

    return {
      role: parsedValue.role ?? null,
      userName: parsedValue.userName ?? '',
      organizationName: parsedValue.organizationName ?? '',
    }
  } catch {
    return {
      role: null,
      userName: '',
      organizationName: '',
    }
  }
}

function writeStoredAuthProfile(profile) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

function clearStoredAuthProfile() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ...readStoredAuthProfile(),
    accessToken: null,
    isAuthenticated: false,
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
    setProfile(profile) {
      this.role = profile.role ?? null
      this.userName = profile.userName ?? ''
      this.organizationName = profile.organizationName ?? ''

      writeStoredAuthProfile({
        role: this.role,
        userName: this.userName,
        organizationName: this.organizationName,
      })
    },
    setAuth(loginResult) {
      this.accessToken = loginResult.accessToken
      this.setProfile({
        role: loginResult.role,
        userName: loginResult.userName,
        organizationName: loginResult.organizationName,
      })
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
      clearStoredAuthProfile()
    },
    async login(credentials) {
      const data = await loginAuth(credentials)
      this.setAuth(data.result)
      return data.result
    },
    async restoreSession() {
      this.isAuthInitializing = true

      try {
        const storedProfile = readStoredAuthProfile()
        this.role = storedProfile.role
        this.userName = storedProfile.userName
        this.organizationName = storedProfile.organizationName

        const data = await reissueAuth()
        this.setAccessToken(data.result.newAccessToken)

        if (data.result.role || data.result.userName || data.result.organizationName) {
          this.setProfile({
            role: data.result.role,
            userName: data.result.userName,
            organizationName: data.result.organizationName,
          })
        }
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
