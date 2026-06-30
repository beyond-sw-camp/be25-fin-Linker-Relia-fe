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
        <main
          class="esg-drawer__body esg-dashboard"
          :class="{ 'is-entered': isEntered }"
        >
          <section class="esg-dashboard__top">
            <div class="esg-dashboard__headline">
              <div>
                <div class="esg-dashboard__title-row">
                  <h2>해수면 상승 완화 현황</h2>
                  <button
                    type="button"
                    class="esg-dashboard__info-button"
                    aria-label="환경 기여 알아보기"
                    @click="isImpactInfoOpen = true"
                  >
                    <v-icon icon="mdi-information-outline" size="18" />
                    <span class="esg-dashboard__info-tooltip" role="tooltip">환경 기여 알아보기</span>
                  </button>
                </div>
                <p>상담일지 작성 · AI 브리핑 생성 · 인수인계 완료가 종이 사용을 줄이고
                  <br>
                  해수면 상승 속도를 늦춰 섬을 지켜주고 있습니다.</p>
              </div>
            </div>

            <div class="esg-dashboard__month-wrap">
              <button type="button" class="esg-dashboard__month" @click="monthMenuOpen = !monthMenuOpen">
                <v-icon icon="mdi-calendar-month-outline" size="13" />
                {{ monthLabel }} ESG 챌린지
                <v-icon :icon="monthMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="14" />
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
                  <v-icon v-if="option.value === targetMonthValue" icon="mdi-check" size="13" />
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
              </div>
            </article>

            <article class="esg-summary-card">
              <span class="esg-summary-card__icon esg-summary-card__icon--green">
                <v-icon icon="mdi-cloud-outline" size="24" />
              </span>
              <div>
                <p>이번 달 절감한 CO₂</p>
                <strong>{{ formatNumber(animatedCo2SavedKg) }}<small>kg</small></strong>
              </div>
            </article>

            <article class="esg-summary-card">
              <span class="esg-summary-card__icon esg-summary-card__icon--violet">
                <v-icon icon="mdi-waves" size="24" />
              </span>
              <div>
                <p>해수면 상승 완화 단계</p>
                <strong>Lv.{{ animatedLevel }}<small>{{ stageCurrentLabel }}</small></strong>
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
              <p class="esg-ocean-panel__message">
                <v-icon icon="mdi-lightbulb-on-outline" size="16" />
                더 많은 실천을 할수록 바다가 내려가고, 섬은 더 안전해집니다.
              </p>
            </div>
          </section>

          <section class="esg-journey">
            <div class="esg-journey__header">
              <div>
                <h3>환경 기여 레벨</h3>
                <p>종이 절감량에 따라 레벨이 자동으로 상승합니다.</p>
              </div>
            </div>
            <div class="esg-journey__steps">
              <article
                v-for="step in journeySteps"
                :key="step.level"
                :class="{ 'is-active': step.level === currentLevel }"
              >
                <span class="esg-journey__image">
                  <img :src="seaLevelIslandImage" alt="" />
                </span>
                <strong>{{ step.label }}</strong>
                <b>{{ step.title }}</b>
                <small class="esg_journey__description">
                  {{ step.description }}
                </small>
                <div class="esg-journey__target">
                  <i>필요 절약량</i>
                  <mark>{{ step.range }}</mark>
                </div>
              </article>
            </div>
          </section>
        </main>
      </aside>
    </Transition>

    <Transition name="esg-info-modal">
      <div v-if="isImpactInfoOpen" class="esg-info-modal" role="dialog" aria-modal="true" aria-label="환경 기여 알아보기">
        <button type="button" class="esg-info-modal__backdrop" aria-label="환경 기여 알아보기 닫기" @click="isImpactInfoOpen = false"></button>
        <section class="esg-info-modal__panel">
          <header class="esg-info-modal__header">
            <div>
              <v-icon icon="mdi-leaf" size="34" />
              <h2>환경 기여 알아보기</h2>
            </div>
            <button type="button" aria-label="닫기" @click="isImpactInfoOpen = false">
              <v-icon icon="mdi-close" size="34" />
            </button>
          </header>

          <p class="esg-info-modal__lead">
            종이 절약이 CO₂ 절감으로 이어지고, 해수면 상승 완화에 기여합니다.
          </p>

          <div class="esg-info-modal__grid">
            <div class="esg-info-modal__left">
              <section class="esg-info-section esg-info-section--activity">
                <h3>1. 우리가 실천한 활동</h3>
                <div class="esg-info-activities">
                  <article>
                    <span class="esg-info-activity-icon esg-info-activity-icon--blue">
                      <v-icon icon="mdi-file-document-outline" size="34" />
                    </span>
                    <strong>상담일지 작성</strong>
                    <div class="esg-info-activity-metrics">
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          기준
                        </span>
                        <b>1건당 종이 3장 절약</b>
                      </p>
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          현재
                        </span>
                        <strong>{{ impactInfoActivityMetrics.consultation.paper }}<small>장 절약</small></strong>
                        <em>({{ impactInfoActivityMetrics.consultation.count }}건)</em>
                      </p>
                    </div>
                  </article>
                  <article>
                    <span class="esg-info-activity-icon esg-info-activity-icon--purple">
                      <v-icon icon="mdi-laptop" size="34" />
                    </span>
                    <strong>AI 브리핑 생성</strong>
                    <div class="esg-info-activity-metrics">
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          기준
                        </span>
                        <b>1건당 종이 5장 절약</b>
                      </p>
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          현재
                        </span>
                        <strong>{{ impactInfoActivityMetrics.aiBriefing.paper }}<small>장 절약</small></strong>
                        <em>({{ impactInfoActivityMetrics.aiBriefing.count }}건)</em>
                      </p>
                    </div>
                  </article>
                  <article>
                    <span class="esg-info-activity-icon esg-info-activity-icon--green">
                      <v-icon icon="mdi-account-group" size="34" />
                    </span>
                    <strong>인수인계 완료</strong>
                    <div class="esg-info-activity-metrics">
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          기준
                        </span>
                        <b>1건당 종이 4장 절약</b>
                      </p>
                      <p>
                        <span>
                          <v-icon icon="mdi-check" size="14" />
                          현재
                        </span>
                        <strong>{{ impactInfoActivityMetrics.handover.paper }}<small>장 절약</small></strong>
                        <em>({{ impactInfoActivityMetrics.handover.count }}건)</em>
                      </p>
                    </div>
                  </article>
                </div>
                <div class="esg-info-paper-total">
                  <strong>총 절약한 종이</strong>
                  <b>{{ impactInfoPaperCount }}<small>장</small></b>
                  <img class="esg-info-paper-illustration" :src="infoPaperStackImage" alt="" />
                </div>
              </section>

              <section class="esg-info-section">
                <h3>2. 종이 절약이 CO₂ 절감으로</h3>
                <div class="esg-info-equation">
                  <article>
                    <span>절약한 종이</span>
                    <strong>{{ impactInfoPaperCount }}<small>장</small></strong>
                  </article>
                  <i>×</i>
                  <article>
                    <span>종이 1장당 CO₂ 배출량</span>
                    <strong>0.015<small>kg</small></strong>
                  </article>
                  <i>=</i>
                  <article class="is-green">
                    <span>CO₂ 절감량</span>
                    <strong>{{ impactInfoCo2Kg }}<small>kg</small></strong>
                  </article>
                </div>
                <div class="esg-info-formula">
                  <strong>계산식</strong>
                  <span>{{ impactInfoPaperCount }}장 × 0.015kg/장 = {{ impactInfoCo2Kg }}kg CO₂ 절감</span>
                  <b>(종이 1장당 CO₂ 배출량: 0.015kg)</b>
                </div>
              </section>

              <section class="esg-info-section">
                <h3>3. CO₂ 절감이 지구에 주는 영향 <small>(나무 식재 효과로 환산)</small></h3>
                <div class="esg-info-equation">
                  <article class="is-green">
                    <span>CO₂ 절감량</span>
                    <strong>{{ impactInfoCo2Kg }}<small>kg</small></strong>
                  </article>
                  <i>÷</i>
                  <article>
                    <span>성목 1그루의<br />연간 CO₂ 흡수량</span>
                    <strong>8.7<small>kg</small></strong>
                  </article>
                  <i>=</i>
                  <article class="is-green">
                    <span>나무 식재 효과</span>
                    <strong>약 {{ impactInfoTreeCount }}<small>그루</small></strong>
                  </article>
                </div>
                <div class="esg-info-formula">
                  <strong>계산식</strong>
                  <span>{{ impactInfoCo2Kg }}kg ÷ 8.7kg/그루 = 약 {{ impactInfoTreeCount }}그루</span>
                  <b>(성목 1그루 연간 CO₂ 흡수량: 8.7kg)</b>
                </div>
              </section>
            </div>

            <aside class="esg-info-modal__right">
              <section class="esg-info-side-card esg-info-side-card--blue">
                <h3>왜 해수면 상승을 주제로 하나요?</h3>
                <p>
                  해수면 상승은 섬과 해안 지역을 위협하고,<br />
                  다양한 생물과 사람들의 삶의 터전을 변화시킵니다.
                </p>
                <p>
                  Relia는 종이 절약으로 줄인 CO₂를 해수면 회복 단계로 표현하여,<br />
                  작은 실천도 환경을 지키는 의미 있는 <br />
                  변화가 될 수 있다는 메시지를 담았습니다.
                </p>
              </section>

              <section class="esg-info-side-card esg-info-side-card--green">
                <h3>CO₂ 절감량은 어디서 왔나요?</h3>
                <p>
                  종이의 원료 채취, 제조, 운송, 폐기 전 과정에서<br />
                  발생하는 평균 CO₂ 배출량을 기준으로<br />
                  계산했습니다.
                </p>
                <small>출처: 환경부 탄소중립 생활 실천 안내서 (2023)</small>
              </section>

              <section class="esg-info-side-card">
                <h3>계산 기준 요약</h3>
                <ul>
                  <li>
                    <strong>종이 1장당 CO₂ 배출량: 0.015kg (15g)</strong>
                    <span>출처: 환경부 (2023)</span>
                  </li>
                  <li>
                    <strong>성목 1그루 연간 CO₂ 흡수량: 8.7kg</strong>
                    <span>출처: 국립산림과학원 산림탄소관리센터 (2022)</span>
                  </li>
                </ul>
              </section>
            </aside>
          </div>

          <footer class="esg-info-modal__footer">
            <p>
              계산 예시는 이해를 돕기 위한 예시이며, 실제 절감량은 이번 달 실적을 기준으로 자동 계산됩니다.
            </p>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import infoPaperStackImage from '../../assets/esg/info-paper-stack.png'
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
const isImpactInfoOpen = ref(false)
const isEntered = ref(false)
const selectedTargetMonth = ref('')
const monthMenuOpen = ref(false)
const animatedRecovery = ref(0)
const animatedLevel = ref(0)
const animatedPaperSavedCount = ref(0)
const animatedCo2SavedKg = ref(0)
let counterAnimationId = null

const journeySteps = [
  { level: 1, label: 'Lv.1', title: '침수 위기', description: '섬의 대부분이\n위험한 상태', range: '0 ~ 49장' },
  { level: 2, label: 'Lv.2', title: '희망의 시작', description: '작은 실천이\n변화를 시작', range: '50 ~ 99장' },
  { level: 3, label: 'Lv.3', title: '변화 확산', description: '지속적인 실천으로\n변화가 커짐', range: '100~149장' },
  { level: 4, label: 'Lv.4', title: '안정 확보', description: '해수면 상승 속도가\n눈에 띄게 완화', range: '150~199장' },
  { level: 5, label: 'Lv.5', title: '미래 보전', description: '미래 세대를 위한\n안전을 확보', range: '200~249장' },
  { level: 6, label: 'Lv.6', title: '평화로운 수호', description: '섬이 안전하게\n지켜진 상태', range: '250장 이상' },
]

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      isImpactInfoOpen.value = false
      isEntered.value = false
      monthMenuOpen.value = false
      cancelCounterAnimation()
      return
    }

    startEntryAnimation()
  },
)

watch(
  () => [
    props.impact.paperSavedCount,
    props.impact.co2SavedKg,
    props.impact.level,
    props.impact.recoveryRate,
  ],
  () => {
    if (!props.modelValue) return
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
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - (11 - index), 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      value,
      label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
    }
  })
})
const animatedSeaFill = computed(() => isEntered.value ? getSeaFillByLevel(props.impact.level) : '88%')
const paperProgress = computed(() => Math.min(Math.round((animatedPaperSavedCount.value / 250) * 100), 100))
const stageCurrentLabel = computed(() => journeySteps.find((step) => step.level === currentLevel.value)?.title ?? '안정 확보')
const impactInfoPaperCount = computed(() => formatCount(Math.round(Math.max(Number(props.impact.paperSavedCount) || 0, 0))))
const impactInfoCo2Kg = computed(() => formatFixedNumber((Math.max(Number(props.impact.paperSavedCount) || 0, 0) * 0.015), 2))
const impactInfoTreeCount = computed(() => formatFixedNumber((Math.max(Number(props.impact.paperSavedCount) || 0, 0) * 0.015) / 8.7, 2))
const impactInfoActivityMetrics = computed(() => {
  const consultationCount = Math.max(Number(props.impact.consultationCount) || 0, 0)
  const aiBriefingCount = Math.max(Number(props.impact.aiBriefingCount) || 0, 0)
  const handoverCount = Math.max(Number(props.impact.handoverCount) || 0, 0)

  return {
    consultation: {
      count: formatCount(consultationCount),
      paper: formatCount(consultationCount * 3),
    },
    aiBriefing: {
      count: formatCount(aiBriefingCount),
      paper: formatCount(aiBriefingCount * 5),
    },
    handover: {
      count: formatCount(handoverCount),
      paper: formatCount(handoverCount * 4),
    },
  }
})

function close() {
  isImpactInfoOpen.value = false
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

function formatFixedNumber(value, digits) {
  const numberValue = Number(value) || 0
  return numberValue.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
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
  display: grid;
  min-width: 0;
  gap: 6px;
}

.esg-dashboard__headline h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-dashboard__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.esg-dashboard__info-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.esg-dashboard__info-button:hover,
.esg-dashboard__info-button:focus-visible {
  color: #1d4ed8;
}

.esg-dashboard__info-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
  border-radius: 999px;
}

.esg-dashboard__info-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  z-index: 50;
  width: max-content;
  max-width: 160px;
  padding: 6px 9px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(-3px);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.esg-dashboard__info-tooltip::after {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  width: 7px;
  height: 7px;
  background: inherit;
  transform: translate(4px, -50%) rotate(45deg);
}

.esg-dashboard__info-button:hover .esg-dashboard__info-tooltip,
.esg-dashboard__info-button:focus-visible .esg-dashboard__info-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.esg-dashboard__headline strong {
  display: block;
  margin-top: 4px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
}

.esg-dashboard__headline p {
  margin: 10px 0 0;
  color: #71839b;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
}

.esg-dashboard__month-wrap {
  position: relative;
  z-index: 30;
}

.esg-dashboard__month {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0 9px;
  border: 1px solid #dbeafe;
  border-radius: 7px;
  background: #ffffff;
  color: #334155;
  font-size: 11px;
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
  min-width: 158px;
  max-height: 286px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.esg-dashboard__month-menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #475569;
  font-size: 11px;
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
  border: 1px solid rgba(203, 213, 225, 0.7);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.94);
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(7px);
}

.esg-ocean-panel__message :deep(.v-icon) {
  color: #facc15;
}

.esg-journey {
  padding: 20px 24px 22px;
  border: 1px solid #e8f2fb;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.045);
}

.esg-journey__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.esg-journey__header > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #d8f8eb;
  color: #0fb47c;
}

.esg-journey__header h3 {
  margin: 0;
  color: #0d2857;
  font-size: 17px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-journey__header p {
  margin: 5px 0 0;
  color: #71839b;
  font-size: 11px;
  font-weight: 600;
}

.esg-journey__steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: start;
  gap: 14px;
  padding-top: 16px;
}

.esg-journey__steps article {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8px;
  min-width: 0;
  color: #0d2857;
  text-align: center;
}

.esg-journey__steps article:not(:last-child)::after {
  content: '›';
  position: absolute;
  right: -13px;
  top: 42px;
  color: #7d8ca5;
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.esg-journey__steps em {
  position: absolute;
  top: -16px;
  left: 50%;
  z-index: 2;
  min-width: 54px;
  padding: 3px 7px;
  border-radius: 999px;
  background: #10bfa5;
  color: #ffffff;
  font-size: 9px;
  font-style: normal;
  font-weight: 950;
  line-height: 1.1;
  transform: translateX(-50%);
}

.esg-journey__image {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  overflow: hidden;
  border-radius: 999px;
  background: #dff2ff;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.12);
}

.esg-journey__steps img {
  width: 132px;
  height: 82px;
  object-fit: cover;
  object-position: center;
}

.esg-journey__steps strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2f74db;
  font-size: 11px;
  font-weight: 950;
}

.esg-journey__steps b {
  color: #0d2857;
  font-size: 13px;
  font-weight: 950;
  line-height: 1.25;
}

.esg-journey__steps small {
  min-height: 36px;
  color: #6b7d95;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.55;
  word-break: keep-all;
}

.esg-journey__steps article.is-active .esg-journey__image {
  box-shadow: 0 0 0 5px #16c7b8, 0 14px 26px rgba(20, 184, 166, 0.24);
  transform: scale(1.03);
}

.esg-journey__steps article.is-active strong {
  background: #dffaf3;
  color: #08a886;
}

.esg-journey__steps article.is-active b {
  color: #08a886;
}

.esg-journey__target {
  display: grid;
  justify-items: center;
  gap: 3px;
  width: 100%;
  min-height: 62px;
  margin-top: 6px;
  padding: 9px 6px;
  border: 1px dashed #b8d8ff;
  border-radius: 8px;
  background: #fbfdff;
}

.esg-journey__target i {
  color: #3b82f6;
  font-size: 9px;
  font-style: normal;
  font-weight: 950;
}

.esg-journey__target mark {
  background: transparent;
  color: #2f74db;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
}

.esg-journey__steps article.is-active .esg-journey__target {
  border-color: #9ee6db;
  background: #fbfffd;
}

.esg-journey__steps article.is-active .esg-journey__target i,
.esg-journey__steps article.is-active .esg-journey__target mark {
  color: #08a886;
}

.esg_journey__description {
  white-space: pre-line;
}

.esg-info-modal {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: grid;
  place-items: center;
  padding: 24px;
}

.esg-info-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.58);
  cursor: pointer;
}

.esg-info-modal__panel {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1210px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  gap: 18px;
  padding: 36px 34px 28px;
  border-radius: 18px;
  background: #ffffff;
  color: #0d2857;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.3);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.esg-info-modal__panel::-webkit-scrollbar {
  display: none;
}

.esg-info-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.esg-info-modal__header div {
  display: flex;
  align-items: center;
  gap: 16px;
}

.esg-info-modal__header :deep(.v-icon) {
  color: #2ca56a;
}

.esg-info-modal__header h2 {
  margin: 0;
  color: #0b2a5c;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-info-modal__header button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #0b2a5c;
  cursor: pointer;
}

.esg-info-modal__header button :deep(.v-icon) {
  color: #0b2a5c;
}

.esg-info-modal__lead {
  margin: -8px 0 2px 52px;
  color: #71839b;
  font-size: 15px;
  font-weight: 750;
}

.esg-info-modal__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.95fr) minmax(330px, 1fr);
  gap: 26px;
}

.esg-info-modal__left,
.esg-info-modal__right {
  display: grid;
  gap: 18px;
}

.esg-info-section,
.esg-info-side-card {
  border: 1px solid #d7e2f2;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.035);
}

.esg-info-section {
  padding: 18px;
}

.esg-info-section--activity {
  padding: 24px 24px 18px;
}

.esg-info-section h3,
.esg-info-side-card h3 {
  margin: 0;
  color: #0b2a5c;
  font-size: 20px;
  font-weight: 950;
  letter-spacing: 0;
}

.esg-info-section h3 small {
  color: #71839b;
  font-size: 14px;
  font-weight: 850;
}

.esg-info-activities {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  padding: 24px 0 22px;
}

.esg-info-activities article {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 260px;
  padding: 24px 20px 22px;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: #ffffff;
  text-align: center;
}

.esg-info-activity-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border-radius: 999px;
}

.esg-info-activity-icon--blue {
  background: #dbeafe;
  color: #3b82f6;
}

.esg-info-activity-icon--purple {
  background: #ede9fe;
  color: #7c3aed;
}

.esg-info-activity-icon--green {
  background: #d1fae5;
  color: #2ca56a;
}

.esg-info-activities > article > strong {
  margin-top: 14px;
  min-height: 42px;
  color: #0d2857;
  font-size: 15px;
  font-weight: 950;
  line-height: 1.25;
  word-break: keep-all;
}

.esg-info-activity-metrics {
  display: grid;
  width: 100%;
  gap: 12px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #dbe6f5;
}

.esg-info-activity-metrics p {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  column-gap: 12px;
  min-height: 42px;
  margin: 0;
  text-align: left;
}

.esg-info-activity-metrics p > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7d95;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.esg-info-activity-metrics p > span::after {
  display: none;
}

.esg-info-activity-metrics p > span :deep(.v-icon) {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #d7dee8;
  color: #334155;
}

.esg-info-activity-metrics p:nth-child(2) > span {
  color: #1d6be3;
}

.esg-info-activity-metrics p:nth-child(2) > span :deep(.v-icon) {
  background: #2f7df0;
  color: #ffffff;
}

.esg-info-activity-metrics b {
  color: #334155;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.35;
  word-break: keep-all;
}

.esg-info-activity-metrics strong {
  color: #2f7df0;
  font-size: 18px;
  font-weight: 950;
  line-height: 1;
  white-space: nowrap;
}

.esg-info-activity-metrics strong small {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 900;
}

.esg-info-activity-metrics em {
  grid-column: 2;
  margin-top: -2px;
  color: #6b7d95;
  font-size: 12px;
  font-style: normal;
  font-weight: 750;
}

.esg-info-paper-total {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 90px;
  align-items: center;
  gap: 25px;
  min-height: 92px;
  padding: 12px 18px 0;
  border-top: 1px solid #d7e2f2;
}

.esg-info-paper-total strong {
  color: #0d2857;
  font-size: 19px;
  font-weight: 950;
}

.esg-info-paper-total b {
  color: #1e3a8a;
  font-size: 30px;
  font-weight: 950;
  white-space: nowrap;
}

.esg-info-paper-total small,
.esg-info-equation small {
  margin-left: 4px;
  font-size: 18px;
  font-weight: 900;
}

.esg-info-paper-illustration {
  display: block;
  width: 86px;
  height: 54px;
  object-fit: contain;
  object-position: right center;
}

.esg-info-equation {
  display: grid;
  grid-template-columns: 1fr 28px 1.35fr 28px 1.35fr;
  gap: 16px;
  align-items: center;
  margin-top: 17px;
}

.esg-info-equation article {
  display: grid;
  align-content: center;
  place-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 14px;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: linear-gradient(180deg, #fbfdff, #f5f8fb);
  text-align: center;
}

.esg-info-equation article.is-green {
  background: linear-gradient(180deg, #f8fffb, #eefaf3);
}

.esg-info-equation span {
  color: #0d2857;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.35;
}

.esg-info-equation strong {
  color: #1e3a8a;
  font-size: 26px;
  font-weight: 950;
  line-height: 1.1;
}

.esg-info-equation article.is-green strong {
  color: #23895b;
}

.esg-info-equation i {
  color: #42526f;
  font-size: 32px;
  font-style: normal;
  font-weight: 800;
  text-align: center;
}

.esg-info-formula {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  min-height: 40px;
  margin-top: 18px;
  padding: 0 18px;
  border-radius: 10px;
  background: #f3f6fa;
  color: #0d2857;
  font-size: 12px;
  font-weight: 850;
}

.esg-info-formula strong {
  font-weight: 950;
}

.esg-info-formula b {
  font-weight: 850;
}

.esg-info-side-card {
  position: relative;
  overflow: hidden;
  min-height: 178px;
  padding: 28px;
}

.esg-info-side-card--blue {
  min-height: 318px;
  background: linear-gradient(135deg, #f8fbff, #eef6ff);
}

.esg-info-side-card--green {
  background: linear-gradient(135deg, #f8fffb, #effaf6);
}

.esg-info-side-card--green h3 {
  color: #168658;
}

.esg-info-side-card p {
  position: relative;
  z-index: 1;
  margin: 22px 0 0;
  color: #0d2857;
  font-size: 15px;
  font-weight: 780;
  line-height: 1.75;
}

.esg-info-side-card small {
  display: block;
  margin-top: 22px;
  color: #64748b;
  font-size: 11px;
  font-weight: 500;
}

.esg-info-side-card ul {
  display: grid;
  gap: 22px;
  margin: 22px 0 0;
  padding: 0 0 0 18px;
  color: #0d2857;
}

.esg-info-side-card li {
  padding-left: 4px;
}

.esg-info-side-card li strong,
.esg-info-side-card li span {
  display: block;
  font-size: 14px;
  line-height: 1.55;
}

.esg-info-side-card li strong {
  font-weight: 950;
}

.esg-info-side-card li span {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.esg-info-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
  color: #64748b;
}

.esg-info-modal__footer p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #71839b;
  font-size: 13px;
  font-weight: 750;
}

.esg-info-modal__footer :deep(.v-icon) {
  color: #64748b;
}

.esg-info-modal-enter-active,
.esg-info-modal-leave-active {
  transition: opacity 0.18s ease;
}

.esg-info-modal-enter-from,
.esg-info-modal-leave-to {
  opacity: 0;
}

@media (max-width: 1180px) {
  .esg-info-modal__panel {
    width: min(860px, calc(100vw - 32px));
    padding: 30px 24px 24px;
  }

  .esg-info-modal__grid {
    grid-template-columns: 1fr;
  }

  .esg-info-modal__right {
    grid-template-columns: 1fr;
  }

  .esg-info-side-card--blue {
    min-height: 278px;
  }

  .esg-info-equation {
    grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1.1fr) 24px minmax(0, 1.1fr);
    gap: 10px;
  }

  .esg-info-equation article {
    min-width: 0;
    padding: 12px 8px;
  }

  .esg-info-equation strong {
    font-size: 23px;
  }

  .esg-info-formula {
    grid-template-columns: auto minmax(0, 1fr);
    row-gap: 5px;
    padding: 8px 14px;
  }

  .esg-info-formula b {
    grid-column: 2;
  }

  .esg-info-formula :deep(.v-icon) {
    display: none;
  }
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

  .esg-journey {
    padding: 18px 18px 20px;
  }

  .esg-journey__steps {
    gap: 22px;
  }

  .esg-journey__steps article:not(:last-child)::after {
    display: none;
  }

  .esg-scene {
    height: 300px;
  }

  .esg-ocean-panel__message {
    left: 20px;
    right: 20px;
  }

  .esg-info-modal {
    padding: 12px;
  }

  .esg-info-modal__panel {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    padding: 22px 16px;
    border-radius: 14px;
  }

  .esg-info-modal__header h2 {
    font-size: 24px;
  }

  .esg-info-modal__lead {
    margin-left: 0;
    line-height: 1.45;
  }

  .esg-info-modal__grid,
  .esg-info-activities,
  .esg-info-paper-total,
  .esg-info-equation {
    grid-template-columns: 1fr;
  }

  .esg-info-activities article {
    grid-template-columns: 64px 1fr;
    min-height: auto;
    padding: 18px;
  }

  .esg-info-activity-icon {
    width: 64px;
    height: 64px;
  }

  .esg-info-activities strong {
    font-size: 17px;
  }

  .esg-info-activity-metrics {
    gap: 12px;
  }

  .esg-info-activity-metrics p {
    grid-template-columns: 92px 1fr;
    column-gap: 12px;
  }

  .esg-info-activity-metrics p > span {
    font-size: 13px;
  }

  .esg-info-activity-metrics b {
    font-size: 14px;
  }

  .esg-info-activity-metrics strong {
    font-size: 24px;
  }

  .esg-info-activity-metrics strong small,
  .esg-info-activity-metrics em {
    font-size: 14px;
  }

  .esg-info-paper-total {
    justify-items: center;
    text-align: center;
  }

  .esg-info-paper-illustration {
    width: 74px;
    height: 48px;
  }

  .esg-info-side-card--blue {
    min-height: 330px;
  }

  .esg-info-equation i {
    font-size: 24px;
  }

  .esg-info-formula {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 10px 12px;
  }

  .esg-info-modal__footer {
    display: grid;
  }

}
</style>
