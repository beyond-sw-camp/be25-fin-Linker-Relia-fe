import { authApi } from './axios'

export async function getFpDashboardSummary(params) {
  const response = await authApi.get('/dashboard/fp/summary', { params })
  return response.data
}

export async function getFpDashboardContractStatus(params) {
  const response = await authApi.get('/dashboard/fp/contracts/status', { params })
  return response.data
}

export async function getFpDashboardContractDistribution(params) {
  const response = await authApi.get('/dashboard/fp/contracts/distribution', { params })
  return response.data
}

export async function getFpDashboardMonthlyContractCustomerTrend(params) {
  const response = await authApi.get('/dashboard/fp/monthly-contract-customer-trend', { params })
  return response.data
}

export async function getFpDashboardMonthlyCommissionTrend(params) {
  const response = await authApi.get('/dashboard/fp/monthly-commission-trend', { params })
  return response.data
}
