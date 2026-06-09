import axios from 'axios'

const apiOrigin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const baseURL = `${apiOrigin.replace(/\/+$/, '')}/api`

export const publicApi = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
})

export const authApi = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
})

const refreshApi = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
})

let getAccessToken = () => null
let applyAccessToken = () => {}
let handleAuthFailure = async () => {}

let isRefreshing = false
let refreshWaiters = []

function resolveRefreshWaiters(error, token) {
  refreshWaiters.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }

    resolve(token)
  })

  refreshWaiters = []
}

function shouldSkipRefresh(url) {
  return ['/auth/login', '/auth/reissue'].some((path) => url?.includes(path))
}

async function refreshAccessToken() {
  const response = await refreshApi.post('/auth/reissue')
  const newToken = response.data?.result?.newAccessToken

  if (!newToken) {
    throw new Error('재발급 응답에 access token이 없습니다.')
  }

  applyAccessToken(newToken)
  return newToken
}

export function bindAuthSessionHandlers(handlers) {
  getAccessToken = handlers.getAccessToken
  applyAccessToken = handlers.applyAccessToken
  handleAuthFailure = handlers.handleAuthFailure
}

authApi.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (!originalRequest || status !== 401 || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      try {
        const token = await new Promise((resolve, reject) => {
          refreshWaiters.push({ resolve, reject })
        })

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${token}`
        return authApi(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      resolveRefreshWaiters(null, newToken)
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return authApi(originalRequest)
    } catch (refreshError) {
      resolveRefreshWaiters(refreshError, null)
      await handleAuthFailure()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
