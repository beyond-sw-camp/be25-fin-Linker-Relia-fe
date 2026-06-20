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
          <p>STT Recorder</p>
          <h2 id="stt-preview-modal-title">녹음</h2>
        </div>
        <button type="button" aria-label="Close" @click="handleClose">×</button>
      </header>

      <div class="stt-preview-modal__body">
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

        <div class="stt-recorder__status-pill" :class="statusPillClass">
          <span class="stt-recorder__status-dot"></span>
          {{ statusPillLabel }}
        </div>

        <div class="stt-recorder__actions">
          <button
            type="button"
            class="stt-button stt-button--primary"
            :disabled="!canStartCombined"
            @click="handleStart"
          >
            녹음 시작
          </button>
          <button
            type="button"
            class="stt-button"
            :disabled="!canPauseRecording"
            @click="pauseRecording"
          >
            일시정지
          </button>
          <button
            type="button"
            class="stt-button stt-button--primary"
            :disabled="!canResumeRecording"
            @click="resumeRecording"
          >
            다시 시작
          </button>
          <button
            type="button"
            class="stt-button stt-button--danger"
            :disabled="!canStopRecording"
            @click="stopRecording"
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
            <p v-else>녹음을 시작하면 실시간 자막이 여기에 표시됩니다.</p>
          </div>
        </section>

        <div class="stt-meta-grid">
          <article>
            <span>세션 상태</span>
            <strong>{{ sessionStatus || 'IDLE' }}</strong>
          </article>
          <article>
            <span>소켓 상태</span>
            <strong>{{ wsConnectionState }}</strong>
          </article>
          <article>
            <span>sessionId</span>
            <strong>{{ sessionId || '-' }}</strong>
          </article>
          <article>
            <span>상담 유형</span>
            <strong>{{ sessionForm.consultationType }}</strong>
          </article>
        </div>

        <v-alert
          v-if="errorMessage || audioDebug.recentError"
          type="error"
          density="comfortable"
          variant="tonal"
        >
          {{ errorMessage || audioDebug.recentError }}
        </v-alert>

        <details class="stt-details">
          <summary>상세 디버그 정보</summary>

          <div class="stt-details__content">
            <section class="stt-detail-card">
              <h3>Session</h3>
              <div class="stt-preview-form">
                <label class="stt-field">
                  <span>customerId</span>
                  <input
                    v-model.trim="sessionForm.customerId"
                    class="stt-input"
                    placeholder="nullable"
                  />
                </label>

                <label class="stt-field">
                  <span>consultationType</span>
                  <select v-model="sessionForm.consultationType" class="stt-input">
                    <option
                      v-for="option in consultationTypeOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="stt-preview-actions">
                <button
                  type="button"
                  class="stt-button"
                  :disabled="!sessionId || isBusy"
                  @click="refreshSession"
                >
                  상태 새로고침
                </button>
                <button
                  type="button"
                  class="stt-button"
                  :disabled="!sessionId || isBusy"
                  @click="reconnectSocket"
                >
                  소켓 재연결
                </button>
              </div>

              <dl class="stt-status-grid">
                <div>
                  <dt>startedAt</dt>
                  <dd>{{ startedAt || '-' }}</dd>
                </div>
                <div>
                  <dt>endedAt</dt>
                  <dd>{{ endedAt || '-' }}</dd>
                </div>
              </dl>
            </section>

            <section class="stt-detail-card">
              <h3>Audio / Transport</h3>
              <dl class="stt-status-grid">
                <div>
                  <dt>Capture mode</dt>
                  <dd>{{ audioDebug.capture.mode }}</dd>
                </div>
                <div>
                  <dt>Input sample rate</dt>
                  <dd>{{ formatSampleRate(audioDebug.capture.inputSampleRate) }}</dd>
                </div>
                <div>
                  <dt>Output sample rate</dt>
                  <dd>{{ formatSampleRate(audioDebug.transform.outputSampleRate) }}</dd>
                </div>
                <div>
                  <dt>Chunk count</dt>
                  <dd>{{ audioDebug.transport.chunkCount }}</dd>
                </div>
                <div>
                  <dt>Total bytes</dt>
                  <dd>{{ formatByteCount(audioDebug.transport.totalBytes) }}</dd>
                </div>
                <div>
                  <dt>Last chunk bytes</dt>
                  <dd>{{ formatByteCount(audioDebug.transport.lastByteLength) }}</dd>
                </div>
              </dl>
            </section>

            <section class="stt-detail-card stt-detail-card--wide">
              <h3>Debug Log</h3>
              <ul class="stt-log-list">
                <li v-for="log in audioDebug.logs" :key="log.id">
                  <strong>[{{ log.stage }}] {{ log.at }}</strong>
                  <span>{{ log.message }}</span>
                  <code v-if="log.details">{{ stringifyDetails(log.details) }}</code>
                </li>
                <li v-if="audioDebug.logs.length === 0">
                  <span>No debug entries yet.</span>
                </li>
              </ul>
            </section>
          </div>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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

const emit = defineEmits(['update:open'])

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

const elapsedSeconds = ref(0)
const timerId = ref(0)

const canStartCombined = computed(() => canStartSession.value && !isBusy.value)
const displayTranscript = computed(() => normalizeText(finalText.value || partialText.value))
const formattedElapsedTime = computed(() => formatElapsedTime(elapsedSeconds.value))
const statusPillLabel = computed(() => {
  if (recordingState.value === 'RECORDING') return 'ON'
  if (recordingState.value === 'PAUSED') return 'PAUSE'
  if (sessionStatus.value === 'PROCESSING') return 'PROCESSING'
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

function syncInitialValues() {
  sessionForm.customerId = props.initialCustomerId || ''
  sessionForm.consultationType = props.initialConsultationType || 'NEW_CONTRACT'
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

async function handleStart() {
  await startSession()
  await startRecording()
}

async function handleClose() {
  stopTimer()
  elapsedSeconds.value = 0
  await dispose()
  resetRuntimeState()
  emit('update:open', false)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      elapsedSeconds.value = 0
      resetRuntimeState()
      syncInitialValues()
      return
    }

    stopTimer()
    elapsedSeconds.value = 0
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

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style scoped>
.stt-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.stt-preview-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.56);
}

.stt-preview-modal__panel {
  position: relative;
  width: min(760px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.26);
}

.stt-preview-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 20px;
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
  font-size: 34px;
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
  gap: 22px;
  padding: 28px;
  overflow-y: auto;
  max-height: calc(100vh - 170px);
}

.stt-recorder__timer {
  text-align: center;
  color: #111827;
  font-size: 54px;
  font-weight: 300;
  line-height: 1;
}

.stt-recorder__mic-shell {
  position: relative;
  width: min(330px, 70vw);
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
}

.stt-recorder__status-pill {
  margin: 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 0 24px;
  border: 2px solid #f9a8d4;
  border-radius: 999px;
  background: #ffffff;
  color: #ec4899;
  font-size: 26px;
  font-weight: 700;
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
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: currentColor;
  flex-shrink: 0;
}

.stt-recorder__actions,
.stt-preview-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.stt-button {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
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
  gap: 14px;
}

.stt-results__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.stt-results__header strong {
  font-size: 24px;
  color: #111827;
}

.stt-results__header span {
  color: #7c3aed;
  font-size: 13px;
  font-weight: 700;
}

.stt-results__body {
  min-height: 240px;
  padding: 22px 24px;
  border: 2px solid #d8b4fe;
  border-radius: 28px;
  background: #ffffff;
}

.stt-results__body p {
  margin: 0;
  color: #374151;
  font-size: 18px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.stt-results__body.is-empty p {
  color: #9ca3af;
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
    padding: 12px;
  }

  .stt-preview-modal__panel {
    max-height: calc(100vh - 24px);
    border-radius: 24px;
  }

  .stt-preview-modal__body {
    max-height: calc(100vh - 150px);
    padding: 20px 16px 24px;
  }

  .stt-recorder__timer {
    font-size: 42px;
  }

  .stt-meta-grid,
  .stt-details__content,
  .stt-preview-form,
  .stt-status-grid {
    grid-template-columns: 1fr;
  }

  .stt-results__header {
    display: grid;
  }
}
</style>
