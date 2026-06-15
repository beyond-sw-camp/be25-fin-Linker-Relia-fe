<template>
  <section class="commission-page">
    <div class="commission-page__hero">
      <div>
        <p class="commission-page__eyebrow">Commission Overview</p>
        <h2>수수료 관리</h2>
        <p class="commission-page__description">
          로그인한 설계사의 지급 수수료 현황과 지급 정보를 조회할 수 있습니다.
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
      </div>
    </div>

    <v-alert v-if="validationMessage" type="warning" variant="tonal" density="comfortable">
      {{ validationMessage }}
    </v-alert>

    <div class="commission-summary">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-card__header">
          <div class="summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
            <v-icon :icon="card.icon" size="18" />
          </div>
          <span v-if="card.badge" class="summary-card__badge" :class="card.badgeClass">{{ card.badge }}</span>
        </div>
        <p class="summary-card__label">{{ card.label }}</p>
        <strong class="summary-card__value" :class="card.valueClass">{{ card.value }}</strong>
        <p class="summary-card__caption">{{ card.caption }}</p>
      </article>
    </div>

    <div class="commission-grid commission-grid--top">
      <section class="panel panel--wide">
        <div class="panel__header">
          <div>
            <h3>지급 구분 요약</h3>
            <p>초회 수수료, 유지 수수료, 환수 금액 비중을 보여줍니다.</p>
          </div>
        </div>

        <div v-if="isPaymentTypeLoading" class="panel__state">
          <v-progress-circular indeterminate color="#f97316" />
          <p>지급 구분 데이터를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="paymentTypeErrorMessage" class="panel__state panel__state--error">
          <p>{{ paymentTypeErrorMessage }}</p>
        </div>
        <div v-else-if="paymentTypeItems.length === 0" class="panel__state">
          <p>지급 구분 요약 데이터가 없습니다.</p>
        </div>
        <div v-else class="payment-type-panel">
          <div class="payment-type-panel__chart">
            <div class="donut-chart" :style="paymentTypeDonutStyle">
              <div class="donut-chart__center">
                <strong>{{ formatCurrency(paymentTypeTotalAmount) }}</strong>
                <span>총 지급 기준</span>
              </div>
            </div>
          </div>
          <div class="payment-type-panel__legend">
            <article
              v-for="item in paymentTypeItems"
              :key="item.label"
              class="legend-row"
            >
              <div class="legend-row__label">
                <span class="legend-row__dot" :style="{ backgroundColor: item.color }" />
                <strong>{{ item.label }}</strong>
              </div>
              <div class="legend-row__metrics">
                <span>{{ formatCurrency(item.amount) }}</span>
                <strong>{{ formatPercent(item.ratio) }}</strong>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div class="commission-grid commission-grid--stack">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>월별 수수료 조회</h3>
            <p>최근 6개월 추이 API가 준비되면 이 영역에 연결됩니다.</p>
          </div>
        </div>

        <div class="panel__state">
          <v-icon icon="mdi-chart-timeline-variant" size="28" color="#94a3b8" />
          <p>월별 추이 API가 아직 준비되지 않아 현재는 빈 상태로 표시합니다.</p>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>보험사별 수수료 조회</h3>
            <p>총 지급 수수료 기준 상위 보험사 현황입니다.</p>
          </div>
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
        <div v-else class="insurer-panel">
          <div class="insurer-panel__chart">
            <div class="bar-stack">
              <article
                v-for="item in insuranceCompanyItems"
                :key="item.name"
                class="bar-stack__row"
              >
                <div class="bar-stack__head">
                  <strong>{{ item.name }}</strong>
                  <span>{{ formatCurrency(item.amount) }}</span>
                </div>
                <div class="bar-stack__track">
                  <div class="bar-stack__fill" :style="{ width: `${Math.max(item.ratio, 4)}%` }" />
                </div>
              </article>
            </div>
          </div>

          <div class="insurer-panel__rankings">
            <article
              v-for="(item, index) in insuranceCompanyItems"
              :key="`${item.name}-${index}`"
              class="insurer-rank"
            >
              <div class="insurer-rank__head">
                <span class="insurer-rank__index">{{ String(index + 1).padStart(2, '0') }}</span>
                <strong>{{ item.name }}</strong>
              </div>
              <div class="insurer-rank__meta">
                <span>{{ formatCurrency(item.amount) }}</span>
                <span>{{ formatPercent(item.ratio) }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  getCommissionInsuranceCompanySummary,
  getCommissionPaymentTypeSummary,
  getFpCommissionSummary,
} from '../../api/commissions'
import { formatCurrency } from '../../utils/formatters'

const PAYMENT_TYPE_CONFIG = [
  { label: '초회 수수료', color: '#f97316', keys: ['firstCommissionAmount', 'initialCommissionAmount'] },
  { label: '유지 수수료', color: '#2563eb', keys: ['renewalCommissionAmount', 'maintenanceCommissionAmount'] },
  { label: '환수 금액', color: '#ef4444', keys: ['clawbackAmount', 'recoveryAmount', 'refundAmount'] },
]

const filters = reactive({
  closingMonth: getLatestAvailableClosingMonth(),
})

const validationMessage = ref('')
const summary = ref(createEmptyFpSummary())
const paymentTypeItems = ref([])
const insuranceCompanyItems = ref([])

const isSummaryLoading = ref(false)
const isPaymentTypeLoading = ref(false)
const isInsuranceCompanyLoading = ref(false)

const summaryErrorMessage = ref('')
const paymentTypeErrorMessage = ref('')
const insuranceCompanyErrorMessage = ref('')

const summaryCards = computed(() => [
  {
    label: '지급 예정 수수료',
    value: formatCurrency(summary.value.totalPaymentCommissionAmount),
    caption: summaryErrorMessage.value || `전월 ${formatCurrency(summary.value.previousNetCommissionAmount)}`,
    accent: '#f97316',
    tone: '#fff3e8',
    icon: 'mdi-cash-fast',
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
    label: '순수수료',
    value: formatCurrency(summary.value.netCommissionAmount),
    caption: `계약 ${formatCount(summary.value.contractCount)}건`,
    accent: '#2563eb',
    tone: '#eff6ff',
    icon: 'mdi-finance',
  },
  {
    label: '전월 대비 증감률',
    value: formatComparisonRate(summary.value.comparisonRate),
    caption:
      summary.value.comparisonAmount === null
        ? '비교 데이터 없음'
        : `전월 ${formatCurrency(summary.value.comparisonAmount)} 변동`,
    accent: '#22c55e',
    tone: '#ecfdf3',
    icon: 'mdi-trending-up',
    valueClass: getComparisonRateClass(summary.value.comparisonRate),
  },
])

const paymentTypeTotalAmount = computed(() =>
  paymentTypeItems.value.reduce((sum, item) => sum + item.amount, 0),
)

const paymentTypeDonutStyle = computed(() => buildDonutStyle(paymentTypeItems.value))
const latestAvailableClosingMonth = computed(() => getLatestAvailableClosingMonth())

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

  await Promise.all([loadSummary(), loadPaymentTypes(), loadInsuranceCompanies()])
}

function resetFilters() {
  filters.closingMonth = latestAvailableClosingMonth.value
}

async function loadSummary() {
  summaryErrorMessage.value = ''
  isSummaryLoading.value = true

  try {
    const response = await getFpCommissionSummary({
      closingMonth: filters.closingMonth,
    })

    summary.value = normalizeFpSummary(response?.result, filters.closingMonth)
  } catch (error) {
    summary.value = createEmptyFpSummary(filters.closingMonth)
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

async function loadInsuranceCompanies() {
  insuranceCompanyErrorMessage.value = ''
  isInsuranceCompanyLoading.value = true

  try {
    const response = await getCommissionInsuranceCompanySummary({
      closingMonth: filters.closingMonth,
    })

    insuranceCompanyItems.value = normalizeInsuranceCompanyItems(response?.result).slice(0, 5)
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

function normalizeFpSummary(result, closingMonth = getCurrentMonth()) {
  const comparison = result?.comparison ?? {}
  const totalPaymentCommissionAmount = toNumber(
    getValue(result, [
      'totalPaymentCommissionAmount',
      'totalCommissionAmount',
      'paymentCommissionAmount',
      'totalPaidCommissionAmount',
      'totalPaymentAmount',
    ]),
  )

  const clawbackAmount = toNumber(
    getValue(result, [
      'clawbackAmount',
      'recoveryAmount',
      'refundAmount',
      'totalRecoveryCollectionAmount',
      'totalRecoveryAmount',
    ]),
  )
  const netCommissionAmount = toNumber(getValue(result, ['netCommissionAmount', 'netAmount']))
  const comparisonRate = toNullableNumber(
    getValue(comparison, ['growthRate', 'comparisonRate', 'monthOverMonthRate']) ??
      getValue(result, ['comparisonRate', 'monthOverMonthRate']),
  )
  const comparisonAmount = toNullableNumber(
    getValue(comparison, ['differenceAmount', 'comparisonAmount', 'monthOverMonthAmount']) ??
      getValue(result, ['comparisonAmount', 'monthOverMonthAmount']),
  )
  const isClosed = Boolean(getValue(result, ['closingCompleted', 'closed', 'isClosed']))
  const closingReference =
    getValue(result, ['closingReferenceMonth', 'closedMonth', 'closingMonth']) || closingMonth

  return {
    totalPaymentCommissionAmount,
    clawbackAmount,
    netCommissionAmount,
    contractCount: toNumber(getValue(result, ['contractCount', 'totalContractCount'])),
    clawbackContractCount: toNumber(
      getValue(result, ['clawbackContractCount', 'recoveryContractCount', 'recoveryContractCount']),
    ),
    previousNetCommissionAmount: toNumber(
      getValue(comparison, ['previousNetCommissionAmount', 'previousAmount']),
    ),
    comparisonRate,
    comparisonAmount,
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

  const normalized = items.map((item) => {
    const amount = toNumber(
      getValue(item, [
        'totalPaymentCommissionAmount',
        'totalCommissionAmount',
        'netCommissionAmount',
        'netProfitCommissionAmount',
        'totalPaymentAmount',
        'netAmount',
      ]),
    )

    return {
      name: getValue(item, ['insuranceCompanyName', 'companyName']) || '-',
      amount,
      ratio: toNullableNumber(getValue(item, ['ratio', 'shareRate', 'percentage'])) ?? 0,
    }
  })

  const totalAmount = normalized.reduce((sum, item) => sum + item.amount, 0)

  return normalized
    .map((item) => ({
      ...item,
      ratio: item.ratio > 0 ? item.ratio : totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount)
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

function createEmptyFpSummary(closingMonth = getCurrentMonth()) {
  return {
    totalPaymentCommissionAmount: 0,
    clawbackAmount: 0,
    netCommissionAmount: 0,
    contractCount: 0,
    clawbackContractCount: 0,
    previousNetCommissionAmount: 0,
    comparisonRate: null,
    comparisonAmount: null,
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

function buildDonutStyle(items) {
  if (!items.length) {
    return {
      background: 'conic-gradient(#e5e7eb 0deg 360deg)',
    }
  }

  let startDegree = 0
  const segments = items.map((item) => {
    const endDegree = startDegree + (item.ratio / 100) * 360
    const segment = `${item.color} ${startDegree}deg ${endDegree}deg`
    startDegree = endDegree
    return segment
  })

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  }
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

.commission-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
  border: 1px solid #ebeef4;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.summary-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.summary-card__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
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
  font-size: 31px;
  line-height: 1.08;
  color: #111827;
}

.summary-card__value--success {
  color: #16a34a;
}

.summary-card__value--danger {
  color: #ef4444;
}

.summary-card__caption {
  margin-top: 8px;
  font-size: 12px;
}

.commission-grid {
  display: grid;
  gap: 18px;
}

.commission-grid--top {
  grid-template-columns: minmax(0, 1fr);
}

.commission-grid--stack {
  grid-template-columns: minmax(0, 1fr);
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

.panel__state {
  min-height: 240px;
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

.payment-type-panel {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}

.payment-type-panel__chart,
.insurer-panel__chart {
  position: relative;
}

.payment-type-panel__chart {
  height: 230px;
}

.donut-chart {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto;
  border-radius: 50%;
}

.donut-chart::after {
  content: '';
  position: absolute;
  inset: 28px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #edf2f7;
}

.donut-chart__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  text-align: center;
}

.donut-chart__center strong,
.donut-chart__center span {
  display: block;
}

.donut-chart__center strong {
  font-size: 18px;
  color: #111827;
}

.donut-chart__center span {
  font-size: 12px;
  color: #64748b;
}

.payment-type-panel__legend {
  display: grid;
  gap: 14px;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.legend-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.legend-row__label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
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
}

.legend-row__metrics strong {
  color: #111827;
}

.insurer-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 24px;
  align-items: start;
}

.insurer-panel__chart {
  min-height: 320px;
}

.insurer-panel__rankings {
  display: grid;
  gap: 12px;
}

.bar-stack {
  display: grid;
  gap: 16px;
  padding-top: 6px;
}

.bar-stack__row {
  display: grid;
  gap: 8px;
}

.bar-stack__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  font-size: 13px;
}

.bar-stack__head strong {
  color: #111827;
}

.bar-stack__track {
  width: 100%;
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.bar-stack__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f97316 0%, #fb923c 100%);
}

.insurer-rank {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.insurer-rank__head,
.insurer-rank__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.insurer-rank__head {
  margin-bottom: 6px;
}

.insurer-rank__head strong {
  color: #111827;
}

.insurer-rank__index {
  font-size: 12px;
  font-weight: 700;
  color: #f97316;
}

.insurer-rank__meta {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .commission-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .payment-type-panel,
  .insurer-panel {
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
