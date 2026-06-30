const ESG_ACTIVITY_STORAGE_KEY = 'relia.esg.activities'

export const ESG_ACTIVITY_PRESETS = {
  CONSULTATION: {
    title: '상담일지 작성',
    description: '종이 3장 절감',
    paperSavedCount: 3,
    seaLevelDelta: -0.02,
  },
  AI_BRIEFING: {
    title: 'AI 브리핑 생성',
    description: '종이 5장 절감',
    paperSavedCount: 5,
    seaLevelDelta: -0.03,
  },
  HANDOVER: {
    title: '인수인계 완료',
    description: '종이 4장 절감',
    paperSavedCount: 4,
    seaLevelDelta: -0.025,
  },
}

export function recordLocalEsgImpactActivity(type, occurredAt = new Date(), context = {}) {
  const preset = ESG_ACTIVITY_PRESETS[type]
  if (!preset || typeof window === 'undefined') return null

  const occurredDate = normalizeDate(occurredAt)
  const sourceId = String(context.sourceId ?? context.id ?? '').trim()
  const activity = {
    id: sourceId ? `${type}-${sourceId}` : `${type}-${occurredDate.getTime()}`,
    targetMonth: formatMonth(occurredDate),
    time: formatTime(occurredDate),
    type,
    isLocal: true,
    ...preset,
  }
  const activities = readLocalEsgImpactActivities()
  const nextActivities = [activity, ...activities.filter((item) => item.id !== activity.id)].slice(0, 50)
  window.localStorage.setItem(ESG_ACTIVITY_STORAGE_KEY, JSON.stringify(nextActivities))

  return activity
}

export function getLocalEsgImpactActivities(targetMonth) {
  return readLocalEsgImpactActivities().filter((activity) => activity.targetMonth === targetMonth)
}

function readLocalEsgImpactActivities() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(ESG_ACTIVITY_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value || '')
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
