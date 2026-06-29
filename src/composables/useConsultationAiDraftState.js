import { computed, onBeforeUnmount, ref } from 'vue'

import {
  getConsultationAiDraft,
} from '../api/consultationStt'
import { deepClone, setValueByPath } from '../utils/objectPath'

const TERMINAL_STATUSES = new Set(['GPT_COMPLETED', 'FAILED', 'APPLIED'])
const EDITABLE_TERMINAL_STATUSES = new Set(['GPT_COMPLETED', 'FAILED', 'APPLIED'])

function upper(value) {
  return String(value || '').trim().toUpperCase()
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function toText(value, fallback = '') {
  return String(value ?? fallback ?? '').trim()
}

function getResolutionValue(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return candidate
  }

  if (candidate.resolvedValue !== undefined) return candidate.resolvedValue
  if (candidate.value !== undefined) return candidate.value
  if (candidate.code !== undefined) return candidate.code
  if (candidate.id !== undefined) return candidate.id
  return candidate
}

function makeFieldId(source, index) {
  return String(
    source?.id ??
      source?.fieldId ??
      source?.fieldKey ??
      source?.key ??
      source?.fieldPath ??
      source?.path ??
      `resolution-${index}`,
  )
}

function makeFieldPath(source) {
  return String(source?.fieldPath ?? source?.path ?? source?.jsonPath ?? source?.targetPath ?? source?.key ?? '')
}

function makeFieldLabel(source) {
  const explicitLabel = source?.label ?? source?.fieldLabel ?? source?.displayName ?? source?.fieldName
  if (explicitLabel) {
    return String(explicitLabel)
  }

  const path = makeFieldPath(source)
  if (!path) {
    return '확인 필요 항목'
  }

  const lastSegment = path.split('.').filter(Boolean).pop()
  return lastSegment || path
}

function normalizeCandidates(candidates, fieldId) {
  if (!Array.isArray(candidates)) {
    return []
  }

  return candidates.map((candidate, index) => {
    const resolvedValue = getResolutionValue(candidate)
    const label =
      candidate?.label ??
      candidate?.displayValue ??
      candidate?.name ??
      candidate?.code ??
      (typeof resolvedValue === 'string' ? resolvedValue : JSON.stringify(resolvedValue))

    return {
      key: `${fieldId}:${index}`,
      id: candidate?.id ?? '',
      code: candidate?.code ?? '',
      label: toText(label, `후보 ${index + 1}`),
      subLabel: toText(candidate?.subLabel ?? candidate?.description ?? candidate?.reason ?? candidate?.message),
      value: resolvedValue,
      raw: candidate,
    }
  })
}

function normalizeResolutionField(field, index) {
  const id = makeFieldId(field, index)
  const candidates = normalizeCandidates(field?.candidates ?? field?.options ?? field?.candidateList, id)
  const status = upper(field?.status)

  return {
    id,
    path: makeFieldPath(field),
    label: makeFieldLabel(field),
    rawValue: field?.rawValue ?? field?.currentValue ?? field?.value ?? null,
    currentValue: field?.rawValue ?? field?.currentValue ?? field?.value ?? null,
    status,
    message: toText(field?.message ?? field?.reason ?? field?.resolutionMessage),
    candidates,
    canManualEdit: status === 'NO_CANDIDATE' || candidates.length === 0,
  }
}

function normalizeDraftRecord(payload) {
  const record = payload?.result ?? payload ?? null
  if (!record || typeof record !== 'object') {
    return null
  }

  const resolutions = record?.resolutions ?? {}
  const fields = Array.isArray(resolutions?.fields) ? resolutions.fields.map(normalizeResolutionField) : []
  const warnings = Array.isArray(record?.warnings) ? record.warnings : []

  return {
    ...record,
    aiNoteId: record?.aiNoteId ?? record?.consultationAiNoteId ?? record?.id ?? '',
    sessionId: record?.sessionId ?? '',
    consultationType: record?.consultationType ?? '',
    draftStatus: upper(record?.draftStatus ?? record?.status ?? record?.aiNoteStatus),
    sttRawText: record?.sttRawText ?? record?.rawText ?? '',
    summaryText: record?.summaryText ?? record?.structuredData?.summaryText ?? '',
    structuredData: record?.structuredData ?? record?.draft ?? null,
    errorMessage: toText(record?.errorMessage ?? record?.message),
    warnings,
    resolutions: {
      hasPendingResolution: Boolean(resolutions?.hasPendingResolution),
      fields,
    },
  }
}

function sanitizeStructuredData(structuredData, resolutionFields) {
  const nextStructuredData = deepClone(structuredData ?? null)

  if (!nextStructuredData || !Array.isArray(resolutionFields)) {
    return nextStructuredData
  }

  resolutionFields.forEach((field) => {
    if (!field?.path) {
      return
    }

    if (field.status === 'NEEDS_USER_CONFIRMATION' || field.status === 'NO_CANDIDATE') {
      setValueByPath(nextStructuredData, field.path, null)
    }
  })

  return nextStructuredData
}

function normalizeApiError(error, fallbackMessage) {
  const code =
    error?.response?.data?.code ??
    error?.response?.data?.errorCode ??
    error?.response?.data?.result?.code ??
    ''

  if (code === 'CONSULTATION_016') {
    return 'AI 초안이 아직 준비되지 않았거나 확인이 필요한 항목이 남아 있습니다.'
  }

  return (
    error?.response?.data?.message ??
    error?.response?.data?.errorMessage ??
    error?.message ??
    fallbackMessage
  )
}

export function useConsultationAiDraftState() {
  const draftRecord = ref(null)
  const editableStructuredData = ref(null)
  const isLoading = ref(false)
  const isPolling = ref(false)
  const errorMessage = ref('')
  const pollAttempt = ref(0)
  const activeSessionId = ref('')
  const disposed = ref(false)
  const activePollToken = ref(0)

  function applyDraft(payload) {
    const normalized = normalizeDraftRecord(payload)
    draftRecord.value = normalized
    editableStructuredData.value = sanitizeStructuredData(normalized?.structuredData, normalized?.resolutions?.fields)

    return normalized
  }

  async function fetchDraft(sessionId) {
    const response = await getConsultationAiDraft(sessionId)
    return applyDraft(response)
  }

  async function startPolling(sessionId, options = {}) {
    const { intervalMs = 1500, maxAttempts = 40, immediate = true } = options

    if (!sessionId) {
      return null
    }

    const pollToken = Date.now()
    activePollToken.value = pollToken
    activeSessionId.value = sessionId
    isLoading.value = immediate
    isPolling.value = true
    errorMessage.value = ''
    pollAttempt.value = 0

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (disposed.value || activePollToken.value !== pollToken) {
          return draftRecord.value
        }

        pollAttempt.value = attempt

        try {
          const draft = await fetchDraft(sessionId)
          if (EDITABLE_TERMINAL_STATUSES.has(draft?.draftStatus || '')) {
            return draft
          }
        } catch (error) {
          if (error?.response?.status !== 404) {
            errorMessage.value = normalizeApiError(error, 'AI 초안 조회에 실패했습니다.')
            return null
          }
        }

        if (attempt < maxAttempts) {
          isLoading.value = false
          await wait(intervalMs)
        }
      }

      errorMessage.value = 'AI 초안 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
      return draftRecord.value
    } finally {
      if (activePollToken.value === pollToken) {
        isLoading.value = false
        isPolling.value = false
      }
    }
  }

  async function retry() {
    if (!activeSessionId.value || isPolling.value) {
      return draftRecord.value
    }

    return startPolling(activeSessionId.value, { immediate: true })
  }

  function reset() {
    activePollToken.value = 0
    draftRecord.value = null
    editableStructuredData.value = null
    isLoading.value = false
    isPolling.value = false
    errorMessage.value = ''
    pollAttempt.value = 0
    activeSessionId.value = ''
  }

  const draftStatus = computed(() => draftRecord.value?.draftStatus || '')
  const aiDraftId = computed(() => draftRecord.value?.aiNoteId || '')
  const summaryText = computed(() => toText(draftRecord.value?.summaryText || draftRecord.value?.structuredData?.summaryText))
  const sttRawText = computed(() => toText(draftRecord.value?.sttRawText))
  const resolutionFields = computed(() => draftRecord.value?.resolutions?.fields || [])
  const warnings = computed(() => draftRecord.value?.warnings || [])
  const serverHasPendingResolution = computed(() => Boolean(draftRecord.value?.resolutions?.hasPendingResolution))
  const canApply = computed(() => {
    return (
      !!draftRecord.value?.aiNoteId &&
      draftRecord.value?.draftStatus === 'GPT_COMPLETED'
    )
  })
  const isFailed = computed(() => draftStatus.value === 'FAILED')
  const isCompleted = computed(() => TERMINAL_STATUSES.has(draftStatus.value))
  const hasDraft = computed(() => Boolean(draftRecord.value?.aiNoteId))

  onBeforeUnmount(() => {
    disposed.value = true
    activePollToken.value = 0
  })

  return {
    draftRecord,
    editableStructuredData,
    draftStatus,
    aiDraftId,
    summaryText,
    sttRawText,
    resolutionFields,
    warnings,
    serverHasPendingResolution,
    canApply,
    hasDraft,
    isLoading,
    isPolling,
    isFailed,
    isCompleted,
    errorMessage,
    pollAttempt,
    fetchDraft,
    startPolling,
    retry,
    reset,
    applyDraft,
  }
}
