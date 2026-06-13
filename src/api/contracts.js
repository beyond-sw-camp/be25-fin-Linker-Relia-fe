import { authApi } from './axios'

export async function getContracts(params) {
  const response = await authApi.get('/contracts', { params })
  return response.data
}

export async function createContract(payload) {
  const response = await authApi.post('/contracts', payload)
  return response.data
}

export async function getContractDetail(contractId) {
  const response = await authApi.get(`/contracts/${contractId}`)
  return response.data
}

export async function getContractSummary(params) {
  const response = await authApi.get('/contracts/summary', { params })
  return response.data
}

export async function getInsuranceCompanyContractStatuses(params) {
  const response = await authApi.get('/contracts/insurance-companies', { params })
  return response.data
}

export async function getMonthlyContractTrend(params) {
  const response = await authApi.get('/contracts/monthly-trend', { params })
  return response.data
}
