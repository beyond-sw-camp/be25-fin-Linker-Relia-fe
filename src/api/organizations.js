import { authApi, publicApi } from './axios'

/**
 * @typedef {Object} OrganizationNode
 * @property {string} id
 * @property {string} organizationCode
 * @property {string|null} parentOrganizationId
 * @property {string} organizationName
 * @property {'HQ'|'BRANCH'} organizationType
 * @property {string} organizationAddress
 * @property {string} organizationPhone
 * @property {'ACTIVE'|'INACTIVE'} organizationStatus
 * @property {OrganizationNode[]} children
 */

/**
 * @typedef {Object} BranchOption
 * @property {string} organizationId
 * @property {string} organizationCode
 * @property {string} organizationName
 */

function unwrapResult(response) {
  return response.data?.result
}

export async function getBranchOrganizations() {
  const response = await publicApi.get('/organizations/branches')
  return response.data
}

export async function getOrganizations(params = {}) {
  const response = await authApi.get('/organizations', { params })
  return unwrapResult(response)?.organizations ?? []
}

export async function getOrganizationMembers(params = {}) {
  const response = await authApi.get('/organizations/members', { params })
  return unwrapResult(response) ?? createEmptyPage(params)
}

export async function getOrganizationsBranches() {
  const response = await publicApi.get('/organizations/branches')
  return unwrapResult(response) ?? []
}

export async function getOrganizationFps(params = {}) {
  const response = await authApi.get('/organizations/fps', { params })
  return unwrapResult(response) ?? createEmptyPage(params)
}

export async function getOrganizationFpDetail(fpId, params = {}) {
  const response = await authApi.get(`/organizations/fps/${fpId}`, { params })
  return unwrapResult(response) ?? null
}

export async function getMyOrganizationFpDetail(params = {}) {
  const response = await authApi.get('/organizations/fps/me', { params })
  return unwrapResult(response) ?? null
}

export async function getMyOrganizationFpContracts(params = {}) {
  const response = await authApi.get('/organizations/fps/me/contracts', { params })
  return unwrapResult(response) ?? createEmptyPage(params)
}

export async function getOrganizationFpContracts(fpId, params = {}) {
  const response = await authApi.get(`/organizations/fps/${fpId}/contracts`, { params })
  return unwrapResult(response) ?? createEmptyPage(params)
}

export async function resignOrganizationFp(fpId, payload) {
  const response = await authApi.patch(`/organizations/fps/${fpId}/resign`, payload, {
    timeout: 30000,
  })
  return unwrapResult(response) ?? null
}

function createEmptyPage(params = {}) {
  return {
    content: [],
    page: Number(params.page ?? 1),
    size: Number(params.size ?? 10),
    totalElements: 0,
    totalPages: 0,
  }
}
