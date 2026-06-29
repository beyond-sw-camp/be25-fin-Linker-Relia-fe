<template>
  <button
    type="button"
    class="esg-card"
    :class="{ 'esg-card--collapsed': collapsed }"
    :style="{ '--sea-fill': seaFill }"
    @click="$emit('click')"
  >
    <template v-if="collapsed">
      <v-icon icon="mdi-sprout" size="22" />
    </template>

    <template v-else>
      <header class="esg-card__header">
        <span class="esg-card__leaf">
          <v-icon icon="mdi-sprout" size="19" />
        </span>
        <strong>ESG Impact</strong>
        <span class="esg-card__arrow">
          <v-icon icon="mdi-chevron-right" size="18" />
        </span>
      </header>

      <section class="esg-card__body">
        <div class="esg-card__title-row">
          <span>바다 수위 안정</span>
          <b>Lv. {{ impact.level }}</b>
        </div>

        <div class="esg-card__scene" aria-hidden="true">
          <img :src="seaLevelIslandImage" alt="" />
          <div class="esg-card__water">
            <span class="esg-card__submerged"></span>
            <span class="esg-card__wave esg-card__wave--one"></span>
            <span class="esg-card__wave esg-card__wave--two"></span>
            <span class="esg-card__wave esg-card__wave--three"></span>
            <span class="esg-card__bubble esg-card__bubble--one"></span>
            <span class="esg-card__bubble esg-card__bubble--two"></span>
          </div>
        </div>

        <div class="esg-card__stats">
          <div>
            <strong>+{{ formattedSeaLevel }}m</strong>
            <span>안정 단계</span>
          </div>
          <b>{{ formattedRecovery }}%</b>
        </div>

        <div class="esg-card__progress" aria-hidden="true">
          <span :style="{ width: `${boundedRecovery}%` }"></span>
        </div>
      </section>
    </template>
  </button>
</template>

<script setup>
import { computed } from 'vue'

import seaLevelIslandImage from '../../assets/esg/sea-level-island.png'

const props = defineProps({
  impact: {
    type: Object,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const boundedRecovery = computed(() => Math.min(Math.max(Number(props.impact.recoveryRate) || 0, 0), 100))
const seaFill = computed(() => `${64 - boundedRecovery.value * 0.18}%`)
const formattedSeaLevel = computed(() => formatNumber(props.impact.seaLevelContribution))
const formattedRecovery = computed(() => formatNumber(props.impact.recoveryRate))

function formatNumber(value) {
  const numberValue = Number(value) || 0
  return numberValue.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })
}
</script>

<style scoped>
.esg-card {
  width: 100%;
  max-width: 100%;
  min-height: 196px;
  display: block;
  box-sizing: border-box;
  contain: layout paint;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 16px;
  background: linear-gradient(180deg, #17375c 0%, #0c2f55 46%, #0b2748 100%);
  color: #f8fafc;
  text-align: left;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.esg-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.46);
  box-shadow: 0 22px 42px rgba(0, 0, 0, 0.36), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.esg-card--collapsed {
  display: grid;
  place-items: center;
  min-height: 48px;
  padding: 10px;
  color: #5eead4;
}

.esg-card__header {
  display: grid;
  grid-template-columns: 26px 1fr 24px;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 12px;
  background: rgba(10, 31, 55, 0.82);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
}

.esg-card__header strong {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0;
}

.esg-card__leaf {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  color: #5eead4;
  background: rgba(20, 184, 166, 0.14);
}

.esg-card__arrow {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: #bfdbfe;
  background: rgba(255, 255, 255, 0.08);
}

.esg-card__body {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px 12px;
}

.esg-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.esg-card__title-row span,
.esg-card__title-row b {
  color: #dbeafe;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.esg-card__scene {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 88px;
  min-width: 0;
  overflow: hidden;
  border-radius: 10px;
  background: #0e4a75;
}

.esg-card__scene::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(2, 20, 40, 0.06), rgba(4, 32, 62, 0.24)),
    radial-gradient(ellipse at 50% 78%, rgba(0, 13, 26, 0.22), transparent 48%);
  pointer-events: none;
}

.esg-card__scene img {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  max-width: 100%;
  object-fit: cover;
  object-position: center 36%;
}

.esg-card__water {
  position: absolute;
  left: -22px;
  right: -22px;
  bottom: -6px;
  z-index: 3;
  height: var(--sea-fill);
  min-height: 48px;
  overflow: visible;
  animation: esg-card-sea 5.8s ease-in-out infinite;
}

.esg-card__water::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 24px;
  bottom: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 18% 72%, rgba(8, 61, 99, 0.16) 0 2px, transparent 3px),
    radial-gradient(circle at 72% 76%, rgba(255, 255, 255, 0.12) 0 2px, transparent 3px),
    linear-gradient(180deg, rgba(16, 139, 211, 0.28), rgba(4, 77, 135, 0.56));
  backdrop-filter: blur(4px);
}

.esg-card__submerged {
  position: absolute;
  left: 50%;
  top: 8px;
  z-index: 2;
  width: 96px;
  height: 58px;
  border-radius: 46% 54% 58% 42% / 26% 28% 72% 74%;
  background:
    radial-gradient(ellipse at 50% 8%, rgba(236, 208, 142, 0.26) 0 30%, transparent 54%),
    linear-gradient(180deg, rgba(162, 118, 66, 0.3), rgba(17, 91, 126, 0.12));
  filter: blur(1.6px);
  opacity: 0.72;
  transform: translateX(-50%);
  mix-blend-mode: multiply;
}

.esg-card__wave {
  position: absolute;
  left: -34%;
  z-index: 4;
  width: 170%;
  height: 42px;
  border-radius: 46% 54% 49% 51% / 52% 48% 52% 48%;
  background: rgba(49, 160, 255, 0.3);
  animation: esg-card-wave 8s ease-in-out infinite;
}

.esg-card__wave--one {
  top: -13px;
  background:
    radial-gradient(ellipse at 48% 8%, rgba(255, 255, 255, 0.68) 0 9%, rgba(255, 255, 255, 0.24) 10% 18%, transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(66, 180, 238, 0.18) 26%, rgba(14, 129, 203, 0.42)),
    rgba(13, 124, 202, 0.34);
}

.esg-card__wave--two {
  top: 5px;
  left: -46%;
  height: 48px;
  width: 184%;
  opacity: 0.66;
  animation-duration: 11s;
  animation-direction: reverse;
}

.esg-card__wave--three {
  top: 28px;
  left: -38%;
  height: 52px;
  width: 174%;
  opacity: 0.38;
  animation-duration: 15s;
}

.esg-card__bubble {
  position: absolute;
  z-index: 6;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  animation: esg-card-bubble 4.4s ease-in-out infinite;
}

.esg-card__bubble--one {
  right: 38px;
  bottom: 16px;
  width: 6px;
  height: 6px;
}

.esg-card__bubble--two {
  right: 56px;
  bottom: 34px;
  width: 4px;
  height: 4px;
  animation-delay: 0.9s;
}

.esg-card__stats {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
}

.esg-card__stats div strong,
.esg-card__stats div span {
  display: block;
}

.esg-card__stats div strong {
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.05;
}

.esg-card__stats div span {
  margin-top: 2px;
  color: #dbeafe;
  font-size: 11px;
  font-weight: 800;
}

.esg-card__stats > b {
  color: #f8d654;
  font-size: 21px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

.esg-card__progress {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
}

.esg-card__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #67d691, #27d2c4);
  box-shadow: 0 0 12px rgba(45, 212, 191, 0.42);
  transition: width 0.35s ease;
}

@keyframes esg-card-wave {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(18px);
  }
}

@keyframes esg-card-sea {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(3px);
  }
}

@keyframes esg-card-bubble {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.28;
  }

  50% {
    transform: translateY(-10px);
    opacity: 0.74;
  }
}
</style>
