<template>
  <section class="login-page">
    <div class="login-shell">
      <aside class="login-shell__support">
        <div class="login-shell__support-copy">
          <p class="login-shell__eyebrow">빠른 테스트 로그인</p>
          <h1>역할별 계정을 눌러<br />바로 로그인해보세요</h1>
          <p>
            설계사, 지점장, 본사 계정을 한 번에 확인할 수 있도록 준비했습니다.
            버튼을 누르면 로그인 정보가 자동으로 입력됩니다.
          </p>
        </div>

        <section class="quick-login">
          <div class="quick-login__header">
            <strong>테스트 계정</strong>
            <span>공통 비밀번호: relia1234</span>
          </div>

          <div class="quick-login__groups">
            <div v-for="group in groupedTestUsers" :key="group.role" class="quick-login__group">
              <div class="quick-login__group-title">{{ group.label }}</div>
              <div class="quick-login__actions">
                <button
                  v-for="testUser in group.users"
                  :key="testUser.loginId"
                  type="button"
                  class="quick-login__chip"
                  @click="fillTestUser(testUser)"
                >
                  {{ testUser.label }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <div class="login-shell__main">
        <div class="login-panel">
          <div class="login-panel__brand-wrap">
            <button class="login-shell__brand" type="button" @click="goToHome">
              <img class="login-shell__brand-image" :src="loginLogo" alt="Relia" />
            </button>
          </div>

          <div class="login-panel__header">
            <h2>로그인</h2>
            <p>계정에 로그인하면 보유 역할에 맞는 첫 화면으로 자동 이동합니다.</p>
          </div>

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
              class="mb-5"
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
              height="48"
              class="login-panel__submit mt-6"
              :loading="submitting"
            >
              로그인
            </v-btn>

            <div class="login-panel__divider">
              <span>또는</span>
            </div>

            <v-btn
              block
              height="48"
              variant="outlined"
              class="login-panel__secondary"
              @click="goToSignup"
            >
              보험 설계사 회원가입
            </v-btn>
          </v-form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import loginLogo from '../../assets/images/logo/logo-login.png'
import { getDefaultRouteByRole, TEST_LOGIN_USERS } from '../../constants/auth'
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
const groupedTestUsers = computed(() => {
  const groups = new Map()

  TEST_LOGIN_USERS.forEach((testUser) => {
    if (!groups.has(testUser.role)) {
      groups.set(testUser.role, {
        role: testUser.role,
        label: testUser.groupLabel,
        users: [],
      })
    }

    groups.get(testUser.role).users.push(testUser)
  })

  return Array.from(groups.values())
})

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

function goToHome() {
  router.push(getDefaultRouteByRole(authStore.userRole))
}

function fillTestUser(testUser) {
  form.loginId = testUser.loginId
  form.password = testUser.password
  errorMessage.value = ''
}
</script>

<style scoped>
.login-page {
  width: 100%;
  padding: 0 16px 24px;
}

.login-shell {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(320px, 440px) minmax(320px, 420px);
  justify-content: center;
  gap: 24px;
  align-items: stretch;
  padding: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 28px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 42%, #ffffff 100%);
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.08);
}

.login-shell__support {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
  padding: 8px 12px 8px 8px;
}

.login-shell__brand {
  display: inline-flex;
  width: min(220px, 100%);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.login-shell__brand-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.login-shell__support-copy {
  margin: 24px 0 28px;
}

.login-shell__eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f97316;
}

.login-shell__support-copy h1 {
  margin: 0;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #7c2d12;
}

.login-shell__support-copy p:last-child {
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #9a3412;
}

.quick-login__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.quick-login__header strong {
  font-size: 15px;
  font-weight: 700;
  color: #7c2d12;
}

.quick-login__header span {
  font-size: 13px;
  color: #c2410c;
}

.quick-login__groups {
  display: grid;
  gap: 14px;
}

.quick-login__group {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  align-items: center;
}

.quick-login__group-title {
  font-size: 14px;
  font-weight: 700;
  color: #7c2d12;
}

.quick-login__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-login__chip {
  min-width: 74px;
  padding: 10px 14px;
  border: 1px solid #fdba74;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: #9a3412;
  font-size: 13px;
  font-weight: 700;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.quick-login__chip:hover {
  border-color: #f97316;
  background: #fff7ed;
  transform: translateY(-1px);
}

.login-shell__main {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #edf0f5;
  border-radius: 24px;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
  padding: 28px;
}

.login-panel {
  width: min(420px, 100%);
}

.login-panel__brand-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.login-panel__header {
  margin-bottom: 28px;
}

.login-panel__header h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.login-panel__header p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
}

.form-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.login-panel :deep(.v-field) {
  border-radius: 10px;
}

.login-panel :deep(.v-field__outline) {
  color: #d1d5db;
}

.login-panel :deep(.v-field--focused .v-field__outline) {
  color: #f97316;
}

.login-panel__submit {
  border-radius: 10px;
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
  font-weight: 700;
}

.login-panel__divider {
  position: relative;
  margin: 18px 0;
  text-align: center;
}

.login-panel__divider::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: #e5e7eb;
}

.login-panel__divider span {
  position: relative;
  padding: 0 12px;
  background: #ffffff;
  font-size: 12px;
  color: #9ca3af;
}

.login-panel__secondary {
  border-radius: 10px;
  border-color: #d1d5db;
  color: #374151;
  font-weight: 700;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .quick-login__group {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .quick-login__actions {
    gap: 8px;
  }

  .quick-login__chip {
    width: 100%;
  }

  .login-shell__support,
  .login-shell__main {
    padding: 20px;
  }
}
</style>
