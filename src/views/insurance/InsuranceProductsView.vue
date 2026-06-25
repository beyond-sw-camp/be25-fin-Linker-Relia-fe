<template>
  <section class="insurance-products-page">
    <div class="insurance-products-page__breadcrumb">
      <span>보험 상품 관리</span>
      <span class="insurance-products-page__breadcrumb-separator">/</span>
      <strong>보험 상품 목록</strong>
    </div>

    <div class="insurance-products-page__header">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>

      <v-btn
        v-if="canManage"
        class="insurance-products-page__create-button"
        @click="handleRegisterClick"
      >
        + 보험 상품 등록
      </v-btn>
    </div>

    <div class="insurance-products-page__summary">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <div class="summary-card__content">
          <span class="summary-card__label">{{ card.label }}</span>
          <div class="summary-card__value">
            <strong>{{ card.value }}</strong>
            <span>개</span>
          </div>
          <p>{{ card.caption }}</p>
        </div>
      </article>
    </div>

    <section class="insurance-products-panel">
      <div class="insurance-products-page__toolbar">
        <div class="insurance-products-page__search-label">보험 상품 검색</div>
        <div class="insurance-products-page__filter-row">
          <div class="insurance-products-page__search-group">
            <v-text-field
              v-model="filters.keyword"
              placeholder="상품명을 입력하세요"
              variant="outlined"
              density="comfortable"
              hide-details
              class="insurance-products-page__name-filter"
              @keyup.enter="searchProducts"
            />

            <v-select
              v-model="filters.companyId"
              :items="companyOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="insurance-products-page__select-filter"
            />

            <v-select
              v-model="filters.categoryId"
              :items="categoryOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="insurance-products-page__select-filter"
            />

            <v-select
              v-model="filters.saleStatus"
              :items="saleStatusOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="insurance-products-page__status-filter"
            />

            <v-btn class="insurance-products-page__search-button" @click="searchProducts">
              <v-icon icon="mdi-magnify" size="16" start />
              검색
            </v-btn>

            <v-btn
              variant="outlined"
              class="insurance-products-page__reset-button"
              @click="resetFilters"
            >
              <v-icon icon="mdi-restore" size="16" start />
              초기화
            </v-btn>
          </div>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <div v-if="isLoading" class="insurance-products-panel__state">
        <v-progress-circular indeterminate color="#f97316" />
        <p>보험 상품 목록을 불러오는 중입니다.</p>
      </div>

      <template v-else-if="displayedProducts.length > 0">
        <div class="insurance-products-table">
          <table>
            <thead>
              <tr>
                <th>보험 상품명</th>
                <th>보험사</th>
                <th>보종</th>
                <th>상태</th>
                <th>출시일</th>
                <th>판매 종료일</th>
                <th>보장기간</th>
                <th>최대보장 나이</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in displayedProducts" :key="product.productId">
                <td>
                  <button
                    type="button"
                    class="insurance-products-table__name-button"
                    @click="goToProductDetail(product)"
                  >
                    {{ product.productName }}
                  </button>
                </td>
                <td>{{ product.insuranceCompanyName }}</td>
                <td>{{ product.categoryName }}</td>
                <td>
                  <span
                    class="insurance-products-table__status"
                    :class="getProductStatusClass(product.saleStatus)"
                  >
                    {{ getProductStatusLabel(product.saleStatus) }}
                  </span>
                </td>
                <td>{{ formatDate(product.saleStartDate) }}</td>
                <td :class="{ 'is-ended': product.saleEndDate }">
                  {{ formatDate(product.saleEndDate) }}
                </td>
                <td>{{ product.coveragePeriod }}</td>
                <td>{{ product.maxCoverageAge }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="insurance-products-page__pagination">
          <span>총 {{ displayedTotalElements.toLocaleString('ko-KR') }}건</span>
          <v-pagination
            :model-value="filters.page"
            :length="paginationLength"
            total-visible="7"
            rounded="circle"
            @update:model-value="changePage"
          />
        </div>
      </template>

      <div v-else class="insurance-products-panel__state">
        <p>조회된 보험 상품이 없습니다.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  getInsuranceCategories,
  getInsuranceCompanies,
  getInsuranceManagementProducts,
} from '../../api/insurance'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

defineProps({
  title: {
    type: String,
    default: '보험 상품 목록',
  },
  description: {
    type: String,
    default: '제휴 보험사의 보험 상품 정보를 조회할 수 있습니다.',
  },
})

const authStore = useAuthStore()
const router = useRouter()

const canManage = computed(() => authStore.userRole === USER_ROLES.SYSTEM_ADMIN)

const saleStatusOptions = [
  { label: '전체', value: 'ALL' },
  { label: '판매 중', value: 'ON_SALE' },
  { label: '판매 종료', value: 'SALE_ENDED' },
]

const filters = reactive({
  keyword: '',
  companyId: '',
  categoryId: '',
  saleStatus: 'ALL',
  page: 1,
  size: 10,
})

const companyOptions = ref([{ label: '전체 보험사', value: '' }])
const categoryOptions = ref([{ label: '전체 보종', value: '' }])
const productPage = ref(createEmptyPage())
const summaryCounts = ref({
  total: 0,
  onSale: 0,
  saleEnded: 0,
})
const isLoading = ref(false)
const errorMessage = ref('')

const displayedProducts = computed(() => productPage.value.content)
const displayedTotalElements = computed(() => productPage.value.totalElements)
const paginationLength = computed(() => Math.max(productPage.value.totalPages, 1))

const summaryCards = computed(() => [
  {
    label: '전체 보험 상품',
    value: formatCount(summaryCounts.value.total),
    caption: '등록된 전체 상품 수',
    accent: '#ea580c',
    tone: '#fff7ed',
    icon: 'mdi-cube-outline',
  },
  {
    label: '판매 중 상품',
    value: formatCount(summaryCounts.value.onSale),
    caption: '현재 판매 중인 상품',
    accent: '#2563eb',
    tone: '#eff6ff',
    icon: 'mdi-tag-outline',
  },
  {
    label: '판매 종료 상품',
    value: formatCount(summaryCounts.value.saleEnded),
    caption: '판매가 종료된 상품',
    accent: '#64748b',
    tone: '#f1f5f9',
    icon: 'mdi-calendar-remove-outline',
  },
])

onMounted(async () => {
  await Promise.all([loadCompanyOptions(), loadCategoryOptions()])
  await loadProducts()
})

async function loadCompanyOptions() {
  try {
    const response = await getInsuranceCompanies()
    const items = normalizeSelectOptions(extractApiPayload(response), {
      fallbackIdKeys: ['insuranceCompanyId', 'companyId', 'id'],
      fallbackLabelKeys: ['insuranceCompanyName', 'companyName', 'name'],
    })

    companyOptions.value = [{ label: '전체 보험사', value: '' }, ...items]
  } catch {
    companyOptions.value = [{ label: '전체 보험사', value: '' }]
  }
}

async function loadCategoryOptions() {
  try {
    const response = await getInsuranceCategories()
    const items = normalizeSelectOptions(extractApiPayload(response), {
      fallbackIdKeys: ['insuranceCategoryId', 'categoryId', 'id'],
      fallbackLabelKeys: ['insuranceCategoryName', 'categoryName', 'name'],
    })

    categoryOptions.value = [{ label: '전체 보종', value: '' }, ...items]
  } catch {
    categoryOptions.value = [{ label: '전체 보종', value: '' }]
  }
}

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [pageResponse, totalResponse, onSaleResponse, endedResponse] = await Promise.all([
      getInsuranceManagementProducts(buildProductQuery(filters.saleStatus, filters.page, filters.size)),
      getInsuranceManagementProducts(buildProductQuery('ALL', 1, 1)),
      getInsuranceManagementProducts(buildProductQuery('ON_SALE', 1, 1)),
      getInsuranceManagementProducts(buildProductQuery('SALE_ENDED', 1, 1)),
    ])

    productPage.value = normalizeProductPage(extractApiPayload(pageResponse), filters.size)
    summaryCounts.value = {
      total: normalizeProductPage(extractApiPayload(totalResponse), 1).totalElements,
      onSale: normalizeProductPage(extractApiPayload(onSaleResponse), 1).totalElements,
      saleEnded: normalizeProductPage(extractApiPayload(endedResponse), 1).totalElements,
    }
  } catch (error) {
    productPage.value = createEmptyPage(filters.size)
    summaryCounts.value = {
      total: 0,
      onSale: 0,
      saleEnded: 0,
    }
    errorMessage.value = getApiErrorMessage(error, '보험 상품 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function buildProductQuery(saleStatus, page, size) {
  return {
    page,
    size,
    insuranceCompanyId: filters.companyId || undefined,
    insuranceCategoryId: filters.categoryId || undefined,
    insuranceProductName: filters.keyword || undefined,
    saleStatus: saleStatus || 'ALL',
  }
}

function searchProducts() {
  filters.page = 1
  loadProducts()
}

function resetFilters() {
  filters.keyword = ''
  filters.companyId = ''
  filters.categoryId = ''
  filters.saleStatus = 'ALL'
  filters.page = 1
  loadProducts()
}

function changePage(page) {
  filters.page = page
  loadProducts()
}

function handleRegisterClick() {
  router.push({ name: 'insurance-product-create' })
}

function goToProductDetail(product) {
  router.push({
    name: 'insurance-product-detail',
    params: {
      insuranceProductId: product.productId,
    },
  })
}

function normalizeSelectOptions(payload, { fallbackIdKeys, fallbackLabelKeys }) {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload?.items)
        ? payload.items
        : []

  return source.map((item, index) => ({
    label: String(getFirstDefinedValue(item, fallbackLabelKeys) ?? `항목 ${index + 1}`),
    value: String(getFirstDefinedValue(item, fallbackIdKeys) ?? index),
  }))
}

function extractApiPayload(response) {
  return response?.data ?? response?.result ?? response
}

function normalizeProductPage(payload, defaultSize = 10) {
  const source = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload)
      ? payload
      : []

  const content = source.map((item, index) => ({
    productId: item.insuranceProductId ?? item.productId ?? `insurance-product-${index}`,
    productName: item.insuranceProductName ?? item.productName ?? '-',
    insuranceCompanyName: item.insuranceCompanyName ?? item.companyName ?? '-',
    categoryName: item.insuranceCategoryName ?? item.categoryName ?? '-',
    saleStartDate: item.insuranceStartDate ?? item.saleStartDate ?? item.launchDate ?? item.createdAt ?? null,
    saleEndDate: item.insuranceEndDate ?? item.saleEndDate ?? item.salesEndedAt ?? null,
    saleStatus: normalizeSaleStatus(
      item.saleStatus
        ?? item.insuranceProductStatus
        ?? inferSaleStatus(item.insuranceEndDate ?? item.saleEndDate ?? item.salesEndedAt ?? null),
    ),
    coveragePeriod: formatCoveragePeriod(
      item.coveragePeriodYears ?? item.coveragePeriod ?? item.coverageTerm,
    ),
    maxCoverageAge: formatAge(item.coverageAgeLimit ?? item.maxCoverageAge ?? item.maxAge),
  }))

  return {
    content,
    page: Number(payload?.page ?? 1),
    size: Number(payload?.size ?? defaultSize),
    totalElements: Number(payload?.totalElements ?? content.length),
    totalPages: Number(payload?.totalPages ?? 1),
  }
}

function getFirstDefinedValue(target, keys) {
  for (const key of keys) {
    if (target?.[key] !== undefined && target?.[key] !== null) {
      return target[key]
    }
  }

  return undefined
}

function createEmptyPage(size = 10) {
  return {
    content: [],
    page: 1,
    size,
    totalElements: 0,
    totalPages: 1,
  }
}

function inferSaleStatus(saleEndDate) {
  return saleEndDate ? 'SALE_ENDED' : 'ON_SALE'
}

function normalizeSaleStatus(status) {
  if (!status) return 'ALL'

  const normalized = String(status).toUpperCase()
  if (normalized === 'ENDED' || normalized === 'INACTIVE' || normalized === 'SALE_ENDED') {
    return 'SALE_ENDED'
  }
  if (normalized === 'ACTIVE' || normalized === 'ON_SALE') {
    return 'ON_SALE'
  }
  if (normalized === 'ALL') {
    return 'ALL'
  }

  return normalized
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
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

function formatCoveragePeriod(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string' && value.includes('년')) return value
  return `${value}년`
}

function getProductStatusLabel(status) {
  if (status === 'SALE_ENDED') return '비활성'
  if (status === 'ON_SALE') return '활성'
  return '-'
}

function getProductStatusClass(status) {
  if (status === 'SALE_ENDED') return 'insurance-products-table__status--inactive'
  if (status === 'ON_SALE') return 'insurance-products-table__status--active'
  return 'insurance-products-table__status--neutral'
}

function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage
}
</script>

<style scoped>
.insurance-products-page {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.insurance-products-page__breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.insurance-products-page__breadcrumb strong {
  color: #374151;
  font-weight: 700;
}

.insurance-products-page__breadcrumb-separator {
  color: #d1d5db;
}

.insurance-products-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.insurance-products-page__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  color: #111827;
  font-weight: 800;
}

.insurance-products-page__header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.insurance-products-page__create-button {
  min-width: 132px;
  height: 36px;
  background: #f97316;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: none;
  border-radius: 10px;
}

.insurance-products-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 96px;
  padding: 20px 22px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.summary-card__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  flex: 0 0 auto;
}

.summary-card__content {
  display: grid;
  gap: 2px;
}

.summary-card__label {
  color: #6b7280;
  font-size: 13px;
}

.summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-card__value strong {
  font-size: 20px;
  line-height: 1;
  color: #111827;
  font-weight: 800;
}

.summary-card__value span {
  color: #111827;
  font-size: 14px;
  font-weight: 700;
}

.summary-card__content p {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
}

.insurance-products-panel {
  padding: 0;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  min-width: 0;
  overflow: hidden;
}

.insurance-products-page__toolbar {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 18px 20px 16px;
  border-bottom: 1px solid #eef2f7;
}

.insurance-products-page__search-label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}

.insurance-products-page__filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  flex-wrap: wrap;
}

.insurance-products-page__search-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  flex-wrap: wrap;
  min-width: 0;
}

.insurance-products-page__name-filter {
  width: 188px;
  max-width: 100%;
  flex: 0 1 188px;
}

.insurance-products-page__select-filter {
  width: 148px;
  max-width: 100%;
  flex: 0 0 148px;
}

.insurance-products-page__status-filter {
  width: 128px;
  max-width: 100%;
  flex: 0 0 128px;
}

.insurance-products-page__search-button {
  height: 36px;
  border-radius: 10px;
  background: #f97316;
  color: #ffffff;
  padding: 0 16px;
  box-shadow: none;
}

.insurance-products-page__reset-button {
  height: 36px;
  border-radius: 10px;
  border-color: #d1d5db;
  color: #475569;
  padding: 0 16px;
  box-shadow: none;
}

.insurance-products-panel__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 260px;
  color: #64748b;
  padding: 20px;
}

.insurance-products-table {
  overflow-x: auto;
  min-width: 0;
}

.insurance-products-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.insurance-products-table th,
.insurance-products-table td {
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  text-align: left;
  color: #475569;
}

.insurance-products-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.insurance-products-table__name-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #f97316;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-align: left;
}

.insurance-products-table__name-button:hover {
  color: #ea580c;
  text-decoration: underline;
}

.insurance-products-table__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.insurance-products-table__status--active {
  background: #dcfce7;
  color: #16a34a;
}

.insurance-products-table__status--inactive {
  background: #f1f5f9;
  color: #64748b;
}

.insurance-products-table__status--neutral {
  background: #f8fafc;
  color: #94a3b8;
}

.insurance-products-table td.is-ended {
  color: #ef4444;
}

.insurance-products-page__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px 16px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .insurance-products-page__header,
  .insurance-products-page__pagination {
    display: grid;
    grid-template-columns: 1fr;
  }

  .insurance-products-page__filter-row {
    display: grid;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .insurance-products-page__summary {
    grid-template-columns: 1fr;
  }

  .insurance-products-page__search-group {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }

  .insurance-products-page__name-filter,
  .insurance-products-page__select-filter,
  .insurance-products-page__status-filter {
    width: 100%;
    flex: 1 1 auto;
  }

  .insurance-products-page__search-button,
  .insurance-products-page__reset-button {
    align-self: flex-start;
  }
}
</style>
