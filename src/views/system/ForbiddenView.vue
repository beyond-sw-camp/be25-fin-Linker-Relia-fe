<template>
  <div class="forbidden-screen">
    <v-card class="forbidden-screen__card" rounded="xl" elevation="0">
      <v-icon icon="mdi-shield-alert-outline" size="54" color="error" class="mb-4" />
      <p class="forbidden-screen__code">403 Forbidden</p>
      <h1>접근 권한이 없습니다.</h1>
      <p>현재 로그인한 계정으로는 이 화면에 접근할 수 없습니다.</p>
      <div class="forbidden-screen__actions">
        <v-btn color="primary" @click="goDefault">기본 화면으로 이동</v-btn>
        <v-btn variant="text" @click="goLogin">로그인으로 이동</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function goDefault() {
  if (authStore.isAuthenticated) {
    router.push(authStore.defaultRoutePath)
    return
  }

  router.push('/login')
}

async function goLogin() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.forbidden-screen {
  width: min(540px, 100%);
}

.forbidden-screen__card {
  padding: 40px 28px;
  text-align: center;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
}

.forbidden-screen__code {
  margin: 0 0 8px;
  color: #dc2626;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.forbidden-screen__card h1 {
  margin: 0 0 12px;
}

.forbidden-screen__card p {
  color: #64748b;
}

.forbidden-screen__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 720px) {
  .forbidden-screen__actions {
    flex-direction: column;
  }
}
</style>
