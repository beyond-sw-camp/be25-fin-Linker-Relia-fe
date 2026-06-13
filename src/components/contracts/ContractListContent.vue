<template>
  <section class="contract-page" :aria-label="props.pageTitle">
    <div class="contract-page__toolbar">
      <div class="contract-page__filters">
        <v-select
          v-if="props.showOrganizationFilter"
          v-model="filters.branch"
          :items="branchOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          class="contract-page__filter"
        />
        <v-select
          v-model="filters.insurer"
          :items="insurerOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          class="contract-page__filter"
        />
        <v-select
          v-model="filters.month"
          :items="monthOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          class="contract-page__filter contract-page__filter--month"
        />
      </div>

      <v-btn
        v-if="props.allowContractCreateButton"
        class="contract-page__create-button"
        @click="goToContractCreate"
      >
        + 계약 등록
      </v-btn>
    </div>

    <div v-if="isContractSummaryLoading" class="contract-page__summary-state">
      <v-progress-circular indeterminate color="#f97316" size="28" />
      <span>계약 요약을 불러오는 중입니다.</span>
    </div>
    <div v-else-if="contractSummaryError" class="contract-page__summary-state contract-page__summary-state--error">
      {{ contractSummaryError }}
    </div>
    <div v-else class="contract-page__summary">
      <article v-for="card in summaryCards" :key="card.label" class="contract-summary-card">
        <div class="contract-summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <div class="contract-summary-card__value">
          <strong>{{ card.value }}</strong>
          <span>건</span>
        </div>
        <p>{{ card.label }}</p>
        <small>{{ card.caption }}</small>
      </article>
    </div>

    <section class="contract-panel">
      <h2>보유 계약 목록</h2>

      <div class="contract-list-controls">
        <div class="contract-tabs" role="tablist" aria-label="계약 상태">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            class="contract-tabs__button"
            :class="{ 'contract-tabs__button--active': filters.status === tab.value }"
            @click="changeStatus(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="contract-sort" aria-label="계약 목록 정렬 기준">
          <span class="contract-sort__label">정렬 기준</span>
          <div class="contract-sort__buttons" role="group">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="contract-sort__button"
              :class="{ 'contract-sort__button--active': contractSort === option.value }"
              @click="changeSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="contract-table">
        <table>
          <thead>
            <tr>
              <th>계약번호</th>
              <th>고객명</th>
              <th>보험사</th>
              <th>보험상품</th>
              <th>계약일</th>
              <th>월 보험료</th>
              <th>납부 여부</th>
              <th>만기일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isContractListLoading">
              <td colspan="8" class="contract-table__state">
                <v-progress-circular indeterminate color="#f97316" size="28" />
                <span>계약 목록을 불러오는 중입니다.</span>
              </td>
            </tr>
            <tr v-else-if="contractListError">
              <td colspan="8" class="contract-table__state contract-table__state--error">
                {{ contractListError }}
              </td>
            </tr>
            <template v-else>
              <tr v-for="contract in contractRows" :key="contract.contractCode">
                <td>
                  <button type="button" class="contract-table__link" @click="goToContractDetail(contract)">
                    {{ contract.contractCode }}
                  </button>
                </td>
                <td>
                  <button type="button" class="contract-table__link">{{ contract.customerName }}</button>
                </td>
                <td>{{ contract.insuranceCompanyName }}</td>
                <td class="contract-table__strong">{{ contract.insuranceProductName }}</td>
                <td>{{ formatDate(contract.contractDate) }}</td>
                <td class="contract-table__strong">{{ formatPremium(contract.monthlyPremium) }}</td>
                <td>
                  <span class="contract-badge" :class="getContractStatusBadgeClass(contract.contractStatus)">
                    {{ getContractStatusLabel(contract.contractStatus) }}
                  </span>
                </td>
                <td>
                  <span>{{ formatDate(contract.contractEndDate) }}</span>
                  <span v-if="isNearMaturityContract(contract.contractStatus)" class="contract-badge contract-badge--warning">
                    {{ getContractStatusLabel(contract.contractStatus) }}
                  </span>
                </td>
              </tr>
            </template>
            <tr v-if="!isContractListLoading && !contractListError && contractRows.length === 0">
              <td colspan="8" class="contract-table__empty">조건에 맞는 계약이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="contract-panel__pagination">
        <span>{{ rangeLabel }}</span>
        <div class="contract-panel__pagination-actions">
          <v-pagination
            :model-value="currentPage"
            :length="Math.max(totalPages, 1)"
            total-visible="7"
            rounded="circle"
            @update:model-value="changePage"
          />
        </div>
      </div>
    </section>

    <div class="contract-page__bottom">
      <section class="contract-chart-panel">
        <h2>월별 계약 추이</h2>
        <div class="contract-chart">
          <div v-if="isMonthlyTrendLoading" class="contract-chart__state">
            <v-progress-circular indeterminate color="#f97316" size="28" />
            <span>월별 계약 추이를 불러오는 중입니다.</span>
          </div>
          <div v-else-if="monthlyTrendError" class="contract-chart__state contract-chart__state--error">
            {{ monthlyTrendError }}
          </div>
          <div v-else-if="monthlyTrendRows.length === 0" class="contract-chart__state">
            월별 계약 추이 데이터가 없습니다.
          </div>
          <div v-else class="contract-chart__canvas">
            <Bar :data="monthlyTrendChartData" :options="monthlyTrendChartOptions" />
          </div>
        </div>
      </section>

      <section class="contract-insurer-panel">
        <h2>보험사 계약 현황</h2>
        <div class="contract-insurer-table">
          <table>
            <thead>
              <tr>
                <th>보험사</th>
                <th>전체 계약</th>
                <th>월납 보험료</th>
                <th>유지율</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isInsuranceCompanyStatusLoading">
                <td colspan="4" class="contract-insurer-table__state">
                  <v-progress-circular indeterminate color="#f97316" size="28" />
                  <span>보험사 계약 현황을 불러오는 중입니다.</span>
                </td>
              </tr>
              <tr v-else-if="insuranceCompanyStatusError">
                <td colspan="4" class="contract-insurer-table__state contract-insurer-table__state--error">
                  {{ insuranceCompanyStatusError }}
                </td>
              </tr>
              <template v-else>
                <tr v-for="insurer in insuranceCompanyStatusRows" :key="insurer.insuranceCompanyName">
                  <td>{{ insurer.insuranceCompanyName }}</td>
                  <td>{{ formatCount(insurer.totalContractCount) }}</td>
                  <td>{{ formatHundredMillion(insurer.totalMonthlyPremiumAmount) }}</td>
                  <td>{{ formatPercent(insurer.retentionRate) }}</td>
                </tr>
              </template>
              <tr v-if="!isInsuranceCompanyStatusLoading && !insuranceCompanyStatusError && insuranceCompanyStatusRows.length === 0">
                <td colspan="4" class="contract-insurer-table__state">보험사 계약 현황이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import {
  BarElement,
  BarController,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { useRoute, useRouter } from 'vue-router'

import {
  getContractSummary,
  getContracts,
  getInsuranceCompanyContractStatuses,
  getMonthlyContractTrend,
} from '../../api/contracts'
import {
  CONTRACT_BRANCH_OPTIONS,
  CONTRACT_INSURER_OPTIONS,
  CONTRACT_MONTH_OPTIONS,
} from '../../data/contractMocks'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

const props = defineProps({
  pageTitle: {
    type: String,
    required: true,
  },
  showOrganizationFilter: {
    type: Boolean,
    default: true,
  },
  allowContractCreateButton: {
    type: Boolean,
    default: false,
  },
})

const branchOptions = CONTRACT_BRANCH_OPTIONS
const insurerOptions = CONTRACT_INSURER_OPTIONS
const monthOptions = CONTRACT_MONTH_OPTIONS
const route = useRoute()
const router = useRouter()

const statusTabs = [
  { label: '전체', value: 'ALL' },
  { label: '수금', value: 'PAID' },
  { label: '미수금', value: 'UNPAID' },
  { label: '만기 임박', value: 'EXPIRING_SOON' },
  { label: '갱신 임박', value: 'RENEWAL_SOON' },
]

const sortOptions = [
  { label: '최신 계약순', value: 'LATEST_CONTRACT' },
  { label: '오래된 계약순', value: 'OLDEST_CONTRACT' },
  { label: '계약 만기임박순', value: 'EXPIRY_SOON' },
]

const filters = reactive({
  branch: 'ALL',
  insurer: 'ALL',
  month: '2026-05',
  status: 'ALL',
})

const contractSort = ref('LATEST_CONTRACT')
const contractRows = ref([])
const currentPage = ref(1)
const pageSize = ref(8)
const totalElements = ref(0)
const totalPages = ref(0)
const isContractListLoading = ref(false)
const contractListError = ref('')
const contractSummary = ref(createEmptyContractSummary())
const isContractSummaryLoading = ref(false)
const contractSummaryError = ref('')
const insuranceCompanyStatusRows = ref([])
const isInsuranceCompanyStatusLoading = ref(false)
const insuranceCompanyStatusError = ref('')
const monthlyTrendRows = ref([])
const isMonthlyTrendLoading = ref(false)
const monthlyTrendError = ref('')

const summaryCards = computed(() => [
  {
    label: '전체 보유 계약',
    value: formatCount(contractSummary.value.totalContractCount),
    caption: '전체 계약 건수',
    accent: '#f97316',
    tone: '#fff1e8',
    icon: 'mdi-file-document-outline',
  },
  {
    label: '수금 계약',
    value: formatCount(contractSummary.value.normalPaymentCount),
    caption: '정상 수금 계약',
    accent: '#16a34a',
    tone: '#dcfce7',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: '미수금 계약',
    value: formatCount(contractSummary.value.unpaidCount),
    caption: '미수금 발생 계약',
    accent: '#ef4444',
    tone: '#fee2e2',
    icon: 'mdi-alert-circle-outline',
  },
  {
    label: '만기 임박 계약',
    value: formatCount(contractSummary.value.expiringSoonCount),
    caption: '30일 이내 만기',
    accent: '#f59e0b',
    tone: '#fef3c7',
    icon: 'mdi-clock-outline',
  },
])

const rangeLabel = computed(() => {
  if (totalElements.value === 0) {
    return '총 0건 중 0-0건 표시'
  }

  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, totalElements.value)

  return `총 ${totalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건 표시`
})

const monthlyTrendChartData = computed(() => ({
  labels: monthlyTrendRows.value.map((row) => formatMonth(row.month)),
  datasets: [
    {
      type: 'bar',
      label: '계약 건수(건)',
      data: monthlyTrendRows.value.map((row) => Number(row.contractCount ?? 0)),
      yAxisID: 'y',
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderRadius: 4,
      barThickness: 28,
      order: 2,
    },
    {
      type: 'line',
      label: '월납 보험료(억원)',
      data: monthlyTrendRows.value.map((row) => toHundredMillion(row.totalMonthlyPremiumAmount)),
      yAxisID: 'y1',
      borderColor: '#34d399',
      backgroundColor: '#34d399',
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#34d399',
      pointBorderWidth: 4,
      pointRadius: 6,
      pointHoverRadius: 7,
      tension: 0.35,
      borderWidth: 3,
      order: 1,
    },
  ],
}))

const monthlyTrendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'center',
      labels: {
        color: '#334155',
        boxWidth: 18,
        boxHeight: 8,
        usePointStyle: false,
        padding: 20,
        font: {
          family: 'Pretendard, Noto Sans KR, sans-serif',
          size: 13,
          weight: 700,
        },
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          if (context.dataset.yAxisID === 'y') {
            return `${context.dataset.label}: ${formatCount(context.raw)}건`
          }

          return `${context.dataset.label}: ${formatCompactNumber(context.raw)}억`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#475569',
        font: {
          family: 'Pretendard, Noto Sans KR, sans-serif',
          size: 12,
          weight: 700,
        },
      },
    },
    y: {
      beginAtZero: true,
      grace: '10%',
      grid: {
        color: '#e5e7eb',
      },
      ticks: {
        color: '#64748b',
        callback(value) {
          return formatCount(value)
        },
        font: {
          family: 'Pretendard, Noto Sans KR, sans-serif',
          size: 12,
          weight: 700,
        },
      },
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grace: '10%',
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#64748b',
        callback(value) {
          return formatCompactNumber(value)
        },
        font: {
          family: 'Pretendard, Noto Sans KR, sans-serif',
          size: 12,
          weight: 700,
        },
      },
    },
  },
}))

watch(
  () => [filters.branch, filters.insurer, filters.month, filters.status],
  () => {
    currentPage.value = 1
    loadContractList()
  },
)

watch(
  () => [filters.branch, filters.insurer, filters.month],
  () => {
    loadContractSummary()
    loadInsuranceCompanyStatus()
    loadMonthlyTrend()
  },
)

onMounted(() => {
  loadContractList()
  loadContractSummary()
  loadInsuranceCompanyStatus()
  loadMonthlyTrend()
})

function changeStatus(status) {
  filters.status = status
}

function changeSort(sort) {
  if (contractSort.value === sort) {
    return
  }

  contractSort.value = sort
  currentPage.value = 1
  loadContractList()
}

function goToContractCreate() {
  router.push({ name: 'contract-create' })
}

function goToContractDetail(contract) {
  const contractId = contract.contractId ?? contract.id

  if (!contractId) {
    contractListError.value = '계약 상세 조회에 필요한 계약 ID가 없습니다.'
    return
  }

  router.push({
    name: 'contract-detail',
    params: {
      contractId,
    },
    query: {
      from: route.name,
    },
  })
}

async function changePage(page) {
  currentPage.value = page
  await loadContractList()
}

async function loadContractList() {
  contractListError.value = ''
  isContractListLoading.value = true

  try {
    const response = await getContracts(buildContractListParams())
    const result = response?.result ?? {}

    contractRows.value = Array.isArray(result.content) ? result.content : []
    currentPage.value = Number(result.page ?? currentPage.value)
    pageSize.value = Number(result.size ?? pageSize.value)
    totalElements.value = Number(result.totalElements ?? 0)
    totalPages.value = Number(result.totalPages ?? 0)
  } catch (error) {
    contractRows.value = []
    totalElements.value = 0
    totalPages.value = 0
    contractListError.value =
      error.response?.data?.message ||
      error.message ||
      '계약 목록을 불러오지 못했습니다.'
  } finally {
    isContractListLoading.value = false
  }
}

async function loadContractSummary() {
  contractSummaryError.value = ''
  isContractSummaryLoading.value = true

  try {
    const response = await getContractSummary(buildContractSummaryParams())
    contractSummary.value = normalizeContractSummary(response?.result)
  } catch (error) {
    contractSummary.value = createEmptyContractSummary()
    contractSummaryError.value =
      error.response?.data?.message ||
      error.message ||
      '계약 요약을 불러오지 못했습니다.'
  } finally {
    isContractSummaryLoading.value = false
  }
}

async function loadInsuranceCompanyStatus() {
  insuranceCompanyStatusError.value = ''
  isInsuranceCompanyStatusLoading.value = true

  try {
    const response = await getInsuranceCompanyContractStatuses(buildInsuranceCompanyStatusParams())
    insuranceCompanyStatusRows.value = Array.isArray(response?.result) ? response.result : []
  } catch (error) {
    insuranceCompanyStatusRows.value = []
    insuranceCompanyStatusError.value =
      error.response?.data?.message ||
      error.message ||
      '보험사 계약 현황을 불러오지 못했습니다.'
  } finally {
    isInsuranceCompanyStatusLoading.value = false
  }
}

async function loadMonthlyTrend() {
  monthlyTrendError.value = ''
  isMonthlyTrendLoading.value = true

  try {
    const response = await getMonthlyContractTrend(buildMonthlyTrendParams())
    monthlyTrendRows.value = Array.isArray(response?.result) ? response.result : []
  } catch (error) {
    monthlyTrendRows.value = []
    monthlyTrendError.value =
      error.response?.data?.message ||
      error.message ||
      '월별 계약 추이를 불러오지 못했습니다.'
  } finally {
    isMonthlyTrendLoading.value = false
  }
}

function buildContractListParams() {
  const params = {
    closingMonth: filters.month,
    sort: contractSort.value,
    page: Math.max(currentPage.value, 1),
    size: pageSize.value,
  }

  if (props.showOrganizationFilter && filters.branch !== 'ALL') {
    params.organizationCode = filters.branch
  }

  if (filters.insurer !== 'ALL') {
    params.insuranceCompanyId = filters.insurer
  }

  if (filters.status !== 'ALL') {
    params.contractStatus = filters.status
  }

  return params
}

function buildContractSummaryParams() {
  const params = {
    closingMonth: filters.month,
  }

  if (props.showOrganizationFilter && filters.branch !== 'ALL') {
    params.organizationCode = filters.branch
  }

  if (filters.insurer !== 'ALL') {
    params.insuranceCompanyId = filters.insurer
  }

  return params
}

function buildInsuranceCompanyStatusParams() {
  const params = {
    closingMonth: filters.month,
  }

  if (props.showOrganizationFilter && filters.branch !== 'ALL') {
    params.organizationCode = filters.branch
  }

  if (filters.insurer !== 'ALL') {
    params.insuranceCompanyId = filters.insurer
  }

  return params
}

function buildMonthlyTrendParams() {
  const params = {
    closingMonth: filters.month,
  }

  if (props.showOrganizationFilter && filters.branch !== 'ALL') {
    params.organizationCode = filters.branch
  }

  if (filters.insurer !== 'ALL') {
    params.insuranceCompanyId = filters.insurer
  }

  return params
}

function normalizeContractSummary(summary) {
  return {
    totalContractCount: Number(summary?.totalContractCount ?? 0),
    normalPaymentCount: Number(summary?.normalPaymentCount ?? 0),
    unpaidCount: Number(summary?.unpaidCount ?? 0),
    lapseExpectedCount: Number(summary?.lapseExpectedCount ?? 0),
    expiringSoonCount: Number(summary?.expiringSoonCount ?? 0),
  }
}

function createEmptyContractSummary() {
  return {
    totalContractCount: 0,
    normalPaymentCount: 0,
    unpaidCount: 0,
    lapseExpectedCount: 0,
    expiringSoonCount: 0,
  }
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatHundredMillion(value) {
  const amount = toHundredMillion(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return `${amount.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}억`
}

function formatPercent(value) {
  const percentage = Number(value ?? 0)

  if (!Number.isFinite(percentage)) {
    return '-'
  }

  return `${percentage.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function formatMonth(value) {
  return value ? String(value).replace('-', '.') : '-'
}

function formatCompactNumber(value) {
  return Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

function toHundredMillion(value) {
  return Number(value ?? 0) / 100000000
}

function formatPremium(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR')}원`
}

function formatDate(value) {
  return value ? String(value).replaceAll('-', '.') : '-'
}

function getContractStatusLabel(status) {
  return status || '-'
}

function getContractStatusBadgeClass(status) {
  if (status === '수금') {
    return 'contract-badge--success'
  }

  if (status === '미수금' || status === '실효') {
    return 'contract-badge--danger'
  }

  if (isNearMaturityContract(status)) {
    return 'contract-badge--warning'
  }

  return 'contract-badge--neutral'
}

function isNearMaturityContract(status) {
  return status === '만기임박' || status === '갱신임박'
}
</script>

<style scoped>
.contract-page {
  display: grid;
  gap: 18px;
}

.contract-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.contract-page__filters {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.contract-page__filter {
  width: 160px;
  flex: 0 0 auto;
}

.contract-page__filter--month {
  width: 210px;
}

.contract-page__create-button {
  min-width: 124px;
  height: 40px;
  background: #f97316;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: none;
}

.contract-page__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.contract-page__summary-state {
  min-height: 150px;
  display: grid;
  place-items: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: #64748b;
}

.contract-page__summary-state--error {
  color: #ef4444;
}

.contract-summary-card {
  min-height: 150px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.contract-summary-card__icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  margin-bottom: 12px;
}

.contract-summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.contract-summary-card__value strong {
  font-size: 28px;
  line-height: 1.1;
  color: #111827;
}

.contract-summary-card__value span,
.contract-summary-card p,
.contract-summary-card small {
  color: #6b7280;
}

.contract-summary-card p,
.contract-summary-card small {
  display: block;
  margin: 6px 0 0;
  font-size: 12px;
}

.contract-panel,
.contract-chart-panel,
.contract-insurer-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.contract-panel {
  padding: 18px 20px 20px;
}

.contract-panel h2,
.contract-chart-panel h2,
.contract-insurer-panel h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.contract-list-controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.contract-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.contract-tabs__button {
  min-width: 86px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.contract-tabs__button--active {
  border-bottom-color: #f97316;
  color: #f97316;
  font-weight: 700;
}

.contract-sort {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.contract-sort__label {
  flex: 0 0 auto;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.contract-sort__buttons {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
}

.contract-sort__button {
  min-height: 38px;
  padding: 0 16px;
  border: 0;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.contract-sort__button:last-child {
  border-right: 0;
}

.contract-sort__button:hover {
  color: #f97316;
}

.contract-sort__button--active,
.contract-sort__button--active:hover {
  background: #f97316;
  color: #ffffff;
}

.contract-table,
.contract-insurer-table {
  overflow-x: auto;
}

.contract-table {
  margin-top: 28px;
}

.contract-table table,
.contract-insurer-table table {
  width: 100%;
  border-collapse: collapse;
}

.contract-table table {
  min-width: 980px;
}

.contract-table th,
.contract-table td {
  padding: 13px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  text-align: left;
  color: #475569;
  white-space: nowrap;
}

.contract-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.contract-table__link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #f97316;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.contract-table__strong {
  font-weight: 700;
  color: #111827;
}

.contract-table__empty {
  height: 140px;
  text-align: center;
  color: #94a3b8;
}

.contract-table__state {
  height: 140px;
  text-align: center;
  color: #64748b;
}

.contract-table__state span {
  display: block;
  margin-top: 10px;
}

.contract-table__state--error {
  color: #ef4444;
}

.contract-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  vertical-align: middle;
}

.contract-badge + .contract-badge,
td span + .contract-badge {
  margin-left: 8px;
}

.contract-badge--success {
  background: #dcfce7;
  color: #16a34a;
}

.contract-badge--danger {
  background: #fee2e2;
  color: #ef4444;
}

.contract-badge--warning {
  background: #fef3c7;
  color: #f59e0b;
}

.contract-badge--neutral {
  background: #f1f5f9;
  color: #64748b;
}

.contract-panel__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: #64748b;
}

.contract-panel__pagination-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.contract-page__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);
  gap: 18px;
  margin-top: 70px;
}

.contract-chart-panel,
.contract-insurer-panel {
  min-height: 360px;
  padding: 24px 28px;
}

.contract-chart {
  margin-top: 28px;
}

.contract-chart__state {
  min-height: 250px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #64748b;
}

.contract-chart__state span {
  display: block;
  margin-top: 10px;
}

.contract-chart__state--error {
  color: #ef4444;
}

.contract-chart__canvas {
  position: relative;
  width: 100%;
  height: 280px;
}

.contract-insurer-table {
  margin-top: 24px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.contract-insurer-table th,
.contract-insurer-table td {
  padding: 14px 16px;
  border-right: 1px solid #d1d5db;
  border-bottom: 1px solid #d1d5db;
  text-align: left;
}

.contract-insurer-table th:last-child,
.contract-insurer-table td:last-child {
  border-right: 0;
}

.contract-insurer-table tr:last-child td {
  border-bottom: 0;
}

.contract-insurer-table th {
  background: #f3f4f6;
  font-weight: 700;
}

.contract-insurer-table__state {
  height: 140px;
  text-align: center;
  color: #64748b;
}

.contract-insurer-table__state span {
  display: block;
  margin-top: 10px;
}

.contract-insurer-table__state--error {
  color: #ef4444;
}

@media (max-width: 1180px) {
  .contract-page__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .contract-page__bottom {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
}

@media (max-width: 768px) {
  .contract-page__toolbar,
  .contract-page__filters,
  .contract-list-controls,
  .contract-panel__pagination,
  .contract-panel__pagination-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .contract-page__filter,
  .contract-page__filter--month {
    width: 100%;
  }

  .contract-page__create-button {
    width: 100%;
  }

  .contract-tabs {
    width: 100%;
  }

  .contract-sort {
    width: 100%;
    margin-left: 0;
    align-items: flex-start;
    flex-direction: column;
  }

  .contract-sort__buttons {
    width: 100%;
    overflow-x: auto;
  }

  .contract-sort__button {
    flex: 1 0 auto;
  }

  .contract-page__summary {
    grid-template-columns: 1fr;
  }

  .contract-chart-panel,
  .contract-insurer-panel {
    padding: 18px;
  }

  .contract-chart__canvas {
    min-width: 360px;
  }
}
</style>
