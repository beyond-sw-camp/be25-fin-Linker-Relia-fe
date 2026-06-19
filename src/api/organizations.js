import { authApi, publicApi } from './axios'

export async function getBranchOrganizations() {
  const response = await publicApi.get('/organizations/branches')
  return response.data
}

export async function getOrganizationFps(params = {}) {
  const response = await authApi.get('/organizations/fps', { params })
  return response.data
}
