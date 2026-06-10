import { publicApi } from './axios'

export async function getBranchOrganizations() {
  const response = await publicApi.get('/organizations/branches')
  return response.data
}
