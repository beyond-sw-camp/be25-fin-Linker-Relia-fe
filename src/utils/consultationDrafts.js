const DRAFT_STORAGE_KEY = 'relia.consultationDrafts'

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
  const id = draftId || `draft-${Date.now()}`
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
