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

    <v-alert v-if="branchErrorMessage" type="warning" variant="tonal" class="signup-page__alert">
      {{ branchErrorMessage }}
    </v-alert>

    <v-form class="signup-form" @submit.prevent="submitSignup">
      <v-card class="signup-section" elevation="0">
        <div class="signup-grid">
          <div class="signup-field signup-field--wide">
            <label>로그인 ID <em>*</em></label>
            <v-text-field
              v-model="form.loginId"
              variant="outlined"
              density="comfortable"
              hide-details
            />
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
            />
          </div>

          <div class="signup-field signup-field--wide">
            <label>이름 <em>*</em></label>
            <v-text-field
              v-model="form.userName"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>

          <div class="signup-field">
            <label>이메일 <em>*</em></label>
            <v-text-field
              v-model="form.email"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>

          <div class="signup-field">
            <label>연락처</label>
            <v-text-field
              v-model="form.phone"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>

          <div class="signup-field signup-field--wide">
            <label>소속 지점 <em>*</em></label>
            <v-select
              v-model="form.organizationCode"
              :items="branchOptions"
              item-title="label"
              item-value="value"
              placeholder="소속 지점을 선택하세요"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading="isLoadingBranches"
              :disabled="isLoadingBranches || branchOptions.length === 0"
              no-data-text="선택 가능한 지점이 없습니다."
            />
          </div>
        </div>
      </v-card>

      <div class="signup-actions">
        <v-btn variant="outlined" class="signup-actions__back" @click="goToLogin">
          로그인으로 돌아가기
        </v-btn>
        <v-btn
          type="submit"
          class="signup-actions__submit"
          :loading="submitting"
          :disabled="isLoadingBranches || branchOptions.length === 0"
        >
          회원가입
        </v-btn>
      </div>
    </v-form>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { signupFp } from '../../api/auth'
import { getBranchOrganizations } from '../../api/organizations'

const router = useRouter()

const form = reactive({
  loginId: '',
  password: '',
  userName: '',
  email: '',
  phone: '',
  organizationCode: '',
})

const branchOrganizations = ref([])
const errorMessage = ref('')
const branchErrorMessage = ref('')
const submitting = ref(false)
const isLoadingBranches = ref(false)

const branchOptions = computed(() =>
  branchOrganizations.value.map((branch) => ({
    label: `${branch.organizationName} (${branch.organizationCode})`,
    value: branch.organizationCode,
  })),
)

onMounted(() => {
  loadBranchOrganizations()
})

async function loadBranchOrganizations() {
  branchErrorMessage.value = ''
  isLoadingBranches.value = true

  try {
    const response = await getBranchOrganizations()
    branchOrganizations.value = Array.isArray(response?.result) ? response.result : []
    form.organizationCode = branchOrganizations.value[0]?.organizationCode ?? ''
  } catch (error) {
    branchOrganizations.value = []
    form.organizationCode = ''
    branchErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoadingBranches.value = false
  }
}

async function submitSignup() {
  errorMessage.value = ''
  submitting.value = true

  try {
    await signupFp(form)
    await router.push({ path: '/login', query: { signedUp: '1' } })
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || error.message || '회원가입에 실패했습니다.'
  } finally {
    submitting.value = false
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

.signup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.signup-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.signup-field em {
  font-style: normal;
  color: #ef4444;
}

.signup-field--wide {
  grid-column: 1 / -1;
}

.signup-form :deep(.v-field) {
  border-radius: 8px;
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

@media (max-width: 768px) {
  .signup-grid,
  .signup-actions {
    grid-template-columns: 1fr;
  }

  .signup-page {
    padding-top: 20px;
  }
}
</style>
