<template>
  <header class="app-header">
    <div class="app-header__title">
      <h1>{{ pageTitle }}</h1>
    </div>

    <div class="app-header__actions">
      <button class="app-header__icon-button" type="button" aria-label="알림">
        <v-badge dot color="#f97316" offset-x="2" offset-y="2">
          <v-icon icon="mdi-bell-outline" size="20" />
        </v-badge>
      </button>

      <div class="app-header__profile">
        <div class="app-header__avatar">
          <v-icon icon="mdi-account-outline" size="18" />
        </div>
        <div class="app-header__profile-text">
          <strong>{{ authStore.user?.userName }}</strong>
          <span>{{ roleLabel }}</span>
        </div>
        <button class="app-header__logout" type="button" @click="logout">
          <v-icon icon="mdi-chevron-down" size="16" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROLE_LABELS } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => route.meta.title ?? '대시보드')
const roleLabel = computed(() => ROLE_LABELS[authStore.userRole] ?? '사용자')

function logout() {
  authStore.logout()
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

.app-header__icon-button,
.app-header__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.app-header__icon-button {
  width: 36px;
  height: 36px;
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

@media (max-width: 768px) {
  .app-header {
    padding: 14px 16px;
  }

  .app-header__profile-text {
    display: none;
  }
}
</style>
