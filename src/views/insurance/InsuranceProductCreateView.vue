<template>
  <section class="insurance-product-create-page">
    <div class="insurance-product-create-page__breadcrumb">
      <span>보험 상품 관리</span>
      <span class="insurance-product-create-page__breadcrumb-separator">/</span>
      <button type="button" @click="goToList">보험 상품 목록</button>
      <span class="insurance-product-create-page__breadcrumb-separator">/</span>
      <strong>보험 상품 등록</strong>
    </div>

    <header class="insurance-product-create-page__header">
      <div>
        <h2>보험 상품 등록</h2>
        <p>보험 상품 정보를 입력하고 보종을 함께 관리할 수 있습니다.</p>
      </div>

      <v-btn
        variant="outlined"
        class="insurance-product-create-page__back-button"
        @click="goToList"
      >
        <v-icon icon="mdi-arrow-left" size="16" start />
        목록으로 돌아가기
      </v-btn>
    </header>

    <v-alert v-if="submitErrorMessage" type="error" variant="tonal">
      {{ submitErrorMessage }}
    </v-alert>

    <div class="insurance-product-create-layout">
      <div class="insurance-product-create-layout__main">
        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">1. 보험사 및 보종</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-grid insurance-product-create-grid--two">
              <label class="insurance-product-create-field">
                <span>보험사 <em>*</em></span>
                <select v-model="form.insuranceCompanyId" class="insurance-product-create-input">
                  <option value="">보험사를 선택하세요</option>
                  <option
                    v-for="company in companyOptions"
                    :key="company.id"
                    :value="company.id"
                  >
                    {{ company.name }}
                  </option>
                </select>
              </label>

              <label class="insurance-product-create-field">
                <span>보종 <em>*</em></span>
                <select v-model="form.insuranceCategoryId" class="insurance-product-create-input">
                  <option value="">보종을 선택하세요</option>
                  <option
                    v-for="category in categoryOptions"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">2. 상품 기본 정보</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-grid insurance-product-create-grid--single-row">
              <label class="insurance-product-create-field">
                <span>보험상품명 <em>*</em></span>
                <input
                  v-model.trim="form.insuranceProductName"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="보험상품명을 입력하세요"
                />
              </label>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--product-meta">
              <label class="insurance-product-create-field">
                <span>출시일 <em>*</em></span>
                <input
                  v-model="form.insuranceStartDate"
                  type="date"
                  class="insurance-product-create-input insurance-product-create-input--disabled"
                  disabled
                />
                <small>오늘 날짜가 자동 입력되며 수정할 수 없습니다.</small>
              </label>

              <label class="insurance-product-create-field">
                <span>판매 종료일</span>
                <input
                  v-model="form.insuranceEndDate"
                  type="date"
                  class="insurance-product-create-input"
                />
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">3. 보장 정보</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-field">
              <span>보장기간 유형 <em>*</em></span>
              <div class="insurance-product-create-segment">
                <button
                  v-for="type in coverageTypeOptions"
                  :key="type.value"
                  type="button"
                  :class="{ 'is-active': form.coveragePeriodType === type.value }"
                  @click="handleCoverageTypeChange(type.value)"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--coverage-main insurance-product-create-grid--spaced">
              <label class="insurance-product-create-field">
                <span>보장 기간 (년)</span>
                <div class="insurance-product-create-inline">
                  <input
                    v-model.trim="form.coveragePeriodYears"
                    type="text"
                    class="insurance-product-create-input"
                    placeholder="예: 20"
                    :disabled="form.coveragePeriodType === 'LIFETIME'"
                  />
                  <span>년</span>
                </div>
              </label>

              <label class="insurance-product-create-field">
                <span>최대 보장 나이</span>
                <input
                  v-model.trim="form.coverageAgeLimit"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="-"
                  :disabled="form.coveragePeriodType === 'LIFETIME'"
                />
              </label>

              <div class="insurance-product-create-field">
                <span>종신 보장 여부 <em>*</em></span>
                <div class="insurance-product-create-toggle">
                  <button
                    type="button"
                    :class="{ 'is-active': form.isLifetimeCoverage === true }"
                    @click="setLifetimeCoverage(true)"
                  >
                    예
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': form.isLifetimeCoverage === false }"
                    @click="setLifetimeCoverage(false)"
                  >
                    아니오
                  </button>
                </div>
              </div>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--coverage-sub">
              <div class="insurance-product-create-field">
                <span>갱신 여부 <em>*</em></span>
                <div class="insurance-product-create-toggle">
                  <button
                    type="button"
                    :class="{ 'is-active': form.isRenewable === true }"
                    @click="setRenewable(true)"
                  >
                    예
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': form.isRenewable === false }"
                    @click="setRenewable(false)"
                  >
                    아니오
                  </button>
                </div>
              </div>

              <label class="insurance-product-create-field">
                <span>갱신 주기 (월)</span>
                <input
                  v-model.trim="form.renewalCycle"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="-"
                  :disabled="!form.isRenewable"
                />
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">4. 상품 설명</div>
          <div class="insurance-product-create-section__body insurance-product-create-section__body--description">
            <textarea
              v-model.trim="form.productDescription"
              class="insurance-product-create-textarea"
              rows="6"
              placeholder="보험 상품에 대한 설명을 입력하세요. (주요 보장 내용, 가입 조건, 특이사항 등)"
            />
          </div>
        </section>
      </div>

      <aside class="insurance-product-create-side">
        <section class="insurance-product-create-side__panel">
          <header class="insurance-product-create-side__header">
            <div>
              <h3>보종 관리</h3>
              <p>목록에서 선택하고 바로 추가, 수정, 삭제할 수 있습니다.</p>
            </div>
            <span class="insurance-product-create-side__count">
              총 {{ managementCategoryOptions.length }}개
            </span>
          </header>

          <div class="insurance-product-create-side__editor">
            <label class="insurance-product-create-field">
              <span>보종명</span>
              <input
                v-model.trim="categoryEditor.name"
                type="text"
                class="insurance-product-create-input"
                placeholder="보종명을 입력하세요"
              />
            </label>

            <div class="insurance-product-create-side__buttons">
              <v-btn class="insurance-product-create-side__primary" @click="handleCategoryAdd">
                추가
              </v-btn>
              <v-btn
                variant="outlined"
                class="insurance-product-create-side__secondary"
                :disabled="!selectedCategoryId"
                @click="handleCategoryUpdate"
              >
                이름 수정
              </v-btn>
              <v-btn
                variant="outlined"
                class="insurance-product-create-side__danger"
                :disabled="!selectedManagementCategory || selectedManagementCategory.status === 'INACTIVE'"
                @click="handleCategoryDeactivate"
              >
                비활성화
              </v-btn>
              <v-btn
                variant="outlined"
                class="insurance-product-create-side__success"
                :disabled="!selectedManagementCategory || selectedManagementCategory.status === 'ACTIVE'"
                @click="handleCategoryActivate"
              >
                활성화
              </v-btn>
            </div>

            <button
              v-if="selectedCategoryId"
              type="button"
              class="insurance-product-create-side__clear"
              @click="clearCategorySelection"
            >
              선택 해제
            </button>
          </div>

          <ul class="insurance-product-create-side__list">
            <li
              v-for="category in managementCategoryOptions"
              :key="category.id"
              :class="[
                { 'is-selected': selectedCategoryId === category.id },
                { 'is-inactive': category.status === 'INACTIVE' },
              ]"
              @click="selectCategory(category)"
            >
              <div class="insurance-product-create-side__item">
                <div class="insurance-product-create-side__item-head">
                  <strong>{{ category.name }}</strong>
                  <span
                    class="insurance-product-create-side__status"
                    :class="getManagementCategoryStatusClass(category.status)"
                  >
                    {{ getManagementCategoryStatusLabel(category.status) }}
                  </span>
                </div>
                <p v-if="selectedCategoryName === category.name && category.status !== 'INACTIVE'">
                  현재 상품에 선택됨
                </p>
                <p v-else-if="category.status === 'INACTIVE'">
                  비활성 상태로 관리 목록에 유지됨
                </p>
                <p v-else>클릭해서 바로 적용</p>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <footer class="insurance-product-create-page__actions">
      <v-btn
        variant="outlined"
        class="insurance-product-create-page__cancel-button"
        @click="goToList"
      >
        취소
      </v-btn>
      <v-btn
        class="insurance-product-create-page__submit-button"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        등록
      </v-btn>
    </footer>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createInsuranceManagementProduct,
  getInsuranceCategories,
  getInsuranceCompanies,
  getInsuranceManagementCategories,
  createInsuranceManagementCategory,
  updateInsuranceManagementCategory,
} from '../../api/insurance'

const router = useRouter()

const companyOptions = ref([])
const categoryOptions = ref([])
const managementCategoryOptions = ref([])

const coverageTypeOptions = [
  { label: '연 단위', value: 'YEARS' },
  { label: '나이 기준', value: 'AGE' },
  { label: '종신', value: 'LIFETIME' },
]

const form = reactive({
  insuranceCompanyId: '',
  insuranceCategoryId: '',
  insuranceProductName: '',
  insuranceStartDate: getTodayDate(),
  insuranceEndDate: '',
  coveragePeriodType: 'YEARS',
  coveragePeriodYears: '',
  coverageAgeLimit: '',
  isLifetimeCoverage: false,
  isRenewable: false,
  renewalCycle: '',
  productDescription: '',
})

const categoryEditor = reactive({
  name: '',
})

const selectedCategoryId = ref(null)
const isSubmitting = ref(false)
const submitErrorMessage = ref('')

onMounted(async () => {
  await loadCompanyOptions()
  await loadCategoryOptions()
  await loadManagementCategoryOptions()
})

const selectedCategoryName = computed(() => {
  const selected = categoryOptions.value.find((category) => category.id === form.insuranceCategoryId)
  return selected?.name ?? ''
})

const selectedManagementCategory = computed(() => {
  return (
    managementCategoryOptions.value.find((category) => category.id === selectedCategoryId.value) ?? null
  )
})

function goToList() {
  router.push({ name: 'insurance-products' })
}

async function loadCompanyOptions() {
  try {
    const response = await getInsuranceCompanies()
    companyOptions.value = normalizeSelectOptions(extractApiPayload(response), {
      fallbackIdKeys: ['insuranceCompanyId', 'companyId', 'id'],
      fallbackLabelKeys: ['insuranceCompanyName', 'companyName', 'name'],
    })
  } catch {
    companyOptions.value = []
  }
}

async function loadCategoryOptions() {
  try {
    const response = await getInsuranceCategories()
    categoryOptions.value = normalizeSelectOptions(extractApiPayload(response), {
      fallbackIdKeys: ['insuranceCategoryId', 'categoryId', 'id'],
      fallbackLabelKeys: ['insuranceCategoryName', 'categoryName', 'name'],
    })
  } catch {
    categoryOptions.value = []
  }
}

async function loadManagementCategoryOptions() {
  try {
    const response = await getInsuranceManagementCategories()
    const normalizedOptions = normalizeManagementCategoryOptions(extractApiPayload(response))

    managementCategoryOptions.value = normalizedOptions.length
      ? normalizedOptions
      : categoryOptions.value.map((category) => ({
        ...category,
        status: 'ACTIVE',
      }))

    if (!categoryOptions.value.length && normalizedOptions.length) {
      categoryOptions.value = normalizedOptions
        .filter((category) => category.status !== 'INACTIVE')
        .map(({ id, name }) => ({ id, name }))
    }
  } catch {
    managementCategoryOptions.value = categoryOptions.value.map((category) => ({
      ...category,
      status: 'ACTIVE',
    }))
  }
}

function handleCoverageTypeChange(value) {
  form.coveragePeriodType = value

  if (value === 'LIFETIME') {
    form.isLifetimeCoverage = true
    form.coveragePeriodYears = ''
    form.coverageAgeLimit = ''
    return
  }

  if (form.isLifetimeCoverage) {
    form.isLifetimeCoverage = false
  }
}

function setLifetimeCoverage(value) {
  form.isLifetimeCoverage = value

  if (value) {
    form.coveragePeriodType = 'LIFETIME'
    form.coveragePeriodYears = ''
    form.coverageAgeLimit = ''
  }
}

function setRenewable(value) {
  form.isRenewable = value

  if (!value) {
    form.renewalCycle = ''
  }
}

function selectCategory(category) {
  selectedCategoryId.value = category.id
  categoryEditor.name = category.name

  if (category.status !== 'INACTIVE') {
    form.insuranceCategoryId = category.id
  }
}

function clearCategorySelection() {
  selectedCategoryId.value = null
  categoryEditor.name = ''
}

async function handleCategoryAdd() {
  const name = categoryEditor.name.trim()
  if (!name) {
    window.alert('보종명을 입력하세요.')
    return
  }

  const exists = managementCategoryOptions.value.some((category) => category.name === name)
  if (exists) {
    window.alert('이미 존재하는 보종명입니다.')
    return
  }

  try {
    const response = await createInsuranceManagementCategory({
      insuranceCategoryName: name,
    })
    await Promise.all([loadCategoryOptions(), loadManagementCategoryOptions()])

    const payload = extractApiPayload(response)
    const createdCategoryId = String(
      payload?.insuranceCategoryId ?? payload?.categoryId ?? payload?.id ?? '',
    )
    const createdCategory =
      managementCategoryOptions.value.find((category) => category.id === createdCategoryId)
      ?? managementCategoryOptions.value.find((category) => category.name === name)

    if (createdCategory) {
      selectCategory(createdCategory)
    } else {
      clearCategorySelection()
    }
  } catch (error) {
    window.alert(error?.response?.data?.message || '보종 추가에 실패했습니다.')
  }
}

async function handleCategoryUpdate() {
  if (!selectedCategoryId.value) return

  const name = categoryEditor.name.trim()
  if (!name) {
    window.alert('보종명을 입력하세요.')
    return
  }

  const duplicate = managementCategoryOptions.value.some(
    (category) => category.id !== selectedCategoryId.value && category.name === name,
  )
  if (duplicate) {
    window.alert('이미 존재하는 보종명입니다.')
    return
  }

  try {
    await updateInsuranceManagementCategory(selectedCategoryId.value, {
      insuranceCategoryName: name,
    })
    await Promise.all([loadCategoryOptions(), loadManagementCategoryOptions()])

    const updatedCategory = managementCategoryOptions.value.find(
      (category) => category.id === selectedCategoryId.value,
    )
    if (updatedCategory) {
      selectCategory(updatedCategory)
    }
  } catch (error) {
    window.alert(error?.response?.data?.message || '보종 수정에 실패했습니다.')
  }
}

async function handleCategoryDeactivate() {
  if (!selectedCategoryId.value) return

  const target = managementCategoryOptions.value.find((category) => category.id === selectedCategoryId.value)
  if (!target) return

  try {
    await updateInsuranceManagementCategory(selectedCategoryId.value, {
      insuranceCategoryStatus: 'INACTIVE',
    })
    await Promise.all([loadCategoryOptions(), loadManagementCategoryOptions()])

    if (form.insuranceCategoryId === target.id) {
      form.insuranceCategoryId = ''
    }

    clearCategorySelection()
  } catch (error) {
    window.alert(error?.response?.data?.message || '보종 비활성화에 실패했습니다.')
  }
}

async function handleCategoryActivate() {
  if (!selectedCategoryId.value) return

  try {
    await updateInsuranceManagementCategory(selectedCategoryId.value, {
      insuranceCategoryStatus: 'ACTIVE',
    })
    await Promise.all([loadCategoryOptions(), loadManagementCategoryOptions()])

    const reactivatedCategory = managementCategoryOptions.value.find(
      (category) => category.id === selectedCategoryId.value,
    )

    if (reactivatedCategory) {
      selectCategory(reactivatedCategory)
    }
  } catch (error) {
    window.alert(error?.response?.data?.message || '보종 활성화에 실패했습니다.')
  }
}

function validateForm() {
  if (!form.insuranceCompanyId) return '보험사를 선택하세요.'
  if (!form.insuranceCategoryId) return '보종을 선택하세요.'
  if (!form.insuranceProductName.trim()) return '보험상품명을 입력하세요.'
  if (!form.insuranceStartDate) return '출시일을 확인하세요.'
  if (!form.coveragePeriodType) return '보장기간 유형을 선택하세요.'
  if (form.isLifetimeCoverage === null || form.isLifetimeCoverage === undefined) {
    return '종신 보장 여부를 선택하세요.'
  }
  if (form.isRenewable === null || form.isRenewable === undefined) {
    return '갱신 여부를 선택하세요.'
  }
  return ''
}

function buildPayload() {
  return {
    insuranceCompanyId: form.insuranceCompanyId,
    insuranceCategoryId: form.insuranceCategoryId,
    insuranceProductName: form.insuranceProductName.trim(),
    insuranceProductStatus: form.insuranceEndDate ? 'INACTIVE' : 'ACTIVE',
    insuranceStartDate: form.insuranceStartDate,
    insuranceEndDate: form.insuranceEndDate || null,
    coveragePeriodType: form.coveragePeriodType,
    coveragePeriodYears: toNullableNumber(form.coveragePeriodYears),
    coverageAgeLimit: toNullableNumber(form.coverageAgeLimit),
    isLifetimeCoverage: Boolean(form.isLifetimeCoverage),
    isRenewable: Boolean(form.isRenewable),
    renewalCycle: toNullableNumber(form.renewalCycle),
    productDescription: form.productDescription.trim() || null,
  }
}

async function handleSubmit() {
  submitErrorMessage.value = ''

  const message = validateForm()
  if (message) {
    submitErrorMessage.value = message
    return
  }

  isSubmitting.value = true

  try {
    await createInsuranceManagementProduct(buildPayload())
    window.alert('보험 상품이 등록되었습니다.')
    goToList()
  } catch (error) {
    submitErrorMessage.value =
      error?.response?.data?.message || '보험 상품 등록에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function toNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeSelectOptions(payload, { fallbackIdKeys, fallbackLabelKeys }) {
  const source = extractOptionSource(payload)

  return source.map((item, index) => ({
    id: String(getFirstDefinedValue(item, fallbackIdKeys) ?? `option-${index}`),
    name: String(getFirstDefinedValue(item, fallbackLabelKeys) ?? `항목 ${index + 1}`),
  }))
}

function normalizeManagementCategoryOptions(payload) {
  const source = extractOptionSource(payload)

  return source.map((item, index) => ({
    id: String(
      getFirstDefinedValue(item, ['insuranceCategoryId', 'categoryId', 'id']) ?? `category-${index}`,
    ),
    name: String(
      getFirstDefinedValue(item, ['insuranceCategoryName', 'categoryName', 'name']) ?? `항목 ${index + 1}`,
    ),
    status: String(
      getFirstDefinedValue(item, ['insuranceCategoryStatus', 'categoryStatus', 'status']) ?? 'ACTIVE',
    ).toUpperCase(),
  }))
}

function getManagementCategoryStatusLabel(status) {
  return String(status).toUpperCase() === 'INACTIVE' ? '비활성' : '활성'
}

function getManagementCategoryStatusClass(status) {
  return String(status).toUpperCase() === 'INACTIVE'
    ? 'insurance-product-create-side__status--inactive'
    : 'insurance-product-create-side__status--active'
}

function extractOptionSource(payload) {
  if (Array.isArray(payload)) return payload

  const candidates = [
    payload?.content,
    payload?.items,
    payload?.categories,
    payload?.insuranceCategories,
    payload?.companies,
    payload?.insuranceCompanies,
    payload?.data,
    payload?.result,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function extractApiPayload(response) {
  return response?.data ?? response?.result ?? response
}

function getFirstDefinedValue(target, keys) {
  for (const key of keys) {
    if (target?.[key] !== undefined && target?.[key] !== null) {
      return target[key]
    }
  }

  return undefined
}

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.insurance-product-create-page {
  display: grid;
  gap: 22px;
  min-width: 0;
}

.insurance-product-create-page__breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.insurance-product-create-page__breadcrumb button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
}

.insurance-product-create-page__breadcrumb strong {
  color: #111827;
  font-weight: 700;
}

.insurance-product-create-page__breadcrumb-separator {
  color: #d1d5db;
}

.insurance-product-create-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.insurance-product-create-page__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  color: #111827;
  font-weight: 800;
}

.insurance-product-create-page__header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.insurance-product-create-page__back-button,
.insurance-product-create-page__cancel-button,
.insurance-product-create-page__submit-button {
  height: 40px;
  border-radius: 10px;
  padding: 0 18px;
  box-shadow: none;
}

.insurance-product-create-page__back-button,
.insurance-product-create-page__cancel-button {
  border-color: #d1d5db;
  color: #475569;
}

.insurance-product-create-page__submit-button {
  background: #f97316;
  color: #ffffff;
  font-weight: 700;
}

.insurance-product-create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

.insurance-product-create-layout__main {
  display: grid;
  gap: 22px;
}

.insurance-product-create-section,
.insurance-product-create-side__panel {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.insurance-product-create-section__title {
  padding: 16px 24px;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
  color: #1f2937;
  font-size: 15px;
  font-weight: 800;
}

.insurance-product-create-section__body {
  padding: 30px 32px;
}

.insurance-product-create-section__body--description {
  padding-top: 26px;
}

.insurance-product-create-grid {
  display: grid;
  gap: 24px 24px;
  align-items: start;
}

.insurance-product-create-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insurance-product-create-grid--single-row {
  max-width: 760px;
}

.insurance-product-create-grid--product-meta {
  grid-template-columns: repeat(2, minmax(0, 320px));
  margin-top: 28px;
}

.insurance-product-create-grid--coverage-main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insurance-product-create-grid--coverage-sub {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28px;
}

.insurance-product-create-grid--spaced {
  margin-top: 28px;
}

.insurance-product-create-field {
  display: grid;
  gap: 10px;
}

.insurance-product-create-field span {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
}

.insurance-product-create-field em {
  color: #ef4444;
  font-style: normal;
}

.insurance-product-create-field small {
  color: #9ca3af;
  font-size: 12px;
}

.insurance-product-create-input,
.insurance-product-create-textarea {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font: inherit;
}

.insurance-product-create-input {
  height: 44px;
  padding: 0 14px;
}

.insurance-product-create-input--disabled {
  background: #f8fafc;
  color: #64748b;
}

.insurance-product-create-textarea {
  min-height: 180px;
  padding: 14px 16px;
  line-height: 1.6;
  resize: vertical;
}

.insurance-product-create-inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.insurance-product-create-inline span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.insurance-product-create-toggle,
.insurance-product-create-segment {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

.insurance-product-create-toggle button,
.insurance-product-create-segment button {
  min-width: 58px;
  height: 44px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0 16px;
}

.insurance-product-create-toggle button:first-child,
.insurance-product-create-segment button:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.insurance-product-create-toggle button:last-child,
.insurance-product-create-segment button:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.insurance-product-create-toggle button + button,
.insurance-product-create-segment button + button {
  border-left: 0;
}

.insurance-product-create-toggle button.is-active,
.insurance-product-create-segment button.is-active {
  background: #f97316;
  border-color: #f97316;
  color: #ffffff;
}

.insurance-product-create-side__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
}

.insurance-product-create-side__header h3 {
  margin: 0;
  font-size: 15px;
  color: #111827;
  font-weight: 800;
}

.insurance-product-create-side__header p {
  margin: 6px 0 0;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.4;
}

.insurance-product-create-side__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
}

.insurance-product-create-side__editor {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
}

.insurance-product-create-side__buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.insurance-product-create-side__primary,
.insurance-product-create-side__secondary,
.insurance-product-create-side__danger,
.insurance-product-create-side__success {
  height: 34px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: none;
}

.insurance-product-create-side__primary {
  background: #f97316;
  color: #ffffff;
}

.insurance-product-create-side__secondary {
  border-color: #d1d5db;
  color: #475569;
}

.insurance-product-create-side__danger {
  border-color: #fecaca;
  color: #dc2626;
}

.insurance-product-create-side__success {
  border-color: #bbf7d0;
  color: #16a34a;
}

.insurance-product-create-side__clear {
  justify-self: flex-end;
  border: 0;
  padding: 0;
  background: transparent;
  color: #f97316;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.insurance-product-create-side__list {
  list-style: none;
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 14px 16px 16px;
  max-height: 520px;
  overflow-y: auto;
}

.insurance-product-create-side__list li {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  cursor: pointer;
}

.insurance-product-create-side__list li strong {
  display: block;
  color: #111827;
  font-size: 14px;
}

.insurance-product-create-side__item {
  display: grid;
  gap: 6px;
}

.insurance-product-create-side__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.insurance-product-create-side__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.insurance-product-create-side__status--active {
  background: #dcfce7;
  color: #16a34a;
}

.insurance-product-create-side__status--inactive {
  background: #f1f5f9;
  color: #64748b;
}

.insurance-product-create-side__list li p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.4;
}

.insurance-product-create-side__list li.is-selected {
  border-color: #fdba74;
  background: #fff7ed;
}

.insurance-product-create-side__list li.is-inactive strong {
  color: #475569;
}

.insurance-product-create-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1180px) {
  .insurance-product-create-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .insurance-product-create-grid--two,
  .insurance-product-create-grid--product-meta,
  .insurance-product-create-grid--coverage-main,
  .insurance-product-create-grid--coverage-sub {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .insurance-product-create-page__header {
    display: grid;
    grid-template-columns: 1fr;
  }

  .insurance-product-create-side__buttons {
    grid-template-columns: 1fr;
  }
}
</style>
