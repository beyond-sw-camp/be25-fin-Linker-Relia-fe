import { authApi } from './axios'

export async function getHandoverSummary(params = {}) {
  const response = await authApi.get('/handovers/summary', { params })
  return response.data
}

export async function getHandovers(params = {}) {
  const response = await authApi.get('/handovers', { params })
  return response.data
}

export async function getHandoverDetail(handoverRequestId) {
  const response = await authApi.get(`/handovers/${handoverRequestId}`)
  return response.data
}

export async function processHandoverApproval(handoverRequestId, payload) {
  const response = await authApi.patch(`/handovers/${handoverRequestId}/approval`, payload)
  return response.data
}

export async function getAssignableFps(handoverRequestId, params = {}) {
  const response = await authApi.get(`/handovers/${handoverRequestId}/assignable-fps`, { params })
  return response.data
}

export async function assignHandoverFp(handoverRequestId, payload) {
  const response = await authApi.post(`/handovers/${handoverRequestId}/assign`, payload)
  return response.data
}

export async function getReceivedHandovers(params = {}) {
  const response = await authApi.get('/handovers/received', { params })
  return response.data
}

export async function getReceivedHandoverSummary() {
  const response = await authApi.get('/handovers/received/summary')
  return response.data
}
