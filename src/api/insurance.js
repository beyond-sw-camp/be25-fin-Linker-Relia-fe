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
