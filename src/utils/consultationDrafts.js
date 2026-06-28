const DRAFT_STORAGE_KEY = 'relia.consultationDrafts'
const SAVED_CONSULTATION_STORAGE_KEY = 'relia.savedConsultations'

export function getConsultationDrafts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getConsultationDraft(draftId) {
  return getConsultationDrafts().find((draft) => draft.id === draftId) ?? null
}

export function saveConsultationDraft(payload, draftId) {
  const now = new Date().toISOString()
  const drafts = getConsultationDrafts()
  const id = draftId || (window.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const nextDraft = {
    id,
    ...payload,
    draftStatus: '임시저장',
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
  const nextDrafts = drafts.some((draft) => draft.id === id)
    ? drafts.map((draft) => (draft.id === id ? nextDraft : draft))
    : [nextDraft, ...drafts]

  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
  return nextDraft
}

export function deleteConsultationDraft(draftId) {
  const nextDrafts = getConsultationDrafts().filter((draft) => draft.id !== draftId)
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
}

export function normalizeDraftResponse(draft) {
  if (!draft) return null

  const parsedDraftData = parseDraftData(draft.draftData)
  return {
    ...parsedDraftData,
    id: draft.draftId || draft.id || parsedDraftData.id,
    draftId: draft.draftId || draft.id || parsedDraftData.draftId,
    customerId: draft.customerId ?? parsedDraftData.customerId,
    contractId: draft.contractId ?? parsedDraftData.contractId,
    consultationType: draft.consultationType ?? parsedDraftData.consultationType,
    consultationChannel: draft.consultationChannel ?? parsedDraftData.consultationChannel,
    consultedAt: draft.consultedAt ?? parsedDraftData.consultedAt,
    specialNote: draft.specialNote ?? parsedDraftData.specialNote,
    consultationContent: parsedDraftData.consultationContent ?? draft.consultationContent,
    nextScheduledAt: draft.nextScheduledAt ?? parsedDraftData.nextScheduledAt,
    updatedAt: draft.lastSavedAt ?? draft.updatedAt ?? parsedDraftData.updatedAt,
    createdAt: parsedDraftData.createdAt ?? draft.lastSavedAt,
    draftStatus: '임시저장',
  }
}

function parseDraftData(draftData) {
  if (!draftData) return {}
  if (typeof draftData === 'object') return draftData

  try {
    const parsed = JSON.parse(draftData)
    if (typeof parsed === 'string') {
      const reparsed = JSON.parse(parsed)
      return reparsed && typeof reparsed === 'object' ? reparsed : {}
    }
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getSavedConsultations() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_CONSULTATION_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getSavedConsultation(consultationId) {
  return getSavedConsultations().find((consultation) => consultation.consultationId === consultationId) ?? null
}

export function saveCompletedConsultation(payload) {
  const savedConsultations = getSavedConsultations()
  const consultationId = payload.consultationId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const nextRecord = {
    ...payload,
    consultationId,
    savedAt: new Date().toISOString(),
    isLocalCompleted: true,
  }
  const nextConsultations = [
    nextRecord,
    ...savedConsultations.filter((consultation) => consultation.consultationId !== consultationId),
  ].slice(0, 200)

  window.localStorage.setItem(SAVED_CONSULTATION_STORAGE_KEY, JSON.stringify(nextConsultations))
  return nextRecord
}
