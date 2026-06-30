<template>
  <section class="commission-page">
    <div class="commission-page__hero">
      <div>
        <p class="commission-page__eyebrow">Commission Overview</p>
        <h2>수수료 관리</h2>
        <p class="commission-page__description">
          로그인한 설계사의 월별 수수료 흐름과 보험사별 기여도를 동일한 패턴으로 조회할 수 있습니다.
        </p>
      </div>

      <div class="commission-page__toolbar">
        <v-text-field
          v-model="filters.closingMonth"
          type="month"
          label="정산 월"
          variant="outlined"
          density="comfortable"
          hide-details
          :max="latestAvailableClosingMonth"
          class="commission-page__month-field"
        />
        <v-btn variant="outlined" class="commission-page__reset-button" @click="resetFilters">
          초기화
        </v-btn>
        <v-btn
          color="#f97316"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          class="commission-page__pdf-button"
          :loading="isPdfLoading"
          :disabled="Boolean(validationMessage)"
          @click="openMyStatementPdf"
        >
          PDF 명세서
        </v-btn>
      </div>
    </div>

    <v-alert v-if="validationMessage" type="warning" variant="tonal" density="comfortable">
      {{ validationMessage }}
    </v-alert>

    <div class="commission-summary">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <p class="summary-card__label">{{ card.label }}</p>
        <strong class="summary-card__value" :class="card.valueClass">{{ card.value }}</strong>
        <p class="summary-card__caption">{{ card.caption }}</p>
      </article>
    </div>

    <div class="commission-layout commission-layout--top">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>보험사별 수수료 기여도 Top5</h3>
            <p>상위 5개 보험사의 총 수수료 규모를 비교합니다.</p>
          </div>
          <span class="panel__chip">{{ closingMonthLabel }}</span>
        </div>

        <div v-if="isInsuranceCompanyLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>보험사별 수수료 데이터를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="insuranceCompanyErrorMessage" class="panel__state panel__state--error">
          <p>{{ insuranceCompanyErrorMessage }}</p>
        </div>
        <div v-else-if="insuranceCompanyItems.length === 0" class="panel__state">
          <p>보험사별 수수료 데이터가 없습니다.</p>
        </div>
        <div v-else class="insurance-overview">
          <div class="insurance-overview__chart-card">
            <div class="company-panel__chart">
              <Bar :data="companyChartData" :options="companyChartOptions" />
            </div>
            <div class="insurance-overview__chart-caption">
              <strong>보험사별 총 수수료 기여도를 상위 5개 기준으로 비교합니다.</strong>
            </div>
          </div>

          <div class="insurance-overview__list">
            <article
              v-for="item in topInsuranceCompanyItems"
              :key="item.name"
              class="insurance-company-row"
            >
              <div class="insurance-company-row__main">
                <div class="insurance-company-row__title">
                  <span class="insurance-company-row__dot" :style="{ backgroundColor: item.color }" />
                  <strong>{{ item.name }}</strong>
                </div>
                <div class="insurance-company-row__details">
                  <span>계약 건수 {{ formatCount(item.contractCount) }}건</span>
                </div>
              </div>
              <div class="insurance-company-row__metrics">
                <strong>{{ formatCurrency(item.totalCommissionAmount) }}</strong>
                <span>수수료 비중 {{ formatPercent(item.ratio) }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>보험 상품 판매 순위</h3>
            <p>마감월 기준 판매 건수와 월납 보험료 합계에 따른 상품별 순위를 나타냅니다.</p>
          </div>
        </div>

        <div v-if="isProductRankingLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>보험 상품 판매 순위를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="productRankingErrorMessage" class="panel__state panel__state--error">
          <p>{{ productRankingErrorMessage }}</p>
        </div>
        <div v-else-if="productRankingItems.length === 0" class="panel__state">
          <p>보험 상품 판매 순위 데이터가 없습니다.</p>
        </div>
        <div v-else class="product-ranking-panel">
          <div class="table-panel table-panel--product-ranking">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>상품명</th>
                  <th>보험사</th>
                  <th>보종</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in productRankingItems" :key="item.insuranceProductId || item.rank">
                  <td>{{ item.rank }}</td>
                  <td>
                    <strong>{{ item.insuranceProductName }}</strong>
                  </td>
                  <td>{{ item.insuranceCompanyName }}</td>
                  <td>{{ item.insuranceCategoryName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

  </section>
</template>

<script setup>
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'

import {
  getCommissionInsuranceCompanySummary,
  getCommissionPaymentTypeSummary,
  getFpCommissionSummary,
  getMyCommissionStatementPdf,
} from '../../api/commissions'
import { getDashboardInsuranceProductRankings } from '../../api/dashboard'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PAYMENT_TYPE_CONFIG = [
  { label: '초회 수수료', color: '#f97316', keys: ['firstCommissionAmount', 'initialCommissionAmount'] },
  { label: '유지 수수료', color: '#2563eb', keys: ['renewalCommissionAmount', 'maintenanceCommissionAmount'] },
  { label: '환수 금액', color: '#ef4444', keys: ['clawbackAmount', 'recoveryAmount', 'refundAmount'] },
]

const COMPANY_COLORS = ['#f97316', '#2563eb', '#22c55e', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#64748b']

const filters = reactive({
  closingMonth: getLatestAvailableClosingMonth(),
})

const validationMessage = ref('')
const summary = ref(createEmptyFpSummary())
const paymentTypeItems = ref([])
const insuranceCompanyItems = ref([])
const productRankingItems = ref([])

const isSummaryLoading = ref(false)
const isPaymentTypeLoading = ref(false)
const isInsuranceCompanyLoading = ref(false)
const isProductRankingLoading = ref(false)
const isPdfLoading = ref(false)

const summaryErrorMessage = ref('')
const paymentTypeErrorMessage = ref('')
const insuranceCompanyErrorMessage = ref('')
const productRankingErrorMessage = ref('')

const latestAvailableClosingMonth = computed(() => getLatestAvailableClosingMonth())
const closingMonthLabel = computed(() => formatMonthLabel(filters.closingMonth))

const summaryCards = computed(() => [
  {
    label: '총 지급 수수료',
    value: formatCurrency(summary.value.totalPaymentCommissionAmount),
    caption: summaryErrorMessage.value || '당월 설계사 지급 총액',
    accent: '#f97316',
    tone: '#fff3e8',
    icon: 'mdi-cash-multiple',
  },
  {
    label: '실수령 수수료',
    value: formatCurrency(summary.value.netCommissionAmount),
    caption: '환수 반영 후 당월 실제 수령 수수료',
    accent: '#2563eb',
    tone: '#eff6ff',
    icon: 'mdi-finance',
  },
  {
    label: '전월 대비 증감률',
    value: formatComparisonRate(summary.value.comparisonRate),
    caption:
      summary.value.previousNetCommissionAmount === null
        ? '전월 비교 데이터 없음'
        : `전월 ${formatCurrency(summary.value.previousNetCommissionAmount)}`,
    accent: '#16a34a',
    tone: '#ecfdf3',
    icon: 'mdi-trending-up',
    valueClass: getComparisonRateClass(summary.value.comparisonRate),
  },
  {
    label: '환수 예정 수수료',
    value: formatCurrency(summary.value.clawbackAmount),
    caption: `환수 계약 ${formatCount(summary.value.clawbackContractCount)}건`,
    accent: '#ef4444',
    tone: '#fff1f2',
    icon: 'mdi-cash-remove',
    valueClass: 'summary-card__value--danger',
  },
  {
    label: '초회 지급 수수료',
    value: formatCurrency(summary.value.initialPaymentAmount),
    caption: '당월 초회 지급 기준 수수료',
    accent: '#7c3aed',
    tone: '#f5f3ff',
    icon: 'mdi-cash-plus',
  },
  {
    label: '유지 지급 수수료',
    value: formatCurrency(summary.value.maintenancePaymentAmount),
    caption: '당월 유지 지급 기준 수수료',
    accent: '#0ea5a4',
    tone: '#ecfeff',
    icon: 'mdi-chart-line',
  },
])

const topInsuranceCompanyItems = computed(() => insuranceCompanyItems.value.slice(0, 5))

const companyChartData = computed(() => ({
  labels: topInsuranceCompanyItems.value.map((item) => item.name),
  datasets: [
    {
      data: topInsuranceCompanyItems.value.map((item) => item.totalCommissionAmount),
      backgroundColor: topInsuranceCompanyItems.value.map((item) => item.color),
      borderRadius: 999,
      borderSkipped: false,
      barThickness: 18,
      maxBarThickness: 18,
    },
  ],
}))

const paymentTypeChartData = computed(() => ({
  labels: paymentTypeItems.value.map((item) => item.label),
  datasets: [
    {
      data: paymentTypeItems.value.map((item) => item.amount),
      backgroundColor: paymentTypeItems.value.map((item) => item.color),
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 6,
      cutout: '68%',
    },
  ],
}))

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
}))

const companyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 8,
      right: 8,
      top: 8,
      bottom: 0,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.label}: ${formatCurrency(context.raw)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#475569',
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
        font: {
          size: 11,
          weight: '600',
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(226, 232, 240, 0.7)',
        drawBorder: false,
      },
      ticks: {
        color: '#475569',
        callback(value) {
          const numericValue = Number(value)
          if (!Number.isFinite(numericValue) || numericValue === 0) {
            return ''
          }

          return `${Math.round(numericValue / 1000000)}M`
        },
        font: {
          size: 10,
        },
      },
    },
  },
}))

onMounted(() => {
  loadDashboard()
})

watch(
  () => filters.closingMonth,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    if (!isValidClosingMonth(value)) {
      validationMessage.value = '정산 월은 YYYY-MM 형식으로 입력해주세요.'
      return
    }

    if (value > latestAvailableClosingMonth.value) {
      filters.closingMonth = latestAvailableClosingMonth.value
      return
    }

    loadDashboard()
  },
)

async function loadDashboard() {
  validationMessage.value = ''

  if (!isValidClosingMonth(filters.closingMonth)) {
    validationMessage.value = '정산 월은 YYYY-MM 형식으로 입력해주세요.'
    return
  }

  if (filters.closingMonth > latestAvailableClosingMonth.value) {
    validationMessage.value = `정산 월은 ${latestAvailableClosingMonth.value}까지만 조회할 수 있습니다.`
    filters.closingMonth = latestAvailableClosingMonth.value
    return
  }

  await Promise.all([loadSummary(), loadProductRankings(), loadInsuranceCompanies()])
}

function resetFilters() {
  filters.closingMonth = latestAvailableClosingMonth.value
}

async function openMyStatementPdf() {
  validationMessage.value = ''

  if (!isValidClosingMonth(filters.closingMonth)) {
    validationMessage.value = '정산 월은 YYYY-MM 형식으로 입력해주세요.'
    return
  }

  isPdfLoading.value = true

  try {
    const blob = await getMyCommissionStatementPdf({
      closingMonth: filters.closingMonth,
    })
    openPdfBlob(blob)
  } catch (error) {
    validationMessage.value =
      error.response?.data?.message ||
      error.message ||
      '수수료 명세서 PDF를 열지 못했습니다.'
  } finally {
    isPdfLoading.value = false
  }
}

function openPdfBlob(blob) {
  const pdfBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(pdfBlob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}

async function loadSummary() {
  summaryErrorMessage.value = ''
  isSummaryLoading.value = true

  try {
    const response = await getFpCommissionSummary({
      closingMonth: filters.closingMonth,
    })

    summary.value = normalizeFpSummary(response?.result)
  } catch (error) {
    summary.value = createEmptyFpSummary()
    summaryErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '수수료 요약을 불러오지 못했습니다.'
  } finally {
    isSummaryLoading.value = false
  }
}

async function loadPaymentTypes() {
  paymentTypeErrorMessage.value = ''
  isPaymentTypeLoading.value = true

  try {
    const response = await getCommissionPaymentTypeSummary({
      closingMonth: filters.closingMonth,
    })

    paymentTypeItems.value = normalizePaymentTypeItems(response?.result)
  } catch (error) {
    paymentTypeItems.value = []
    paymentTypeErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지급 구분 요약을 불러오지 못했습니다.'
  } finally {
    isPaymentTypeLoading.value = false
  }
}

async function loadProductRankings() {
  productRankingErrorMessage.value = ''
  isProductRankingLoading.value = true

  try {
    const response = await getDashboardInsuranceProductRankings({
      closingMonth: filters.closingMonth,
      limit: 10,
    })

    productRankingItems.value = normalizeProductRankingItems(response?.result)
  } catch (error) {
    productRankingItems.value = []
    productRankingErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '보험 상품 판매 순위를 불러오지 못했습니다.'
  } finally {
    isProductRankingLoading.value = false
  }
}

async function loadInsuranceCompanies() {
  insuranceCompanyErrorMessage.value = ''
  isInsuranceCompanyLoading.value = true

  try {
    const response = await getCommissionInsuranceCompanySummary({
      closingMonth: filters.closingMonth,
    })

    insuranceCompanyItems.value = normalizeInsuranceCompanyItems(response?.result)
  } catch (error) {
    insuranceCompanyItems.value = []
    insuranceCompanyErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '보험사별 수수료 현황을 불러오지 못했습니다.'
  } finally {
    isInsuranceCompanyLoading.value = false
  }
}

function normalizeFpSummary(result) {
  const comparison = result?.comparison ?? {}

  return {
    totalPaymentCommissionAmount: toNumber(
      getValue(result, [
        'totalPaymentCommissionAmount',
        'totalCommissionAmount',
        'paymentCommissionAmount',
        'totalPaidCommissionAmount',
        'totalPaymentAmount',
      ]),
    ),
    initialPaymentAmount: toNumber(
      getValue(result, [
        'totalInitialPaymentAmount',
        'initialPaymentAmount',
        'totalInitialAmount',
      ]),
    ),
    maintenancePaymentAmount: toNumber(
      getValue(result, [
        'totalMaintenancePaymentAmount',
        'maintenancePaymentAmount',
        'totalMaintenanceAmount',
      ]),
    ),
    clawbackAmount: toNumber(
      getValue(result, [
        'clawbackAmount',
        'recoveryAmount',
        'refundAmount',
        'totalRecoveryCollectionAmount',
        'totalRecoveryAmount',
      ]),
    ),
    netCommissionAmount: toNumber(getValue(result, ['netCommissionAmount', 'netAmount'])),
    contractCount: toNumber(getValue(result, ['contractCount', 'totalContractCount'])),
    clawbackContractCount: toNumber(
      getValue(result, ['clawbackContractCount', 'recoveryContractCount']),
    ),
    previousNetCommissionAmount: toNullableNumber(
      getValue(comparison, ['previousNetCommissionAmount', 'previousAmount']),
    ),
    comparisonRate: toNullableNumber(
      getValue(comparison, ['growthRate', 'comparisonRate', 'monthOverMonthRate']) ??
        getValue(result, ['comparisonRate', 'monthOverMonthRate']),
    ),
  }
}

function normalizePaymentTypeItems(result) {
  const itemList = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : []
  const source = itemList.length > 0 ? collapsePaymentTypeArray(itemList) : result ?? {}
  const rawItems = PAYMENT_TYPE_CONFIG.map((config) => ({
    label: config.label,
    color: config.color,
    amount: toNumber(getValue(source, config.keys)),
  }))

  const totalAmount = rawItems.reduce((sum, item) => sum + item.amount, 0)

  return rawItems
    .filter((item) => item.amount > 0 || totalAmount > 0)
    .map((item) => ({
      ...item,
      ratio: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }))
}

function normalizeInsuranceCompanyItems(result) {
  const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : []

  const normalized = items.map((item, index) => {
    const initialAmount = toNumber(
      getValue(item, ['firstCommissionAmount', 'initialCommissionAmount', 'totalInitialAmount']),
    )
    const maintenanceAmount = toNumber(
      getValue(item, [
        'renewalCommissionAmount',
        'maintenanceCommissionAmount',
        'totalMaintenanceAmount',
        'totalMaintenanceCommissionAmount',
      ]),
    )
    const totalCommissionAmount = initialAmount + maintenanceAmount

    return {
      name: getValue(item, ['insuranceCompanyName', 'companyName']) || '-',
      totalCommissionAmount,
      paymentAmount: toNumber(
        getValue(item, [
          'totalPaymentCommissionAmount',
          'totalPaymentAmount',
          'paymentAmount',
        ]),
      ),
      clawbackAmount: toNumber(
        getValue(item, ['clawbackAmount', 'recoveryAmount', 'refundAmount', 'totalRecoveryAmount']),
      ),
      contractCount: toNumber(getValue(item, ['contractCount', 'totalContractCount', 'contractCnt'])),
      ratio: 0,
      color: COMPANY_COLORS[index % COMPANY_COLORS.length],
    }
  })

  const totalAmount = normalized.reduce((sum, item) => sum + item.totalCommissionAmount, 0)

  return normalized
    .map((item) => ({
      ...item,
      ratio: totalAmount > 0 ? (item.totalCommissionAmount / totalAmount) * 100 : 0,
    }))
    .sort((left, right) => right.totalCommissionAmount - left.totalCommissionAmount)
}

function normalizeProductRankingItems(result) {
  const items = Array.isArray(result?.rankings)
    ? result.rankings
    : Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result)
        ? result
        : []

  return items.map((item, index) => ({
    rank: toNumber(getValue(item, ['rank', 'ranking'])) || index + 1,
    insuranceProductId: getValue(item, ['insuranceProductId', 'productId']) ?? '',
    insuranceProductCode: getValue(item, ['insuranceProductCode', 'productCode']) || '-',
    insuranceProductName: getValue(item, ['insuranceProductName', 'productName']) || '-',
    insuranceCompanyName: getValue(item, ['insuranceCompanyName', 'companyName']) || '-',
    insuranceCategoryName: getValue(item, ['insuranceCategoryName', 'categoryName']) || '-',
    contractCount: toNumber(getValue(item, ['contractCount', 'totalContractCount', 'contractCnt'])),
    totalMonthlyPremiumAmount: toNumber(
      getValue(item, ['totalMonthlyPremiumAmount', 'monthlyPremiumAmount', 'totalPremiumAmount']),
    ),
  }))
}

function collapsePaymentTypeArray(items) {
  return items.reduce((accumulator, item) => {
    const type = String(getValue(item, ['paymentType', 'type', 'category']) || '').toUpperCase()
    const amount = toNumber(getValue(item, ['amount', 'commissionAmount', 'totalAmount']))

    if (type.includes('FIRST') || type.includes('INITIAL')) {
      accumulator.firstCommissionAmount = amount
    }

    if (type.includes('RENEW') || type.includes('MAINT')) {
      accumulator.renewalCommissionAmount = amount
    }

    if (type.includes('CLAW') || type.includes('RECOVERY') || type.includes('REFUND')) {
      accumulator.clawbackAmount = amount
    }

    return accumulator
  }, {})
}

function createEmptyFpSummary() {
  return {
    totalPaymentCommissionAmount: 0,
    initialPaymentAmount: 0,
    maintenancePaymentAmount: 0,
    clawbackAmount: 0,
    netCommissionAmount: 0,
    contractCount: 0,
    clawbackContractCount: 0,
    previousNetCommissionAmount: null,
    comparisonRate: null,
  }
}

function getValue(source, keys) {
  if (!source || typeof source !== 'object') {
    return undefined
  }

  const matchedKey = keys.find((key) => source[key] !== undefined && source[key] !== null)
  return matchedKey ? source[matchedKey] : undefined
}

function toNumber(value) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatPercent(value) {
  const number = Number(value ?? 0)

  return `${number.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatComparisonRate(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const number = Number(value)
  const prefix = number > 0 ? '+' : ''

  return `${prefix}${number.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatMonthLabel(value) {
  if (!value) {
    return '-'
  }

  const [year, month] = String(value).split('-')
  return `${year}년 ${month}월`
}

function getComparisonRateClass(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (Number(value) > 0) {
    return 'summary-card__value--success'
  }

  if (Number(value) < 0) {
    return 'summary-card__value--danger'
  }

  return ''
}

function isValidClosingMonth(value) {
  return /^\d{4}-\d{2}$/.test(String(value ?? ''))
}

function getCurrentMonth() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getLatestAvailableClosingMonth() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
</script>

<style scoped>
.commission-page {
  display: grid;
  gap: 20px;
}

.commission-page__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.commission-page__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f97316;
}

.commission-page h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  color: #111827;
}

.commission-page__description {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
}

.commission-page__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.commission-page__month-field {
  width: 180px;
}

.commission-page__reset-button {
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  border-color: #d1d5db;
  color: #475569;
}

.commission-page__pdf-button {
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  box-shadow: none;
}

.commission-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
  border: 1px solid #ebeef4;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.summary-card__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  margin-bottom: 14px;
}

.summary-card__label,
.summary-card__caption {
  margin: 0;
  color: #6b7280;
}

.summary-card__label {
  font-size: 13px;
  font-weight: 700;
}

.summary-card__value {
  display: block;
  margin-top: 10px;
  font-size: 30px;
  line-height: 1.08;
  color: #111827;
}

.summary-card__value--success {
  color: #65a30d;
}

.summary-card__value--danger {
  color: #ef4444;
}

.summary-card__caption {
  margin-top: 8px;
  font-size: 12px;
}

.commission-layout {
  display: grid;
  gap: 18px;
}

.commission-layout--top {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel {
  padding: 22px 24px;
  border: 1px solid #edf1f7;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.panel__header h3 {
  margin: 0;
  font-size: 17px;
  color: #111827;
}

.panel__header p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.panel__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 12px;
  font-weight: 700;
}

.panel__state {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #64748b;
  text-align: center;
}

.panel__state p {
  margin: 0;
}

.panel__state--error {
  color: #dc2626;
}

.insurance-overview {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
}

.insurance-overview__chart-card {
  display: grid;
  gap: 14px;
  align-self: center;
  padding: 18px;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.insurance-overview__chart-caption {
  padding-top: 4px;
  border-top: 1px solid rgba(226, 232, 240, 0.7);
}

.insurance-overview__chart-caption strong {
  display: block;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
  text-align: center;
}

.insurance-overview__list {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.payment-type-panel {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  align-items: center;
  min-height: 100%;
}

.payment-type-panel__visual {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.07), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.company-panel__chart,
.payment-type-panel__chart {
  position: relative;
  height: 220px;
}

.insurance-overview .company-panel__chart {
  height: 248px;
}

.payment-type-panel__summary {
  display: grid;
  gap: 4px;
  justify-items: center;
  text-align: center;
}

.payment-type-panel__summary strong {
  color: #0f172a;
  font-size: 28px;
  line-height: 1.1;
}

.payment-type-panel__summary span {
  color: #94a3b8;
  font-size: 12px;
}

.payment-type-panel__legend {
  display: grid;
  gap: 14px;
  width: 100%;
}

.product-ranking-panel {
  display: grid;
  gap: 14px;
}

.table-panel {
  overflow-x: auto;
  border: 1px solid #edf2f7;
  border-radius: 16px;
}

.table-panel table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.table-panel th,
.table-panel td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.table-panel th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.table-panel td strong,
.table-panel td span {
  display: block;
}

.table-panel td strong {
  color: #111827;
  font-weight: 800;
}

.table-panel td span {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 11px;
}

.table-panel tbody tr:last-child td {
  border-bottom: 0;
}

.table-panel--product-ranking {
  overflow-x: visible;
}

.table-panel--product-ranking table {
  min-width: 0;
  table-layout: fixed;
}

.table-panel--product-ranking th:first-child,
.table-panel--product-ranking td:first-child {
  width: 64px;
  white-space: nowrap;
}

.table-panel--product-ranking th,
.table-panel--product-ranking td {
  white-space: normal;
}

.table-panel--product-ranking td {
  word-break: keep-all;
}

.table-panel--product-ranking td strong {
  overflow-wrap: anywhere;
}

.insurance-company-row,
.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  background: #ffffff;
}

.insurance-company-row__main {
  min-width: 0;
}

.insurance-company-row__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
}

.insurance-company-row__dot,
.legend-row__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.insurance-company-row__details {
  display: grid;
  gap: 4px;
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.insurance-company-row__metrics {
  display: grid;
  justify-items: end;
  gap: 6px;
  flex-shrink: 0;
}

.insurance-company-row__metrics strong {
  color: #0f172a;
  font-size: 15px;
}

.insurance-company-row__metrics span {
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.legend-row__label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  min-width: 0;
}

.legend-row__label strong {
  white-space: nowrap;
}

.legend-row__metrics {
  display: flex;
  align-items: baseline;
  gap: 14px;
  color: #64748b;
  flex-shrink: 0;
}

.legend-row__metrics strong {
  color: #111827;
}

@media (max-width: 1200px) {
  .commission-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .commission-layout--top,
  .insurance-overview,
  .payment-type-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .commission-page__hero,
  .commission-page__toolbar {
    display: grid;
    grid-template-columns: 1fr;
  }

  .commission-page__month-field {
    width: 100%;
  }

  .commission-summary {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }
}
</style>
