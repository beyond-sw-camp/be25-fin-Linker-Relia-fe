<template>
  <div
    v-if="open"
    class="stt-preview-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="stt-preview-modal-title"
  >
    <div class="stt-preview-modal__backdrop" @click="handleClose"></div>

    <section class="stt-preview-modal__panel">
      <header class="stt-preview-modal__header">
        <div>
          <p>AI 녹음</p>
          <h2 id="stt-preview-modal-title">녹음</h2>
        </div>
        <button type="button" aria-label="Close" @click="handleClose">×</button>
      </header>

      <div class="stt-preview-modal__body" :class="{ 'stt-preview-modal__body--recording': currentStep === 1 }">
        <div class="stt-stepper">
          <button
            type="button"
            class="stt-stepper__item"
            :class="{ 'is-active': currentStep === 1, 'is-complete': currentStep > 1 }"
            @click="goToStep(1)"
          >
            <span>1</span>
            <strong>STT</strong>
          </button>
          <div class="stt-stepper__line"></div>
          <button
            type="button"
            class="stt-stepper__item"
            :class="{ 'is-active': currentStep === 2 }"
            :disabled="!canOpenSummaryStep"
            @click="goToStep(2)"
          >
            <span>2</span>
            <strong>요약 미리보기</strong>
          </button>
        </div>

        <section v-show="currentStep === 1" class="stt-slide stt-slide--recording">
          <div class="stt-recorder__timer">{{ formattedElapsedTime }}</div>

          <div
            class="stt-recorder__mic-shell"
            :class="{
              'is-live': recordingState === 'RECORDING',
              'is-paused': recordingState === 'PAUSED',
              'is-processing': sessionStatus === 'PROCESSING',
            }"
          >
            <div class="stt-recorder__mic-core">
              <v-icon icon="mdi-microphone" size="96" />
            </div>
          </div>

          <button
            type="button"
            class="stt-recorder__status-pill"
            :class="statusPillClass"
            :disabled="!canToggleRecording"
            @click="handlePrimaryRecorderAction"
          >
            <span class="stt-recorder__status-dot"></span>
            {{ primaryRecorderButtonLabel }}
          </button>

          <div class="stt-recorder__actions">
            <button
              type="button"
              class="stt-button stt-button--danger"
              :disabled="!canStopRecording"
              @click="handleStopAndContinue"
            >
              녹음 종료
            </button>
          </div>

          <section class="stt-results">
            <div class="stt-results__header">
              <strong>녹음 자막</strong>
              <span>{{ transcriptStateLabel }}</span>
            </div>

            <div class="stt-results__body" :class="{ 'is-empty': !displayTranscript }">
              <p v-if="displayTranscript">{{ displayTranscript }}</p>
              <p v-else>녹음을 시작하면 실시간 전사 결과가 여기에 표시됩니다.</p>
            </div>
          </section>
        </section>

        <section v-show="currentStep === 2" class="stt-slide stt-slide--summary">
          <div class="stt-summary-hero">
            <div>
              <p>STEP 2</p>
              <h3>AI 요약 미리보기</h3>
            </div>
            <span v-if="summaryStepLabel">{{ summaryStepLabel }}</span>
          </div>

          <v-alert v-if="isDraftLoading" type="info" density="comfortable" variant="tonal">
            AI 초안을 불러오는 중입니다. {{ draftPollingMessage }}
          </v-alert>

          <v-alert v-else-if="draftErrorMessage" type="warning" density="comfortable" variant="tonal">
            {{ draftErrorMessage }}
          </v-alert>

          <section v-if="summaryText" class="stt-summary-card stt-summary-card--summary">
            <div class="stt-results__header">
              <strong>요약 카드</strong>
              <span v-if="draftStatusLabel">{{ draftStatusLabel }}</span>
            </div>
            <div class="stt-summary-text">
              <p>{{ summaryText }}</p>
            </div>
          </section>

          <section class="stt-summary-card stt-summary-card--preview">
            <div class="stt-results__header">
              <strong>상담일지 미리보기</strong>
              <span v-if="draftPreviewStatusLabel">{{ draftPreviewStatusLabel }}</span>
            </div>
            <div v-if="draftSections.length" class="stt-preview-sections">
              <section
                v-for="section in draftSections"
                :key="section.key"
                class="stt-preview-section"
              >
                <div class="stt-preview-section__header">
                  <strong>{{ section.title }}</strong>
                  <span>{{ section.rows.length }}개 항목</span>
                </div>
                <dl class="stt-preview-sheet">
                  <div
                    v-for="row in section.rows"
                    :key="row.key"
                    class="stt-preview-row"
                  >
                    <dt>{{ row.label }}</dt>
                    <dd>{{ row.value }}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <div v-else class="stt-results__body is-empty">
              <p>AI 구조화 초안이 준비되면 상담일지 입력값 기준으로 여기에 표시됩니다.</p>
            </div>
          </section>

          <section v-if="warnings.length" class="stt-summary-card stt-summary-card--meta">
            <div class="stt-results__header">
              <strong>주의 항목</strong>
              <span>{{ warnings.length }}건</span>
            </div>
            <ul class="stt-warning-list">
              <li v-for="(warning, index) in warnings" :key="`warning-${index}`">{{ formatWarning(warning) }}</li>
            </ul>
          </section>

          <details class="stt-details">
            <summary>AI 녹음 원문 보기</summary>
            <div class="stt-details__content">
              <section class="stt-detail-card stt-detail-card--wide">
                <div class="stt-results__body stt-results__body--expanded" :class="{ 'is-empty': !displayTranscriptSource }">
                  <p v-if="displayTranscriptSource">{{ displayTranscriptSource }}</p>
                  <p v-else>전사 결과가 아직 준비되지 않았습니다.</p>
                </div>
              </section>
            </div>
          </details>

          <div class="stt-summary-actions">
            <button type="button" class="stt-button" @click="goToStep(1)">이전 단계</button>
            <button
              v-if="canRetryDraft"
              type="button"
              class="stt-button"
              :disabled="isDraftLoading"
              @click="handleRetryAiDraft"
            >
              초안 다시 조회
            </button>
            <button
              v-if="showApplyButton"
              type="button"
              class="stt-button stt-button--primary"
              :disabled="!canApplyAiDraft"
              @click="handleApplyAiDraft"
            >
              {{ applyButtonLabel }}
            </button>
          </div>
        </section>

        <v-alert
          v-if="errorMessage || audioDebug.recentError"
          type="error"
          density="comfortable"
          variant="tonal"
        >
          {{ errorMessage || audioDebug.recentError }}
        </v-alert>
      </div>
    </section>
  </div>

  <transition name="stt-toast">
    <div v-if="toastMessage" class="stt-toast" :class="`is-${toastType}`">
      {{ toastMessage }}
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { getInsuranceProducts } from '../../api/insurance'
import { useConsultationAiDraftState } from '../../composables/useConsultationAiDraftState'
import { useConsultationSttPreview } from '../../composables/useConsultationSttPreview'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  initialCustomerId: {
    type: String,
    default: '',
  },
  initialConsultationType: {
    type: String,
    default: 'NEW_CONTRACT',
  },
})

const emit = defineEmits(['update:open', 'apply-structured-draft'])

const consultationTypeOptions = [
  { label: 'NEW_CONTRACT', value: 'NEW_CONTRACT' },
  { label: 'CLAIM', value: 'CLAIM' },
  { label: 'TERMINATION', value: 'TERMINATION' },
  { label: 'RENEWAL', value: 'RENEWAL' },
]

const {
  sessionForm,
  sessionId,
  sessionStatus,
  partialText,
  finalText,
  errorMessage,
  wsConnectionState,
  recordingState,
  startedAt,
  endedAt,
  isBusy,
  audioDebug,
  canStartSession,
  canPauseRecording,
  canResumeRecording,
  canStopRecording,
  startSession,
  reconnectSocket,
  refreshSession,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  dispose,
  resetRuntimeState,
} = useConsultationSttPreview()

const currentStep = ref(1)
const elapsedSeconds = ref(0)
const timerId = ref(0)
const toastMessage = ref('')
const toastType = ref('success')
const toastTimerId = ref(0)
const insuranceProducts = ref([])
const isInsuranceProductsLoading = ref(false)

const {
  draftRecord,
  editableStructuredData,
  draftStatus,
  summaryText,
  sttRawText,
  warnings,
  canApply,
  isLoading: isDraftLoading,
  isPolling: isDraftPolling,
  isFailed: isDraftFailed,
  errorMessage: draftErrorMessage,
  pollAttempt,
  startPolling,
  retry: retryAiDraft,
  reset: resetAiDraft,
  serverHasPendingResolution,
} = useConsultationAiDraftState()

const canStartCombined = computed(() => canStartSession.value && !isBusy.value)
const canOpenSummaryStep = computed(() => {
  return Boolean(finalText.value || partialText.value || endedAt.value || sessionStatus.value === 'PROCESSING')
})
const displayTranscript = computed(() => normalizeText(finalText.value || partialText.value))
const displayTranscriptSource = computed(() => normalizeText(sttRawText.value || finalText.value || partialText.value))
const formattedElapsedTime = computed(() => formatElapsedTime(elapsedSeconds.value))
const canToggleRecording = computed(() => {
  if (sessionStatus.value === 'PROCESSING') return false
  if (recordingState.value === 'RECORDING') return canPauseRecording.value
  if (recordingState.value === 'PAUSED') return canResumeRecording.value
  return canStartCombined.value
})
const primaryRecorderButtonLabel = computed(() => {
  if (sessionStatus.value === 'PROCESSING') return 'PROCESSING'
  if (recordingState.value === 'RECORDING') return 'STOP'
  if (recordingState.value === 'PAUSED') return 'START'
  return 'OFF'
})
const statusPillClass = computed(() => ({
  'is-on': recordingState.value === 'RECORDING',
  'is-paused': recordingState.value === 'PAUSED',
  'is-processing': sessionStatus.value === 'PROCESSING',
}))
const transcriptStateLabel = computed(() => {
  if (recordingState.value === 'RECORDING') return '실시간 인식 중'
  if (recordingState.value === 'PAUSED') return '일시정지'
  if (sessionStatus.value === 'PROCESSING') return '최종 문장 처리 중'
  if (finalText.value) return '최종 문장 준비 완료'
  return '대기 중'
})
const summaryStepLabel = computed(() => {
  if (draftStatus.value === 'GPT_COMPLETED') return '적용 대기'
  if (isDraftLoading.value) return 'AI 초안 불러오는 중'
  if (editableStructuredData.value) return 'AI 초안 반영 가능'
  if (sessionStatus.value === 'PROCESSING') return '결과 정리 중'
  if (finalText.value) return '전사 반영 완료'
  return '수동 작성 단계'
})
const draftStatusLabel = computed(() => {
  if (draftStatus.value === 'FAILED') return '생성 실패'
  if (draftStatus.value === 'GPT_COMPLETED') return '생성 완료'
  if (draftStatus.value === 'STT_COMPLETED' || draftStatus.value === 'PENDING') return '생성 중'
  return editableStructuredData.value ? '구조화 완료' : '생성 대기'
})
const draftPreviewStatusLabel = computed(() => {
  if (showApplyButton.value) return '적용 가능'
  if (draftStatus.value === 'FAILED') return '생성 실패'
  return draftStatusLabel.value
})
const showApplyButton = computed(() => {
  return Boolean(editableStructuredData.value)
})
const canApplyAiDraft = computed(() => {
  return Boolean(editableStructuredData.value) && canApply.value
})
const canRetryDraft = computed(() => {
  return Boolean(sessionId.value) && (isDraftFailed.value || draftErrorMessage.value || draftStatus.value === 'FAILED')
})
const draftPollingMessage = computed(() => {
  if (!isDraftLoading.value && !isDraftPolling.value) return ''
  return `${pollAttempt.value}회차`
})
const applyButtonLabel = computed(() => '상담일지에 반영')
const draftSections = computed(() => {
  const draft = editableStructuredData.value
  if (!draft) return []

  const commonRows = [
    ['consultationType', '상담 유형', draft.consultationType],
    ['consultationChannel', '상담 채널', draft.consultationChannel],
    ['consultedAt', '상담 일시', formatDateTimeValue(draft.consultedAt)],
    ['specialNote', '특이사항', draft.specialNote],
    ['nextScheduledAt', '다음 일정', formatDateTimeValue(draft.nextScheduledAt)],
  ]
  const customerRows = [
    ['customerName', '고객명', draft.customerInfo?.customerName],
    ['customerPhone', '연락처', draft.customerInfo?.customerPhone],
    ['customerAnnualIncome', '연소득', formatMoneyValue(draft.customerInfo?.customerAnnualIncome)],
    ['customerJob', '직업', draft.customerInfo?.customerJob],
    ['customerCompanyName', '직장명', draft.customerInfo?.customerCompanyName],
    ['customerMaritalStatus', '혼인 상태', draft.customerInfo?.customerMaritalStatus],
    ['underlyingDiseaseCodes', '기저 질환', formatListValue(draft.customerInfo?.underlyingDiseaseCodes)],
  ]
  const typeRows = {
    NEW_CONTRACT: [
    ['monthlyIncome', '월 소득', formatMoneyValue(draft.newDetail?.monthlyIncome)],
    ['hasExistingInsurance', '기존 보험 가입', formatBooleanValue(draft.newDetail?.hasExistingInsurance)],
    ['monthlyInsurancePremium', '기존 보험료', formatMoneyValue(draft.newDetail?.monthlyInsurancePremium)],
    ['insurancePriority', '보험 우선순위', draft.newDetail?.insurancePriority],
    ['coverageTypes', '관심 보장', formatCoverageTypeList(draft.newDetail?.coverageTypes)],
    ['proposedProductCodes', '추천 상품', formatProposedProductList(draft.newDetail?.proposedProductCodes)],
    ],
    CLAIM: [
    ['claimType', '청구 유형', draft.claimDetail?.claimType],
    ['claimReason', '청구 사유', draft.claimDetail?.claimReason],
    ['incidentDate', '사고/진단일', draft.claimDetail?.incidentDate],
    ['claimAmount', '청구 금액', formatMoneyValue(draft.claimDetail?.claimAmount)],
    ],
    RENEWAL: [
    ['renewalScheduledDate', '갱신 예정일', draft.renewalDetail?.renewalScheduledDate],
    ['currentPremium', '현재 보험료', formatMoneyValue(draft.renewalDetail?.currentPremium)],
    ['renewalPremium', '갱신 보험료', formatMoneyValue(draft.renewalDetail?.renewalPremium)],
    ['changeType', '변경 유형', draft.renewalDetail?.changeType],
    ],
    TERMINATION: [
    ['reviewReasons', '해지 검토 사유', formatListValue(draft.cancelDetail?.reviewReasons)],
    ['customerIntent', '고객 의사', draft.cancelDetail?.customerIntent],
    ['retentionPossibility', '유지 가능성', draft.cancelDetail?.retentionPossibility],
    ],
  }

  const sections = [
    createPreviewSection('consultation', '상담 기본 정보', commonRows),
    createPreviewSection('customer', '고객 정보', customerRows),
    createPreviewSection('typed', getConsultationTypeSectionTitle(draft.consultationType), typeRows[draft.consultationType] || []),
  ]

  return sections.filter((section) => section.rows.length > 0)
})

function syncInitialValues() {
  sessionForm.customerId = props.initialCustomerId || ''
  sessionForm.consultationType = props.initialConsultationType || 'NEW_CONTRACT'
}

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type

  if (toastTimerId.value) {
    window.clearTimeout(toastTimerId.value)
  }

  toastTimerId.value = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimerId.value = 0
  }, 2400)
}

function formatSampleRate(value) {
  return value ? `${value} Hz` : '-'
}

function formatByteCount(value) {
  return Number.isFinite(value) && value > 0 ? `${value.toLocaleString('ko-KR')} bytes` : '0 bytes'
}

function stringifyDetails(details) {
  return JSON.stringify(details)
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0))
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(safeSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function stopTimer() {
  if (timerId.value) {
    window.clearInterval(timerId.value)
    timerId.value = 0
  }
}

function startTimer() {
  stopTimer()
  timerId.value = window.setInterval(() => {
    if (!startedAt.value) {
      elapsedSeconds.value += 1
      return
    }

    const started = new Date(startedAt.value).getTime()
    if (Number.isNaN(started)) {
      elapsedSeconds.value += 1
      return
    }

    elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - started) / 1000))
  }, 1000)
}

function goToStep(step) {
  if (step === 1) {
    currentStep.value = 1
    return
  }

  if (canOpenSummaryStep.value) {
    currentStep.value = 2
  }
}

async function handleStart() {
  currentStep.value = 1
  await startSession()
  await startRecording()
}

async function handlePrimaryRecorderAction() {
  if (sessionStatus.value === 'PROCESSING') {
    return
  }

  if (recordingState.value === 'RECORDING') {
    await pauseRecording()
    return
  }

  if (recordingState.value === 'PAUSED') {
    await resumeRecording()
    return
  }

  await handleStart()
}

async function handleStopAndContinue() {
  await stopRecording()

  if (recordingState.value === 'STOPPED' || sessionStatus.value === 'PROCESSING') {
    currentStep.value = 2
    if (finalText.value) {
      await startPolling(sessionId.value)
    }
  }
}

async function handleApplyAiDraft() {
  if (!canApplyAiDraft.value) {
    showToast('AI 초안이 아직 준비되지 않았습니다.', 'error')
    return
  }

  emit('apply-structured-draft', editableStructuredData.value)
  showToast('상담일지에 초안을 반영했습니다.', 'success')
  await handleClose()
}

async function ensureInsuranceProductsLoaded() {
  if (insuranceProducts.value.length > 0 || isInsuranceProductsLoading.value) {
    return
  }

  isInsuranceProductsLoading.value = true

  try {
    const response = await getInsuranceProducts({ size: 1000 })
    const result = response?.result?.products ?? response?.result
    const rows = Array.isArray(result?.content) ? result.content : result
    insuranceProducts.value = Array.isArray(rows) ? rows : []
  } catch {
    insuranceProducts.value = []
  } finally {
    isInsuranceProductsLoading.value = false
  }
}

async function handleClose() {
  stopTimer()
  elapsedSeconds.value = 0
  currentStep.value = 1
  resetAiDraft()
  await dispose()
  resetRuntimeState()
  emit('update:open', false)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      elapsedSeconds.value = 0
      currentStep.value = 1
      resetAiDraft()
      resetRuntimeState()
      syncInitialValues()
      return
    }

    stopTimer()
    elapsedSeconds.value = 0
    currentStep.value = 1
    resetAiDraft()
    await dispose()
    resetRuntimeState()
  },
)

watch(
  () => props.initialCustomerId,
  (value) => {
    if (!sessionId.value && props.open) {
      sessionForm.customerId = value || ''
    }
  },
)

watch(
  () => props.initialConsultationType,
  (value) => {
    if (!sessionId.value && props.open) {
      sessionForm.consultationType = value || 'NEW_CONTRACT'
    }
  },
)

watch(
  () => recordingState.value,
  (value) => {
    if (value === 'RECORDING') {
      startTimer()
      return
    }

    if (value !== 'STOPPING') {
      stopTimer()
    }
  },
)

watch(
  () => finalText.value,
  async (value) => {
    if (value && sessionId.value && !draftRecord.value && !isDraftLoading.value) {
      await startPolling(sessionId.value)
    }
  },
)

watch(
  () => currentStep.value,
  async (step) => {
    if (step === 2 && finalText.value && !draftRecord.value && !isDraftLoading.value && sessionId.value) {
      await startPolling(sessionId.value)
    }
  },
)

watch(
  () => editableStructuredData.value?.newDetail?.proposedProductCodes,
  async (codes) => {
    if (Array.isArray(codes) && codes.length > 0) {
      await ensureInsuranceProductsLoaded()
    }
  },
)

async function handleRetryAiDraft() {
  await retryAiDraft()
}

onBeforeUnmount(() => {
  stopTimer()

  if (toastTimerId.value) {
    window.clearTimeout(toastTimerId.value)
  }
})

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function formatWarning(warning) {
  if (warning === null || warning === undefined) {
    return ''
  }

  if (typeof warning === 'string') {
    return warning
  }

  return warning.message || warning.warningMessage || JSON.stringify(warning)
}

function createPreviewSection(key, title, rows) {
  return {
    key,
    title,
    rows: rows
      .filter(([, , value]) => hasMeaningfulValue(value))
      .map(([rowKey, label, value]) => ({
        key: rowKey,
        label,
        value,
      })),
  }
}

function getConsultationTypeSectionTitle(type) {
  if (type === 'CLAIM') return '청구 정보'
  if (type === 'RENEWAL') return '갱신 정보'
  if (type === 'TERMINATION') return '해지 상담 정보'
  return '신규 상담 정보'
}

function formatListValue(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(', ') : ''
}

function formatProposedProductList(value) {
  if (!Array.isArray(value)) {
    return ''
  }

  return value
    .filter(Boolean)
    .map((code) => {
      const normalizedCode = String(code).trim()
      const matched = insuranceProducts.value.find((product) => (
        String(
          product?.insuranceProductCode ??
          product?.productCode ??
          '',
        ).trim() === normalizedCode
      ))

      return matched?.insuranceProductName || matched?.productName || matched?.name || normalizedCode
    })
    .join(', ')
}

function formatCoverageTypeList(value) {
  const labelMap = {
    CANCER: '암 보장',
    HEART: '심장 보장',
    LIFE: '생명 보장',
    DEATH: '사망 보장',
    LONG_TERM_CARE: '장기요양 보장',
  }

  return Array.isArray(value)
    ? value.filter(Boolean).map((item) => labelMap[item] || item).join(', ')
    : ''
}

function formatBooleanValue(value) {
  if (value === true) return '예'
  if (value === false) return '아니오'
  return ''
}

function normalizeMoneyValue(value) {
  if (value === null || value === undefined || value === '') return null

  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return null

  const parsed = Number(digits)
  if (!Number.isFinite(parsed)) return null

  return parsed < 100000 ? parsed * 10000 : parsed
}

function formatMoneyValue(value) {
  const normalized = normalizeMoneyValue(value)
  return normalized === null ? '' : normalized.toLocaleString('ko-KR')
}

function formatNumberValue(value) {
  if (value === null || value === undefined || value === '') return ''
  return `${Number(value).toLocaleString('ko-KR')}`
}

function formatDateTimeValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.stt-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0;
  pointer-events: none;
}

.stt-preview-modal__backdrop {
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
}

.stt-preview-modal__panel {
  position: relative;
  width: min(460px, calc(100vw - 220px));
  height: 100vh;
  overflow: hidden;
  border-radius: 0;
  background: #ffffff;
  box-shadow: -24px 0 48px rgba(15, 23, 42, 0.16);
  pointer-events: auto;
  border-left: 1px solid rgba(226, 232, 240, 0.9);
}

.stt-preview-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 60%, #8b5cf6 100%);
  color: #ffffff;
}

.stt-preview-modal__header p {
  margin: 0 0 6px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stt-preview-modal__header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.stt-preview-modal__header button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
}

.stt-preview-modal__body {
  display: grid;
  gap: 14px;
  padding: 16px 18px 18px;
  overflow-y: auto;
  max-height: calc(100vh - 118px);
}

.stt-preview-modal__body--recording {
  overflow: hidden;
}

.stt-stepper {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.stt-stepper__line {
  height: 2px;
  background: linear-gradient(90deg, #c4b5fd 0%, #e9d5ff 100%);
}

.stt-stepper__item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.stt-stepper__item:disabled {
  cursor: not-allowed;
}

.stt-stepper__item span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid #d8b4fe;
  border-radius: 999px;
  background: #ffffff;
  color: #7c3aed;
}

.stt-stepper__item.is-active,
.stt-stepper__item.is-complete {
  color: #111827;
}

.stt-stepper__item.is-active span,
.stt-stepper__item.is-complete span {
  background: #7c3aed;
  color: #ffffff;
}

.stt-slide {
  display: grid;
  gap: 14px;
}

.stt-slide--recording {
  grid-template-rows: auto auto auto auto auto minmax(0, 1fr);
  min-height: 0;
}

.stt-slide--summary {
  gap: 18px;
}

.stt-recorder__timer {
  text-align: center;
  color: #111827;
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
}

.stt-recorder__mic-shell {
  position: relative;
  width: min(232px, 34vh, 54vw);
  aspect-ratio: 1;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0.14) 56%, transparent 56%),
    radial-gradient(circle, rgba(16, 185, 129, 0.26) 0%, rgba(16, 185, 129, 0.26) 68%, transparent 68%),
    radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.18) 80%, transparent 80%);
}

.stt-recorder__mic-shell::after {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 999px;
  background: #1ccf8b;
  box-shadow: 0 18px 42px rgba(28, 207, 139, 0.22);
}

.stt-recorder__mic-shell.is-live::before {
  content: '';
  position: absolute;
  inset: 7%;
  border-radius: 999px;
  border: 10px solid rgba(110, 231, 183, 0.36);
  animation: sttPulse 1.8s ease-out infinite;
}

.stt-recorder__mic-shell.is-processing::after {
  background: #a78bfa;
  box-shadow: 0 18px 42px rgba(124, 58, 237, 0.18);
}

.stt-recorder__mic-shell.is-paused::after {
  background: #f59e0b;
  box-shadow: 0 18px 42px rgba(245, 158, 11, 0.2);
}

.stt-recorder__mic-core {
  position: relative;
  z-index: 1;
  color: #ffffff;
  transform: scale(0.82);
}

.stt-recorder__status-pill {
  margin: 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 0 18px;
  border: 2px solid #f9a8d4;
  border-radius: 999px;
  background: #ffffff;
  color: #ec4899;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.stt-recorder__status-pill:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.stt-recorder__status-pill.is-on {
  border-color: #34d399;
  color: #059669;
}

.stt-recorder__status-pill.is-paused {
  border-color: #fcd34d;
  color: #d97706;
}

.stt-recorder__status-pill.is-processing {
  border-color: #c4b5fd;
  color: #7c3aed;
}

.stt-recorder__status-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: currentColor;
  flex-shrink: 0;
}

.stt-recorder__actions,
.stt-preview-actions,
.stt-summary-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.stt-recorder__actions {
  display: flex;
}

.stt-button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.stt-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stt-button--primary {
  border-color: #c4b5fd;
  background: #f5f3ff;
  color: #6d28d9;
}

.stt-button--danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.stt-results {
  display: grid;
  gap: 10px;
  min-height: 0;
}

.stt-results__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.stt-results__header strong {
  font-size: 20px;
  color: #111827;
}

.stt-results__header span {
  color: #7c3aed;
  font-size: 12px;
  font-weight: 700;
}

.stt-results__body {
  min-height: 92px;
  max-height: 92px;
  padding: 12px 14px;
  border: 2px solid #d8b4fe;
  border-radius: 28px;
  background: #ffffff;
  overflow: hidden;
}

.stt-results__body p {
  margin: 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.stt-results__body.is-empty p {
  color: #9ca3af;
}

.stt-results__body--expanded {
  min-height: 140px;
  max-height: 220px;
  overflow-y: auto;
}

.stt-summary-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid #ddd6fe;
  border-radius: 24px;
  background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%);
}

.stt-summary-hero p {
  margin: 0 0 4px;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.stt-summary-hero h3 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 800;
}

.stt-summary-hero span {
  color: #6d28d9;
  font-size: 13px;
  font-weight: 800;
}

.stt-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stt-summary-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e9d5ff;
  border-radius: 24px;
  background: #ffffff;
}

.stt-summary-card--preview {
  gap: 12px;
}

.stt-summary-card--summary,
.stt-summary-card--meta,
.stt-summary-card--editor {
  gap: 12px;
}

.stt-warning-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
}

.stt-summary-text {
  padding: 14px 16px;
  border: 1px solid #ddd6fe;
  border-radius: 18px;
  background: #faf5ff;
}

.stt-summary-text p {
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.stt-preview-sections {
  display: grid;
  gap: 12px;
}

.stt-preview-section {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #ede9fe;
  border-radius: 18px;
  background: #fcfcff;
}

.stt-preview-section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.stt-preview-section__header strong {
  color: #111827;
  font-size: 14px;
}

.stt-preview-section__header span {
  color: #7c3aed;
  font-size: 11px;
  font-weight: 800;
}

.stt-preview-sheet {
  display: grid;
  gap: 10px;
  margin: 0;
}

.stt-preview-row {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f8fafc;
}

.stt-preview-row dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.stt-preview-row dd {
  margin: 0;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.stt-summary-textarea {
  width: 100%;
  min-height: 240px;
  padding: 18px;
  border: 2px solid #ddd6fe;
  border-radius: 20px;
  background: #fafafa;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.7;
  resize: vertical;
}

.stt-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stt-meta-grid article,
.stt-detail-card {
  padding: 16px 18px;
  border: 1px solid #e9d5ff;
  border-radius: 18px;
  background: #faf5ff;
}

.stt-field {
  display: grid;
  gap: 6px;
}

.stt-field span,
.stt-status-grid dt,
.stt-meta-grid span {
  color: #7c3aed;
  font-size: 12px;
  font-weight: 800;
}

.stt-meta-grid strong {
  display: block;
  margin-top: 8px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.stt-details {
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fafafa;
}

.stt-details summary {
  padding: 16px 18px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
}

.stt-details__content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 0 18px 18px;
}

.stt-detail-card--wide {
  grid-column: 1 / -1;
}

.stt-detail-card h3 {
  margin: 0 0 12px;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.stt-preview-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stt-input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
}

.stt-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.stt-status-grid div {
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
}

.stt-status-grid dd {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  word-break: break-word;
}

.stt-log-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 260px;
  overflow-y: auto;
}

.stt-log-list li {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
}

.stt-log-list strong {
  color: #7c3aed;
  font-size: 11px;
}

.stt-log-list span {
  color: #334155;
  font-size: 12px;
  line-height: 1.5;
}

.stt-log-list code {
  overflow-x: auto;
  color: #475569;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}

.stt-toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 1300;
  min-width: 280px;
  max-width: calc(100vw - 32px);
  padding: 14px 18px;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  transform: translateX(-50%);
}

.stt-toast.is-success {
  background: #16a34a;
}

.stt-toast.is-error {
  background: #dc2626;
}

.stt-toast-enter-active,
.stt-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.stt-toast-enter-from,
.stt-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@keyframes sttPulse {
  0% {
    transform: scale(0.88);
    opacity: 0.9;
  }

  100% {
    transform: scale(1.06);
    opacity: 0;
  }
}

@media (max-width: 900px) {
  .stt-preview-modal {
    justify-content: stretch;
  }

  .stt-preview-modal__panel {
    width: min(100vw, 420px);
    max-height: 100vh;
    border-radius: 0;
  }

  .stt-preview-modal__body {
    max-height: calc(100vh - 118px);
    padding: 16px 14px 18px;
  }

  .stt-slide--recording {
    grid-template-rows: auto auto auto auto auto minmax(0, 1fr);
  }

  .stt-recorder__timer {
    font-size: 32px;
  }

  .stt-recorder__mic-shell {
    width: min(210px, 30vh, 52vw);
  }

  .stt-stepper,
  .stt-summary-grid,
  .stt-meta-grid,
  .stt-details__content,
  .stt-preview-form,
  .stt-status-grid {
    grid-template-columns: 1fr;
  }

  .stt-results__header,
  .stt-summary-hero,
  .stt-preview-section__header {
    display: grid;
  }
}
</style>
