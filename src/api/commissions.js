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

export async function getCommissionFpList(params) {
  const response = await authApi.get('/commissions/fp-list', { params })
  return response.data
}

export async function getCommissionOrganizationList(params) {
  const response = await authApi.get('/commissions/organization-list', { params })
  return response.data
}

export async function getHqCommissionStatementPdf(params) {
  const response = await authApi.get('/commissions/statements/hq/pdf', {
    params,
    responseType: 'blob',
  })
  return response.data
}

export async function getBranchCommissionStatementPdf(organizationCode, params) {
  const response = await authApi.get(`/commissions/statements/organizations/${organizationCode}/pdf`, {
    params,
    responseType: 'blob',
  })
  return response.data
}

export async function getOwnBranchCommissionStatementPdf(params) {
  const response = await authApi.get('/commissions/statements/branch/pdf', {
    params,
    responseType: 'blob',
  })
  return response.data
}

export async function getFpCommissionStatementPdf(fpId, params) {
  const response = await authApi.get(`/commissions/statements/fps/${fpId}/pdf`, {
    params,
    responseType: 'blob',
  })
  return response.data
}

export async function getMyCommissionStatementPdf(params) {
  const response = await authApi.get('/commissions/statements/me/pdf', {
    params,
    responseType: 'blob',
  })
  return response.data
}
