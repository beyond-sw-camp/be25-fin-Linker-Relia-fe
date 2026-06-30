<template>
  <button
    type="button"
    class="esg-card"
    :class="{ 'esg-card--collapsed': collapsed, 'is-recovering': recovering }"
    @click="$emit('click')"
  >
    <template v-if="collapsed">
      <v-icon icon="mdi-sprout" size="22" />
    </template>

    <template v-else>
      <section class="esg-card__body">
        <div class="esg-card__scene" aria-hidden="true">
          <span class="esg-card__warm-light"></span>
          <img :src="seaLevelIslandImage" alt="" />
          <div class="esg-card__water">
            <span class="esg-card__submerged"></span>
            <span class="esg-card__wave esg-card__wave--one"></span>
            <span class="esg-card__wave esg-card__wave--two"></span>
            <span class="esg-card__wave esg-card__wave--three"></span>
            <span class="esg-card__shine"></span>
            <span class="esg-card__sparkle esg-card__sparkle--one"></span>
            <span class="esg-card__sparkle esg-card__sparkle--two"></span>
            <span class="esg-card__sparkle esg-card__sparkle--three"></span>
            <span class="esg-card__bubble esg-card__bubble--one"></span>
            <span class="esg-card__bubble esg-card__bubble--two"></span>
          </div>
        </div>

      </section>
    </template>
  </button>
</template>

<script setup>
import { computed } from 'vue'

import seaLevelIslandImage from '../../assets/esg/sea-level-esg-transparent.png'

const props = defineProps({
  impact: {
    type: Object,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
  recovering: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const boundedRecovery = computed(() => Math.min(Math.max(Number(props.impact.recoveryRate) || 0, 0), 100))
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
  min-height: 214px;
  display: block;
  box-sizing: border-box;
  contain: layout;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #f8fafc;
  text-align: left;
  box-shadow: none;
  cursor: pointer;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.esg-card:hover {
  opacity: 0.96;
  transform: translateY(-1px);
}

.esg-card--collapsed {
  display: grid;
  place-items: center;
  min-height: 48px;
  padding: 10px;
  color: #5eead4;
}

.esg-card__body {
  display: grid;
  gap: 7px;
  min-width: 0;
  padding: 4px 0;
}

.esg-card__scene {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 158px;
  min-width: 0;
  overflow: visible;
  border-radius: 0;
  background: transparent;
  transform: translateY(36px);
  margin-bottom: 18px;
}

.esg-card__scene::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 16px;
  z-index: 2;
  width: 108%;
  height: 158px;
  transform: translateX(-50%);
  background:
    radial-gradient(ellipse at 50% 50%, rgba(94, 234, 212, 0.14), transparent 54%),
    radial-gradient(ellipse at 50% 70%, rgba(125, 211, 252, 0.1), transparent 66%);
  filter: blur(42px);
  pointer-events: none;
}

.esg-card__scene img {
  position: absolute;
  left: 50%;
  top: -6px;
  z-index: 3;
  width: 222%;
  height: 242px;
  max-width: 100%;
  object-fit: contain;
  object-position: center;
  opacity: 1;
  filter: brightness(1.12) saturate(1.08) contrast(1.03);
  transform: translateX(-50%);
  mask-image:
    radial-gradient(ellipse at 50% 46%, #000 0 50%, rgba(0, 0, 0, 0.84) 64%, rgba(0, 0, 0, 0.34) 80%, transparent 100%),
    linear-gradient(180deg, transparent 0, #000 18%, #000 78%, transparent 100%);
  mask-composite: intersect;
}

.esg-card__warm-light {
  position: absolute;
  right: -72px;
  top: -30px;
  z-index: 2;
  width: 230px;
  height: 230px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 42% 42%, rgba(255, 250, 213, 0.95) 0 8%, rgba(255, 226, 139, 0.72) 9% 20%, transparent 34%),
    radial-gradient(circle at 48% 48%, rgba(255, 209, 111, 0.55) 0 20%, rgba(255, 178, 72, 0.28) 42%, transparent 72%),
    radial-gradient(circle at 50% 50%, rgba(255, 236, 177, 0.28) 0 34%, rgba(255, 198, 93, 0.14) 58%, transparent 82%);
  opacity: 0;
  transform: scale(0.78);
  pointer-events: none;
  filter: blur(5px);
  mix-blend-mode: screen;
}

.esg-card.is-recovering .esg-card__warm-light {
  animation: esg-card-warm-light 40s ease-out both;
}

.esg-card.is-recovering .esg-card__scene img {
  animation: esg-card-island-sun 40s ease-out both;
}

.esg-card__water {
  position: absolute;
  left: -26px;
  right: -26px;
  bottom: 4px;
  z-index: 4;
  height: 48px;
  overflow: visible;
  animation: esg-card-sea 5.8s ease-in-out infinite;
  mask-image:
    linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%),
    linear-gradient(180deg, transparent 0, #000 18%, #000 58%, transparent 92%);
}

.esg-card__water::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 8px;
  bottom: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 18% 72%, rgba(125, 211, 252, 0.12) 0 2px, transparent 3px),
    radial-gradient(circle at 72% 76%, rgba(255, 255, 255, 0.1) 0 2px, transparent 3px),
    linear-gradient(180deg, rgba(56, 189, 248, 0.06), rgba(14, 165, 233, 0.16) 42%, rgba(6, 78, 118, 0.18) 70%, transparent 100%);
  backdrop-filter: blur(3px);
  mask-image: linear-gradient(180deg, transparent 0, #000 24%, #000 58%, transparent 100%);
  clip-path: polygon(
    0 24%,
    8% 21%,
    16% 24%,
    24% 18%,
    34% 22%,
    44% 17%,
    54% 21%,
    64% 16%,
    74% 21%,
    84% 18%,
    92% 22%,
    100% 19%,
    100% 100%,
    0 100%
  );
}

.esg-card__submerged {
  position: absolute;
  left: 50%;
  top: 10px;
  z-index: 2;
  width: 124px;
  height: 36px;
  border-radius: 46% 54% 58% 42% / 26% 28% 72% 74%;
  background:
    radial-gradient(ellipse at 50% 8%, rgba(236, 208, 142, 0.22) 0 30%, transparent 54%),
    linear-gradient(180deg, rgba(162, 118, 66, 0.22), rgba(17, 91, 126, 0.1));
  filter: blur(1.8px);
  opacity: 0.26;
  transform: translateX(-50%);
  mix-blend-mode: screen;
}

.esg-card__wave {
  position: absolute;
  left: -28%;
  z-index: 4;
  width: 156%;
  height: 28px;
  background: rgba(56, 189, 248, 0.2);
  filter: blur(0.1px);
  mask-image: linear-gradient(180deg, transparent 0, #000 22%, #000 62%, transparent 100%);
  clip-path: polygon(
    0 38%,
    8% 32%,
    16% 37%,
    26% 28%,
    36% 34%,
    46% 27%,
    56% 33%,
    66% 26%,
    76% 32%,
    86% 29%,
    94% 35%,
    100% 31%,
    100% 100%,
    0 100%
  );
  animation: esg-card-wave 12s ease-in-out infinite;
}

.esg-card.is-recovering .esg-card__wave {
  animation-duration: 10.5s;
}

.esg-card__wave--one {
  top: 0;
  background:
    radial-gradient(ellipse at 42% 7%, rgba(255, 255, 255, 0.58) 0 6%, rgba(255, 255, 255, 0.2) 8% 15%, transparent 34%),
    radial-gradient(ellipse at 68% 14%, rgba(255, 255, 255, 0.28) 0 5%, transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(66, 180, 238, 0.14) 34%, rgba(14, 129, 203, 0.18) 70%, transparent 100%),
    rgba(13, 124, 202, 0.18);
}

.esg-card__wave--two {
  top: 11px;
  left: -44%;
  height: 30px;
  width: 176%;
  opacity: 0.38;
  animation-duration: 16s;
  animation-direction: reverse;
}

.esg-card.is-recovering .esg-card__wave--two {
  animation-duration: 14s;
}

.esg-card__wave--three {
  top: 23px;
  left: -34%;
  height: 32px;
  width: 164%;
  opacity: 0.24;
  animation-duration: 20s;
}

.esg-card.is-recovering .esg-card__wave--three {
  animation-duration: 17.5s;
}

.esg-card__shine {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 13px;
  z-index: 5;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.34), transparent);
  opacity: 0.45;
  animation: esg-card-shine 11s ease-in-out infinite;
}

.esg-card.is-recovering .esg-card__shine {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 244, 199, 0.9), rgba(255, 210, 112, 0.42), transparent);
  opacity: 0.9;
  animation-duration: 8s;
  filter: blur(0.3px);
}

.esg-card__sparkle {
  position: absolute;
  z-index: 6;
  width: 42px;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 246, 207, 0.98), rgba(255, 199, 88, 0.5), transparent);
  opacity: 0;
  filter: blur(0.2px);
  transform: translateX(-8px);
  pointer-events: none;
}

.esg-card__sparkle--one {
  left: 18%;
  top: 10px;
}

.esg-card__sparkle--two {
  left: 46%;
  top: 20px;
  width: 34px;
}

.esg-card__sparkle--three {
  right: 18%;
  top: 15px;
  width: 30px;
}

.esg-card.is-recovering .esg-card__sparkle--one {
  animation: esg-card-sparkle 10s ease-in-out 0.2s 4;
}

.esg-card.is-recovering .esg-card__sparkle--two {
  animation: esg-card-sparkle 11s ease-in-out 1.2s 3;
}

.esg-card.is-recovering .esg-card__sparkle--three {
  animation: esg-card-sparkle 9.5s ease-in-out 2s 4;
}

.esg-card__bubble {
  position: absolute;
  z-index: 6;
  border: 1px solid rgba(255, 255, 255, 0.46);
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
  margin-top: -12px;
}

.esg-card__stats div strong,
.esg-card__stats div span {
  display: block;
}

.esg-card__stats div strong {
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.05;
}

.esg-card__stats div span {
  margin-top: 2px;
  color: #dbeafe;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.7;
}

.esg-card__stats > b {
  color: #5eead4;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

.esg-card__progress {
  height: 5px;
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
    transform: translateX(0) translateY(0);
  }

  50% {
    transform: translateX(14px) translateY(1px);
  }
}

@keyframes esg-card-warm-light {
  0% {
    opacity: 0;
    transform: scale(0.78);
  }

  5% {
    opacity: 1;
    transform: scale(1.08);
  }

  37% {
    opacity: 0.96;
    transform: scale(1.16);
  }

  72% {
    opacity: 0.42;
    transform: scale(1.32);
  }

  100% {
    opacity: 0;
    transform: scale(1.42);
  }
}

@keyframes esg-card-island-sun {
  0% {
    filter: brightness(1.12) saturate(1.08) contrast(1.03);
  }

  5% {
    filter: brightness(1.42) saturate(1.2) contrast(1.1);
  }

  37% {
    filter: brightness(1.38) saturate(1.18) contrast(1.09);
  }

  72% {
    filter: brightness(1.2) saturate(1.1) contrast(1.04);
  }

  100% {
    filter: brightness(1.12) saturate(1.08) contrast(1.03);
  }
}

@keyframes esg-card-sparkle {
  0%,
  100% {
    opacity: 0;
    transform: translateX(-8px);
  }

  35% {
    opacity: 0.95;
  }

  65% {
    opacity: 0.42;
  }

  80% {
    transform: translateX(28px);
  }
}

@keyframes esg-card-shine {
  0%,
  100% {
    transform: translateX(-8px);
    opacity: 0.28;
  }

  50% {
    transform: translateX(12px);
    opacity: 0.52;
  }
}

@keyframes esg-card-sea {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(1.5px);
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
