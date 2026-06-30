<template>
  <Teleport to="body">
    <Transition name="esg-backdrop">
      <button
        v-if="modelValue"
        type="button"
        class="esg-drawer__backdrop"
        aria-label="ESG Impact 상세 닫기"
        @click="close"
      ></button>
    </Transition>

    <Transition name="esg-drawer">
      <aside v-if="modelValue" class="esg-drawer" aria-label="ESG Impact 상세">
        <header class="esg-drawer__header">
          <button
            v-if="currentView === 'criteria'"
            type="button"
            class="esg-drawer__back-button"
            aria-label="ESG Impact 상세로 돌아가기"
            @click="currentView = 'main'"
          >
            <v-icon icon="mdi-chevron-left" size="21" />
          </button>
          <div class="esg-drawer__title-group">
            <h2 class="esg-drawer__title">{{ currentView === 'criteria' ? '산정 기준 안내' : '바다 수위 안정 현황' }}</h2>
            <p v-if="currentView === 'main'">당신의 친환경 활동이 높아진 바다가 조금씩 낮아지고 있어요.</p>
          </div>
          <h2>바다 수위 안정 현황</h2>
          <button type="button" aria-label="닫기" @click="close">
            <v-icon icon="mdi-close" size="18" />
          </button>
        </header>

        <main v-if="currentView === 'main'" class="esg-drawer__body">
          <section class="esg-hero">
            <div class="esg-status">
              <article class="esg-status__rate">
                <div class="esg-status__content">
                  <span>현재 안정률</span>
                  <strong>{{ formatNumber(impact.recoveryRate) }}%</strong>
                  <b>▼ {{ recentSeaLevelChange }}m 지난 활동 대비</b>
                </div>
              </article>

              <div class="esg-status__side">
                <article class="esg-status__level">
                  <v-icon icon="mdi-shield-wave-outline" size="22" />
                  <div class="esg-status__content">
                    <span>안정 단계</span>
                    <strong>Lv. {{ impact.level }}</strong>
                    <small>총 6단계 중 {{ impact.level }}단계 달성</small>
                  </div>
                </article>

                <article class="esg-status__message">
                  당신의 소중한 업무가 차오르는 바다를 진정시키고 있습니다.
                </article>
              </div>
            </div>

            <div class="esg-scene" :style="{ '--sea-fill': seaFill }" aria-hidden="true">
              <img class="esg-scene__photo" :src="seaLevelIslandImage" alt="" />
              <div class="esg-scene__sun"></div>
              <div class="esg-scene__cloud esg-scene__cloud--one"></div>
              <div class="esg-scene__cloud esg-scene__cloud--two"></div>
              <i class="esg-scene__bird esg-scene__bird--one"></i>
              <i class="esg-scene__bird esg-scene__bird--two"></i>
              <i class="esg-scene__bird esg-scene__bird--three"></i>

              <div class="esg-scene__island">
                <div class="esg-scene__palm"></div>
                <div class="esg-scene__house">
                  <span></span>
                </div>
              </div>

              <div class="esg-scene__sea">
                <span class="esg-scene__submerged-island"></span>
                <span class="esg-scene__wave esg-scene__wave--one"></span>
                <span class="esg-scene__wave esg-scene__wave--two"></span>
                <span class="esg-scene__wave esg-scene__wave--three"></span>
                <span class="esg-scene__foam esg-scene__foam--one"></span>
                <span class="esg-scene__foam esg-scene__foam--two"></span>
                <span class="esg-scene__bubble esg-scene__bubble--one"></span>
                <span class="esg-scene__bubble esg-scene__bubble--two"></span>
                <span class="esg-scene__bubble esg-scene__bubble--three"></span>
              </div>
              <div class="esg-scene__level-line esg-scene__level-line--current">
                <span>
                  현재 수위
                  <b>+{{ formatNumber(impact.seaLevelContribution) }}m</b>
                </span>
                <i></i>
              </div>
              <div class="esg-scene__level-line esg-scene__level-line--target">
                <span>
                  목표 수위
                  <b>±0.00m</b>
                </span>
                <i></i>
              </div>
              <div class="esg-scene__level-gap">{{ formatNumber(impact.seaLevelContribution) }}m</div>
              <div class="esg-scene__caption">
                <span>현재 수위</span>
                <b>+{{ formatNumber(impact.seaLevelContribution) }}m</b>
                <span>안정 단계</span>
              </div>
            </div>
          </section>

          <section class="esg-section">
            <h3>이번 달 달성 내역</h3>
            <div class="esg-metrics">
              <article v-for="metric in metrics" :key="metric.label" class="esg-metric">
                <span>{{ metric.label }}</span>
                <div>
                  <span v-if="metric.badgeIcon" class="esg-metric__combo-icon">
                    <v-icon :icon="metric.icon" size="18" />
                    <v-icon :icon="metric.badgeIcon" size="10" />
                  </span>
                  <v-icon v-else :icon="metric.icon" size="18" />
                  <strong>{{ metric.value }}</strong>
                </div>
              </article>
            </div>
          </section>

          <section class="esg-section">
            <h3>이번 달 활동 내역</h3>
            <div v-if="activities.length > 0" class="esg-activities">
              <article
                v-for="activity in activities"
                :key="`${activity.time}-${activity.type}`"
                class="esg-activity"
              >
                <time>{{ activity.time }}</time>
                <span class="esg-activity__icon">
                  <v-icon :icon="getActivityIcon(activity.type)" size="18" />
                </span>
                <div class="esg-activity__content">
                  <strong>{{ activity.title }}</strong>
                  <small>{{ activity.description }}</small>
                </div>
                <b>
                  수위 안정
                  <span>{{ formatDelta(activity.seaLevelDelta) }}m</span>
                </b>
              </article>
            </div>
            <div v-else class="esg-activities-empty">
              오늘 기록된 환경 기여 활동이 없습니다.
            </div>
          </section>

          <section class="esg-tip">
            <v-icon icon="mdi-lightbulb-on-outline" size="18" />
            <p>Paperless 업무 전환이 늘어날수록 종이 사용량과 이동 비용이 함께 줄어듭니다.</p>
          </section>

          <button type="button" class="esg-criteria-link" @click="currentView = 'criteria'">
            <span>
              <v-icon icon="mdi-information-outline" size="19" />
            </span>
            <strong>산정 기준 안내</strong>
            <v-icon icon="mdi-chevron-right" size="20" />
          </button>
        </main>

        <main v-else class="esg-drawer__body esg-criteria">
          <section class="esg-criteria__notice">
            <v-icon icon="mdi-leaf" size="18" />
            <p>ESG Impact는 실제 환경 측정값이 아니라, 디지털 업무 활동을 내부 환산 기준으로 계산한 예상 기여 지표입니다.</p>
          </section>

          <section class="esg-criteria__section">
            <h3>1. 활동별 종이 절감 기준</h3>
            <div class="esg-criteria__activity-grid">
              <article v-for="item in paperCriteria" :key="item.label">
                <v-icon :icon="item.icon" size="22" />
                <strong>{{ item.label }}</strong>
                <span>{{ item.value }}</span>
              </article>
            </div>
          </section>

          <section class="esg-criteria__section">
            <h3>2. 레벨 산정 기준 <small>(종이 절감 장수 기준)</small></h3>
            <div class="esg-criteria__table">
              <div v-for="item in levelCriteria" :key="item.level" :class="{ 'is-active': item.level === `Lv.${impact.level}` }">
                <span>{{ item.level }}</span>
                <strong>{{ item.label }}</strong>
                <b>{{ item.range }}</b>
              </div>
            </div>
          </section>

          <section class="esg-criteria__section">
            <h3>3. 회복률 산정 기준</h3>
            <div class="esg-criteria__formula">
              <span>회복률</span>
              <strong>종이 절감 장수</strong>
              <i>/</i>
              <strong>320</strong>
              <i>×</i>
              <strong>100</strong>
              <small>(최대 100%로 표시)</small>
            </div>
          </section>

          <section class="esg-criteria__section">
            <h3>4. 단계 산정 기준 <small>(회복률 기준)</small></h3>
            <div class="esg-criteria__stage-grid">
              <article v-for="item in stageCriteria" :key="item.range">
                <span>{{ item.range }}</span>
                <strong>{{ item.label }}</strong>
              </article>
            </div>
          </section>

          <section class="esg-criteria__section">
            <h3>5. 환경 지표 환산 기준</h3>
            <div class="esg-criteria__conversion">
              <article>
                <v-icon icon="mdi-molecule-co2" size="22" />
                <strong>예상 CO₂ 절감량</strong>
                <span>= 종이 절감 장수 × 0.015 kg</span>
              </article>
              <article>
                <v-icon icon="mdi-waves" size="22" />
                <strong>바다 수위 안정 기여도</strong>
                <span>= 종이 절감 장수 × 0.00037 m</span>
              </article>
            </div>
          </section>

          <p class="esg-criteria__footnote">
            ※ 위 수치는 실제 환경 측정값이 아니라, Paperless 업무 전환 효과를 설명하기 위한 서비스 내부 예상 환산 지표입니다.
          </p>
        </main>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

import seaLevelIslandImage from '../../assets/esg/sea-level-island.png'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  impact: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])
const currentView = ref('main')

const paperCriteria = [
  { icon: 'mdi-file-document-outline', label: '상담일지 작성', value: '1건 = 종이 3장' },
  { icon: 'mdi-text-box-outline', label: 'AI 브리핑 생성', value: '1건 = 종이 5장' },
  { icon: 'mdi-account-switch-outline', label: '인수인계 완료', value: '1건 = 종이 4장' },
]

const levelCriteria = [
  { level: 'Lv.1', label: '시작 단계', range: '0 ~ 59장' },
  { level: 'Lv.2', label: '안정 단계', range: '60 ~ 119장' },
  { level: 'Lv.3', label: '회복 단계', range: '120 ~ 179장' },
  { level: 'Lv.4', label: '고도 회복 단계', range: '180 ~ 239장' },
  { level: 'Lv.5', label: '이상 완전 회복 단계', range: '240장 이상' },
]

const stageCriteria = [
  { range: '0 ~ 25%', label: '시작 단계' },
  { range: '26 ~ 50%', label: '안정 단계' },
  { range: '51 ~ 75%', label: '회복 단계' },
  { range: '76 ~ 100%', label: '고도 회복 단계' },
]

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) currentView.value = 'main'
  },
)

const metrics = computed(() => [
  { icon: 'mdi-file-document-outline', label: '종이 절감', value: `${formatCount(props.impact.paperSavedCount)}장` },
  { icon: 'mdi-weather-cloudy', label: 'CO₂ 절감', value: `${formatNumber(props.impact.co2SavedKg)} kg` },
  { icon: 'mdi-waves', label: '해수면 안정 기여', value: `${formatNumber(props.impact.seaLevelContribution)} m` },
])

const activities = computed(() => Array.isArray(props.impact.activities) ? props.impact.activities : [])
const recentSeaLevelChange = computed(() => {
  const latestDelta = Number(activities.value[0]?.seaLevelDelta)
  return formatNumber(Math.abs(Number.isFinite(latestDelta) ? latestDelta : 0.02))
})
const seaFill = computed(() => {
  const recovery = Math.min(Math.max(Number(props.impact.recoveryRate) || 0, 0), 100)
  return `${62 - recovery * 0.16}%`
})

function close() {
  currentView.value = 'main'
  emit('update:modelValue', false)
}

function getActivityIcon(type) {
  const icons = {
    CONSULTATION: 'mdi-file-document-outline',
    AI_BRIEFING: 'mdi-text-box-outline',
    HANDOVER: 'mdi-account-switch-outline',
  }

  return icons[type] ?? 'mdi-file-document-outline'
}

function formatDelta(value) {
  const numberValue = Number(value) || 0
  const formattedValue = formatNumber(Math.abs(numberValue))
  if (numberValue > 0) return `+${formattedValue}`
  if (numberValue < 0) return `-${formattedValue}`
  return formattedValue
}

function formatNumber(value) {
  const numberValue = Number(value) || 0
  return numberValue.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })
}

function formatCount(value) {
  const numberValue = Number(value) || 0
  return numberValue.toLocaleString('ko-KR', {
    maximumFractionDigits: 0,
  })
}
</script>

<style scoped>
.esg-drawer__backdrop {
  position: fixed;
  inset: 0;
  z-index: 2400;
  border: 0;
  background: rgba(15, 23, 42, 0.18);
  cursor: pointer;
}

.esg-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 2401;
  width: 560px;
  max-width: 100vw;
  height: 100vh;
  overflow-y: auto;
  background: #ffffff;
  color: #122033;
  box-shadow: -18px 0 38px rgba(15, 23, 42, 0.14);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.esg-drawer::-webkit-scrollbar {
  display: none;
}

.esg-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  padding: 0 30px;
  border-bottom: 1px solid #edf1f6;
}

.esg-drawer__header > h2:not(.esg-drawer__title) {
  display: none;
}

.esg-drawer__title-group {
  flex: 1;
  min-width: 0;
}

.esg-drawer__header h2 {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0;
}

.esg-drawer__title-group p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.esg-drawer__header button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #334155;
  cursor: pointer;
}

.esg-drawer__back-button {
  margin-left: -6px;
  margin-right: 4px;
}

.esg-drawer__body {
  padding: 22px 30px 36px;
}

.esg-section h3 {
  margin: 0 0 14px;
  color: #16263a;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
}

.esg-status {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.esg-status__rate,
.esg-status__level,
.esg-status__message {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.055);
}

.esg-status__rate {
  position: relative;
  min-height: 146px;
  padding: 28px;
  background:
    radial-gradient(circle at 88% 18%, rgba(125, 211, 252, 0.22), transparent 32%),
    linear-gradient(135deg, #ffffff, #f0f9ff);
}

.esg-status__content {
  position: absolute;
  left: 28px;
  top: 26px;
  display: grid;
  justify-items: start;
}

.esg-status__rate span,
.esg-status__level span {
  color: #64748b;
  font-size: 15px;
  font-weight: 800;
}

.esg-status__rate strong {
  margin-top: 8px;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 36px;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1;
}

.esg-status__rate b {
  width: fit-content;
  margin-top: 11px;
  color: #059669;
  font-size: 13px;
  font-weight: 800;
}

.esg-status__side {
  display: contents;
}

.esg-status__level {
  position: relative;
  min-height: 146px;
  padding: 28px;
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
}

.esg-status__level :deep(.v-icon) {
  position: absolute;
  top: 14px;
  right: 14px;
  color: #38bdf8;
  opacity: 0.72;
}

.esg-status__level strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 36px;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1;
}

.esg-status__level small {
  display: block;
  margin-top: 11px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.esg-status__message {
  display: flex;
  align-items: center;
  justify-content: center;
  grid-column: 1 / -1;
  min-height: 66px;
  padding: 15px 18px;
  background: #f8fbff;
  color: #0f766e;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  text-align: center;
}

.esg-scene {
  position: relative;
  height: 270px;
  overflow: hidden;
  border-radius: 10px;
  background: #d8eef8;
  box-shadow: 0 16px 30px rgba(56, 130, 179, 0.16);
}

.esg-scene::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(13, 89, 138, 0.08) 68%, rgba(3, 42, 78, 0.18)),
    radial-gradient(ellipse at 50% 58%, transparent 0 46%, rgba(255, 255, 255, 0.1) 74%);
  pointer-events: none;
}

.esg-scene__photo {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
}

.esg-scene__sun,
.esg-scene__cloud,
.esg-scene__bird,
.esg-scene__island {
  display: none;
}

.esg-scene__sun {
  position: absolute;
  top: 34px;
  right: 42px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: radial-gradient(circle at 35% 35%, #fff4a6, #ffd95a 70%);
  box-shadow: 0 0 0 14px rgba(255, 223, 113, 0.18), 0 0 34px rgba(255, 203, 68, 0.42);
}

.esg-scene__cloud {
  position: absolute;
  width: 50px;
  height: 15px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  filter: blur(0.1px);
  animation: esg-cloud 22s ease-in-out infinite;
}

.esg-scene__cloud::before,
.esg-scene__cloud::after {
  content: '';
  position: absolute;
  bottom: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
}

.esg-scene__cloud::before {
  left: 8px;
  width: 18px;
  height: 18px;
}

.esg-scene__cloud::after {
  right: 7px;
  width: 23px;
  height: 23px;
}

.esg-scene__cloud--one {
  top: 76px;
  left: 36px;
  transform: scale(1.16);
}

.esg-scene__cloud--two {
  top: 58px;
  right: 128px;
  opacity: 0.48;
  transform: scale(0.78);
  animation-duration: 27s;
  animation-direction: reverse;
}

.esg-scene__bird {
  position: absolute;
  width: 17px;
  height: 9px;
  border-top: 2px solid #3e8dcc;
  border-radius: 50%;
  animation: esg-bird 16s ease-in-out infinite;
}

.esg-scene__bird::after {
  content: '';
  position: absolute;
  left: 11px;
  top: -2px;
  width: 17px;
  height: 9px;
  border-top: 2px solid #3e8dcc;
  border-radius: 50%;
}

.esg-scene__bird--one {
  top: 54px;
  left: 160px;
  transform: scale(0.7);
}

.esg-scene__bird--two {
  top: 36px;
  left: 242px;
  transform: scale(0.64);
  animation-duration: 21s;
}

.esg-scene__bird--three {
  top: 78px;
  left: 286px;
  transform: scale(0.58);
  opacity: 0.75;
  animation-duration: 18s;
}

.esg-scene__island {
  position: absolute;
  left: 50%;
  bottom: 86px;
  z-index: 5;
  width: 168px;
  height: 48px;
  border-radius: 54% 46% 42% 42%;
  background:
    radial-gradient(circle at 20% 18%, rgba(84, 157, 71, 0.95) 0 22px, transparent 23px),
    radial-gradient(circle at 76% 24%, rgba(69, 135, 61, 0.86) 0 24px, transparent 25px),
    radial-gradient(ellipse at 50% 88%, #fff0bd 0 45%, #dfb16b 46% 70%, #b97c45 100%);
  transform: translateX(-50%);
  box-shadow: 0 18px 28px rgba(59, 78, 92, 0.18);
}

.esg-scene__island::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: -10px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 236, 185, 0.62);
  filter: blur(7px);
}

.esg-scene__house {
  position: absolute;
  left: 72px;
  bottom: 32px;
  width: 52px;
  height: 40px;
  border: 2px solid rgba(64, 50, 43, 0.3);
  border-radius: 3px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent 28%),
    #d8cfbd;
  box-shadow: 0 8px 14px rgba(63, 47, 35, 0.18);
}

.esg-scene__house::before {
  content: '';
  position: absolute;
  left: -9px;
  top: -23px;
  width: 62px;
  height: 32px;
  clip-path: polygon(50% 0, 100% 76%, 0 76%);
  background: linear-gradient(180deg, #79624a, #574535);
}

.esg-scene__house span {
  position: absolute;
  right: 10px;
  bottom: 6px;
  width: 10px;
  height: 13px;
  border-radius: 1px 1px 0 0;
  background: #6e5a45;
}

.esg-scene__house span::before {
  content: '';
  position: absolute;
  left: -24px;
  top: -3px;
  width: 10px;
  height: 9px;
  border-radius: 1px;
  background: rgba(103, 83, 63, 0.72);
  box-shadow: 13px 0 0 rgba(103, 83, 63, 0.72);
}

.esg-scene__palm {
  position: absolute;
  left: 42px;
  bottom: 30px;
  width: 7px;
  height: 56px;
  border-radius: 999px;
  background: linear-gradient(90deg, #87522d, #bd8150 45%, #724124);
  transform: rotate(9deg);
  box-shadow: 0 6px 10px rgba(69, 44, 28, 0.22);
}

.esg-scene__palm::before {
  content: '';
  position: absolute;
  left: -23px;
  top: -24px;
  width: 58px;
  height: 34px;
  border-radius: 999px 999px 999px 8px;
  background: linear-gradient(135deg, #1f9d63, #53c978);
  box-shadow:
    22px 6px 0 #38b96c,
    10px -9px 0 #2da768,
    -9px 8px 0 #2c9a5f;
  transform: rotate(-18deg);
}

.esg-scene__palm::after {
  content: '';
  position: absolute;
  left: -16px;
  top: -17px;
  width: 48px;
  height: 24px;
  border-radius: 999px 999px 8px 999px;
  background: linear-gradient(135deg, #2aa364, #66d27d);
  transform: rotate(34deg);
}

.esg-scene__sea {
  position: absolute;
  left: -48px;
  right: -48px;
  bottom: -12px;
  z-index: 6;
  display: block;
  height: var(--sea-fill);
  min-height: 92px;
  max-height: 150px;
  overflow: visible;
  background: transparent;
  backdrop-filter: blur(2px);
  transform: translateY(0);
  animation: esg-sea-level 5.6s ease-in-out infinite;
}

.esg-scene__sea::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 34px;
  bottom: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 18% 66%, rgba(13, 74, 109, 0.12) 0 2px, transparent 3px),
    radial-gradient(circle at 24% 78%, rgba(13, 74, 109, 0.1) 0 2px, transparent 3px),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.16) 0 2px, transparent 3px),
    linear-gradient(180deg, rgba(25, 153, 224, 0.38), rgba(4, 117, 190, 0.56) 48%, rgba(2, 70, 129, 0.62));
  backdrop-filter: blur(4px);
}

.esg-scene__submerged-island {
  position: absolute;
  left: 50%;
  top: 16px;
  z-index: 2;
  width: 182px;
  height: 96px;
  border-radius: 46% 54% 56% 44% / 24% 26% 74% 76%;
  background:
    radial-gradient(ellipse at 50% 7%, rgba(241, 213, 149, 0.28) 0 28%, transparent 52%),
    linear-gradient(180deg, rgba(188, 143, 83, 0.32), rgba(82, 111, 86, 0.18) 45%, rgba(14, 88, 120, 0.1));
  filter: blur(2px);
  opacity: 0.72;
  transform: translateX(-50%);
  mix-blend-mode: multiply;
  pointer-events: none;
}

.esg-scene__submerged-island::after {
  content: '';
  position: absolute;
  left: 21px;
  right: 21px;
  bottom: 11px;
  height: 32px;
  border-radius: 50%;
  background: rgba(3, 68, 104, 0.18);
  filter: blur(8px);
}

.esg-scene__wave {
  position: absolute;
  left: -28%;
  z-index: 3;
  width: 160%;
  height: 76px;
  border-radius: 46% 54% 49% 51% / 52% 48% 52% 48%;
  background: rgba(49, 160, 255, 0.3);
  filter: blur(0.2px);
  animation: esg-wave 8s ease-in-out infinite;
}

.esg-scene__wave--one {
  top: -18px;
  background:
    radial-gradient(ellipse at 48% 8%, rgba(255, 255, 255, 0.76) 0 9%, rgba(255, 255, 255, 0.26) 10% 18%, transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.44), rgba(104, 196, 246, 0.2) 26%, rgba(28, 151, 222, 0.4) 50%, rgba(4, 124, 198, 0.42)),
    rgba(16, 142, 214, 0.32);
  opacity: 0.96;
  box-shadow: inset 0 12px 14px rgba(255, 255, 255, 0.2), 0 -2px 10px rgba(255, 255, 255, 0.24);
}

.esg-scene__wave--two {
  top: 1px;
  left: -44%;
  height: 86px;
  width: 178%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(75, 184, 238, 0.12) 22%, rgba(6, 132, 207, 0.34)),
    rgba(13, 138, 211, 0.28);
  opacity: 0.72;
  animation-duration: 11s;
  animation-direction: reverse;
}

.esg-scene__wave--three {
  top: 24px;
  left: -34%;
  height: 94px;
  width: 170%;
  background:
    radial-gradient(ellipse at 50% 8%, rgba(255, 255, 255, 0.22) 0 12%, transparent 34%),
    rgba(5, 119, 188, 0.2);
  opacity: 0.46;
  animation-duration: 15s;
}

.esg-scene__foam {
  display: none;
}

.esg-scene__foam--one {
  left: 38px;
  top: 31px;
  width: 126px;
  transform: rotate(-2deg);
}

.esg-scene__foam--two {
  right: 52px;
  top: 51px;
  width: 104px;
  transform: rotate(2deg);
  animation-duration: 13s;
}

.esg-scene__bubble {
  position: absolute;
  z-index: 7;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  animation: esg-bubble 4.5s ease-in-out infinite;
}

.esg-scene__bubble--one {
  right: 112px;
  bottom: 30px;
  width: 8px;
  height: 8px;
}

.esg-scene__bubble--two {
  right: 136px;
  bottom: 58px;
  width: 5px;
  height: 5px;
  animation-delay: 0.7s;
}

.esg-scene__bubble--three {
  right: 86px;
  bottom: 72px;
  width: 10px;
  height: 10px;
  animation-delay: 1.3s;
}

.esg-scene__caption {
  display: none;
}

.esg-scene__level-line {
  position: absolute;
  left: 28px;
  right: 28px;
  z-index: 10;
  height: 0;
}

.esg-scene__level-line::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.esg-scene__level-line span {
  position: absolute;
  left: 0;
  top: -42px;
  display: grid;
  gap: 3px;
  padding: 6px 10px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
  color: #475569;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.15;
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.esg-scene__level-line b {
  color: #0f172a;
  font-size: 13px;
}

.esg-scene__level-line i {
  position: absolute;
  right: -3px;
  top: -5px;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #ffffff;
}

.esg-scene__level-line--current {
  top: 142px;
}

.esg-scene__level-line--current::before {
  border-top: 2px solid rgba(37, 99, 235, 0.82);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.28);
}

.esg-scene__level-line--current i {
  border: 3px solid #2563eb;
}

.esg-scene__level-line--target {
  top: 188px;
}

.esg-scene__level-line--target::before {
  border-top: 2px dashed rgba(20, 184, 166, 0.9);
}

.esg-scene__level-line--target span {
  top: 8px;
}

.esg-scene__level-line--target b {
  color: #059669;
}

.esg-scene__level-line--target i {
  border: 3px solid #14b8a6;
}

.esg-scene__level-gap {
  position: absolute;
  right: 35px;
  top: 154px;
  z-index: 11;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #0f766e;
  font-size: 12px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}


.esg-section {
  margin-top: 22px;
}

.esg-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.esg-metric {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  min-height: 82px;
  padding: 12px 8px;
  border: 1px solid #e8eef5;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.035);
}

.esg-metric > span {
  color: #42536a;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.esg-metric div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.esg-metric :deep(.v-icon),
.esg-activity__icon :deep(.v-icon) {
  color: #4a9ce8;
}

.esg-metric__combo-icon {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #4a9ce8;
}

.esg-metric__combo-icon :deep(.v-icon:first-child) {
  color: #4a9ce8;
}

.esg-metric__combo-icon :deep(.v-icon:last-child) {
  position: absolute;
  right: -3px;
  bottom: -2px;
  color: #4a9ce8;
  filter: drop-shadow(0 0 2px #ffffff);
}

.esg-metric strong {
  color: #1c2b40;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}

.esg-activities {
  overflow: hidden;
  border: 1px solid #e8eef5;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.035);
}

.esg-activities-empty {
  display: grid;
  place-items: center;
  min-height: 86px;
  border: 1px solid #e8eef5;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.035);
}

.esg-tip,
.esg-criteria-link,
.esg-criteria__notice,
.esg-criteria__section,
.esg-criteria__footnote {
  border: 1px solid #e3edf8;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.035);
}

.esg-tip {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 15px 16px;
  color: #0f766e;
}

.esg-tip p {
  margin: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
}

.esg-criteria-link {
  width: 100%;
  display: grid;
  grid-template-columns: 38px 1fr 26px;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 15px 16px;
  color: #102033;
  text-align: left;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.esg-criteria-link:hover {
  transform: translateY(-2px);
  border-color: #bfdbfe;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.esg-criteria-link span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff7ed;
  color: #f97316;
}

.esg-criteria-link strong {
  font-size: 15px;
  font-weight: 900;
}

.esg-criteria {
  display: grid;
  gap: 16px;
}

.esg-criteria__notice {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: start;
  gap: 12px;
  padding: 16px;
  border-color: #fed7aa;
  background: #fff7ed;
}

.esg-criteria__notice :deep(.v-icon) {
  color: #22c55e;
}

.esg-criteria__notice p {
  margin: 0;
  color: #9a3412;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
}

.esg-criteria__section {
  padding: 16px;
}

.esg-criteria__section h3 {
  margin: 0 0 12px;
  color: #102033;
  font-size: 14px;
  font-weight: 900;
}

.esg-criteria__section h3 small {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.esg-criteria__activity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.esg-criteria__stage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.esg-criteria__activity-grid article,
.esg-criteria__stage-grid article {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-height: 86px;
  padding: 12px 8px;
  border-radius: 8px;
  background: #fffaf5;
  color: #102033;
  text-align: center;
}

.esg-criteria__activity-grid :deep(.v-icon) {
  color: #f97316;
}

.esg-criteria__activity-grid strong,
.esg-criteria__stage-grid strong {
  font-size: 12px;
  font-weight: 900;
}

.esg-criteria__activity-grid span,
.esg-criteria__stage-grid span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.esg-criteria__stage-grid span {
  font-size: 15px;
  font-weight: 900;
}

.esg-criteria__stage-grid strong {
  font-size: 12px;
}

.esg-criteria__table {
  overflow: hidden;
  border: 1px solid #fed7aa;
  border-radius: 8px;
}

.esg-criteria__table div {
  display: grid;
  grid-template-columns: 70px 1fr 132px;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  font-size: 13px;
}

.esg-criteria__table div:last-child {
  border-bottom: 0;
}

.esg-criteria__table .is-active {
  background: #ffedd5;
  color: #9a3412;
}

.esg-criteria__table span,
.esg-criteria__table strong,
.esg-criteria__table b {
  font-size: 13px;
  font-weight: 900;
}

.esg-criteria__formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 68px;
  border-radius: 8px;
  background: #fffaf5;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  flex-wrap: wrap;
}

.esg-criteria__formula span {
  color: #ea580c;
  font-weight: 900;
}

.esg-criteria__formula strong {
  padding: 5px 11px;
  border-radius: 999px;
  background: #ffffff;
  color: #102033;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}

.esg-criteria__formula small {
  color: #64748b;
}

.esg-criteria__conversion {
  display: grid;
  gap: 8px;
}

.esg-criteria__conversion article {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 14px;
  border-radius: 8px;
  background: #fffaf5;
}

.esg-criteria__conversion :deep(.v-icon) {
  color: #f97316;
}

.esg-criteria__conversion strong {
  color: #102033;
  font-size: 13px;
}

.esg-criteria__conversion span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.esg-criteria__footnote {
  margin: 0;
  padding: 16px;
  border-color: #fed7aa;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.6;
}

.esg-activity {
  display: grid;
  grid-template-columns: 50px 34px 1fr 60px;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f7;
}

.esg-activity:last-child {
  border-bottom: 0;
}

.esg-activity time {
  color: #7f93aa;
  font-size: 11px;
  font-weight: 800;
}

.esg-activity__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #edf7ff;
}

.esg-activity__content {
  min-width: 0;
}

.esg-activity strong {
  display: block;
  overflow: hidden;
  color: #1d2d42;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.esg-activity small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.esg-activity b {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.35;
  text-align: right;
}

.esg-activity b span {
  display: block;
  color: #079669;
  font-size: 12px;
}

.esg-backdrop-enter-active,
.esg-backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.esg-backdrop-enter-from,
.esg-backdrop-leave-to {
  opacity: 0;
}

.esg-drawer-enter-active,
.esg-drawer-leave-active {
  transition: transform 0.28s ease;
}

.esg-drawer-enter-from,
.esg-drawer-leave-to {
  transform: translateX(100%);
}

@keyframes esg-wave {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(16%);
  }
}

@keyframes esg-sea-level {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(5px);
  }
}

@keyframes esg-foam {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(52px);
  }
}

@keyframes esg-cloud {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(18px);
  }
}

@keyframes esg-bird {
  0%,
  100% {
    margin-top: 0;
  }

  50% {
    margin-top: -4px;
  }
}

@keyframes esg-bubble {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.26;
  }

  50% {
    transform: translateY(-12px);
    opacity: 0.82;
  }
}

@media (max-width: 480px) {
  .esg-drawer {
    width: 100vw;
  }

  .esg-drawer__body {
    padding: 18px 18px 30px;
  }
}
</style>
