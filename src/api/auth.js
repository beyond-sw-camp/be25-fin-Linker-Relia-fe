import { authApi, publicApi } from './axios'

export async function loginAuth(payload) {
  const response = await publicApi.post('/auth/login', payload)
  return response.data
}

export async function reissueAuth() {
  const response = await publicApi.post('/auth/reissue')
  return response.data
}

export async function logoutAuth() {
  const response = await authApi.post('/auth/logout')
  return response.data
}

export async function signupFp(payload) {
  const response = await publicApi.post('/users', payload)
  return response.data
}
