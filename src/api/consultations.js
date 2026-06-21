import { authApi } from './axios'

export async function getConsultations(params) {
  const response = await authApi.get('/consultations', { params })
  return response.data
}

export async function getConsultation(consultationId) {
  const response = await authApi.get(`/consultations/${consultationId}`)
  return response.data
}

export async function createConsultation(payload) {
  const response = await authApi.post('/consultations', payload)
  return response.data
}

export async function getConsultationDraftsFromApi() {
  const response = await authApi.get('/consultation-drafts')
  return response.data
}

export async function getConsultationDraftFromApi(draftId) {
  const response = await authApi.get(`/consultation-drafts/${draftId}`)
  return response.data
}

export async function saveConsultationDraftToApi(payload) {
  const response = await authApi.post('/consultation-drafts', payload)
  return response.data
}

export async function deleteConsultationDraftFromApi(draftId) {
  const response = await authApi.delete(`/consultation-drafts/${draftId}`)
  return response.data
}
