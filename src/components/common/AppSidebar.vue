<template>
  <aside class="app-sidebar" :class="{ 'app-sidebar--collapsed': isCollapsed }">
    <button class="app-sidebar__brand" type="button" @click="goToHome">
      <img
        v-if="!isCollapsed"
        class="app-sidebar__brand-image app-sidebar__brand-image--expanded"
        :src="sidebarLogo"
        alt="Relia"
      />
      <img
        v-else
        class="app-sidebar__brand-image app-sidebar__brand-image--collapsed"
        :src="faviconLogo"
        alt="Relia"
      />
    </button>

    <nav class="app-sidebar__nav" aria-label="sidebar">
      <section v-for="section in menuSections" :key="section.title" class="app-sidebar__section">
        <button
          v-if="section.children"
          type="button"
          class="app-sidebar__section-button"
          :class="{
            'is-open': isSectionOpen(section.title),
            'is-active-parent': hasActiveChild(section),
          }"
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

    <button class="app-sidebar__toggle" type="button" @click="isCollapsed = !isCollapsed">
      <v-icon icon="mdi-chevron-double-left" size="20" :class="{ rotated: isCollapsed }" />
      <span v-if="!isCollapsed">메뉴 닫기</span>
    </button>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import faviconLogo from '../../assets/images/logo/logo-favicon.png'
import sidebarLogo from '../../assets/images/logo/logo-sidebar.png'
import { USER_ROLES, getDefaultRouteByRole } from '../../constants/auth'
import { MENU_BY_ROLE } from '../../constants/navigation'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const isCollapsed = ref(false)
const openSections = ref([])

const menuSections = computed(() => MENU_BY_ROLE[authStore.userRole] ?? [])

watch(
  [menuSections, () => route.name, () => route.query.from],
  () => {
    const activeSectionTitles = menuSections.value
      .filter((section) => section.children?.some((child) => isChildActive(child)))
      .map((section) => section.title)

    if (activeSectionTitles.length > 0) {
      openSections.value = [activeSectionTitles[0]]
    }
  },
  { immediate: true },
)

function isSectionOpen(title) {
  return openSections.value.includes(title)
}

function isChildActive(child) {
  return route.name === child.to.name ||
    route.query.from === child.to.name ||
    getFallbackActiveRouteName() === child.to.name
}

function hasActiveChild(section) {
  return Boolean(section.children?.some((child) => isChildActive(child)))
}

function getFallbackActiveRouteName() {
  if (route.name !== 'handover-detail' || route.query.from) {
    return ''
  }

  if (authStore.userRole === USER_ROLES.FP) {
    return 'handover-received'
  }

  if ([USER_ROLES.HQ_MANAGER, USER_ROLES.SYSTEM_ADMIN].includes(authStore.userRole)) {
    return 'handover-monitoring'
  }

  if (authStore.userRole === USER_ROLES.BRANCH_MANAGER) {
    return 'handover-requests'
  }

  return ''
}

function toggleSection(title) {
  if (isSectionOpen(title)) {
    openSections.value = []
    return
  }

  openSections.value = [title]
}

function goToHome() {
  router.push(getDefaultRouteByRole(authStore.userRole))
}
</script>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 0;
  width: 232px;
  height: 100vh;
  position: sticky;
  top: 0;
  align-self: start;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #1f2937;
  color: #ffffff;
  overflow: hidden;
}

.app-sidebar--collapsed {
  width: 72px;
}

.app-sidebar__brand {
  height: 111px;
  display: flex;
  align-items: center;
  padding: 0 26px;
  border: 0;
  border-bottom: 1px solid rgba(17, 24, 39, 0.9);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.app-sidebar__brand-image {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.app-sidebar__brand-image--expanded {
  width: 160px;
}

.app-sidebar__brand-image--collapsed {
  width: 36px;
}

.app-sidebar__nav {
  flex: 1;
  min-height: 0;
  padding: 22px 12px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-sidebar__nav::-webkit-scrollbar {
  width: 0;
  height: 0;
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

.app-sidebar__section-button.is-active-parent,
.app-sidebar__section-link.router-link-active {
  color: #f97316;
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
  flex-shrink: 0;
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
}
</style>
