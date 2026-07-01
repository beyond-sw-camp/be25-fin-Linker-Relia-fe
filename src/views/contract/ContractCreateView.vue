<template>
  <section class="contract-create-page">
    <PageBackLink label="계약 목록" @click="goToContractList" />

    <form class="contract-create-page__form" @submit.prevent="submitContract">
      <section class="contract-create-card">
        <header class="contract-create-card__header">
          <h3>1. 고객 정보 불러오기</h3>
        </header>
        <div class="contract-create-card__body">
          <div class="customer-search">
            <label>
              고객명 검색
              <input
                v-model.trim="customerSearchKeyword"
                type="text"
                placeholder="고객명"
                @keyup.enter="searchCustomers"
              />
            </label>
            <button
              type="button"
              class="contract-create-button contract-create-button--primary"
              :disabled="isCustomerSearchLoading"
              @click="searchCustomers"
            >
              {{ isCustomerSearchLoading ? '검색 중' : '검색' }}
            </button>
            <button
              type="button"
              class="contract-create-button contract-create-button--outline"
              :disabled="isCustomerSearchLoading"
              @click="resetCustomerSearch"
            >
              초기화
            </button>
          </div>

          <div class="customer-search-table">
            <table>
              <thead>
                <tr>
                  <th>고객명</th>
                  <th>생년월일</th>
                  <th>휴대폰 번호</th>
                  <th>고객 상태</th>
                  <th aria-label="고객 선택"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isCustomerSearchLoading">
                  <td colspan="5" class="contract-create-empty">
                    <v-progress-circular indeterminate color="#f97316" size="24" />
                  </td>
                </tr>
                <tr v-else-if="customerSearchError">
                  <td colspan="5" class="contract-create-empty contract-create-empty--error">
                    {{ customerSearchError }}
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="customer in customerRows"
                    :key="customer.customerId"
                    :class="{ 'is-selected': selectedCustomer?.customerId === customer.customerId }"
                  >
                    <td class="customer-search-table__strong">{{ customer.customerName }}</td>
                    <td>{{ formatDate(customer.birthDate) }}</td>
                    <td>{{ customer.phoneNumber }}</td>
                    <td>
                      <span class="contract-create-badge" :class="getCustomerStatusBadgeClass(customer.customerStatus)">
                        {{ getCustomerStatusLabel(customer.customerStatus) }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="customer-search-table__select"
                        :class="{ 'is-selected': selectedCustomer?.customerId === customer.customerId }"
                        @click="selectCustomer(customer)"
                      >
                        {{ selectedCustomer?.customerId === customer.customerId ? '선택됨' : '선택' }}
                      </button>
                    </td>
                  </tr>
                </template>
                <tr v-if="!isCustomerSearchLoading && !customerSearchError && customerRows.length === 0">
                  <td colspan="5" class="contract-create-empty">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!customerSearchError" class="customer-search-pagination">
            <span>{{ customerRangeLabel }}</span>
            <v-pagination
              :model-value="customerCurrentPage"
              :length="Math.max(customerTotalPages, 1)"
              total-visible="5"
              rounded="circle"
              :disabled="isCustomerSearchLoading"
              @update:model-value="changeCustomerPage"
            />
          </div>
        </div>
      </section>

      <section ref="selectedCustomerInfoSection" class="contract-create-card">
        <header class="contract-create-card__header">
          <h3>2. 불러온 고객 기본 정보</h3>
        </header>
        <div class="contract-create-card__body">
          <div v-if="selectedCustomer" class="customer-profile">
            <div>
              <span>고객명</span>
              <strong>{{ selectedCustomer.customerName }}</strong>
            </div>
            <div>
              <span>고객 상태</span>
              <strong>
                <span class="contract-create-badge" :class="getCustomerStatusBadgeClass(selectedCustomer.customerStatus)">
                  {{ getCustomerStatusLabel(selectedCustomer.customerStatus) }}
                </span>
              </strong>
            </div>
            <div>
              <span>성별 / 생년월일</span>
              <strong>{{ getGenderLabel(selectedCustomer.gender) }} / {{ formatDate(selectedCustomer.birthDate) }}</strong>
            </div>
            <div>
              <span>휴대폰 번호</span>
              <strong>{{ selectedCustomer.phoneNumber }}</strong>
            </div>
            <div>
              <span>이메일</span>
              <strong>{{ selectedCustomer.email }}</strong>
            </div>
            <div>
              <span>직업 / 직장명</span>
              <strong>{{ selectedCustomer.job }} / {{ selectedCustomer.companyName }}</strong>
            </div>
            <div class="customer-profile__wide">
              <span>주소</span>
              <strong>{{ selectedCustomer.address }}</strong>
            </div>
          </div>
          <div v-else class="contract-create-empty contract-create-empty--block"></div>
        </div>
      </section>

      <section class="contract-create-card">
        <header class="contract-create-card__header">
          <h3>3. 보험사 및 상품 정보</h3>
          <p>생명보험 전용</p>
        </header>
        <div class="contract-create-card__body">
          <div class="contract-create-grid contract-create-grid--three">
            <label class="contract-create-field">
              <span>보험사 <b>*</b></span>
              <v-select
                v-model="form.insuranceCompanyCode"
                :items="insuranceCompanyOptions"
                item-title="insuranceCompanyName"
                item-value="insuranceCompanyCode"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="isInsuranceCompaniesLoading"
                :disabled="isSubmitting"
              />
            </label>
            <label class="contract-create-field">
              <span>보종 <b>*</b></span>
              <v-select
                v-model="form.insuranceCategoryCode"
                :items="insuranceCategoryOptions"
                item-title="insuranceCategoryName"
                item-value="insuranceCategoryCode"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="isInsuranceCategoriesLoading"
                :disabled="isSubmitting"
              />
            </label>
            <label class="contract-create-field">
              <span>보험상품 <b>*</b></span>
              <v-select
                v-model="form.insuranceProductId"
                :items="insuranceProductOptions"
                item-title="insuranceProductName"
                item-value="insuranceProductId"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="isInsuranceProductsLoading"
                :disabled="!canLoadProducts || isSubmitting"
              />
            </label>
          </div>
          <p v-if="insuranceLoadError" class="contract-create-message contract-create-message--error">
            {{ insuranceLoadError }}
          </p>
        </div>
      </section>

      <section class="contract-create-card">
        <header class="contract-create-card__header">
          <h3>4. 계약 정보</h3>
        </header>
        <div class="contract-create-card__body">
          <div class="contract-create-grid contract-create-grid--two">
            <label class="contract-create-field">
              <span>계약 시작일 <b>*</b></span>
              <input v-model="form.contractStartDate" type="date" />
            </label>
            <label class="contract-create-field">
              <span>만기일 <b>*</b></span>
              <input v-model="form.contractEndDate" type="date" />
            </label>
            <label class="contract-create-field">
              <span>보장 시작일</span>
              <input v-model="form.coverageStartDate" type="date" />
            </label>
            <label class="contract-create-field">
              <span>보장 종료일</span>
              <input v-model="form.coverageEndDate" type="date" />
            </label>
          </div>

          <div class="contract-create-grid contract-create-grid--three">
            <label class="contract-create-field contract-create-field--suffix">
              <span>납입 기간 <b>*</b></span>
              <input v-model.number="form.paymentPeriodYears" type="number" min="1" />
              <em>년</em>
            </label>
            <label class="contract-create-field">
              <span>납입 주기 <b>*</b></span>
              <v-select
                v-model="form.paymentCycle"
                :items="paymentCycleOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="true"
              />
            </label>
            <label class="contract-create-field contract-create-field--suffix">
              <span>월 보험료 <b>*</b></span>
              <input v-model="form.monthlyPremium" type="text" inputmode="numeric" placeholder="120,000" />
              <em>원</em>
            </label>
          </div>

          <label class="contract-create-field">
            <span>보장 요약</span>
            <textarea
              v-model.trim="form.coverageSummary"
              rows="4"
              placeholder="보장 내용을 간략히 입력하세요 (예: 사망 시 1억 지급, 암 진단 시 3천만 원 지급 등)"
            ></textarea>
          </label>
        </div>
      </section>

      <p v-if="submitMessage" class="contract-create-message" :class="`contract-create-message--${submitMessageType}`">
        {{ submitMessage }}
      </p>

      <div class="contract-create-actions">
        <v-btn variant="outlined" class="contract-create-actions__cancel" :disabled="isSubmitting" @click="goToContractList">
          취소
        </v-btn>
        <v-btn class="contract-create-actions__submit" type="submit" :loading="isSubmitting">
          계약 등록
        </v-btn>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { createContract } from '../../api/contracts'
import { getCustomerDetail, getCustomers } from '../../api/customers'
import PageBackLink from '../../components/common/PageBackLink.vue'
import {
  getInsuranceCategories,
  getInsuranceCompanies,
  getInsuranceProducts,
} from '../../api/insurance'

const router = useRouter()

const customerSearchKeyword = ref('')
const customerRows = ref([])
const selectedCustomer = ref(null)
const selectedCustomerInfoSection = ref(null)
const isCustomerSearchLoading = ref(false)
const customerSearchError = ref('')
const customerCurrentPage = ref(1)
const customerPageSize = ref(5)
const customerTotalElements = ref(0)
const customerTotalPages = ref(0)

const insuranceCompanyOptions = ref([])
const insuranceCategoryOptions = ref([])
const insuranceProductOptions = ref([])
const isInsuranceCompaniesLoading = ref(false)
const isInsuranceCategoriesLoading = ref(false)
const isInsuranceProductsLoading = ref(false)
const insuranceLoadError = ref('')

const isSubmitting = ref(false)
const submitMessage = ref('')
const submitMessageType = ref('error')

const paymentCycleOptions = [{ label: '월납', value: 'MONTHLY' }]

const form = reactive({
  insuranceCompanyCode: '',
  insuranceCategoryCode: '',
  insuranceProductId: '',
  contractStartDate: '',
  contractEndDate: '',
  coverageStartDate: '',
  coverageEndDate: '',
  paymentPeriodYears: 20,
  paymentCycle: 'MONTHLY',
  monthlyPremium: '',
  coverageSummary: '',
})

const canLoadProducts = computed(() => Boolean(form.insuranceCompanyCode && form.insuranceCategoryCode))
const customerRangeLabel = computed(() => {
  if (customerTotalElements.value === 0) {
    return '총 0건'
  }

  const start = (customerCurrentPage.value - 1) * customerPageSize.value + 1
  const end = Math.min(customerCurrentPage.value * customerPageSize.value, customerTotalElements.value)

  return `총 ${customerTotalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건 표시`
})

watch(
  () => [form.insuranceCompanyCode, form.insuranceCategoryCode],
  async () => {
    form.insuranceProductId = ''
    insuranceProductOptions.value = []

    if (canLoadProducts.value) {
      await loadInsuranceProducts()
    }
  },
)

onMounted(() => {
  loadCustomers()
  loadInsuranceCompanies()
  loadInsuranceCategories()
})

async function searchCustomers() {
  customerCurrentPage.value = 1
  await loadCustomers()
}

async function changeCustomerPage(page) {
  customerCurrentPage.value = page
  await loadCustomers()
}

async function resetCustomerSearch() {
  customerSearchKeyword.value = ''
  selectedCustomer.value = null
  customerCurrentPage.value = 1
  await loadCustomers()
}

async function loadCustomers() {
  customerSearchError.value = ''
  isCustomerSearchLoading.value = true

  try {
    const params = {
      page: Math.max(customerCurrentPage.value, 1),
      size: customerPageSize.value,
    }
    const customerName = customerSearchKeyword.value.trim()

    if (customerName) {
      params.customerName = customerName
    }

    const response = await getCustomers(params)
    const pageResult = getCustomerPageResult(response?.result)
    const rows = Array.isArray(pageResult) ? pageResult : pageResult?.content

    customerRows.value = Array.isArray(rows) ? rows.map(normalizeCustomer) : []
    updateCustomerPageState(pageResult)
  } catch (error) {
    customerRows.value = []
    customerTotalElements.value = 0
    customerTotalPages.value = 0
    customerSearchError.value = getApiErrorMessage(error, '고객 목록을 불러오지 못했습니다.')
  } finally {
    isCustomerSearchLoading.value = false
  }
}

async function selectCustomer(customer) {
  const normalizedCustomer = normalizeCustomer(customer)
  selectedCustomer.value = normalizedCustomer
  scrollToSelectedCustomerInfo()

  try {
    const response = await getCustomerDetail(customer.customerId)
    const detail = response?.result?.customer ?? response?.result ?? response

    selectedCustomer.value = {
      ...normalizedCustomer,
      ...normalizeCustomer(detail),
      customerId: detail?.customerId ?? normalizedCustomer.customerId,
      customerName: detail?.customerName ?? normalizedCustomer.customerName,
    }
  } catch {
    // Keep the selected row data when the detail API fails.
  }
}

async function scrollToSelectedCustomerInfo() {
  await nextTick()

  selectedCustomerInfoSection.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function loadInsuranceCompanies() {
  insuranceLoadError.value = ''
  isInsuranceCompaniesLoading.value = true

  try {
    const response = await getInsuranceCompanies()
    insuranceCompanyOptions.value = Array.isArray(response?.result) ? response.result : []
  } catch (error) {
    insuranceCompanyOptions.value = []
    insuranceLoadError.value = getApiErrorMessage(error, '보험사 목록을 불러오지 못했습니다.')
  } finally {
    isInsuranceCompaniesLoading.value = false
  }
}

async function loadInsuranceCategories() {
  insuranceLoadError.value = ''
  isInsuranceCategoriesLoading.value = true

  try {
    const response = await getInsuranceCategories()
    insuranceCategoryOptions.value = Array.isArray(response?.result) ? response.result : []
  } catch (error) {
    insuranceCategoryOptions.value = []
    insuranceLoadError.value = getApiErrorMessage(error, '보종 목록을 불러오지 못했습니다.')
  } finally {
    isInsuranceCategoriesLoading.value = false
  }
}

async function loadInsuranceProducts() {
  insuranceLoadError.value = ''
  isInsuranceProductsLoading.value = true

  try {
    const response = await getInsuranceProducts({
      insuranceCompanyCode: form.insuranceCompanyCode,
      insuranceCategoryCode: form.insuranceCategoryCode,
    })

    insuranceProductOptions.value = Array.isArray(response?.result) ? response.result : []
  } catch (error) {
    insuranceProductOptions.value = []
    insuranceLoadError.value = getApiErrorMessage(error, '보험상품 목록을 불러오지 못했습니다.')
  } finally {
    isInsuranceProductsLoading.value = false
  }
}

async function submitContract() {
  submitMessage.value = ''
  submitMessageType.value = 'error'

  const validationMessage = validateForm()
  if (validationMessage) {
    submitMessage.value = validationMessage
    return
  }

  isSubmitting.value = true

  try {
    const payload = buildContractCreatePayload()
    await createContract(payload)

    submitMessageType.value = 'success'
    submitMessage.value = '계약 등록이 완료되었습니다.'
    window.setTimeout(() => {
      router.push({ name: 'fp-contracts' })
    }, 600)
  } catch (error) {
    submitMessage.value = getSubmitErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

function buildContractCreatePayload() {
  return {
    customerId: selectedCustomer.value.customerId,
    insuranceProductId: form.insuranceProductId,
    contractDate: getTodayDate(),
    contractStartDate: form.contractStartDate,
    contractEndDate: form.contractEndDate,
    coverageStartDate: form.coverageStartDate || null,
    coverageEndDate: form.coverageEndDate || null,
    paymentPeriodYears: Number(form.paymentPeriodYears),
    paymentCycle: 'MONTHLY',
    monthlyPremium: parseMoney(form.monthlyPremium),
    coverageSummary: form.coverageSummary || null,
  }
}

function validateForm() {
  if (!selectedCustomer.value) {
    return '고객을 선택해 주세요.'
  }

  if (!form.insuranceProductId) {
    return '보험상품을 선택해 주세요.'
  }

  if (!form.contractStartDate || !form.contractEndDate) {
    return '계약 시작일과 만기일을 입력해 주세요.'
  }

  if (form.contractStartDate > form.contractEndDate) {
    return '계약 시작일은 만기일보다 늦을 수 없습니다.'
  }

  if (form.coverageStartDate && form.coverageEndDate && form.coverageStartDate > form.coverageEndDate) {
    return '보장 시작일은 보장 종료일보다 늦을 수 없습니다.'
  }

  if (Number(form.paymentPeriodYears) < 1) {
    return '납입 기간은 1년 이상이어야 합니다.'
  }

  if (form.paymentCycle !== 'MONTHLY') {
    return '납입 주기는 월납만 선택할 수 있습니다.'
  }

  if (parseMoney(form.monthlyPremium) <= 0) {
    return '월 보험료는 0보다 커야 합니다.'
  }

  return ''
}

function getSubmitErrorMessage(error) {
  const status = error.response?.status
  const message = error.response?.data?.message

  if (message) {
    return message
  }

  if (status === 400) return '입력값을 확인해 주세요.'
  if (status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '계약 등록 권한이 없거나 담당 고객이 아닙니다.'
  if (status === 404) return '고객 또는 보험상품 정보를 찾을 수 없습니다.'
  if (status === 409) return '같은 고객과 보험상품에 대해 유지 또는 실효 계약이 이미 있습니다.'

  return error.message || '계약 등록에 실패했습니다.'
}

function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback
}

function getCustomerStatusLabel(status) {
  if (status === 'PROSPECT') return '잠재 고객'
  if (status === 'CONTRACTED') return '계약 고객'
  if (status === 'CLOSED') return '종료 고객'
  return status
}

function getGenderLabel(gender) {
  if (gender === 'MALE') return '남'
  if (gender === 'FEMALE') return '여'
  return gender || '-'
}

function getCustomerPageResult(result) {
  if (Array.isArray(result)) {
    return result
  }

  if (result?.customers) {
    return result.customers
  }

  return result ?? {}
}

function updateCustomerPageState(pageResult) {
  if (Array.isArray(pageResult)) {
    customerTotalElements.value = pageResult.length
    customerTotalPages.value = pageResult.length > 0 ? 1 : 0
    customerCurrentPage.value = 1
    return
  }

  const responsePage = pageResult?.page
  const responseNumber = pageResult?.number

  if (responsePage !== undefined && responsePage !== null) {
    customerCurrentPage.value = Number(responsePage)
  } else if (responseNumber !== undefined && responseNumber !== null) {
    customerCurrentPage.value = Number(responseNumber) + 1
  }

  customerPageSize.value = Number(pageResult?.size ?? customerPageSize.value)
  customerTotalElements.value = Number(pageResult?.totalElements ?? customerRows.value.length)
  customerTotalPages.value = Number(pageResult?.totalPages ?? (customerRows.value.length > 0 ? 1 : 0))
}

function normalizeCustomer(customer) {
  return {
    customerId: customer.customerId,
    customerName: customer.customerName,
    birthDate: customer.birthDate ?? customer.customerBirthDate,
    phoneNumber: customer.phoneNumber ?? customer.customerPhone,
    customerStatus: customer.customerStatus,
    gender: customer.gender ?? customer.customerGender,
    email: customer.email ?? customer.customerEmail ?? '-',
    job: customer.job ?? customer.customerJob ?? '-',
    companyName: customer.companyName ?? customer.customerCompanyName ?? '-',
    address: customer.address ?? customer.customerAddress ?? '-',
  }
}

function getCustomerStatusBadgeClass(status) {
  if (status === 'PROSPECT') return 'contract-create-badge--prospect'
  if (status === 'CONTRACTED') return 'contract-create-badge--contracted'
  if (status === 'CLOSED') return 'contract-create-badge--neutral'
  return 'contract-create-badge--neutral'
}

function formatDate(value) {
  return value ? value.replaceAll('-', '.') : '-'
}

function parseMoney(value) {
  return Number(String(value ?? '').replace(/[^\d]/g, ''))
}

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function goToContractList() {
  router.push({ name: 'fp-contracts' })
}
</script>

<style scoped>
.contract-create-page {
  display: grid;
  gap: 16px;
  color: #111827;
}

.contract-create-card__header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
}

.contract-create-page__form {
  display: grid;
  gap: 16px;
}

.contract-create-card {
  overflow: hidden;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.contract-create-card__header {
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
}

.contract-create-card__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.contract-create-card__body {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.customer-search {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.customer-search label,
.contract-create-field {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.customer-search input,
.contract-create-field input,
.contract-create-field textarea {
  width: 100%;
  border: 1px solid #d8dce3;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

.customer-search input,
.contract-create-field input {
  height: 34px;
  padding: 0 14px;
}

.customer-search input {
  width: 160px;
}

.customer-search input::placeholder {
  color: #64748b;
  font-size: 14px;
  opacity: 1;
}

.contract-create-field textarea {
  min-height: 84px;
  padding: 12px 14px;
  resize: vertical;
}

.customer-search input:focus,
.contract-create-field input:focus,
.contract-create-field textarea:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

.contract-create-button {
  width: auto;
  min-width: 55px;
  height: 34px;
  box-sizing: border-box;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  cursor: pointer;
}

.contract-create-button--primary {
  border: 1px solid rgba(249, 115, 22, 0.28);
  background: #fff7ed;
  color: #f97316;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.contract-create-button--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(249, 115, 22, 0.55);
  background: #ffedd5;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);
}

.contract-create-button--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.08);
}

.contract-create-actions__submit {
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
}

.contract-create-button--outline {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #64748b;
}

.contract-create-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.customer-search-table {
  overflow-x: auto;
  border: 1px solid #edf1f7;
  border-radius: 12px;
}

.customer-search-table table {
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;
}

.customer-search-table th,
.customer-search-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f7;
  color: #475569;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.customer-search-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.customer-search-table tr:last-child td {
  border-bottom: 0;
}

.customer-search-table tr.is-selected {
  background: #fff7ed;
}

.customer-search-table__strong {
  color: #111827;
  font-weight: 700;
}

.customer-search-table__select {
  min-width: 58px;
  height: 28px;
  border: 1px solid #f97316;
  border-radius: 8px;
  background: #ffffff;
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.customer-search-table__select.is-selected {
  border-color: transparent;
  background: transparent;
}

.customer-search-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 13px;
}

.customer-search-pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

.contract-create-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.contract-create-badge--prospect {
  background: #dbeafe;
  color: #2563eb;
}

.contract-create-badge--contracted {
  background: #dcfce7;
  color: #16a34a;
}

.contract-create-badge--terminated {
  background: #fee2e2;
  color: #dc2626;
}

.contract-create-badge--completed {
  background: #f5f3ff;
  color: #7c3aed;
}

.contract-create-badge--neutral {
  background: #f1f5f9;
  color: #64748b;
}

.customer-profile {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.customer-profile div {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.customer-profile span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.customer-profile strong {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.customer-profile__wide {
  grid-column: 1 / -1;
}

.contract-create-grid {
  display: grid;
  gap: 16px;
}

.contract-create-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.contract-create-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.contract-create-field b {
  color: #ef4444;
}

.contract-create-field--suffix {
  position: relative;
}

.contract-create-field--suffix input {
  padding-right: 46px;
}

.contract-create-field--suffix em {
  position: absolute;
  right: 14px;
  bottom: 10px;
  color: #64748b;
  font-size: 13px;
  font-style: normal;
}

.contract-create-empty {
  height: 88px;
  text-align: center;
  color: #94a3b8;
}

.contract-create-empty :deep(.v-progress-circular) {
  vertical-align: middle;
}

.contract-create-empty--error {
  color: #dc2626;
}

.contract-create-empty--block {
  height: 72px;
}

.contract-create-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.contract-create-message--error {
  background: #fef2f2;
  color: #dc2626;
}

.contract-create-message--success {
  background: #ecfdf5;
  color: #16a34a;
}

.contract-create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 2px 0 12px;
}

.contract-create-actions__cancel {
  min-width: 78px;
  min-height: 40px;
  border-color: #d8dce3;
  border-radius: 10px;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
}

.contract-create-actions__submit {
  min-width: 106px;
  min-height: 40px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
}

.contract-create-field :deep(.v-field) {
  border-radius: 10px;
  font-size: 13px;
}

@media (max-width: 960px) {
  .customer-search {
    display: grid;
    grid-template-columns: 1fr;
  }

  .customer-search input {
    width: 100%;
  }

  .customer-search-pagination {
    display: grid;
    grid-template-columns: 1fr;
  }

  .customer-profile,
  .contract-create-grid--two,
  .contract-create-grid--three {
    grid-template-columns: 1fr;
  }
}
</style>
