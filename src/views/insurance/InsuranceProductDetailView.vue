<template>
  <section class="insurance-product-detail-page">
    <PageBackLink label="보험 상품 목록" @click="goToList" />

    <v-alert v-if="errorMessage" type="error" variant="tonal">
      {{ errorMessage }}
    </v-alert>

    <div v-if="isLoading" class="insurance-product-detail-page__state">
      <v-progress-circular indeterminate color="#f97316" />
      <p>보험 상품 상세 정보를 불러오는 중입니다.</p>
    </div>

    <template v-else>
      <section class="insurance-product-detail-section">
        <div class="insurance-product-detail-section__title">1. 상품 기본 정보</div>
        <div class="insurance-product-detail-section__body insurance-product-detail-grid">
          <div class="insurance-product-detail-column">
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보험상품명</span>
              <strong class="insurance-product-detail-row__value">{{ displayValue(form.productName) }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">상품 코드</span>
              <strong class="insurance-product-detail-row__value">{{ displayValue(form.productCode) }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보험사</span>
              <strong class="insurance-product-detail-row__value">{{ displayValue(form.insuranceCompanyName) }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보종</span>
              <strong class="insurance-product-detail-row__value">{{ displayValue(form.categoryName) }}</strong>
            </div>
          </div>

          <div class="insurance-product-detail-column">
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보험상품 상태</span>
              <div class="insurance-product-detail-row__value">
                <select
                  v-if="canManage"
                  v-model="form.productStatus"
                  class="insurance-product-detail-input insurance-product-detail-input--select"
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                </select>
                <span v-else class="insurance-product-badge" :class="statusMeta.className">
                  {{ statusMeta.label }}
                </span>
              </div>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">출시일</span>
              <strong class="insurance-product-detail-row__value">{{ formatDate(form.saleStartDate) }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">판매 종료일</span>
              <strong class="insurance-product-detail-row__value">{{ formatDate(form.saleEndDate) }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="insurance-product-detail-section">
        <div class="insurance-product-detail-section__title">2. 보장 정보</div>
        <div class="insurance-product-detail-section__body insurance-product-detail-grid">
          <div class="insurance-product-detail-column">
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보장기간 유형</span>
              <div class="insurance-product-detail-row__value">
                <span
                  v-if="coverageTypeLabel !== '-'"
                  class="insurance-product-badge insurance-product-badge--info"
                >
                  {{ coverageTypeLabel }}
                </span>
                <strong v-else>-</strong>
              </div>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">보장 기간</span>
              <strong class="insurance-product-detail-row__value">{{ coveragePeriodDisplay }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">최대 보장 나이</span>
              <strong class="insurance-product-detail-row__value">{{ maxCoverageAgeDisplay }}</strong>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">종신 보장 여부</span>
              <div class="insurance-product-detail-row__value">
                <span
                  v-if="wholeLifeCoverageLabel !== '-'"
                  class="insurance-product-badge insurance-product-badge--info"
                >
                  {{ wholeLifeCoverageLabel }}
                </span>
                <strong v-else>-</strong>
              </div>
            </div>
          </div>

          <div class="insurance-product-detail-column">
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">갱신 여부</span>
              <div class="insurance-product-detail-row__value">
                <span
                  v-if="renewalAvailableLabel !== '-'"
                  class="insurance-product-badge insurance-product-badge--neutral"
                >
                  {{ renewalAvailableLabel }}
                </span>
                <strong v-else>-</strong>
              </div>
            </div>
            <div class="insurance-product-detail-row">
              <span class="insurance-product-detail-row__label">갱신 주기</span>
              <strong class="insurance-product-detail-row__value">{{ renewalCycleDisplay }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="insurance-product-detail-section">
        <div class="insurance-product-detail-section__title">3. 보험상품 설명</div>
        <div class="insurance-product-detail-section__body">
          <textarea
            v-if="canManage"
            v-model.trim="form.description"
            class="insurance-product-detail-textarea"
            rows="5"
          />
          <p v-else class="insurance-product-detail-description">
            {{ productDescription }}
          </p>
        </div>
      </section>

      <footer v-if="canManage" class="insurance-product-detail-page__actions">
        <v-btn
          variant="outlined"
          class="insurance-product-detail-page__cancel-button"
          @click="resetForm"
        >
          취소
        </v-btn>
        <v-btn
          class="insurance-product-detail-page__submit-button"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="applyChanges"
        >
          수정
        </v-btn>
      </footer>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getInsuranceManagementProductDetail,
  updateInsuranceManagementProduct,
} from '../../api/insurance'
import PageBackLink from '../../components/common/PageBackLink.vue'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const canManage = computed(() => authStore.userRole === USER_ROLES.SYSTEM_ADMIN)

const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive(createEmptyForm())
const savedSnapshot = reactive(createEmptyForm())

watch(
  () => route.params.insuranceProductId,
  () => {
    loadProductDetail()
  },
  { immediate: true },
)

watch(
  () => form.productStatus,
  (next, prev) => {
    if (next === 'INACTIVE' && prev !== 'INACTIVE' && !form.saleEndDate) {
      form.saleEndDate = getCurrentDate()
    }

    if (next === 'ACTIVE' && prev === 'INACTIVE' && form.saleEndDate === getCurrentDate()) {
      form.saleEndDate = ''
    }
  },
)

const statusMeta = computed(() => {
  if (form.productStatus === 'INACTIVE') {
    return { label: '비활성', className: 'insurance-product-badge--inactive' }
  }

  return { label: '활성', className: 'insurance-product-badge--active' }
})

const coverageTypeLabel = computed(() => {
  if (!form.coveragePeriodType) return '-'

  const value = String(form.coveragePeriodType).toUpperCase()
  if (value === 'YEARS') return '연 단위'
  if (value === 'AGE') return '나이 기준'
  if (value === 'LIFETIME') return '종신'
  return displayValue(form.coveragePeriodType)
})

const coveragePeriodDisplay = computed(() => {
  if (form.isLifetimeCoverage) return '-'
  if (form.coveragePeriodYears === null || form.coveragePeriodYears === undefined || form.coveragePeriodYears === '') {
    return '-'
  }

  return `${form.coveragePeriodYears}년`
})

const maxCoverageAgeDisplay = computed(() => formatAge(form.maxCoverageAge))

const wholeLifeCoverageLabel = computed(() => {
  if (form.isLifetimeCoverage === null || form.isLifetimeCoverage === undefined) return '-'
  return form.isLifetimeCoverage ? '예' : '아니오'
})

const renewalAvailableLabel = computed(() => {
  if (form.isRenewable === null || form.isRenewable === undefined) return '-'
  return form.isRenewable ? '예' : '아니오'
})

const renewalCycleDisplay = computed(() => {
  if (!form.isRenewable) return '-'
  if (form.renewalCycle === null || form.renewalCycle === undefined || form.renewalCycle === '') return '-'
  return `${form.renewalCycle}개월`
})

const productDescription = computed(() => {
  const description = displayValue(form.description)
  if (description !== '-') return description

  if (displayValue(form.productName) === '-' && displayValue(form.insuranceCompanyName) === '-') {
    return '등록된 보험상품 설명이 없습니다.'
  }

  return `${displayValue(form.insuranceCompanyName)}의 ${displayValue(form.productName)} 상품입니다.`
})

async function loadProductDetail() {
  const insuranceProductId = getInsuranceProductId()
  if (!insuranceProductId) {
    errorMessage.value = '보험상품 ID가 없어 상세 정보를 조회할 수 없습니다.'
    Object.assign(form, createEmptyForm())
    Object.assign(savedSnapshot, createEmptyForm())
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getInsuranceManagementProductDetail(insuranceProductId)
    const payload = response?.data ?? response?.result ?? response
    const nextForm = normalizeProductDetail(payload)
    Object.assign(form, nextForm)
    Object.assign(savedSnapshot, nextForm)
  } catch (error) {
    Object.assign(form, createEmptyForm())
    Object.assign(savedSnapshot, createEmptyForm())
    errorMessage.value =
      error?.response?.data?.message || '보험 상품 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function createEmptyForm() {
  return {
    productId: '',
    productCode: '',
    productName: '',
    productStatus: 'ACTIVE',
    insuranceCompanyId: '',
    insuranceCompanyName: '',
    categoryId: '',
    categoryName: '',
    saleStartDate: '',
    saleEndDate: '',
    coveragePeriodType: '',
    coveragePeriodYears: '',
    maxCoverageAge: '',
    isLifetimeCoverage: null,
    isRenewable: null,
    renewalCycle: '',
    description: '',
  }
}

function normalizeProductDetail(data) {
  return {
    productId: data?.insuranceProductId ?? '',
    productCode: data?.insuranceProductCode ?? '',
    productName: data?.insuranceProductName ?? '',
    productStatus: normalizeProductStatus(data?.insuranceProductStatus),
    insuranceCompanyId: data?.insuranceCompanyId ?? '',
    insuranceCompanyName: data?.insuranceCompanyName ?? '',
    categoryId: data?.insuranceCategoryId ?? '',
    categoryName: data?.insuranceCategoryName ?? '',
    saleStartDate: data?.insuranceStartDate ?? '',
    saleEndDate: data?.insuranceEndDate ?? '',
    coveragePeriodType: data?.coveragePeriodType ?? '',
    coveragePeriodYears: data?.coveragePeriodYears ?? '',
    maxCoverageAge: data?.coverageAgeLimit ?? '',
    isLifetimeCoverage: data?.isLifetimeCoverage ?? null,
    isRenewable: data?.isRenewable ?? null,
    renewalCycle: data?.renewalCycle ?? '',
    description: data?.productDescription ?? '',
  }
}

function normalizeProductStatus(status) {
  if (!status) return 'ACTIVE'
  if (status === 'INACTIVE') return 'INACTIVE'
  if (status === 'SALE_ENDED') return 'INACTIVE'
  return 'ACTIVE'
}

function getInsuranceProductId() {
  return Array.isArray(route.params.insuranceProductId)
    ? route.params.insuranceProductId[0]
    : route.params.insuranceProductId
}

function resetForm() {
  Object.assign(form, savedSnapshot)
}

async function applyChanges() {
  const insuranceProductId = getInsuranceProductId()
  if (!insuranceProductId) {
    window.alert('보험상품 ID가 없어 수정할 수 없습니다.')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await updateInsuranceManagementProduct(insuranceProductId, {
      insuranceProductStatus: form.productStatus,
      productDescription: form.description,
    })

    const payload = response?.data ?? response?.result ?? response
    const nextForm = normalizeProductDetail(payload)
    Object.assign(form, nextForm)
    Object.assign(savedSnapshot, nextForm)
    window.alert('보험상품 정보가 수정되었습니다.')
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || '보험상품 수정에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function goToList() {
  router.push({ name: 'insurance-products' })
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function formatAge(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string' && value.includes('세')) return value
  return `${value}세`
}

function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.insurance-product-detail-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.insurance-product-detail-page__cancel-button,
.insurance-product-detail-page__submit-button {
  height: 40px;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
}

.insurance-product-detail-page__cancel-button {
  border-color: #d1d5db;
  color: #475569;
}

.insurance-product-detail-page__submit-button {
  background: #f97316;
  color: #ffffff;
  font-weight: 700;
}

.insurance-product-detail-page__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 240px;
  color: #64748b;
  padding: 20px;
}

.insurance-product-detail-section {
  overflow: hidden;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.insurance-product-detail-section__title {
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
  color: #1f2937;
  font-size: 15px;
  font-weight: 800;
}

.insurance-product-detail-section__body {
  padding: 18px;
}

.insurance-product-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.insurance-product-detail-column {
  display: grid;
}

.insurance-product-detail-row {
  min-height: 44px;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-bottom: 0;
  border-radius: 10px;
  background: #f8fafc;
}

.insurance-product-detail-column .insurance-product-detail-row:last-child {
  border-bottom: 0;
}

.insurance-product-detail-row__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.insurance-product-detail-row__value {
  display: flex;
  align-items: center;
  min-height: 32px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.insurance-product-detail-input,
.insurance-product-detail-textarea {
  width: 100%;
  border: 1px solid #d9e0ea;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  box-shadow: none;
}

.insurance-product-detail-input {
  height: 40px;
  padding: 0 12px;
}

.insurance-product-detail-input--select {
  appearance: auto;
}

.insurance-product-detail-textarea {
  min-height: 120px;
  padding: 12px;
  line-height: 1.6;
  resize: vertical;
}

.insurance-product-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.insurance-product-badge--active {
  background: #e8f7ee;
  color: #16a34a;
}

.insurance-product-badge--inactive {
  background: #fef2f2;
  color: #dc2626;
}

.insurance-product-badge--info {
  background: #eff6ff;
  color: #2563eb;
}

.insurance-product-badge--neutral {
  background: #f1f5f9;
  color: #64748b;
}

.insurance-product-detail-description {
  margin: 0;
  color: #374151;
  font-size: 14px;
  line-height: 1.7;
}

.insurance-product-detail-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .insurance-product-detail-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 768px) {
  .insurance-product-detail-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 10px 0;
    align-items: flex-start;
  }
}
</style>
