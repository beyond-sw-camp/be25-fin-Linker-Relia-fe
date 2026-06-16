import { authApi } from './axios'

export async function getFpDashboardSummary(params) {
  const response = await authApi.get('/dashboard/fp/summary', { params })
  return response.data
}
