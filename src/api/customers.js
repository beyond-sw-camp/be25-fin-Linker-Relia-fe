import { authApi } from './axios'

export async function getCustomers(params) {
  const response = await authApi.get('/customers', { params })
  return response.data
}

export async function getInterestCustomers(params) {
  const response = await authApi.get('/customers/interests', { params })
  return response.data
}

export async function getCustomerDetail(customerId) {
  const response = await authApi.get(`/customers/${customerId}`)
  return response.data
}

export async function getCustomerContracts(customerId, params) {
  const response = await authApi.get(`/customers/${customerId}/contracts`, { params })
  return response.data
}

export async function getCustomerConsultations(customerId, params) {
  const response = await authApi.get(`/customers/${customerId}/consultations`, { params })
  return response.data
}

export async function getCustomerAiBriefing(customerId) {
  const response = await authApi.get(`/customers/${customerId}/ai-briefing`)
  return response.data
}

export async function createCustomerAiBriefing(customerId) {
  const response = await authApi.post(`/customers/${customerId}/ai-briefing`)
  return response.data
}

export async function getCustomerFpHistories(customerId, params) {
  const response = await authApi.get(`/customers/${customerId}/fp-histories`, { params })
  return response.data
}
