import { authApi } from './axios'

export async function getFpCommissionSummary(params) {
  const response = await authApi.get('/commissions/fp-summary', { params })
  return response.data
}

export async function getOrganizationCommissionSummary(params) {
  const response = await authApi.get('/commissions/organization-summary', { params })
  return response.data
}

export async function getCommissionPaymentTypeSummary(params) {
  const response = await authApi.get('/commissions/payment-types/summary', { params })
  return response.data
}

export async function getCommissionInsuranceCompanySummary(params) {
  const response = await authApi.get('/commissions/insurance-companies/summary', { params })
  return response.data
}
