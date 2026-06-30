<template>
  <section class="commission-page">
    <div class="commission-page__hero">
      <div>
        <p class="commission-page__eyebrow">{{ heroEyebrow }}</p>
        <h2>{{ pageHeading }}</h2>
        <p class="commission-page__description">{{ pageDescription }}</p>
      </div>

      <div class="commission-page__toolbar">
        <v-select
          v-if="props.scope === 'hq'"
          v-model="filters.organizationCode"
          :items="branches"
          item-title="title"
          item-value="value"
          label="지점 선택"
          variant="outlined"
          density="comfortable"
          hide-details
          :loading="isLoadingBranches"
          class="commission-page__organization-filter"
        />
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
          최근 정산월
        </v-btn>
        <v-btn
          color="#f97316"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          class="commission-page__pdf-button"
          :loading="isPdfLoading"
          :disabled="Boolean(validationMessage)"
          @click="openStatementPdf"
        >
          PDF 명세서
        </v-btn>
      </div>
    </div>

    <v-alert v-if="branchErrorMessage" type="warning" variant="tonal" density="comfortable">
      {{ branchErrorMessage }}
    </v-alert>
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
            <p>상위 5개 보험사의 총 수수료 규모와 구성 정보를 비교합니다.</p>
          </div>
          <span class="panel__chip">{{ closingMonthLabel }}</span>
        </div>

        <div v-if="isInsuranceCompanyLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>마감 기준월 보험사 현황을 불러오는 중입니다.</p>
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
          </div>

          <div class="insurance-overview__list">
            <article
              v-for="item in topInsuranceCompanyItems"
              :key="item.name"
              class="insurance-company-row"
            >
              <div class="insurance-company-row__main">
                <div class="insurance-company-row__title">
                  <span
                    class="insurance-company-row__dot"
                    :style="{ backgroundColor: item.color }"
                  />
                  <strong :title="item.name">{{ formatCompanyDisplayName(item.name) }}</strong>
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
      <section class="panel panel--compact">
        <div class="panel__header">
          <div>
            <h3>보험 상품 판매 순위 {{ productRankingTitleSuffix }}</h3>
            <p>마감월 기준 판매 건수를 기준으로 상품별 순위를 나타냅니다.</p>
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
                  <th>계약 수</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in productRankingItems" :key="item.insuranceProductId || item.rank">
                  <td>{{ item.rank }}</td>
                  <td>
                    <strong>{{ item.insuranceProductName }}</strong>
                  </td>
                  <td>{{ item.insuranceCompanyName }}</td>
                  <td>{{ formatCount(item.contractCount) }}건</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div class="commission-layout commission-layout--bottom">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>설계사별 월 수수료 현황</h3>
            <p>설계사별 월 수수료 지급 및 환수 현황을 서버 페이지네이션 기준으로 조회합니다.</p>
          </div>
        </div>

        <div v-if="isFpListLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>설계사별 월 수수료 현황을 불러오는 중입니다.</p>
        </div>
        <div v-else-if="fpListErrorMessage" class="panel__state panel__state--error">
          <p>{{ fpListErrorMessage }}</p>
        </div>
        <div v-else-if="fpCommissionPage.empty" class="panel__state">
          <p>설계사별 월 수수료 현황 데이터가 없습니다.</p>
        </div>
        <div v-else class="list-panel">
          <div class="table-panel">
            <table>
              <thead>
                <tr>
                  <th>설계사명</th>
                  <th>계약 건수</th>
                  <th>환수 건수</th>
                  <th>신계약 수수료</th>
                  <th>유지 수수료</th>
                  <th>지급 예정액</th>
                  <th>환수 차감액</th>
                  <th>실수령액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in fpCommissionPage.content" :key="row.fpId">
                  <td>{{ row.fpName }}</td>
                  <td>{{ formatCount(row.contractCount) }}</td>
                  <td>{{ formatCount(row.recoveryContractCount) }}</td>
                  <td>{{ formatCurrency(row.initialCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.maintenanceCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.totalPaymentCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.recoveryAmount) }}</td>
                  <td>{{ formatCurrency(row.netCommissionAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="list-panel__footer">
            <p>
              총 {{ formatCount(fpCommissionPage.totalElements) }}건 중
              {{ formatCount(fpCommissionPage.numberOfElements) }}건 표시
            </p>
            <v-pagination
              v-model="fpListPagination.page"
              :length="Math.max(fpCommissionPage.totalPages, 1)"
              :total-visible="5"
              density="comfortable"
              @update:model-value="handleFpPageChange"
            />
          </div>
        </div>
      </section>

      <section v-if="props.scope === 'hq'" class="panel">
        <div class="panel__header">
          <div>
            <h3>지점별 월 수수료 현황</h3>
            <p>지점별 월 수수료 지급 및 환수 현황을 서버 페이지네이션 기준으로 조회합니다.</p>
          </div>
        </div>

        <div v-if="isOrganizationListLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>지점별 월 수수료 현황을 불러오는 중입니다.</p>
        </div>
        <div v-else-if="organizationListErrorMessage" class="panel__state panel__state--error">
          <p>{{ organizationListErrorMessage }}</p>
        </div>
        <div v-else-if="organizationCommissionPage.empty" class="panel__state">
          <p>지점별 월 수수료 현황 데이터가 없습니다.</p>
        </div>
        <div v-else class="list-panel">
          <div class="table-panel">
            <table>
              <thead>
                <tr>
                  <th>지점명</th>
                  <th>FP 수</th>
                  <th>계약 건수</th>
                  <th>환수 건수</th>
                  <th>신계약 수수료</th>
                  <th>유지 수수료</th>
                  <th>지급 예정 총액</th>
                  <th>환수 차감 총액</th>
                  <th>최종 지급 총액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in organizationCommissionPage.content" :key="row.organizationId">
                  <td>{{ row.organizationName }}</td>
                  <td>{{ formatCount(row.fpCount) }}</td>
                  <td>{{ formatCount(row.contractCount) }}</td>
                  <td>{{ formatCount(row.recoveryContractCount) }}</td>
                  <td>{{ formatCurrency(row.initialCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.maintenanceCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.totalPaymentCommissionAmount) }}</td>
                  <td>{{ formatCurrency(row.recoveryAmount) }}</td>
                  <td>{{ formatCurrency(row.netCommissionAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="list-panel__footer">
            <p>
              총 {{ formatCount(organizationCommissionPage.totalElements) }}건 중
              {{ formatCount(organizationCommissionPage.numberOfElements) }}건 표시
            </p>
            <v-pagination
              v-model="organizationListPagination.page"
              :length="Math.max(organizationCommissionPage.totalPages, 1)"
              :total-visible="5"
              density="comfortable"
              @update:model-value="handleOrganizationPageChange"
            />
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
  getBranchCommissionStatementPdf,
  getCommissionInsuranceCompanySummary,
  getCommissionFpList,
  getCommissionOrganizationList,
  getCommissionPaymentTypeSummary,
  getHqCommissionStatementPdf,
  getOwnBranchCommissionStatementPdf,
  getOrganizationCommissionSummary,
} from '../../api/commissions'
import { getDashboardInsuranceProductRankings } from '../../api/dashboard'
import { useBranchFilter } from '../../composables/useBranchFilter'
import { useAuthStore } from '../../stores/auth'
import { formatCurrency } from '../../utils/formatters'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  scope: {
    type: String,
    required: true,
    validator(value) {
      return ['branch', 'hq'].includes(value)
    },
  },
})

const COMPANY_COLORS = ['#f97316', '#2563eb', '#22c55e', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#64748b']
const PAYMENT_TYPE_CONFIG = [
  { label: '초회 수수료', color: '#f97316', keys: ['firstCommissionAmount', 'initialCommissionAmount'] },
  { label: '유지 수수료', color: '#2563eb', keys: ['renewalCommissionAmount', 'maintenanceCommissionAmount'] },
  { label: '환수 금액', color: '#ef4444', keys: ['clawbackAmount', 'recoveryAmount', 'refundAmount'] },
]

const authStore = useAuthStore()
const { branches, isLoadingBranches, branchErrorMessage, initializeBranchFilter } = useBranchFilter(authStore)

const filters = reactive({
  closingMonth: getLatestAvailableClosingMonth(),
  organizationCode: '',
})

const validationMessage = ref('')
const summary = ref(createEmptyOrganizationSummary())
const paymentTypeItems = ref([])
const insuranceCompanyItems = ref([])
const productRankingItems = ref([])
const fpCommissionPage = ref(createEmptyPage())
const organizationCommissionPage = ref(createEmptyPage())
const isSummaryLoading = ref(false)
const isPaymentTypeLoading = ref(false)
const isInsuranceCompanyLoading = ref(false)
const isProductRankingLoading = ref(false)
const isFpListLoading = ref(false)
const isOrganizationListLoading = ref(false)
const isPdfLoading = ref(false)

const summaryErrorMessage = ref('')
const paymentTypeErrorMessage = ref('')
const insuranceCompanyErrorMessage = ref('')
const productRankingErrorMessage = ref('')
const fpListErrorMessage = ref('')
const organizationListErrorMessage = ref('')

const fpListPagination = reactive({
  page: 1,
  size: 5,
})

const organizationListPagination = reactive({
  page: 1,
  size: 5,
})

const heroEyebrow = computed(() => (props.scope === 'branch' ? 'Branch Commission' : 'Headquarter Commission'))
const pageHeading = computed(() => (props.scope === 'branch' ? '지점 수수료 관리' : '본사 수수료 관리'))
const pageDescription = computed(() =>
  props.scope === 'branch'
    ? '소속 지점 기준 수수료 및 지급 정보를 조회할 수 있습니다.'
    : '전사 또는 선택 지점 기준 수수료 및 지급 정보를 조회할 수 있습니다.',
)
const closingMonthLabel = computed(() => formatMonthLabel(filters.closingMonth))
const latestAvailableClosingMonth = computed(() => getLatestAvailableClosingMonth())
const productRankingTitleSuffix = computed(() => `Top${Math.min(productRankingItems.value.length || 10, 10)}`)
const effectiveScope = computed(() => {
  if (props.scope === 'branch') {
    return 'branch'
  }

  if (summary.value.scopeType === 'branch' || filters.organizationCode) {
    return 'branch'
  }

  return 'hq'
})

const summaryCards = computed(() => {
  const comparisonCaption =
    summary.value.previousMetricAmount === null
      ? '수입 수수료 전월 비교 데이터 없음'
      : `수입 수수료 전월 ${formatCurrency(summary.value.previousMetricAmount)}`
  const recoveryLossCaption =
    summary.value.netRecoveryLossAmount === null
      ? '분리 환수 데이터 없음'
      : summary.value.netRecoveryLossAmount > 0
        ? '설계사 환수 우세'
        : summary.value.netRecoveryLossAmount < 0
          ? '원수사 환수 우세'
          : '환수 손익 균형'
  const basePaymentCaption =
    effectiveScope.value === 'hq'
      ? summaryErrorMessage.value || '전사 설계사 지급 총액'
      : summaryErrorMessage.value || '지점 설계사 지급 총액'
  const incomeLabel = effectiveScope.value === 'hq' ? '전사 수입 수수료' : '수입 수수료'
  const incomeCaption =
    effectiveScope.value === 'hq'
      ? '당월 기준 전사 수입 수수료 총액'
      : '당월 기준 지점 수입 수수료 총액'

  return [
    {
      label: '총 지급 수수료',
      value: formatCurrency(summary.value.totalPaymentCommissionAmount),
      caption: basePaymentCaption,
      accent: '#f97316',
      tone: '#fff3e8',
      icon: 'mdi-cash-multiple',
    },
    {
      label: incomeLabel,
      value: formatCurrency(summary.value.netCommissionAmount),
      caption: incomeCaption,
      accent: '#2563eb',
      tone: '#eff6ff',
      icon: 'mdi-finance',
    },
    {
      label: '전월 대비 증감률',
      value: formatComparisonRate(summary.value.comparisonRate),
      caption: comparisonCaption,
      accent: '#16a34a',
      tone: '#ecfdf3',
      icon: 'mdi-trending-up',
      valueClass: getComparisonRateClass(summary.value.comparisonRate),
    },
    {
      label: '환수 순손실',
      value: formatMetricCurrency(summary.value.netRecoveryLossAmount),
      caption: recoveryLossCaption,
      accent: '#8b5cf6',
      tone: '#f5f3ff',
      icon: 'mdi-scale-balance',
      valueClass: getNetRecoveryLossClass(summary.value.netRecoveryLossAmount),
    },
    {
      label: '신계약 수수료',
      value: formatCurrency(summary.value.initialCommissionAmount),
      caption: '당월 신규 체결된 계약으로 발생한 회사 수입 수수료',
      accent: '#7c3aed',
      tone: '#f5f3ff',
      icon: 'mdi-cash-plus',
    },
    {
      label: '유지 수수료',
      value: formatCurrency(summary.value.renewalCommissionAmount),
      caption: '유지 중인 계약에서 발생한 회사 수입 수수료',
      accent: '#0ea5a4',
      tone: '#ecfeff',
      icon: 'mdi-chart-line',
    },
    {
      label: '원수사 환수금',
      value: formatMetricCurrency(summary.value.insuranceClawbackAmount),
      caption:
        summary.value.insuranceClawbackAmount === null
          ? '분리 환수 데이터 없음'
          : '원수사(보험사)가 본사(GA)로 청구한 환수 총액',
      accent: '#ef4444',
      tone: '#fff1f2',
      icon: 'mdi-cash-remove',
      valueClass: 'summary-card__value--danger',
    },
    {
      label: '설계사 환수금',
      value: formatMetricCurrency(summary.value.fpClawbackAmount),
      caption:
        summary.value.fpClawbackAmount === null
          ? '분리 환수 데이터 없음'
          : '회사가 설계사에게서 다시 회수한 금액',
      accent: '#0f766e',
      tone: '#ecfeff',
      icon: 'mdi-cash-refund',
    },
  ]
})

const topInsuranceCompanyItems = computed(() => insuranceCompanyItems.value.slice(0, 5))

const companyChartData = computed(() => ({
  labels: topInsuranceCompanyItems.value.map((item) => formatCompanyChartLabel(item.name)),
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
      left: 0,
      right: 18,
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

onMounted(async () => {
  await initializeBranchFilter()
  await loadDashboard()
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

    resetListPages()
    loadDashboard()
  },
)

watch(
  () => filters.organizationCode,
  (value, previousValue) => {
    if (props.scope !== 'hq' || value === previousValue) {
      return
    }

    resetListPages()
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

  await Promise.all([
    loadSummary(),
    loadProductRankings(),
    loadInsuranceCompanies(),
    loadFpCommissionList(),
    ...(props.scope === 'hq' ? [loadOrganizationCommissionList()] : []),
  ])
}

function resetFilters() {
  filters.closingMonth = latestAvailableClosingMonth.value
  filters.organizationCode = ''
  resetListPages()
}

async function openStatementPdf() {
  validationMessage.value = ''

  if (!isValidClosingMonth(filters.closingMonth)) {
    validationMessage.value = '정산 월은 YYYY-MM 형식으로 입력해주세요.'
    return
  }

  isPdfLoading.value = true

  try {
    const params = { closingMonth: filters.closingMonth }
    const blob = await getStatementPdfBlob(params)

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

function getStatementPdfBlob(params) {
  if (props.scope === 'branch') {
    return getOwnBranchCommissionStatementPdf(params)
  }

  if (filters.organizationCode) {
    return getBranchCommissionStatementPdf(filters.organizationCode, params)
  }

  return getHqCommissionStatementPdf(params)
}

function openPdfBlob(blob) {
  const pdfBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(pdfBlob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}

function resetListPages() {
  fpListPagination.page = 1
  organizationListPagination.page = 1
}

async function loadSummary() {
  summaryErrorMessage.value = ''
  isSummaryLoading.value = true

  try {
    const response = await getOrganizationCommissionSummary(buildScopeParams(filters.closingMonth))
    summary.value = normalizeOrganizationSummary(response?.result)
  } catch (error) {
    summary.value = createEmptyOrganizationSummary()
    summaryErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '조직 수수료 요약을 불러오지 못했습니다.'
  } finally {
    isSummaryLoading.value = false
  }
}

async function loadPaymentTypes() {
  paymentTypeErrorMessage.value = ''
  isPaymentTypeLoading.value = true

  try {
    const response = await getCommissionPaymentTypeSummary(buildScopeParams(filters.closingMonth))
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
      ...buildScopeParams(filters.closingMonth),
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
    const response = await getCommissionInsuranceCompanySummary(buildScopeParams(filters.closingMonth))
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

async function loadFpCommissionList() {
  fpListErrorMessage.value = ''
  isFpListLoading.value = true

  try {
    const response = await getCommissionFpList(buildListParams(fpListPagination))
    fpCommissionPage.value = normalizePageResponse(
      response?.result,
      normalizeFpCommissionRow,
    )
  } catch (error) {
    fpCommissionPage.value = createEmptyPage()
    fpListErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '설계사별 월 수수료 현황을 불러오지 못했습니다.'
  } finally {
    isFpListLoading.value = false
  }
}

async function loadOrganizationCommissionList() {
  if (props.scope !== 'hq') {
    organizationCommissionPage.value = createEmptyPage()
    organizationListErrorMessage.value = ''
    isOrganizationListLoading.value = false
    return
  }

  organizationListErrorMessage.value = ''
  isOrganizationListLoading.value = true

  try {
    const response = await getCommissionOrganizationList(buildListParams(organizationListPagination))
    organizationCommissionPage.value = normalizePageResponse(
      response?.result,
      normalizeOrganizationCommissionRow,
    )
  } catch (error) {
    organizationCommissionPage.value = createEmptyPage()
    organizationListErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점별 월 수수료 현황을 불러오지 못했습니다.'
  } finally {
    isOrganizationListLoading.value = false
  }
}

function handleFpPageChange(page) {
  fpListPagination.page = page
  loadFpCommissionList()
}

function handleOrganizationPageChange(page) {
  if (props.scope !== 'hq') {
    return
  }

  organizationListPagination.page = page
  loadOrganizationCommissionList()
}

function buildScopeParams(closingMonth) {
  const params = { closingMonth }

  if (props.scope === 'hq' && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  return params
}

function buildListParams(pagination) {
  return {
    ...buildScopeParams(filters.closingMonth),
    page: pagination.page,
    size: pagination.size,
  }
}

function normalizeOrganizationSummary(result) {
  const comparison = result?.comparison ?? {}
  const scopeType = result?.branchSummary ? 'branch' : result?.hqSummary ? 'hq' : 'organization'
  const summarySource =
    result?.branchSummary ??
    result?.hqSummary ??
      result?.organizationSummary ??
      result ??
      {}
  const rawInsuranceClawbackAmount = toNullableNumber(
    getValue(summarySource, [
      'insuranceCompanyClawbackAmount',
      'insuranceClawbackAmount',
      'insuranceRecoveryAmount',
      'totalInsuranceRecoveryAmount',
      'totalInsuranceRecoveryCollectionAmount',
      'insuranceRecoveryCollectionAmount',
      'insuranceRecoveryCollectionAmt',
      'totalInsuranceClawbackAmount',
    ]),
  )
  const rawFpClawbackAmount = toNullableNumber(
    getValue(summarySource, [
      'fpClawbackAmount',
      'totalFpRecoveryCollectionAmount',
      'totalFpRecoveryAmount',
      'fpRecoveryCollectionAmount',
      'fpRecoveryAmount',
      'advisorRecoveryCollectionAmount',
      'advisorRecoveryAmount',
    ]),
  )
  const rawTotalClawbackAmount = toNullableNumber(
    getValue(summarySource, [
      'totalClawbackAmount',
      'clawbackAmount',
      'totalRecoveryAmount',
      'totalRecoveryCollectionAmount',
      'totalRecoveryCollectionAmt',
      'recoveryCollectionAmount',
      'totalRefundAmount',
    ]),
  )
  const hasRecoveryBreakdown = rawInsuranceClawbackAmount !== null || rawFpClawbackAmount !== null
  const insuranceClawbackAmount = hasRecoveryBreakdown ? toNumber(rawInsuranceClawbackAmount) : null
  const fpClawbackAmount = hasRecoveryBreakdown ? toNumber(rawFpClawbackAmount) : null
  const totalClawbackAmount = toNumber(
    rawTotalClawbackAmount ??
      ((insuranceClawbackAmount ?? 0) + (fpClawbackAmount ?? 0)),
  )
  const netRecoveryLossAmount =
    hasRecoveryBreakdown && insuranceClawbackAmount !== null && fpClawbackAmount !== null
      ? fpClawbackAmount - insuranceClawbackAmount
      : null

  return {
    totalPaymentCommissionAmount: toNumber(
      getValue(summarySource, [
        'totalPaymentCommissionAmount',
        'totalCommissionAmount',
        'paidCommissionAmount',
        'totalPaymentAmount',
        'totalPaymentCommissionAmount',
      ]),
    ),
    totalClawbackAmount,
    netCommissionAmount: toNumber(
      getValue(summarySource, [
        'netCommissionAmount',
        'netProfitCommissionAmount',
        'netRevenueCommissionAmount',
        'netAmount',
        'netIncomeCommissionAmount',
      ]),
    ),
    initialCommissionAmount: toNumber(
      getValue(summarySource, [
        'firstCommissionAmount',
        'initialCommissionAmount',
        'totalInitialAmount',
        'totalInitialGrossCommissionAmount',
        'totalInitialPaymentAmount',
      ]),
    ),
    renewalCommissionAmount: toNumber(
      getValue(summarySource, [
        'renewalCommissionAmount',
        'maintenanceCommissionAmount',
        'totalMaintenanceAmount',
        'totalMaintenanceGrossCommissionAmount',
        'totalMaintenancePaymentAmount',
        'totalMaintenanceCommissionAmount',
      ]),
    ),
    contractCount: toNumber(
      getValue(summarySource, ['contractCount', 'totalContractCount', 'totalContractCnt']),
    ),
    advisorCount: toNumber(
      getValue(summarySource, ['advisorCount', 'fpCount', 'advisorTotalCount', 'totalFpCount']),
    ),
    clawbackContractCount: toNumber(
      getValue(summarySource, ['clawbackContractCount', 'recoveryContractCount']),
    ),
    insuranceClawbackAmount,
    fpClawbackAmount,
    netRecoveryLossAmount,
    comparisonRate: toNullableNumber(
      getValue(comparison, ['growthRate', 'comparisonRate', 'monthOverMonthRate']) ??
        getValue(result, ['comparisonRate', 'monthOverMonthRate']),
    ),
    comparisonAmount: toNullableNumber(
      getValue(comparison, [
        'differenceAmount',
        'comparisonAmount',
        'monthOverMonthAmount',
        'previousMetricAmount',
      ]) ??
        getValue(result, ['comparisonAmount', 'monthOverMonthAmount']),
    ),
    previousMetricAmount: toNullableNumber(
      getValue(comparison, ['previousMetricAmount', 'previousAmount']),
    ),
    scopeType,
  }
}

function normalizePaymentTypeItems(result) {
  const itemList = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : []
  const source = itemList.length > 0 ? collapsePaymentTypeArray(itemList) : result ?? {}
  const items = PAYMENT_TYPE_CONFIG.map((config) => ({
    label: config.label,
    color: config.color,
    amount: toNumber(getValue(source, config.keys)),
  }))

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return items
    .filter((item) => item.amount > 0 || totalAmount > 0)
    .map((item) => ({
      ...item,
      ratio: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }))
}

function normalizeInsuranceCompanyItems(result) {
  const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : []
  const normalized = items.map((item, index) => {
    const paymentAmount = toNumber(
      getValue(item, [
        'totalPaymentCommissionAmount',
        'totalCommissionAmount',
        'netCommissionAmount',
        'netProfitCommissionAmount',
        'totalPaymentAmount',
        'netAmount',
      ]),
    )
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
      amount: totalCommissionAmount,
      totalCommissionAmount,
      paymentAmount,
      initialAmount,
      maintenanceAmount,
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

function formatCompanyDisplayName(value) {
  const companyName = String(value || '-')
  return companyName.length >= 7 ? companyName.slice(0, 6) : companyName
}

function formatCompanyChartLabel(value) {
  return String(value || '-').slice(0, 2)
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
    commissionAmount: toNumber(
      getValue(item, [
        'commissionAmount',
        'totalCommissionAmount',
        'totalPaymentCommissionAmount',
        'netCommissionAmount',
        'totalMonthlyPremiumAmount',
      ]),
    ),
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

function normalizePageResponse(result, rowNormalizer = (row) => row) {
  return {
    content: Array.isArray(result?.content) ? result.content.map(rowNormalizer) : [],
    page: Number(result?.page ?? 1),
    size: Number(result?.size ?? 5),
    totalElements: Number(result?.totalElements ?? 0),
    totalPages: Number(result?.totalPages ?? 0),
    numberOfElements: Number(result?.numberOfElements ?? 0),
    hasNext: Boolean(result?.hasNext),
    hasPrevious: Boolean(result?.hasPrevious),
    first: Boolean(result?.first),
    last: Boolean(result?.last),
    empty: Boolean(result?.empty ?? true),
  }
}

function createEmptyPage() {
  return {
    content: [],
    page: 1,
    size: 5,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true,
    empty: true,
  }
}

function normalizeFpCommissionRow(row) {
  return {
    fpId: row?.fpId ?? '',
    fpName: row?.fpName ?? '-',
    initialCommissionAmount: toNumber(row?.initialCommissionAmount),
    maintenanceCommissionAmount: toNumber(row?.maintenanceCommissionAmount),
    recoveryAmount: toNumber(row?.recoveryAmount),
    totalPaymentCommissionAmount: toNumber(row?.totalPaymentCommissionAmount),
    netCommissionAmount: toNumber(row?.netCommissionAmount),
    contractCount: toNumber(row?.contractCount),
    recoveryContractCount: toNumber(row?.recoveryContractCount),
  }
}

function normalizeOrganizationCommissionRow(row) {
  return {
    organizationId: row?.organizationId ?? '',
    organizationName: row?.organizationName ?? '-',
    initialCommissionAmount: toNumber(row?.initialCommissionAmount),
    maintenanceCommissionAmount: toNumber(row?.maintenanceCommissionAmount),
    recoveryAmount: toNumber(row?.recoveryAmount),
    totalPaymentCommissionAmount: toNumber(row?.totalPaymentCommissionAmount),
    netCommissionAmount: toNumber(row?.netCommissionAmount),
    fpCount: toNumber(row?.fpCount),
    contractCount: toNumber(row?.contractCount),
    recoveryContractCount: toNumber(row?.recoveryContractCount),
  }
}

function createEmptyOrganizationSummary() {
  return {
    totalPaymentCommissionAmount: 0,
    totalClawbackAmount: 0,
    netCommissionAmount: 0,
    initialCommissionAmount: 0,
    renewalCommissionAmount: 0,
    contractCount: 0,
    advisorCount: 0,
    clawbackContractCount: 0,
    insuranceClawbackAmount: null,
    fpClawbackAmount: null,
    netRecoveryLossAmount: null,
    comparisonRate: null,
    comparisonAmount: null,
    previousMetricAmount: null,
    scopeType: 'organization',
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

function getNetRecoveryLossClass(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (value > 0) {
    return 'summary-card__value--success'
  }

  if (value < 0) {
    return 'summary-card__value--danger'
  }

  return ''
}

function formatMetricCurrency(value) {
  return value === null || value === undefined ? '-' : formatCurrency(value)
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

.commission-page__organization-filter {
  width: 220px;
}

.commission-page__month-field {
  width: 180px;
}

.commission-page__search-button {
  height: 40px;
  padding: 0 18px;
  border-radius: 12px;
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.commission-layout--bottom {
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}

.panel {
  padding: 22px 24px;
  border: 1px solid #edf1f7;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.panel--tall {
  min-height: 360px;
}

.panel--compact {
  min-height: 100%;
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
  grid-template-columns: minmax(220px, 260px) minmax(240px, 1fr);
  gap: 14px;
  align-items: center;
}

.insurance-overview__chart-card {
  display: grid;
  gap: 12px;
  align-content: space-between;
  align-self: center;
  justify-items: start;
  overflow: hidden;
  padding: 16px;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.insurance-overview__list {
  display: grid;
  gap: 8px;
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
  width: 220px;
  max-width: 100%;
  height: 260px;
  justify-self: start;
  margin-left: -6px;
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

.list-panel {
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
  min-width: 880px;
  border-collapse: collapse;
}

.table-panel th,
.table-panel td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: left;
  color: #475569;
  white-space: nowrap;
}

.table-panel th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
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

.table-panel--product-ranking th:last-child,
.table-panel--product-ranking td:last-child {
  width: 92px;
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

.list-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-panel__footer p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.insurance-company-row,
.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  background: #ffffff;
}

.insurance-company-row__main {
  flex: 1 1 auto;
  min-width: 0;
}

.insurance-company-row__title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #1e293b;
}

.insurance-company-row__title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insurance-company-row__dot {
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

.legend-row__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
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

  .list-panel__footer {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .commission-page__hero,
  .commission-page__toolbar {
    display: grid;
    grid-template-columns: 1fr;
  }

  .commission-page__organization-filter,
  .commission-page__month-field {
    width: 100%;
  }

  .commission-summary {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }

  .payment-type-panel {
    align-content: start;
  }
}
</style>
