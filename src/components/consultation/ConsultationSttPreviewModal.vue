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
          <p>STT 미리보기</p>
          <h2 id="stt-preview-modal-title">상담 음성 추출 테스트</h2>
        </div>
        <button type="button" aria-label="닫기" @click="handleClose">×</button>
      </header>

      <div class="stt-preview-modal__body">
        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>세션 설정</h3>
            <span>UI는 임시 디버그 패널입니다.</span>
          </div>

          <div class="stt-preview-form">
            <label class="stt-field">
              <span>customerId</span>
              <input
                v-model.trim="sessionForm.customerId"
                class="stt-input"
                placeholder="없으면 비워두세요"
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
              세션 시작
            </button>
            <button type="button" class="stt-button" :disabled="!sessionId || isBusy" @click="refreshSession">
              세션 조회
            </button>
            <button type="button" class="stt-button" :disabled="!sessionId || isBusy" @click="reconnectSocket">
              WS 재연결
            </button>
          </div>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>오디오 전송</h3>
            <span>브라우저 MediaRecorder 기반</span>
          </div>

          <div class="stt-preview-actions">
            <button type="button" class="stt-button stt-button--primary" :disabled="!canStartRecording" @click="startRecording">
              녹음 시작
            </button>
            <button type="button" class="stt-button stt-button--danger" :disabled="!canStopRecording" @click="stopRecording">
              녹음 종료
            </button>
          </div>

          <p class="stt-preview-help">
            현재 전송 포맷: <strong>{{ captureMimeType || '대기 중' }}</strong>
          </p>
          <p class="stt-preview-help">
            이후 GPT 요약/개선 단계는 이 모달 다음 흐름으로 연결할 예정이며, 현재는 STT 추출 과정만 검증합니다.
          </p>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>세션 상태</h3>
            <span>{{ statusSummary }}</span>
          </div>

          <dl class="stt-status-grid">
            <div>
              <dt>WS 연결</dt>
              <dd>{{ wsConnectionState }}</dd>
            </div>
            <div>
              <dt>녹음 상태</dt>
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

          <v-alert v-if="errorMessage" type="error" density="comfortable" variant="tonal">
            {{ errorMessage }}
          </v-alert>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>인식 결과</h3>
            <span>partial / final text</span>
          </div>

          <label class="stt-field">
            <span>partialText</span>
            <textarea :value="partialText" class="stt-textarea" rows="4" readonly></textarea>
          </label>

          <label class="stt-field">
            <span>finalText</span>
            <textarea :value="finalText" class="stt-textarea" rows="6" readonly></textarea>
          </label>
        </section>

        <section class="stt-preview-card">
          <div class="stt-preview-card__title">
            <h3>이벤트 로그</h3>
            <span>최근 30개</span>
          </div>

          <ul class="stt-log-list">
            <li v-for="log in eventLogs" :key="log.id">
              <strong>{{ log.at }}</strong>
              <span>{{ log.message }}</span>
            </li>
            <li v-if="eventLogs.length === 0">
              <span>아직 기록된 이벤트가 없습니다.</span>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

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
  { label: '신규 계약', value: 'NEW_CONTRACT' },
  { label: '청구', value: 'CLAIM' },
  { label: '해지', value: 'TERMINATION' },
  { label: '갱신', value: 'RENEWAL' },
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
  captureMimeType,
  startedAt,
  endedAt,
  isBusy,
  eventLogs,
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

const statusSummary = computed(() => {
  if (!sessionId.value) {
    return '세션이 아직 시작되지 않았습니다.'
  }

  if (recordingState.value === 'RECORDING') {
    return '오디오 청크를 실시간으로 전송 중입니다.'
  }

  if (sessionStatus.value === 'PROCESSING') {
    return 'COMPLETE 전송 후 서버 후처리를 기다리는 중입니다.'
  }

  if (sessionStatus.value === 'COMPLETED') {
    return '최종 텍스트가 확정되었습니다.'
  }

  return '세션 상태를 확인할 수 있습니다.'
})

function syncInitialValues() {
  sessionForm.customerId = props.initialCustomerId || ''
  sessionForm.consultationType = props.initialConsultationType || 'NEW_CONTRACT'
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
  width: min(1080px, 100%);
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

.stt-preview-card__title span,
.stt-preview-help {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
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
