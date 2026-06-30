<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--collapsed': isCollapsed }">
    <div class="app-sidebar__brand">
      <div class="app-sidebar__mark" aria-hidden="true">
        <span></span>
      </div>
      <strong v-if="!isCollapsed">Relia</strong>
    </div>

    <nav class="app-sidebar__nav" aria-label="sidebar">
      <section v-for="section in menuSections" :key="section.title" class="app-sidebar__section">
        <button
          v-if="section.children"
          type="button"
          class="app-sidebar__section-button"
          :class="{ 'is-open': isSectionOpen(section.title) }"
          @click="toggleSection(section.title)"
        >
          <span class="app-sidebar__section-left">
            <v-icon :icon="section.icon" size="18" />
            <span v-if="!isCollapsed">{{ section.title }}</span>
          </span>
          <v-icon v-if="!isCollapsed" icon="mdi-chevron-down" size="16" />
        </button>

        <RouterLink
          v-else
          class="app-sidebar__section-button app-sidebar__section-link"
          :to="section.to"
        >
          <span class="app-sidebar__section-left">
            <v-icon :icon="section.icon" size="18" />
            <span v-if="!isCollapsed">{{ section.title }}</span>
          </span>
        </RouterLink>

        <div
          v-if="section.children && !isCollapsed && isSectionOpen(section.title)"
          class="app-sidebar__submenu"
        >
          <RouterLink
            v-for="child in section.children"
            :key="child.title"
            :to="child.to"
            class="app-sidebar__submenu-link"
            :class="{ 'is-active': isChildActive(child) }"
          >
            {{ child.title }}
          </RouterLink>
        </div>
      </section>
    </nav>

    <div class="app-sidebar__esg">
      <EsgImpactCard
        :impact="esgImpact"
        :collapsed="isCollapsed"
        :recovering="isEsgRecovering"
        @click="isEsgDrawerOpen = true"
      />
    </div>

    <EsgImpactDrawer
      v-model="isEsgDrawerOpen"
      :impact="esgImpact"
    />

    <button class="app-sidebar__toggle" type="button" @click="isCollapsed = !isCollapsed">
      <v-icon icon="mdi-chevron-double-left" size="20" :class="{ rotated: isCollapsed }" />
      <span v-if="!isCollapsed">메뉴 닫기</span>
    </button>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import EsgImpactCard from '../esg/EsgImpactCard.vue'
import EsgImpactDrawer from '../esg/EsgImpactDrawer.vue'
import { USER_ROLES } from '../../constants/auth'
import { MENU_BY_ROLE } from '../../constants/navigation'
import { useAuthStore } from '../../stores/auth'
import { useEsgImpactStore } from '../../stores/esgImpactStore'

const authStore = useAuthStore()
const esgImpactStore = useEsgImpactStore()
const route = useRoute()

const isCollapsed = ref(false)
const isEsgDrawerOpen = ref(false)
const isEsgRecovering = ref(false)
const openSections = ref([])
let esgRecoveringTimer = null

const menuSections = computed(() => MENU_BY_ROLE[authStore.userRole] ?? [])
const esgImpact = computed(() => esgImpactStore.data ?? {
  targetMonth: getCurrentMonth(),
  level: 4,
  recoveryRate: 68,
  paperSavedCount: 218,
  co2SavedKg: 3.2,
  seaLevelContribution: 0.08,
  earthTemperatureReduction: 0.08,
  consultationCount: 12,
  aiBriefingCount: 5,
  handoverCount: 2,
  eSignCount: 8,
  activities: [],
})

onMounted(() => {
  esgImpactStore.fetchMyImpact(getCurrentMonth())
})

watch(
  [menuSections, () => route.name, () => route.query.from],
  () => {
    const activeSectionTitles = menuSections.value
      .filter((section) => section.children?.some((child) => isChildActive(child)))
      .map((section) => section.title)

    openSections.value = Array.from(new Set([...openSections.value, ...activeSectionTitles]))
  },
  { immediate: true },
)

watch(
  () => esgImpact.value.activities?.length ?? 0,
  (activityCount, previousActivityCount) => {
    if (!previousActivityCount || activityCount <= previousActivityCount) return

    isEsgRecovering.value = false
    window.clearTimeout(esgRecoveringTimer)
    window.requestAnimationFrame(() => {
      isEsgRecovering.value = true
      esgRecoveringTimer = window.setTimeout(() => {
        isEsgRecovering.value = false
      }, 40000)
    })
  },
)

function isSectionOpen(title) {
  return openSections.value.includes(title)
}

function isChildActive(child) {
  return route.name === child.to.name ||
    route.query.from === child.to.name ||
    getFallbackActiveRouteName() === child.to.name
}

function getFallbackActiveRouteName() {
  if (route.name !== 'handover-detail' || route.query.from) {
    return ''
  }

  if (authStore.userRole === USER_ROLES.FP) {
    return 'handover-received'
  }

  if (authStore.userRole === USER_ROLES.HQ_MANAGER) {
    return 'handover-monitoring'
  }

  if (authStore.userRole === USER_ROLES.BRANCH_MANAGER) {
    return 'handover-requests'
  }

  return ''
}

function toggleSection(title) {
  if (isSectionOpen(title)) {
    openSections.value = openSections.value.filter((item) => item !== title)
    return
  }

  openSections.value = [...openSections.value, title]
}

function getCurrentMonth() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}
</script>

<style scoped>
.app-sidebar {
  width: 232px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  color: #ffffff;
}

.app-sidebar--collapsed {
  width: 72px;
}

.app-sidebar__brand {
  height: 111px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 26px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.9);
}

.app-sidebar__brand strong {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.app-sidebar__mark {
  position: relative;
  width: 32px;
  height: 32px;
  transform: rotate(45deg);
  border: 3px solid #f97316;
  border-radius: 3px;
}

.app-sidebar__mark::before,
.app-sidebar__mark::after,
.app-sidebar__mark span::before,
.app-sidebar__mark span::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #f97316;
}

.app-sidebar__mark::before {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.app-sidebar__mark::after {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.app-sidebar__mark span::before {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.app-sidebar__mark span::after {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.app-sidebar__nav {
  flex: 1;
  padding: 22px 12px;
}

.app-sidebar__esg {
  margin-top: auto;
  padding: 0 12px 10px;
  overflow: hidden;
}

.app-sidebar__section + .app-sidebar__section {
  margin-top: 8px;
}

.app-sidebar__section-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #f3f4f6;
  text-align: left;
  cursor: pointer;
}

.app-sidebar__section-button:hover,
.app-sidebar__section-button.is-open,
.app-sidebar__section-link.router-link-active {
  background: rgba(255, 255, 255, 0.06);
}

.app-sidebar__section-left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.app-sidebar__submenu {
  margin-top: 4px;
  padding: 6px 0 0 28px;
}

.app-sidebar__submenu-link {
  position: relative;
  display: block;
  padding: 10px 0 10px 12px;
  font-size: 12px;
  color: #d1d5db;
}

.app-sidebar__submenu-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 2px;
  height: 14px;
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-50%);
}

.app-sidebar__submenu-link.is-active {
  color: #f97316;
}

.app-sidebar__toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px 22px;
  border: 0;
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
}

.app-sidebar__toggle .rotated {
  transform: rotate(180deg);
}

.app-sidebar--collapsed .app-sidebar__brand,
.app-sidebar--collapsed .app-sidebar__toggle {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

@media (max-width: 1024px) {
  .app-sidebar {
    width: 88px;
  }

  .app-sidebar__brand strong,
  .app-sidebar__section-left span,
  .app-sidebar__toggle span,
  .app-sidebar__submenu {
    display: none;
  }

  .app-sidebar__brand,
  .app-sidebar__toggle {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .app-sidebar__esg :deep(.esg-card) {
    grid-template-columns: 1fr;
    padding: 8px;
  }

  .app-sidebar__esg :deep(.esg-card__content) {
    display: none;
  }
}
</style>
