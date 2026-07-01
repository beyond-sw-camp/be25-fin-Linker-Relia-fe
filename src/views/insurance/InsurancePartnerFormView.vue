<template>
  <section class="insurance-form-page">
    <PageBackLink label="제휴 보험사 목록" @click="goToList" />

    <header class="insurance-form-page__header">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDescription }}</p>
      </div>
    </header>

    <section class="insurance-form-panel">
      <div class="insurance-form-panel__title">보험사 기본 정보</div>

      <div v-if="isLoading" class="insurance-form-panel__state">
        <v-progress-circular indeterminate color="#f97316" />
        <p>보험사 정보를 불러오는 중입니다.</p>
      </div>

      <div v-else-if="loadErrorMessage" class="insurance-form-panel__alert">
        <v-alert type="error" variant="tonal">
          {{ loadErrorMessage }}
        </v-alert>
      </div>

      <template v-else>
        <div v-if="submitErrorMessage" class="insurance-form-panel__alert insurance-form-panel__alert--inline">
          <v-alert type="error" variant="tonal">
            {{ submitErrorMessage }}
          </v-alert>
        </div>

        <div class="insurance-form-grid">
          <label class="insurance-form-field">
            <span>보험사명 <em>*</em></span>
            <input
              v-model.trim="form.insuranceCompanyName"
              type="text"
              placeholder="보험사명을 입력하세요"
              :readonly="isReadOnly"
            />
          </label>

          <label class="insurance-form-field">
            <span>대표 연락처 <em>*</em></span>
            <input
              v-model.trim="form.insuranceCompanyPhone"
              type="text"
              placeholder="02-0000-0000"
              :readonly="isReadOnly"
            />
          </label>

          <label class="insurance-form-field">
            <span>제휴 시작일</span>
            <input :value="form.partnerStartedAt || '-'" type="text" readonly />
            <small>등록 시점의 날짜가 자동 입력됩니다.</small>
          </label>

          <label class="insurance-form-field">
            <span>제휴 해지일</span>
            <input :value="form.partnerTerminatedAt || '-'" type="text" readonly />
            <small>비활성화 처리 시 자동으로 기록됩니다.</small>
          </label>
        </div>

        <div class="insurance-form-status">
          <span>상태</span>
          <div class="insurance-form-status__options">
            <button
              type="button"
              class="insurance-form-status__option"
              :class="{ 'is-active': form.insuranceCompanyStatus === 'ACTIVE' }"
              :disabled="isReadOnly"
              @click="setStatus('ACTIVE')"
            >
              <span class="insurance-form-status__dot"></span>
              활성
            </button>
            <button
              type="button"
              class="insurance-form-status__option"
              :class="{ 'is-active': form.insuranceCompanyStatus === 'INACTIVE' }"
              :disabled="isReadOnly"
              @click="setStatus('INACTIVE')"
            >
              <span class="insurance-form-status__dot"></span>
              비활성
            </button>
          </div>
        </div>
      </template>
    </section>

    <footer class="insurance-form-page__actions">
      <v-btn
        v-if="canManage && !isLoading"
        variant="outlined"
        class="insurance-form-page__cancel-button"
        @click="goToList"
      >
        취소
      </v-btn>
      <v-btn
        v-if="canManage && !isLoading"
        class="insurance-form-page__submit-button"
        :disabled="isSubmitting || Boolean(loadErrorMessage)"
        @click="submitForm"
      >
        {{ isSubmitting ? '처리 중...' : isCreateMode ? '등록' : '수정' }}
      </v-btn>
    </footer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageBackLink from '../../components/common/PageBackLink.vue'
import {
  createInsuranceManagementCompany,
  getInsuranceManagementCompanyDetail,
  updateInsuranceManagementCompany,
} from '../../api/insurance'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const canManage = computed(() => authStore.userRole === USER_ROLES.SYSTEM_ADMIN)
const isCreateMode = computed(() => route.name === 'insurance-partner-create')
const isReadOnly = computed(() => !canManage.value)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadErrorMessage = ref('')
const submitErrorMessage = ref('')

const pageTitle = computed(() => (isCreateMode.value ? '보험사 등록' : '보험사 상세'))
const pageDescription = computed(() => (
  isCreateMode.value
    ? '신규 제휴 보험사 정보를 등록합니다.'
    : '제휴 보험사 정보를 확인하고 수정할 수 있습니다.'
))

const form = reactive(createEmptyForm())

watch(
  () => [route.name, route.params.insuranceCompanyId],
  async () => {
    resetForm()

    if (isCreateMode.value) {
      return
    }

    await loadCompanyDetail()
  },
  { immediate: true },
)

function createEmptyForm() {
  return {
    insuranceCompanyName: '',
    insuranceCompanyPhone: '',
    insuranceCompanyStatus: 'ACTIVE',
    partnerStartedAt: new Date().toISOString().slice(0, 10),
    partnerTerminatedAt: '',
  }
}

function resetForm() {
  loadErrorMessage.value = ''
  submitErrorMessage.value = ''
  Object.assign(form, createEmptyForm())
}

function getInsuranceCompanyId() {
  return Array.isArray(route.params.insuranceCompanyId)
    ? route.params.insuranceCompanyId[0]
    : route.params.insuranceCompanyId
}

async function loadCompanyDetail() {
  const insuranceCompanyId = getInsuranceCompanyId()

  if (!insuranceCompanyId) {
    loadErrorMessage.value = '보험사 식별자가 올바르지 않습니다.'
    return
  }

  isLoading.value = true

  try {
    const response = await getInsuranceManagementCompanyDetail(insuranceCompanyId)
    const detail = response?.result ?? {}

    form.insuranceCompanyName = detail.insuranceCompanyName ?? ''
    form.insuranceCompanyPhone = detail.insuranceCompanyPhone ?? ''
    form.insuranceCompanyStatus = normalizeStatus(detail.insuranceCompanyStatus)
    form.partnerStartedAt = detail.partnerStartedAt ?? ''
    form.partnerTerminatedAt = detail.partnerTerminatedAt ?? ''
  } catch (error) {
    loadErrorMessage.value = error?.response?.data?.message || '보험사 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function normalizeStatus(status) {
  if (status === 'INACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

function buildPayload() {
  return {
    insuranceCompanyName: form.insuranceCompanyName.trim(),
    insuranceCompanyPhone: form.insuranceCompanyPhone.trim(),
    insuranceCompanyStatus: form.insuranceCompanyStatus,
  }
}

function validateForm() {
  if (!form.insuranceCompanyName.trim()) {
    submitErrorMessage.value = '보험사명을 입력해주세요.'
    return false
  }

  if (!form.insuranceCompanyPhone.trim()) {
    submitErrorMessage.value = '대표 연락처를 입력해주세요.'
    return false
  }

  return true
}

function setStatus(status) {
  if (isReadOnly.value) return

  form.insuranceCompanyStatus = status

  if (status === 'ACTIVE') {
    form.partnerTerminatedAt = ''
    return
  }

  form.partnerTerminatedAt = new Date().toISOString().slice(0, 10)
}

async function submitForm() {
  if (!canManage.value) return

  submitErrorMessage.value = ''

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    if (isCreateMode.value) {
      await createInsuranceManagementCompany(buildPayload())
      window.alert('보험사가 등록되었습니다.')
    } else {
      const insuranceCompanyId = getInsuranceCompanyId()

      if (!insuranceCompanyId) {
        submitErrorMessage.value = '보험사 식별자가 올바르지 않습니다.'
        return
      }

      await updateInsuranceManagementCompany(insuranceCompanyId, buildPayload())
      window.alert('보험사 정보가 수정되었습니다.')
      await loadCompanyDetail()
    }

    goToList()
  } catch (error) {
    submitErrorMessage.value = error?.response?.data?.message
      || (isCreateMode.value ? '보험사 등록에 실패했습니다.' : '보험사 수정에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

function goToList() {
  router.push({ name: 'insurance-partners' })
}
</script>

<style scoped>
.insurance-form-page {
  display: grid;
  gap: 16px;
  min-width: 0;
  color: #111827;
}

.insurance-form-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.insurance-form-page__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
  color: #111827;
  font-weight: 800;
}

.insurance-form-page__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.insurance-form-panel {
  overflow: hidden;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.insurance-form-panel__title {
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.insurance-form-panel__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 220px;
  padding: 24px;
  color: #64748b;
}

.insurance-form-panel__alert {
  margin: 18px;
}

.insurance-form-panel__alert--inline {
  margin-bottom: 0;
}

.insurance-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 18px;
}

.insurance-form-field {
  display: grid;
  gap: 8px;
}

.insurance-form-field span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.insurance-form-field em {
  color: #ef4444;
  font-style: normal;
}

.insurance-form-field input {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #d8dce3;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

.insurance-form-field input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

.insurance-form-field input[readonly] {
  background: #f8fafc;
  color: #64748b;
}

.insurance-form-field small {
  color: #64748b;
  font-size: 12px;
}

.insurance-form-status {
  display: grid;
  gap: 12px;
  padding: 0 18px 18px;
}

.insurance-form-status > span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.insurance-form-status__options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.insurance-form-status__option {
  min-width: 92px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border: 1px solid #d8dce3;
  border-radius: 10px;
  background: #ffffff;
  color: #64748b;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  cursor: pointer;
}

.insurance-form-status__option.is-active {
  border-color: #f97316;
  color: #f97316;
  background: #fff7ed;
}

.insurance-form-status__option:disabled {
  cursor: default;
}

.insurance-form-status__dot {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-radius: 999px;
}

.insurance-form-status__option.is-active .insurance-form-status__dot {
  background: currentColor;
  box-shadow: inset 0 0 0 3px #fff7ed;
}

.insurance-form-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 12px;
}

.insurance-form-page__cancel-button,
.insurance-form-page__submit-button {
  height: 40px;
  border-radius: 10px;
  padding: 0 20px;
  box-shadow: none;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
}

.insurance-form-page__cancel-button {
  border-color: #d8dce3;
  color: #64748b;
}

.insurance-form-page__submit-button {
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 1024px) {
  .insurance-form-page__header {
    display: grid;
    grid-template-columns: 1fr;
  }

  .insurance-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .insurance-form-page__actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
