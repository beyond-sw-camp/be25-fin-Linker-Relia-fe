import { defineStore } from 'pinia'

import { getMyEsgImpact } from '../api/esgImpact'
import {
  getLocalEsgImpactActivities,
  recordLocalEsgImpactActivity,
} from '../utils/esgImpactActivities'

function createFallbackImpact(targetMonth) {
  return {
    targetMonth,
    level: 4,
    recoveryRate: 68,
    paperSavedCount: 218,
    co2SavedKg: 3.2,
    seaLevelContribution: 0.6,
    earthTemperatureReduction: 0.08,
    consultationCount: 12,
    aiBriefingCount: 5,
    handoverCount: 2,
    eSignCount: 8,
    activities: [],
  }
}

function normalizeImpact(source, targetMonth) {
  const fallback = createFallbackImpact(targetMonth)
  const data = source ?? fallback
  const activities = mergeActivities(
    Array.isArray(data.activities) ? data.activities : [],
    getLocalEsgImpactActivities(targetMonth),
  )

  return {
    ...fallback,
    ...data,
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
    recordActivity(type, occurredAt) {
      const activity = recordLocalEsgImpactActivity(type, occurredAt)
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
