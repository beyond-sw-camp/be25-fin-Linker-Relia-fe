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
          <p>STT Preview</p>
          <h2 id="stt-preview-modal-title">PCM capture and transport debug</h2>
        </div>
        <button type="button" aria-label="Close" @click="handleClose">×</button>
      </header>

      <div class="stt-preview-modal__body">
        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>Session</h3>
            <span>REST and WebSocket</span>
          </div>

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
                <option v-for="option in consultationTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="stt-preview-actions">
            <button type="button" class="stt-button stt-button--primary" :disabled="!canStartSession" @click="startSession">
              Start Session
            </button>
            <button type="button" class="stt-button" :disabled="!sessionId || isBusy" @click="refreshSession">
              Refresh Session
            </button>
            <button type="button" class="stt-button" :disabled="!sessionId || isBusy" @click="reconnectSocket">
              Reconnect WS
            </button>
          </div>

          <dl class="stt-status-grid">
            <div>
              <dt>WS state</dt>
              <dd>{{ wsConnectionState }}</dd>
            </div>
            <div>
              <dt>Recording state</dt>
              <dd>{{ recordingState }}</dd>
            </div>
            <div>
              <dt>sessionId</dt>
              <dd>{{ sessionId || '-' }}</dd>
            </div>
            <div>
              <dt>sessionStatus</dt>
              <dd>{{ sessionStatus }}</dd>
            </div>
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

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>Capture</h3>
            <span>Microphone -> float32</span>
          </div>

          <div class="stt-preview-actions">
            <button type="button" class="stt-button stt-button--primary" :disabled="!canStartRecording" @click="startRecording">
              Start Recording
            </button>
            <button type="button" class="stt-button stt-button--danger" :disabled="!canStopRecording" @click="stopRecording">
              Stop Recording
            </button>
          </div>

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
              <dt>Input channels</dt>
              <dd>{{ audioDebug.capture.inputChannelCount || '-' }}</dd>
            </div>
            <div>
              <dt>Buffer size</dt>
              <dd>{{ audioDebug.capture.bufferSize || '-' }}</dd>
            </div>
          </dl>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>Transform</h3>
            <span>mono + resample + int16</span>
          </div>

          <dl class="stt-status-grid">
            <div>
              <dt>Format</dt>
              <dd>{{ audioDebug.transform.format }}</dd>
            </div>
            <div>
              <dt>Output sample rate</dt>
              <dd>{{ formatSampleRate(audioDebug.transform.outputSampleRate) }}</dd>
            </div>
            <div>
              <dt>Output channels</dt>
              <dd>{{ audioDebug.transform.outputChannelCount }}</dd>
            </div>
            <div>
              <dt>Bit depth</dt>
              <dd>{{ audioDebug.transform.bitDepth }}-bit</dd>
            </div>
            <div>
              <dt>Endian</dt>
              <dd>{{ audioDebug.transform.endian }}</dd>
            </div>
            <div>
              <dt>Last input frames</dt>
              <dd>{{ audioDebug.transform.lastInputFrameCount || '-' }}</dd>
            </div>
            <div>
              <dt>Last output samples</dt>
              <dd>{{ audioDebug.transform.lastOutputSampleCount || '-' }}</dd>
            </div>
            <div>
              <dt>Payload type</dt>
              <dd>{{ audioDebug.capture.payloadType }}</dd>
            </div>
          </dl>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>Transport</h3>
            <span>ArrayBuffer over raw WebSocket</span>
          </div>

          <dl class="stt-status-grid">
            <div>
              <dt>Payload type</dt>
              <dd>{{ audioDebug.transport.payloadType }}</dd>
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

          <v-alert v-if="errorMessage || audioDebug.recentError" type="error" density="comfortable" variant="tonal">
            {{ errorMessage || audioDebug.recentError }}
          </v-alert>
        </section>

        <section class="stt-preview-card stt-preview-card--wide stt-preview-card--caption">
          <div class="stt-preview-card__title">
            <h3>Recognition</h3>
            <span>real-time subtitle preview</span>
          </div>

          <ConsultationSttLiveCaptionPanel
            :partial-text="partialText"
            :final-text="finalText"
            :recording-state="recordingState"
            :session-status="sessionStatus"
          />
        </section>

        <section class="stt-preview-card stt-preview-card--wide stt-preview-card--fixed">
          <div class="stt-preview-card__title">
            <h3>Debug Log</h3>
            <span>Capture / Transform / Transport / Session</span>
          </div>

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
    </section>
  </div>
</template>

<script setup>
import { watch } from 'vue'

import ConsultationSttLiveCaptionPanel from './ConsultationSttLiveCaptionPanel.vue'
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
  canStartRecording,
  canStopRecording,
  startSession,
  reconnectSocket,
  refreshSession,
  startRecording,
  stopRecording,
  dispose,
  resetRuntimeState,
} = useConsultationSttPreview()

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

async function handleClose() {
  await dispose()
  resetRuntimeState()
  emit('update:open', false)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      resetRuntimeState()
      syncInitialValues()
      return
    }

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
  width: min(1120px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 20px;
  background: #f8fafc;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.26);
}

.stt-preview-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.stt-preview-modal__header p {
  margin: 0 0 6px;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
}

.stt-preview-modal__header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
}

.stt-preview-modal__header button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 22px;
  cursor: pointer;
}

.stt-preview-modal__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 20px 24px 24px;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}

.stt-preview-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe3ee;
  border-radius: 16px;
  background: #ffffff;
}

.stt-preview-card--wide {
  grid-column: 1 / -1;
}

.stt-preview-card--caption {
  max-height: none;
}

.stt-preview-card--fixed {
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  max-height: 280px;
}

.stt-preview-card__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.stt-preview-card__title h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.stt-preview-card__title span {
  color: #64748b;
  font-size: 12px;
}

.stt-preview-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stt-field {
  display: grid;
  gap: 6px;
}

.stt-field span,
.stt-status-grid dt {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.stt-input,
.stt-textarea {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
}

.stt-textarea {
  min-height: 120px;
  height: 100%;
  resize: vertical;
}

.stt-preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stt-button {
  min-height: 38px;
  padding: 0 16px;
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
  border-color: #fb923c;
  background: #fff7ed;
  color: #ea580c;
}

.stt-button--danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
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
  background: #f8fafc;
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
  min-height: 0;
  overflow-y: auto;
  align-content: start;
}

.stt-preview-card--fixed .stt-field {
  min-height: 0;
}

.stt-preview-card--fixed .stt-textarea {
  min-height: 0;
  resize: none;
}

.stt-log-list li {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.stt-log-list strong {
  color: #f97316;
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

@media (max-width: 900px) {
  .stt-preview-modal {
    padding: 12px;
  }

  .stt-preview-modal__body,
  .stt-preview-form,
  .stt-status-grid {
    grid-template-columns: 1fr;
  }

  .stt-preview-modal__panel {
    max-height: calc(100vh - 24px);
  }

  .stt-preview-modal__body {
    max-height: calc(100vh - 132px);
    padding: 16px;
  }
}
</style>
