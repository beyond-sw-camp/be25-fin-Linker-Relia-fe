import { authApi } from './axios'

export async function createConsultationSttSession(payload) {
  const response = await authApi.post('/consultation-stt-sessions', payload)
  return response.data
}

export async function getConsultationSttSession(sessionId) {
  const response = await authApi.get(`/consultation-stt-sessions/${sessionId}`)
  return response.data
}

export async function completeConsultationSttSession(sessionId, payload) {
  const response = await authApi.post(`/consultation-stt-sessions/${sessionId}/complete`, payload)
  return response.data
}
