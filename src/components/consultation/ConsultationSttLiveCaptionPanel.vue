<template>
  <section class="live-caption-panel" aria-label="실시간 STT 자막">
    <header class="live-caption-panel__header">
      <div>
        <p>Live Caption</p>
        <h3>실시간 자막 미리보기</h3>
      </div>
      <span class="live-caption-panel__status" :class="statusClass">
        {{ statusLabel }}
      </span>
    </header>

    <div class="live-caption-panel__viewport" :class="{ 'is-empty': !displayCaptionText }">
      <p v-if="displayCaptionText" class="live-caption-panel__caption">
        {{ displayCaptionText }}
      </p>
      <p v-else class="live-caption-panel__placeholder">
        녹음을 시작하면 실시간 자막이 여기에 표시됩니다.
      </p>
    </div>

    <div class="live-caption-panel__meta">
      <div>
        <span>현재 인식</span>
        <strong>{{ partialTextPreview }}</strong>
      </div>
      <div>
        <span>확정 전사</span>
        <strong>{{ finalTextPreview }}</strong>
      </div>
    </div>

    <div class="live-caption-panel__transcript">
      <article class="transcript-block">
        <span>실시간 문장</span>
        <p>{{ partialTextPreview }}</p>
      </article>

      <article class="transcript-block transcript-block--final">
        <span>최종 확정 문장</span>
        <p>{{ finalTextPreview }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  partialText: {
    type: String,
    default: '',
  },
  finalText: {
    type: String,
    default: '',
  },
  recordingState: {
    type: String,
    default: 'IDLE',
  },
  sessionStatus: {
    type: String,
    default: 'IDLE',
  },
})

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

const partialTextPreview = computed(() => normalizeText(props.partialText) || '아직 인식 중인 문장이 없습니다.')
const finalTextPreview = computed(() => normalizeText(props.finalText) || '최종 확정 문장이 아직 없습니다.')

const displayCaptionText = computed(() => {
  if (normalizeText(props.partialText)) {
    return normalizeText(props.partialText)
  }

  if (normalizeText(props.finalText)) {
    return normalizeText(props.finalText)
  }

  return ''
})

const statusLabel = computed(() => {
  if (props.recordingState === 'RECORDING') {
    return '실시간 자막 수신 중'
  }

  if (props.sessionStatus === 'PROCESSING') {
    return '최종 전사 대기 중'
  }

  if (props.sessionStatus === 'COMPLETED') {
    return '최종 전사 완료'
  }

  return '대기 중'
})

const statusClass = computed(() => ({
  'is-live': props.recordingState === 'RECORDING',
  'is-processing': props.sessionStatus === 'PROCESSING',
  'is-completed': props.sessionStatus === 'COMPLETED',
}))
</script>

<style scoped>
.live-caption-panel {
  display: grid;
  gap: 14px;
  min-height: 0;
}

.live-caption-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.live-caption-panel__header p {
  margin: 0 0 4px;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
}

.live-caption-panel__header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.live-caption-panel__status {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.live-caption-panel__status.is-live {
  background: #fff7ed;
  color: #ea580c;
}

.live-caption-panel__status.is-processing {
  background: #eff6ff;
  color: #2563eb;
}

.live-caption-panel__status.is-completed {
  background: #ecfdf5;
  color: #15803d;
}

.live-caption-panel__viewport {
  display: flex;
  align-items: center;
  min-height: 144px;
  padding: 20px 22px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.12), transparent 28%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
}

.live-caption-panel__viewport.is-empty {
  background:
    radial-gradient(circle at top right, rgba(148, 163, 184, 0.16), transparent 28%),
    linear-gradient(135deg, #1f2937 0%, #334155 100%);
}

.live-caption-panel__caption,
.live-caption-panel__placeholder {
  margin: 0;
  color: #f8fafc;
  font-size: 27px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: -0.02em;
}

.live-caption-panel__placeholder {
  color: rgba(248, 250, 252, 0.72);
}

.live-caption-panel__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.live-caption-panel__meta div,
.transcript-block {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.live-caption-panel__meta span,
.transcript-block span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.live-caption-panel__meta strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.live-caption-panel__transcript {
  display: grid;
  gap: 12px;
}

.transcript-block p {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.transcript-block--final {
  border: 1px solid #fed7aa;
  background: #fff7ed;
}

@media (max-width: 900px) {
  .live-caption-panel__meta {
    grid-template-columns: 1fr;
  }

  .live-caption-panel__caption,
  .live-caption-panel__placeholder {
    font-size: 22px;
  }
}
</style>
