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
