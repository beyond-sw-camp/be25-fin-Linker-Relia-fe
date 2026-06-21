import { authApi } from './axios'

export async function getInsuranceCompanies() {
  const response = await authApi.get('/insurance/companies')
  return response.data
}

export async function getInsuranceCategories() {
  const response = await authApi.get('/insurance/categories')
  return response.data
}

export async function getInsuranceProducts(params) {
  const response = await authApi.get('/insurance/products', { params })
  return response.data
}

export async function getInsuranceManagementCompanies(params) {
  const response = await authApi.get('/insurance-management/companies', { params })
  return response.data
}

export async function getInsuranceManagementCompanyDetail(insuranceCompanyId) {
  const response = await authApi.get(`/insurance-management/companies/${insuranceCompanyId}`)
  return response.data
}

export async function createInsuranceManagementCompany(payload) {
  const response = await authApi.post('/insurance-management/companies', payload)
  return response.data
}

export async function updateInsuranceManagementCompany(insuranceCompanyId, payload) {
  const response = await authApi.patch(`/insurance-management/companies/${insuranceCompanyId}`, payload)
  return response.data
}
