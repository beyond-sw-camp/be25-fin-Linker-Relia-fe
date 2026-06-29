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
          <h2>ESG Impact 상세</h2>
          <button type="button" aria-label="닫기" @click="close">
            <v-icon icon="mdi-close" size="18" />
          </button>
        </header>

        <main class="esg-drawer__body">
          <section class="esg-hero">
            <h3>바다 수위 안정 현황</h3>
            <span>현재 회복률</span>
            <strong>{{ impact.recoveryRate }}%</strong>

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
            <h3>오늘의 환경 기여 활동</h3>
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
                  수위
                  <span>{{ formatDelta(activity.seaLevelDelta) }}m</span>
                </b>
              </article>
            </div>
            <div v-else class="esg-activities-empty">
              오늘 기록된 환경 기여 활동이 없습니다.
            </div>
          </section>
        </main>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

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

const metrics = computed(() => [
  { icon: 'mdi-file-document-outline', label: '종이 절감', value: `${formatCount(props.impact.paperSavedCount)} 장` },
  { icon: 'mdi-weather-cloudy', label: 'CO₂ 절감', value: `${formatNumber(props.impact.co2SavedKg)} kg` },
  { icon: 'mdi-earth', badgeIcon: 'mdi-thermometer-low', label: '지구 온도 완화', value: `${formatNumber(props.impact.earthTemperatureReduction)} ℃` },
  { icon: 'mdi-waves', label: '해수면 감소 기여', value: `${formatNumber(props.impact.seaLevelContribution)} m` },
])

const activities = computed(() => Array.isArray(props.impact.activities) ? props.impact.activities : [])
const seaFill = computed(() => {
  const recovery = Math.min(Math.max(Number(props.impact.recoveryRate) || 0, 0), 100)
  return `${62 - recovery * 0.16}%`
})

function close() {
  emit('update:modelValue', false)
}

function getActivityIcon(type) {
  const icons = {
    CONSULTATION: 'mdi-file-document-outline',
    AI_BRIEFING: 'mdi-text-box-outline',
    E_SIGN: 'mdi-draw-pen',
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
  width: 460px;
  max-width: 100vw;
  height: 100vh;
  overflow-y: auto;
  background: #ffffff;
  color: #122033;
  box-shadow: -18px 0 38px rgba(15, 23, 42, 0.14);
}

.esg-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 24px;
  border-bottom: 1px solid #edf1f6;
}

.esg-drawer__header h2 {
  margin: 0;
  color: #111827;
  font-size: 14px;
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
  padding: 18px 24px 30px;
}

.esg-hero h3,
.esg-section h3 {
  margin: 0 0 12px;
  color: #16263a;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
}

.esg-hero > span {
  display: block;
  margin-bottom: 2px;
  color: #65768d;
  font-size: 10px;
  font-weight: 800;
}

.esg-hero > strong {
  display: block;
  margin-bottom: 10px;
  color: #172236;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.esg-scene {
  position: relative;
  height: 230px;
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
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.62);
  color: #6a7c91;
  font-size: 9px;
  font-weight: 800;
  backdrop-filter: blur(5px);
}

.esg-scene__caption b {
  color: #079669;
  font-size: 12px;
  font-weight: 900;
}


.esg-section {
  margin-top: 18px;
}

.esg-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.esg-metric {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  min-height: 66px;
  padding: 8px 6px;
  border: 1px solid #e8eef5;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.035);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.esg-metric:hover,
.esg-activity:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.esg-metric > span {
  color: #42536a;
  font-size: 9px;
  font-weight: 900;
  white-space: nowrap;
}

.esg-metric div {
  display: flex;
  align-items: center;
  gap: 4px;
}

.esg-metric :deep(.v-icon),
.esg-activity__icon :deep(.v-icon) {
  color: #4a9ce8;
}

.esg-metric__combo-icon {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 19px;
  height: 19px;
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
  font-size: 12px;
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
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.035);
}

.esg-activity {
  display: grid;
  grid-template-columns: 40px 28px 1fr 46px;
  align-items: center;
  gap: 10px;
  min-height: 51px;
  padding: 8px 12px;
  border-bottom: 1px solid #eef2f7;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.esg-activity:last-child {
  border-bottom: 0;
}

.esg-activity time {
  color: #7f93aa;
  font-size: 9px;
  font-weight: 800;
}

.esg-activity__icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
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
  font-size: 10px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.esg-activity small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
}

.esg-activity b {
  display: block;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 900;
  line-height: 1.35;
  text-align: right;
}

.esg-activity b span {
  display: block;
  color: #079669;
  font-size: 10px;
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
