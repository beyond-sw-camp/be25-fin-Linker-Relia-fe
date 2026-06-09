<template>
  <section class="login-page">
    <div class="login-page__inner">
      <div class="login-page__brand">
        <div class="login-page__logo">
          <v-icon icon="mdi-shield" size="14" color="white" />
        </div>
        <h1>Relia</h1>
      </div>

      <v-card class="login-card" elevation="0">
        <v-alert v-if="route.query.signedUp" type="success" variant="tonal" class="mb-4">
          회원가입이 완료되었습니다. 로그인 후 이용해 주세요.
        </v-alert>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-form @submit.prevent="submitLogin">
          <label class="form-label" for="login-id">로그인 ID</label>
          <v-text-field
            id="login-id"
            v-model="form.loginId"
            placeholder="로그인 ID를 입력하세요"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-4"
          />

          <label class="form-label" for="password">비밀번호</label>
          <v-text-field
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="비밀번호를 입력하세요"
            variant="outlined"
            density="comfortable"
            hide-details
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-btn
            type="submit"
            block
            height="40"
            class="login-card__submit mt-5"
            :loading="submitting"
          >
            로그인
          </v-btn>

          <div class="login-card__divider">
            <span>또는</span>
          </div>

          <v-btn block height="40" variant="outlined" class="login-card__ghost" @click="goToSignup">
            보험 설계사 회원가입
          </v-btn>
        </v-form>
      </v-card>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getDefaultRouteByRole } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  loginId: '',
  password: '',
})

const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

async function submitLogin() {
  errorMessage.value = ''
  submitting.value = true

  try {
    const result = await authStore.login(form)
    await router.push(getDefaultRouteByRole(result.role))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || '로그인에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}

function goToSignup() {
  router.push('/signup/fp')
}
</script>

<style scoped>
.login-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 16px 24px;
}

.login-page__inner {
  width: min(372px, 100%);
  text-align: center;
}

.login-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.login-page__logo {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f97316;
}

.login-page h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #111827;
}

.login-card {
  padding: 18px 18px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
  text-align: left;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.login-card :deep(.v-field) {
  border-radius: 8px;
}

.login-card__submit {
  border-radius: 8px;
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
}

.login-card__divider {
  position: relative;
  margin: 16px 0;
  text-align: center;
}

.login-card__divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #e5e7eb;
}

.login-card__divider span {
  position: relative;
  padding: 0 10px;
  background: #ffffff;
  font-size: 12px;
  color: #9ca3af;
}

.login-card__ghost {
  border-radius: 8px;
  border-color: #d1d5db;
  color: #374151;
}
</style>
