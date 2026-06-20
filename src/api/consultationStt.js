import { authApi } from './axios'

export async function createConsultationSttSession(payload) {
  const response = await authApi.post('/consultation-stt-sessions', payload)
  return response.data
}

export async function getConsultationSttSession(sessionId) {
  const response = await authApi.get(`/consultation-stt-sessions/${sessionId}`)
  return response.data
}

export async function getConsultationSttAiDraft(sessionId) {
  const response = await authApi.get(`/consultation-stt-sessions/${sessionId}/ai-draft`)
  return response.data
}

export async function applyConsultationAiNote(aiNoteId) {
  const response = await authApi.patch(`/consultation-ai-notes/${aiNoteId}/apply`)
  return response.data
}

export async function completeConsultationSttSession(sessionId, payload) {
  const response = await authApi.post(`/consultation-stt-sessions/${sessionId}/complete`, payload)
  return response.data
}
