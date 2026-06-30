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
        <header v-if="currentView === 'criteria'" class="esg-drawer__header">
          <button
            type="button"
            class="esg-drawer__back-button"
            aria-label="ESG Impact 상세로 돌아가기"
            @click="currentView = 'main'"
          >
            <v-icon icon="mdi-chevron-left" size="21" />
          </button>
          <h2>산정 기준 안내</h2>
          <button type="button" aria-label="닫기" @click="close">
            <v-icon icon="mdi-close" size="18" />
          </button>
        </header>

        <main
          v-if="currentView === 'main'"
          class="esg-drawer__body esg-dashboard"
          :class="{ 'is-entered': isEntered }"
        >
          <section class="esg-dashboard__top">
            <div class="esg-dashboard__headline">
              <span class="esg-dashboard__icon">
                <v-icon icon="mdi-waves" size="23" />
              </span>
              <div>
                <h2>해수면 상승 완화 현황</h2>
                <strong>{{ monthLabel }} ESG 챌린지</strong>
                <p>상담일지 작성 · AI 브리핑 생성 · 인수인계 완료가 종이 사용을 줄이고 
                  <br>
                  해수면 상승 속도를 늦춰 섬을 지켜주고 있어요.</p>
              </div>
            </div>

            <div class="esg-dashboard__month-wrap">
              <button type="button" class="esg-dashboard__month" @click="monthMenuOpen = !monthMenuOpen">
                <v-icon icon="mdi-calendar-month-outline" size="15" />
                {{ monthLabel }} ESG 챌린지
                <v-icon :icon="monthMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="16" />
              </button>
              <div v-if="monthMenuOpen" class="esg-dashboard__month-menu">
                <button
                  v-for="option in monthOptions"
                  :key="option.value"
                  type="button"
                  :class="{ 'is-selected': option.value === targetMonthValue }"
                  @click="selectTargetMonth(option.value)"
                >
                  <span>{{ option.label }} ESG 챌린지</span>
                  <v-icon v-if="option.value === targetMonthValue" icon="mdi-check" size="15" />
                </button>
              </div>
            </div>
          </section>

          <section class="esg-summary">
            <article class="esg-summary-card">
              <span class="esg-summary-card__icon esg-summary-card__icon--blue">
                <v-icon icon="mdi-file-document-outline" size="24" />
              </span>
              <div>
                <p>이번 달 절약한 종이</p>
                <strong>{{ formatCount(animatedPaperSavedCount) }}<small>장</small></strong>
                <em>목표 250장</em>
                <div class="esg-summary-card__bar">
                  <i :style="{ width: `${paperProgress}%` }"></i>
                </div>
                <b>{{ paperProgress }}%</b>
              </div>
            </article>

            <article class="esg-summary-card">
              <span class="esg-summary-card__icon esg-summary-card__icon--green">
                <v-icon icon="mdi-leaf" size="24" />
              </span>
              <div>
                <p>절감한 CO₂</p>
                <strong>{{ formatNumber(animatedCo2SavedKg) }}<small>kg</small></strong>
                <em>나무 0.33그루 심은 효과</em>
              </div>
            </article>

            <article class="esg-summary-card">
              <span class="esg-summary-card__icon esg-summary-card__icon--violet">
                <v-icon icon="mdi-shield-check-outline" size="24" />
              </span>
              <div>
                <p>해수면 상승 완화 단계</p>
                <strong>Lv.{{ animatedLevel }}</strong>
                <em>{{ stageCurrentLabel }}</em>
                <button type="button" @click="currentView = 'criteria'">단계 기준 보기</button>
              </div>
            </article>
          </section>

          <section class="esg-ocean-panel">
            <div
              class="esg-scene"
              :class="{ 'is-entered': isEntered }"
              :style="{ '--sea-fill': animatedSeaFill }"
              aria-hidden="true"
            >
              <img class="esg-scene__photo" :src="seaLevelIslandImage" alt="" />
              <div class="esg-scene__sea">
                <span class="esg-scene__submerged-island"></span>
                <span class="esg-scene__wave esg-scene__wave--one"></span>
                <span class="esg-scene__wave esg-scene__wave--two"></span>
                <span class="esg-scene__wave esg-scene__wave--three"></span>
                <span class="esg-scene__bubble esg-scene__bubble--one"></span>
                <span class="esg-scene__bubble esg-scene__bubble--two"></span>
                <span class="esg-scene__bubble esg-scene__bubble--three"></span>
              </div>
              <div class="esg-sea-label esg-sea-label--baseline">
                <strong>빠른 상승 상태</strong>
                <span>(아무 활동도 하지 않을 경우)</span>
              </div>
              <div class="esg-sea-label esg-sea-label--current">
                <strong>현재 상승 상태</strong>
                <span>(당신의 실천 결과)</span>
              </div>
              <div class="esg-sea-label esg-sea-label--recovery">
                <strong>최소 상승 상태</strong>
                <span>(우리의 목표)</span>
              </div>
              <span class="esg-sea-arrow esg-sea-arrow--up-left"></span>
              <span class="esg-sea-arrow esg-sea-arrow--up-right"></span>
              <span class="esg-sea-arrow esg-sea-arrow--down"></span>
              <aside class="esg-scene-note">
                <strong>현재 상태</strong>
                <p>이 캠페인에서는 실제 수치를 나타내는 것이 아니라, 종이 절감 활동이 해수면 상승 흐름을 완화하는 과정을 표현합니다.</p>
              </aside>
              <p class="esg-ocean-panel__message">
                <v-icon icon="mdi-lightbulb-on-outline" size="16" />
                더 많은 실천을 할수록 바다가 내려가고, 섬은 더 안전해집니다.
              </p>
            </div>
          </section>

          <section class="esg-journey">
            <h3>당신의 실천이 만들어가는 변화</h3>
            <div class="esg-journey__steps">
              <article
                v-for="step in journeySteps"
                :key="step.level"
                :class="{ 'is-active': step.level === currentLevel }"
              >
                <span>
                  <img :src="seaLevelIslandImage" alt="" />
                </span>
                <strong>{{ step.label }}</strong>
                <b>{{ step.title }}</b>
                <small>{{ step.description }}</small>
              </article>
            </div>
            <div class="esg-journey__progress">
              현재 Lv.{{ currentLevel }} ({{ monthLabel }} 전체 목표의 {{ formatNumber(animatedRecovery) }}%)
            </div>
          </section>
        </main>

        <main v-else class="esg-drawer__body esg-criteria">
          <section class="esg-criteria-card" aria-label="단계 기준">
            <header class="esg-criteria-card__header">
              <h3>단계 기준</h3>
              <button type="button" aria-label="닫기" @click="currentView = 'main'">
                <v-icon icon="mdi-close" size="16" />
              </button>
            </header>

            <p class="esg-criteria-card__description">
              실천한 종이 절약량에 따라<br />
              해수면 상승 완화 단계가 결정됩니다.
            </p>

            <div class="esg-criteria-levels">
              <article
                v-for="item in levelCriteria"
                :key="item.level"
                class="esg-criteria-level"
                :class="{ 'is-active': item.level === currentLevel }"
              >
                <span class="esg-criteria-level__icon" :class="`esg-criteria-level__icon--${item.tone}`">
                  <v-icon :icon="item.icon" size="16" />
                </span>
                <div class="esg-criteria-level__content">
                  <div>
                    <strong>{{ item.label }}</strong>
                    <b>{{ item.range }}</b>
                  </div>
                  <p>{{ item.description }}</p>
                </div>
              </article>
            </div>

            <footer class="esg-criteria-card__footnote">
              <v-icon icon="mdi-information-outline" size="14" />
              <p>
                단계는 매월 1일에 초기화되며,<br />
                해당 달의 실천량을 기준으로 산정됩니다.
              </p>
            </footer>
          </section>
        </main>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

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

const emit = defineEmits(['update:modelValue', 'change-month'])
const currentView = ref('main')
const isEntered = ref(false)
const selectedTargetMonth = ref('')
const monthMenuOpen = ref(false)
const animatedRecovery = ref(0)
const animatedLevel = ref(0)
const animatedPaperSavedCount = ref(0)
const animatedCo2SavedKg = ref(0)
let counterAnimationId = null

const journeySteps = [
  { level: 1, label: 'Lv.1', title: '침수 위기', description: '섬의 대부분이 위험한 상태' },
  { level: 2, label: 'Lv.2', title: '희망의 시작', description: '작은 실천이 변화를 시작' },
  { level: 3, label: 'Lv.3', title: '변화 확산', description: '지속적인 실천으로 변화가 커짐' },
  { level: 4, label: 'Lv.4', title: '안정 확보', description: '해수면 상승 속도가 눈에 띄게 완화' },
  { level: 5, label: 'Lv.5', title: '미래 보전', description: '미래 세대를 위한 안전을 확보' },
  { level: 6, label: 'Lv.6', title: '투발루 수호', description: '섬이 안전하게 지켜진 상태' },
]

const levelCriteria = [
  {
    level: 1,
    icon: 'mdi-medical-bag',
    tone: 'red',
    label: 'Lv.1 침수 위기',
    description: '섬의 대부분이 침수 위협에 노출된 상태입니다.',
    range: '0 ~ 49장',
  },
  {
    level: 2,
    icon: 'mdi-leaf',
    tone: 'green',
    label: 'Lv.2 희망의 시작',
    description: '작은 실천이 변화를 만들어가기 시작했어요.',
    range: '50 ~ 99장',
  },
  {
    level: 3,
    icon: 'mdi-recycle',
    tone: 'teal',
    label: 'Lv.3 변화 확산',
    description: '지속적인 실천으로 긍정적인 변화가 커져요.',
    range: '100 ~ 149장',
  },
  {
    level: 4,
    icon: 'mdi-account-group',
    tone: 'blue',
    label: 'Lv.4 안정 확보',
    description: '해수면 상승 속도가 눈에 띄게 완화되고 있어요.',
    range: '150 ~ 199장',
  },
  {
    level: 5,
    icon: 'mdi-account-multiple',
    tone: 'violet',
    label: 'Lv.5 미래 보전',
    description: '미래 세대를 위한 안전을 확보하고 있어요.',
    range: '200 ~ 249장',
  },
  {
    level: 6,
    icon: 'mdi-island',
    tone: 'sky',
    label: 'Lv.6 투발루 수호',
    description: '투발루의 미래를 함께 지켜냈어요!',
    range: '250장 이상',
  },
]

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      currentView.value = 'main'
      isEntered.value = false
      monthMenuOpen.value = false
      cancelCounterAnimation()
      return
    }

    startEntryAnimation()
  },
)

const currentLevel = computed(() => Math.round(toBoundedNumber(props.impact.level, 1, 6)))
const targetMonthValue = computed(() => selectedTargetMonth.value || String(props.impact.targetMonth || getCurrentMonthValue()))
const monthLabel = computed(() => {
  const [year, month] = targetMonthValue.value.split('-')
  if (!year || !month) return '2026년 6월'
  return `${year}년 ${Number(month)}월`
})
const monthOptions = computed(() => {
  const [baseYear, baseMonth] = targetMonthValue.value.split('-').map(Number)
  const baseDate = new Date(baseYear || new Date().getFullYear(), (baseMonth || new Date().getMonth() + 1) - 1, 1)

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - index, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      value,
      label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
    }
  })
})
const animatedSeaFill = computed(() => isEntered.value ? getSeaFillByLevel(props.impact.level) : '88%')
const paperProgress = computed(() => Math.min(Math.round((animatedPaperSavedCount.value / 250) * 100), 100))
const stageCurrentLabel = computed(() => journeySteps.find((step) => step.level === currentLevel.value)?.title ?? '안정화 단계')

function close() {
  currentView.value = 'main'
  monthMenuOpen.value = false
  emit('update:modelValue', false)
}

function selectTargetMonth(targetMonth) {
  selectedTargetMonth.value = targetMonth
  monthMenuOpen.value = false
  emit('change-month', targetMonth)
}

function getCurrentMonthValue() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

async function startEntryAnimation() {
  cancelCounterAnimation()
  isEntered.value = false
  animatedRecovery.value = 0
  animatedLevel.value = 0
  animatedPaperSavedCount.value = 0
  animatedCo2SavedKg.value = 0

  await nextTick()
  window.requestAnimationFrame(() => {
    isEntered.value = true
    animateCounters()
  })
}

function animateCounters() {
  const duration = 820
  const startedAt = performance.now()
  const targetRecovery = toBoundedNumber(props.impact.recoveryRate, 0, 100)
  const targetLevel = toBoundedNumber(props.impact.level, 1, 6)
  const targetPaperSavedCount = Math.max(Number(props.impact.paperSavedCount) || 0, 0)
  const targetCo2SavedKg = Math.max(Number(props.impact.co2SavedKg) || 0, 0)

  const tick = (timestamp) => {
    const progress = Math.min((timestamp - startedAt) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    animatedRecovery.value = targetRecovery * eased
    animatedLevel.value = Math.max(1, Math.round(targetLevel * eased))
    animatedPaperSavedCount.value = Math.round(targetPaperSavedCount * eased)
    animatedCo2SavedKg.value = targetCo2SavedKg * eased

    if (progress < 1) {
      counterAnimationId = window.requestAnimationFrame(tick)
      return
    }

    animatedRecovery.value = targetRecovery
    animatedLevel.value = Math.round(targetLevel)
    animatedPaperSavedCount.value = Math.round(targetPaperSavedCount)
    animatedCo2SavedKg.value = targetCo2SavedKg
    counterAnimationId = null
  }

  counterAnimationId = window.requestAnimationFrame(tick)
}

function cancelCounterAnimation() {
  if (!counterAnimationId) return
  window.cancelAnimationFrame(counterAnimationId)
  counterAnimationId = null
}

function toBoundedNumber(value, min, max) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return min
  return Math.min(Math.max(numberValue, min), max)
}

function getSeaFillByLevel(level) {
  const waterLevel = {
    1: '58%',
    2: '52%',
    3: '46%',
    4: '40%',
    5: '34%',
    6: '28%',
  }

  const normalizedLevel = Math.round(toBoundedNumber(level, 1, 6))
  return waterLevel[normalizedLevel] ?? waterLevel[1]
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
  width: 760px;
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

.esg-drawer__header h2 {
  flex: 1;
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0;
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

.esg-drawer__body {
  padding: 22px 30px 36px;
}

.esg-dashboard {
  display: grid;
  gap: 16px;
}

.esg-dashboard__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.esg-dashboard__headline {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.esg-dashboard__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #2563eb;
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.72);
}

.esg-dashboard__headline h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-dashboard__headline strong {
  display: block;
  margin-top: 5px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
}

.esg-dashboard__headline p {
  margin: 7px 0 0;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

.esg-dashboard__month-wrap {
  position: relative;
  z-index: 30;
}

.esg-dashboard__month {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.035);
  cursor: pointer;
}

.esg-dashboard__month:hover {
  border-color: #67e8f9;
  box-shadow: 0 10px 22px rgba(56, 189, 248, 0.12);
}

.esg-dashboard__month-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  display: grid;
  gap: 4px;
  min-width: 190px;
  max-height: 330px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.esg-dashboard__month-menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.esg-dashboard__month-menu button:hover,
.esg-dashboard__month-menu button.is-selected {
  background: #effaff;
  color: #0284c7;
}

.esg-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.esg-summary-card {
  display: grid;
  grid-template-columns: 54px 1fr;
  align-items: center;
  gap: 14px;
  min-height: 124px;
  padding: 18px 17px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #ffffff;
  box-shadow: 0 9px 18px rgba(15, 23, 42, 0.04);
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.esg-dashboard.is-entered .esg-summary-card {
  opacity: 1;
  transform: translateY(0);
}

.esg-dashboard.is-entered .esg-summary-card:nth-child(2) {
  transition-delay: 0.06s;
}

.esg-dashboard.is-entered .esg-summary-card:nth-child(3) {
  transition-delay: 0.12s;
}

.esg-summary-card__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
}

.esg-summary-card > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

.esg-summary-card__icon--blue {
  background: #dbeafe;
  color: #3b82f6;
}

.esg-summary-card__icon--green {
  background: #d1fae5;
  color: #059669;
}

.esg-summary-card__icon--violet {
  background: #ede9fe;
  color: #7c3aed;
}

.esg-summary-card p,
.esg-summary-card em {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  word-break: keep-all;
}

.esg-summary-card strong {
  display: block;
  margin-top: 5px;
  color: #1e3a8a;
  font-size: 27px;
  font-weight: 950;
  line-height: 1;
}

.esg-summary-card strong small {
  margin-left: 3px;
  color: #334155;
  font-size: 13px;
}

.esg-summary-card em {
  display: block;
  margin-top: 7px;
}

.esg-summary-card__bar {
  height: 5px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.esg-summary-card__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #2dd4bf);
  transition: width 0.82s cubic-bezier(0.16, 1, 0.3, 1);
}

.esg-summary-card b {
  display: block;
  margin-top: 5px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-align: right;
}

.esg-summary-card button {
  width: fit-content;
  margin-top: 8px;
  padding: 5px 9px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.esg-ocean-panel {
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  box-shadow: none;
}

.esg-scene {
  position: relative;
  height: 318px;
  overflow: hidden;
  border-radius: 10px;
  background: #d8eef8;
  box-shadow: 0 16px 30px rgba(56, 130, 179, 0.16);
  opacity: 0;
  transform: translateY(14px) scale(0.992);
  transition:
    opacity 0.62s ease 0.12s,
    transform 0.62s ease 0.12s;
}

.esg-scene.is-entered {
  opacity: 1;
  transform: translateY(0) scale(1);
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
  opacity: 0;
  transform: scale(1.025);
  transition:
    opacity 0.7s ease,
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.esg-scene.is-entered .esg-scene__photo {
  opacity: 1;
  transform: scale(1);
}

.esg-scene__sea {
  position: absolute;
  left: -48px;
  right: -48px;
  bottom: -12px;
  z-index: 6;
  display: block;
  height: var(--sea-fill);
  min-height: 64px;
  overflow: visible;
  background: transparent;
  backdrop-filter: blur(2px);
  transition: height 1.9s cubic-bezier(0.16, 1, 0.3, 1);
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
    radial-gradient(circle at 18% 66%, rgba(20, 184, 166, 0.13) 0 2px, transparent 3px),
    radial-gradient(circle at 24% 78%, rgba(56, 189, 248, 0.12) 0 2px, transparent 3px),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.22) 0 2px, transparent 3px),
    linear-gradient(180deg, rgba(125, 229, 246, 0.42), rgba(45, 212, 191, 0.44) 46%, rgba(56, 189, 248, 0.52));
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

.esg-scene__wave {
  position: absolute;
  left: -28%;
  z-index: 3;
  width: 160%;
  height: 76px;
  border-radius: 46% 54% 49% 51% / 52% 48% 52% 48%;
  background: rgba(103, 232, 249, 0.28);
  filter: blur(0.2px);
  animation: esg-wave 11s ease-in-out infinite alternate;
}

.esg-scene__wave--one {
  top: -18px;
  background:
    radial-gradient(ellipse at 48% 8%, rgba(255, 255, 255, 0.82) 0 9%, rgba(255, 255, 255, 0.32) 10% 18%, transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.48), rgba(125, 229, 246, 0.24) 26%, rgba(45, 212, 191, 0.34) 50%, rgba(56, 189, 248, 0.34)),
    rgba(103, 232, 249, 0.28);
  opacity: 0.96;
}

.esg-scene__wave--two {
  top: 1px;
  left: -44%;
  width: 178%;
  height: 86px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(103, 232, 249, 0.16) 22%, rgba(20, 184, 166, 0.28)),
    rgba(45, 212, 191, 0.22);
  opacity: 0.72;
  animation-duration: 14s;
  animation-direction: reverse;
}

.esg-scene__wave--three {
  top: 24px;
  left: -34%;
  width: 170%;
  height: 94px;
  background:
    radial-gradient(ellipse at 50% 8%, rgba(255, 255, 255, 0.28) 0 12%, transparent 34%),
    rgba(56, 189, 248, 0.2);
  opacity: 0.46;
  animation-duration: 18s;
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

.esg-sea-label {
  position: absolute;
  left: 28px;
  z-index: 12;
  display: grid;
  gap: 2px;
  color: #334155;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.2;
}

.esg-sea-label strong {
  font-size: 12px;
}

.esg-sea-label span {
  color: #64748b;
  font-size: 9px;
}

.esg-sea-label::after {
  content: '';
  position: absolute;
  left: 112px;
  top: 12px;
  width: 430px;
  border-top: 2px dashed currentColor;
  opacity: 0.62;
}

.esg-sea-label--baseline {
  top: 78px;
  color: #ef4444;
}

.esg-sea-label--current {
  top: 143px;
  color: #2563eb;
}

.esg-sea-label--recovery {
  top: 205px;
  color: #16a34a;
}

.esg-sea-arrow {
  position: absolute;
  z-index: 13;
  width: 0;
  height: 58px;
  border-left: 3px solid currentColor;
}

.esg-sea-arrow::before,
.esg-sea-arrow::after {
  content: '';
  position: absolute;
  left: -7px;
  width: 12px;
  height: 12px;
  border-left: 3px solid currentColor;
  border-top: 3px solid currentColor;
}

.esg-sea-arrow::before {
  top: -1px;
  transform: rotate(45deg);
}

.esg-sea-arrow::after {
  bottom: -1px;
  transform: rotate(225deg);
}

.esg-sea-arrow--up-left {
  left: 17px;
  top: 112px;
  color: #ef4444;
}

.esg-sea-arrow--up-right {
  right: 17px;
  top: 112px;
  color: #ef4444;
}

.esg-sea-arrow--down {
  right: 18px;
  top: 174px;
  color: #16a34a;
}

.esg-scene-note {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 14;
  width: 168px;
  padding: 11px;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.86);
  color: #475569;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
}

.esg-scene-note strong {
  display: block;
  color: #2563eb;
  font-size: 12px;
  font-weight: 950;
}

.esg-scene-note p {
  margin: 5px 0 0;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.45;
}

.esg-ocean-panel__message {
  position: absolute;
  left: 96px;
  right: 96px;
  bottom: 17px;
  z-index: 18;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 30px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid rgba(245, 207, 128, 0.42);
  border-radius: 999px;
  background: rgba(255, 249, 232, 0.92);
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(180, 129, 42, 0.12);
  backdrop-filter: blur(7px);
}

.esg-journey {
  padding: 12px 12px 14px;
  border: 1px solid #c8f3ef;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.045);
}

.esg-journey h3 {
  margin: 0 0 8px;
  color: #102033;
  font-size: 15px;
  font-weight: 950;
}

.esg-journey__steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
}

.esg-journey__steps article {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  color: #475569;
  text-align: center;
}

.esg-journey__steps article:not(:last-child)::after {
  content: '→';
  position: absolute;
  right: -10px;
  top: 31px;
  color: #94a3b8;
  font-weight: 900;
}

.esg-journey__steps span {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 999px;
  background: #d9f8f3;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.esg-journey__steps img {
  width: 92px;
  height: 56px;
  object-fit: cover;
  object-position: center;
}

.esg-journey__steps strong {
  color: #ef4444;
  font-size: 12px;
  font-weight: 950;
}

.esg-journey__steps b {
  color: #0f766e;
  font-size: 11px;
  font-weight: 950;
}

.esg-journey__steps small {
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
  line-height: 1.25;
}

.esg-journey__steps article.is-active span {
  box-shadow: 0 0 0 4px #20c7ba, 0 10px 22px rgba(20, 184, 166, 0.22);
  transform: scale(1.03);
}

.esg-journey__progress {
  width: fit-content;
  margin: 10px auto 0;
  padding: 6px 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, #20c7ba, #38bdf8);
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
}

.esg-criteria {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px 18px 34px;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 36%);
}

.esg-criteria-card {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 356px;
  padding: 18px 15px 20px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(226, 232, 240, 0.55);
}

.esg-criteria-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.esg-criteria-card__header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 15px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-criteria-card__header button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #1e3a8a;
  cursor: pointer;
}

.esg-criteria-card__description {
  margin: 0;
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.55;
}

.esg-criteria-levels {
  display: grid;
  gap: 7px;
}

.esg-criteria-level {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #ffffff;
}

.esg-criteria-level.is-active {
  border-color: #3b82f6;
  background: #f8fbff;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.esg-criteria-level__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
}

.esg-criteria-level__icon--red {
  background: #fee2e2;
  color: #ef4444;
}

.esg-criteria-level__icon--green {
  background: #d1fae5;
  color: #059669;
}

.esg-criteria-level__icon--teal {
  background: #ccfbf1;
  color: #0f766e;
}

.esg-criteria-level__icon--blue {
  background: #dbeafe;
  color: #2563eb;
}

.esg-criteria-level__icon--violet {
  background: #ede9fe;
  color: #7c3aed;
}

.esg-criteria-level__icon--sky {
  background: #dff4ff;
  color: #0284c7;
}

.esg-criteria-level__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.esg-criteria-level__content div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.esg-criteria-level__content strong {
  color: #1e3a8a;
  font-size: 11px;
  font-weight: 950;
  line-height: 1.2;
}

.esg-criteria-level__content b {
  flex: 0 0 auto;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 950;
  line-height: 1.2;
}

.esg-criteria-level__content p {
  margin: 0;
  color: #334155;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.35;
  word-break: keep-all;
}

.esg-criteria-card__footnote {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  margin-top: 5px;
  padding-top: 13px;
  border-top: 1px solid #e2e8f0;
  color: #1e3a8a;
}

.esg-criteria-card__footnote p {
  margin: 0;
  color: #334155;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.45;
}

.esg-backdrop-enter-active,
.esg-backdrop-leave-active {
  transition: opacity 0.22s ease;
}

.esg-backdrop-enter-from,
.esg-backdrop-leave-to {
  opacity: 0;
}

.esg-drawer-enter-active,
.esg-drawer-leave-active {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
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
    transform: translateX(7%);
  }
}

@keyframes esg-bubble {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 0.8;
    transform: translateY(-12px);
  }
}

@media (max-width: 720px) {
  .esg-drawer {
    width: 100vw;
  }

  .esg-drawer__body {
    padding: 18px 18px 30px;
  }

  .esg-dashboard__top,
  .esg-dashboard__headline {
    display: grid;
  }

  .esg-summary,
  .esg-journey__steps {
    grid-template-columns: 1fr;
  }

  .esg-scene {
    height: 300px;
  }

  .esg-scene-note {
    display: none;
  }

  .esg-ocean-panel__message {
    left: 20px;
    right: 20px;
  }

  .esg-criteria {
    padding: 14px;
  }

  .esg-criteria-card {
    max-width: 100%;
  }

  .esg-criteria-level__content div {
    align-items: flex-start;
  }
}
</style>
