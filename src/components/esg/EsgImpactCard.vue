<template>
  <button
    type="button"
    class="esg-card"
    :class="{ 'esg-card--collapsed': collapsed }"
    :style="{ '--water-alpha': waterAlpha }"
    @click="$emit('click')"
  >
    <div class="esg-card__scene" aria-hidden="true">
      <div class="esg-card__sky"></div>
      <div class="esg-card__island">
        <span class="esg-card__tree"></span>
      </div>
      <div class="esg-card__water">
        <span class="esg-card__wave esg-card__wave--one"></span>
        <span class="esg-card__wave esg-card__wave--two"></span>
        <span class="esg-card__wave esg-card__wave--three"></span>
      </div>
    </div>

    <div v-if="!collapsed" class="esg-card__content">
      <div>
        <strong>ESG Impact</strong>
        <span>바다 수위 안정</span>
      </div>
      <div class="esg-card__meta">
        <span>Lv. {{ impact.level }}</span>
        <span>+{{ formattedSeaLevel }}m</span>
        <b>{{ impact.recoveryRate }}%</b>
      </div>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

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

const waterAlpha = computed(() => {
  const recovery = Math.min(Math.max(Number(props.impact.recoveryRate) || 0, 0), 100)
  return (0.24 + recovery * 0.0018).toFixed(3)
})
const formattedSeaLevel = computed(() => {
  const value = Number(props.impact.seaLevelContribution) || 0
  return value.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })
})
</script>

<style scoped>
.esg-card {
  width: 100%;
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(30, 58, 82, 0.92));
  color: #f8fafc;
  text-align: left;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.esg-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.42);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
}

.esg-card--collapsed {
  grid-template-columns: 1fr;
  padding: 8px;
}

.esg-card__scene {
  position: relative;
  height: 58px;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(191, 219, 254, 0.8), rgba(240, 253, 250, 0.7));
}

.esg-card--collapsed .esg-card__scene {
  height: 42px;
}

.esg-card__sky {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 75% 22%, rgba(254, 240, 138, 0.9) 0 7px, transparent 8px);
}

.esg-card__island {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 3;
  width: 36px;
  height: 16px;
  border-radius: 50% 50% 35% 35%;
  background: linear-gradient(180deg, #65a30d, #3f6212);
  transform: translateX(-50%);
}

.esg-card__tree {
  position: absolute;
  left: 19px;
  bottom: 9px;
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #92400e;
  transform: rotate(7deg);
}

.esg-card__tree::before {
  content: '';
  position: absolute;
  left: -9px;
  top: -9px;
  width: 22px;
  height: 16px;
  border-radius: 999px 999px 999px 4px;
  background: #16a34a;
  transform: rotate(-14deg);
}

.esg-card__water {
  position: absolute;
  inset: auto -20px 0;
  z-index: 4;
  height: 28px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent),
    rgba(49, 160, 255, var(--water-alpha));
  backdrop-filter: blur(5px);
}

.esg-card__wave {
  position: absolute;
  left: -35%;
  bottom: 6px;
  width: 170%;
  height: 18px;
  border-radius: 45%;
  background: rgba(255, 255, 255, 0.28);
  animation: esg-card-wave 8s linear infinite;
}

.esg-card__wave--two {
  bottom: 10px;
  opacity: 0.42;
  animation-duration: 11s;
  animation-direction: reverse;
}

.esg-card__wave--three {
  bottom: 2px;
  opacity: 0.24;
  animation-duration: 14s;
}

.esg-card__content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.esg-card__content strong {
  display: block;
  font-size: 13px;
  line-height: 1.2;
}

.esg-card__content span {
  display: block;
  color: #bae6fd;
  font-size: 11px;
}

.esg-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.esg-card__meta span,
.esg-card__meta b {
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0f2fe;
  font-size: 10px;
  font-weight: 800;
}

@keyframes esg-card-wave {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(18%);
  }
}
</style>
