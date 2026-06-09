<template>
  <section class="signup-page">
    <div class="signup-page__brand">
      <div class="signup-page__logo">
        <v-icon icon="mdi-shield" size="14" color="white" />
      </div>
      <strong>Relia</strong>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="signup-page__alert">
      {{ errorMessage }}
    </v-alert>

    <v-form class="signup-form" @submit.prevent="submitSignup">
      <v-card class="signup-section" elevation="0">
        <div class="signup-grid">
          <div class="signup-field signup-field--wide">
            <label>로그인 ID <em>*</em></label>
            <div class="signup-inline">
              <v-text-field
                v-model="form.loginId"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <v-btn variant="outlined" class="signup-inline__button" @click="checkLoginId">
                중복 확인
              </v-btn>
            </div>
          </div>

          <div class="signup-field signup-field--wide">
            <label>비밀번호 <em>*</em></label>
            <v-text-field
              v-model="form.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              variant="outlined"
              density="comfortable"
              hide-details
              append-inner-icon="mdi-eye-outline"
            />
          </div>

          <div class="signup-field signup-field--wide">
            <label>비밀번호 확인 <em>*</em></label>
            <v-text-field
              v-model="form.passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              variant="outlined"
              density="comfortable"
              hide-details
              append-inner-icon="mdi-eye-outline"
            />
          </div>
        </div>
      </v-card>

      <v-card class="signup-section" elevation="0">
        <h2>기본 정보</h2>
        <div class="signup-grid signup-grid--three">
          <div class="signup-field">
            <label>이름 <em>*</em></label>
            <v-text-field v-model="form.userName" variant="outlined" density="comfortable" hide-details />
          </div>

          <div class="signup-field">
            <label>이메일 <em>*</em></label>
            <v-text-field v-model="form.email" variant="outlined" density="comfortable" hide-details />
          </div>

          <div class="signup-field">
            <label>연락처 <em>*</em></label>
            <v-text-field v-model="form.phone" variant="outlined" density="comfortable" hide-details />
          </div>
        </div>
      </v-card>

      <v-card class="signup-section" elevation="0">
        <h2>조직 정보</h2>
        <div class="signup-grid">
          <div class="signup-field signup-field--wide">
            <label>소속 지점 <em>*</em></label>
            <v-select
              v-model="form.branchId"
              :items="branchOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>
        </div>

        <div class="signup-notice">
          <span>• 검증 완료된 보험 설계사만 가입할 수 있습니다.</span>
        </div>
      </v-card>

      <v-card class="signup-section signup-section--agreements" elevation="0">
        <label>
          <input v-model="form.agreePrivacy" type="checkbox" />
          개인정보 수집 및 이용에 동의합니다. <em>*</em>
        </label>
        <label>
          <input v-model="form.agreeTerms" type="checkbox" />
          서비스 이용약관에 동의합니다. <em>*</em>
        </label>
      </v-card>

      <div class="signup-actions">
        <v-btn variant="outlined" class="signup-actions__back" @click="goToLogin">
          로그인으로 돌아가기
        </v-btn>
        <v-btn type="submit" class="signup-actions__submit">회원가입</v-btn>
      </div>

      <p class="signup-form__helper">{{ loginCheckMessage }}</p>
    </v-form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { DEMO_USERS } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const branchOptions = [
  { title: '서울강남지점', value: 'branch-seoul-gangnam' },
  { title: '서울서초지점', value: 'branch-seoul-seocho' },
  { title: '부산중앙지점', value: 'branch-busan-central' },
]

const form = reactive({
  loginId: '',
  password: '',
  passwordConfirm: '',
  userName: '',
  email: '',
  phone: '',
  branchId: '',
  agreePrivacy: false,
  agreeTerms: false,
})

const errorMessage = ref('')
const loginCheckMessage = ref('중복 확인이 필요합니다.')
const loginIdAvailable = ref(false)

function checkLoginId() {
  const trimmedLoginId = form.loginId.trim()

  if (!trimmedLoginId) {
    loginCheckMessage.value = '로그인 ID를 먼저 입력해 주세요.'
    loginIdAvailable.value = false
    return
  }

  const exists = DEMO_USERS.some((user) => user.loginId === trimmedLoginId)
  loginIdAvailable.value = !exists
  loginCheckMessage.value = exists
    ? '이미 사용 중인 로그인 ID입니다.'
    : '사용 가능한 로그인 ID입니다.'
}

async function submitSignup() {
  errorMessage.value = ''

  if (!loginIdAvailable.value) {
    errorMessage.value = '로그인 ID 중복 확인을 완료해 주세요.'
    return
  }

  if (form.password !== form.passwordConfirm) {
    errorMessage.value = '비밀번호와 비밀번호 확인 값이 일치해야 합니다.'
    return
  }

  if (!form.loginId || !form.password || !form.userName || !form.email || !form.phone || !form.branchId) {
    errorMessage.value = '필수 입력값을 모두 입력해 주세요.'
    return
  }

  if (!form.agreePrivacy || !form.agreeTerms) {
    errorMessage.value = '필수 약관 동의가 필요합니다.'
    return
  }

  try {
    authStore.signUpFp(form)
    await router.push({ path: '/login', query: { signedUp: '1' } })
  } catch (error) {
    errorMessage.value = error.message
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.signup-page {
  width: min(630px, 100%);
  margin: 0 auto;
  padding: 32px 0 20px;
  text-align: center;
}

.signup-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.signup-page__logo {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f97316;
}

.signup-page__brand strong {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
}

.signup-page__alert {
  margin-bottom: 16px;
  text-align: left;
}

.signup-form {
  text-align: left;
}

.signup-section {
  padding: 14px 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: none;
}

.signup-section + .signup-section {
  margin-top: 12px;
}

.signup-section h2 {
  margin: -14px -16px 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.signup-grid {
  display: grid;
  gap: 14px;
}

.signup-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.signup-field label,
.signup-section--agreements label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.signup-field em,
.signup-section--agreements em {
  font-style: normal;
  color: #ef4444;
}

.signup-inline {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 8px;
}

.signup-inline__button {
  height: 40px;
  border-color: #d1d5db;
}

.signup-field--wide {
  grid-column: 1 / -1;
}

.signup-form :deep(.v-field) {
  border-radius: 8px;
}

.signup-notice {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  background: #f0fdf4;
  font-size: 12px;
  color: #15803d;
}

.signup-section--agreements {
  display: grid;
  gap: 12px;
}

.signup-section--agreements label {
  margin: 0;
}

.signup-actions {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
  margin-top: 12px;
}

.signup-actions__back,
.signup-actions__submit {
  height: 40px;
  border-radius: 8px;
}

.signup-actions__back {
  border-color: #d1d5db;
}

.signup-actions__submit {
  background: #f97316;
  color: #ffffff;
}

.signup-form__helper {
  margin: 10px 0 0;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .signup-grid--three,
  .signup-actions,
  .signup-inline {
    grid-template-columns: 1fr;
  }

  .signup-page {
    padding-top: 20px;
  }
}
</style>
