import { defineStore } from 'pinia'

import { getMyEsgImpact } from '../api/esgImpact'
import {
  ESG_ACTIVITY_PRESETS,
  getLocalEsgImpactActivities,
  recordLocalEsgImpactActivity,
} from '../utils/esgImpactActivities'

const MONTHLY_PAPER_TARGET = 250
const CO2_PER_PAPER_KG = 0.015

function createFallbackImpact(targetMonth) {
  return {
    targetMonth,
    level: 1,
    recoveryRate: 0,
    paperSavedCount: 0,
    co2SavedKg: 0,
    seaLevelContribution: 0.6,
    earthTemperatureReduction: 0.08,
    consultationCount: 0,
    aiBriefingCount: 0,
    handoverCount: 0,
    eSignCount: 8,
    activities: [],
  }
}

function normalizeImpact(source, targetMonth) {
  const fallback = createFallbackImpact(targetMonth)
  const data = source ?? fallback
  const localActivities = getLocalEsgImpactActivities(targetMonth)
  const activities = mergeActivities(
    Array.isArray(data.activities) ? data.activities : [],
    localActivities,
  )
  const basePaperSavedCount = toNumber(data.basePaperSavedCount ?? data.paperSavedCount ?? fallback.paperSavedCount)
  const localPaperSavedCount = sumPaperSavedCount(localActivities)
  const paperSavedCount = basePaperSavedCount + localPaperSavedCount
  const activityCounts = countLocalActivities(localActivities)

  return {
    ...fallback,
    ...data,
    basePaperSavedCount,
    paperSavedCount,
    co2SavedKg: roundNumber(paperSavedCount * CO2_PER_PAPER_KG, 2),
    recoveryRate: Math.min(roundNumber((paperSavedCount / MONTHLY_PAPER_TARGET) * 100, 2), 100),
    level: getLevelByPaperSavedCount(paperSavedCount),
    consultationCount: toNumber(data.consultationCount ?? fallback.consultationCount) + activityCounts.CONSULTATION,
    aiBriefingCount: toNumber(data.aiBriefingCount ?? fallback.aiBriefingCount) + activityCounts.AI_BRIEFING,
    handoverCount: toNumber(data.handoverCount ?? fallback.handoverCount) + activityCounts.HANDOVER,
    activities,
  }
}

export const useEsgImpactStore = defineStore('esgImpact', {
  state: () => ({
    data: null,
    loading: false,
    error: '',
  }),
  actions: {
    async fetchMyImpact(targetMonth) {
      this.loading = true
      this.error = ''

      try {
        const response = await getMyEsgImpact(targetMonth)
        this.data = normalizeImpact(response?.result ?? response, targetMonth)
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message ||
          'ESG Impact 정보를 불러오지 못했습니다.'
        this.data = createFallbackImpact(targetMonth)
      } finally {
        this.loading = false
      }
    },
    recordActivity(type, occurredAt, context) {
      const activity = recordLocalEsgImpactActivity(type, occurredAt, context)
      if (!activity) return

      const targetMonth = activity.targetMonth
      const currentData = normalizeImpact(this.data, targetMonth)
      this.data = {
        ...currentData,
        targetMonth,
        activities: mergeActivities([activity], currentData.activities),
      }
    },
  },
})

function mergeActivities(primaryActivities, secondaryActivities) {
  const seen = new Set()

  return [...primaryActivities, ...secondaryActivities]
    .filter((activity) => {
      const key = activity.id ?? `${activity.time}-${activity.type}-${activity.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
}

function sumPaperSavedCount(activities) {
  return activities.reduce((sum, activity) => {
    const presetPaperCount = ESG_ACTIVITY_PRESETS[activity.type]?.paperSavedCount ?? 0
    return sum + toNumber(activity.paperSavedCount ?? presetPaperCount)
  }, 0)
}

function countLocalActivities(activities) {
  return activities.reduce(
    (counts, activity) => ({
      ...counts,
      [activity.type]: (counts[activity.type] ?? 0) + 1,
    }),
    {
      CONSULTATION: 0,
      AI_BRIEFING: 0,
      HANDOVER: 0,
    },
  )
}

function getLevelByPaperSavedCount(paperSavedCount) {
  if (paperSavedCount >= 250) return 6
  if (paperSavedCount >= 200) return 5
  if (paperSavedCount >= 150) return 4
  if (paperSavedCount >= 100) return 3
  if (paperSavedCount >= 50) return 2
  return 1
}

function roundNumber(value, fractionDigits = 2) {
  const multiplier = 10 ** fractionDigits
  return Math.round((toNumber(value) + Number.EPSILON) * multiplier) / multiplier
}

function toNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}
