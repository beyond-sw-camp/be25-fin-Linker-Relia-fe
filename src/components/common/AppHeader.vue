<template>
  <header class="app-header">
    <div class="app-header__title">
      <h1>{{ pageTitle }}</h1>
    </div>

    <div class="app-header__actions">
      <NotificationBell />

      <div class="app-header__profile">
        <div class="app-header__avatar">
          <v-icon icon="mdi-account-outline" size="18" />
        </div>
        <div class="app-header__profile-text">
          <strong>{{ authStore.userName || '사용자' }}</strong>
          <span>{{ profileMetaLabel }}</span>
        </div>
        <v-menu location="bottom end" offset="8">
          <template #activator="{ props }">
            <button
              class="app-header__menu-trigger"
              type="button"
              aria-label="사용자 메뉴 열기"
              v-bind="props"
            >
              <v-icon icon="mdi-chevron-down" size="16" />
            </button>
          </template>

          <v-list class="app-header__menu" density="compact" nav>
            <v-list-item prepend-icon="mdi-logout" title="로그아웃" @click="logout" />
          </v-list>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getBranchOrganizations } from '../../api/organizations'
import { ROLE_LABELS, USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'
import NotificationBell from './NotificationBell.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const resolvedOrganizationName = ref('')

const BRANCH_SCOPED_TITLE_BY_ROUTE = {
  'branch-dashboard': '대시보드',
  'branch-customers': '고객 목록',
  'branch-contracts': '계약 목록',
  'branch-consultations': '상담 목록',
  'handover-requests': '인수인계 현황',
  'branch-commissions': '수수료 관리',
}

const pageTitle = computed(() => {
  if (isBranchScopedRoute.value) {
    const organizationName = getOrganizationName()
    const titleSuffix = BRANCH_SCOPED_TITLE_BY_ROUTE[route.name]

    if (organizationName && titleSuffix) return `${organizationName} ${titleSuffix}`
  }

  return route.meta.title ?? '대시보드'
})
const roleLabel = computed(() => ROLE_LABELS[authStore.userRole] ?? '사용자')
const profileMetaLabel = computed(() => {
  const organizationName = getOrganizationName()

  if (organizationName && roleLabel.value) {
    return `${organizationName} · ${roleLabel.value}`
  }

  return organizationName || roleLabel.value
})

const isBranchScopedRoute = computed(() => (
  Object.keys(BRANCH_SCOPED_TITLE_BY_ROUTE).includes(route.name) &&
  authStore.userRole === USER_ROLES.BRANCH_MANAGER
))

onMounted(resolveOrganizationName)

watch(
  () => [authStore.organizationName, authStore.accessToken, authStore.userRole, route.name],
  resolveOrganizationName,
)

async function resolveOrganizationName() {
  resolvedOrganizationName.value = ''
  if (!isBranchScopedRoute.value || getOrganizationName()) return
  const tokenProfile = parseTokenProfile(authStore.accessToken)
  if (!tokenProfile.organizationId && !tokenProfile.organizationCode) return

  try {
    const response = await getBranchOrganizations()
    const branches = Array.isArray(response?.result) ? response.result : []
    const branch = branches.find((item) => (
      item.organizationId === tokenProfile.organizationId ||
      item.organizationCode === tokenProfile.organizationCode
    ))
    resolvedOrganizationName.value = branch?.organizationName ?? ''
  } catch {
    resolvedOrganizationName.value = ''
  }
}

function getOrganizationName() {
  return authStore.organizationName || authStore.user?.organizationName || resolvedOrganizationName.value
}

function parseTokenProfile(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { organizationId: '', organizationCode: '' }
  }

  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]))
    return {
      organizationId: payload.organizationId ?? payload.orgId ?? '',
      organizationCode: payload.organizationCode ?? payload.orgCode ?? '',
    }
  } catch {
    return { organizationId: '', organizationCode: '' }
  }
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return decodeURIComponent(
    Array.from(window.atob(padded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
  )
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 78px;
  padding: 16px 28px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.app-header__title h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-header__menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.app-header__profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  border-left: 1px solid #e5e7eb;
}

.app-header__avatar {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  color: #9ca3af;
}

.app-header__profile-text {
  line-height: 1.2;
}

.app-header__profile-text strong,
.app-header__profile-text span {
  display: block;
}

.app-header__profile-text strong {
  font-size: 12px;
  color: #111827;
}

.app-header__profile-text span {
  font-size: 11px;
  color: #6b7280;
}

.app-header__menu {
  min-width: 72px;
}

.app-header__menu :deep(.v-list-item) {
  min-height: 28px;
  padding-inline: 8px;
}

.app-header__menu :deep(.v-list-item__prepend) {
  width: auto;
}

.app-header__menu :deep(.v-list-item__spacer) {
  width: 4px;
}

.app-header__menu :deep(.v-list-item-title) {
  font-size: 12px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 14px 16px;
  }

  .app-header__profile-text {
    display: none;
  }
}
</style>
