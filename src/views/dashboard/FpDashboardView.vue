<template>
  <section class="fp-dashboard" aria-label="설계사 대시보드">
    <div class="fp-dashboard__main">
      <div class="fp-dashboard__heading">
        <div>
          <h2>설계사 대시보드</h2>
          <p>본인의 계약, 상담, 고객, 일정 현황을 한눈에 확인할 수 있습니다.</p>
        </div>
      </div>

      <div class="fp-dashboard__notice">
        <span>
          <v-icon icon="mdi-information-outline" size="16" />
          {{ comparisonLabel }} 마감 기준으로 집계된 데이터입니다.
        </span>
      </div>

      <div v-if="summaryError" class="fp-dashboard__error">
        {{ summaryError }}
      </div>

      <div class="metric-grid" aria-label="주요 지표">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <div class="metric-card__icon" :style="{ color: metric.color, backgroundColor: metric.tone }">
            <v-icon :icon="metric.icon" size="19" />
          </div>
          <div class="metric-card__value">
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.unit }}</span>
          </div>
          <p>{{ metric.label }}</p>
          <small>
            <v-progress-circular v-if="isSummaryLoading" indeterminate color="#16a34a" size="12" width="2" />
            <v-icon v-else :icon="metric.isDown ? 'mdi-triangle-small-down' : 'mdi-triangle-small-up'" size="16" />
            {{ metric.change }}
          </small>
        </article>
      </div>

      <section class="contract-overview panel">
        <div class="panel__title-row">
          <h3>계약 현황 및 건수 조회</h3>
        </div>

        <div v-if="isContractStatusLoading" class="contract-overview__state">
          <v-progress-circular indeterminate color="#f97316" size="22" width="2" />
          <span>계약 상태를 불러오는 중입니다.</span>
        </div>
        <div v-else-if="contractStatusError" class="contract-overview__state contract-overview__state--error">
          {{ contractStatusError }}
        </div>
        <div v-else class="contract-overview__cards">
          <article
            v-for="card in contractStatusCards"
            :key="card.label"
            class="status-card"
            :class="card.className"
          >
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}<small>건</small></strong>
            <p>{{ card.caption }}</p>
          </article>
        </div>
      </section>

      <div class="chart-grid">
        <section class="panel chart-panel">
          <h3>보험사별 계약 건수</h3>
          <div v-if="isDistributionLoading" class="chart-state">
            <v-progress-circular indeterminate color="#f97316" size="22" width="2" />
            <span>계약 분포를 불러오는 중입니다.</span>
          </div>
          <div v-else-if="distributionError" class="chart-state chart-state--error">
            {{ distributionError }}
          </div>
          <div v-else-if="insurerBars.length === 0" class="chart-state">
            보험사별 계약 데이터가 없습니다.
          </div>
          <div v-else class="bar-chart" aria-label="보험사별 계약 건수 차트">
            <div v-for="bar in insurerBars" :key="bar.label" class="bar-chart__item">
              <strong>{{ bar.value }}건</strong>
              <div class="bar-chart__bar" :style="{ height: `${bar.height}%` }"></div>
              <span>{{ bar.label }}</span>
            </div>
          </div>
        </section>

        <section class="panel chart-panel chart-panel--donut">
          <h3>보종별 계약 건수</h3>
          <div v-if="isDistributionLoading" class="chart-state">
            <v-progress-circular indeterminate color="#f97316" size="22" width="2" />
            <span>계약 분포를 불러오는 중입니다.</span>
          </div>
          <div v-else-if="distributionError" class="chart-state chart-state--error">
            {{ distributionError }}
          </div>
          <div v-else-if="productSummary.length === 0" class="chart-state">
            보종별 계약 데이터가 없습니다.
          </div>
          <div v-else class="donut-summary">
            <div class="donut-summary__chart" :style="{ background: donutGradient }" aria-hidden="true"></div>
            <ul>
              <li v-for="item in productSummary" :key="item.label">
                <span :style="{ backgroundColor: item.color }"></span>
                {{ item.label }}
                <strong>{{ item.value }}건 · {{ item.ratio }}%</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="panel chart-panel">
          <h3>월별 계약/고객 건수</h3>
          <div v-if="isTrendLoading" class="chart-state">
            <v-progress-circular indeterminate color="#f97316" size="22" width="2" />
            <span>월별 추이를 불러오는 중입니다.</span>
          </div>
          <div v-else-if="trendError" class="chart-state chart-state--error">
            {{ trendError }}
          </div>
          <div v-else-if="monthlyTrendItems.length === 0" class="chart-state">
            월별 계약/고객 데이터가 없습니다.
          </div>
          <div v-else class="line-chart-wrap" @mouseleave="hideTrendTooltip">
            <svg class="line-chart" viewBox="0 0 520 170" role="img" aria-label="월별 계약 고객 건수 차트">
              <g class="line-chart__grid">
                <line v-for="y in [20, 60, 100, 140]" :key="`h-${y}`" x1="24" :y1="y" x2="500" :y2="y" />
                <line v-for="point in monthlyTrendPoints.customers" :key="`v-${point.x}`" :x1="point.x" y1="16" :x2="point.x" y2="145" />
              </g>
              <polyline :points="monthlyTrendPolyline.customers" fill="none" stroke="#2563eb" stroke-width="3" />
              <polyline :points="monthlyTrendPolyline.contracts" fill="none" stroke="#f97316" stroke-width="3" />
              <g>
                <circle
                  v-for="point in monthlyTrendPoints.customers"
                  :key="`c-${point.month}`"
                  class="line-chart__point"
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  fill="#2563eb"
                  @mouseenter="showTrendTooltip(point)"
                  @mousemove="showTrendTooltip(point)"
                />
                <circle
                  v-for="point in monthlyTrendPoints.contracts"
                  :key="`p-${point.month}`"
                  class="line-chart__point"
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  fill="#f97316"
                  @mouseenter="showTrendTooltip(point)"
                  @mousemove="showTrendTooltip(point)"
                />
              </g>
              <g class="line-chart__labels">
                <text v-for="point in monthlyTrendPoints.customers" :key="point.month" :x="point.x" y="164">{{ point.label }}</text>
              </g>
            </svg>
            <div
              v-if="trendTooltip.visible"
              class="line-chart-tooltip"
              :style="{ left: `${trendTooltip.x}%`, top: `${trendTooltip.y}%` }"
            >
              <strong>{{ trendTooltip.label }}</strong>
              <span><i class="chart-legend__dot chart-legend__dot--orange"></i>계약 {{ trendTooltip.contracts }}건</span>
              <span><i class="chart-legend__dot chart-legend__dot--blue"></i>신규 고객 {{ trendTooltip.customers }}명</span>
            </div>
          </div>
          <div class="chart-legend">
            <span><i class="chart-legend__dot chart-legend__dot--orange"></i>계약 건수</span>
            <span><i class="chart-legend__dot chart-legend__dot--blue"></i>신규 고객</span>
          </div>
          <div v-if="monthlyTrendSummaryRows.length" class="chart-summary-table">
            <table>
              <thead>
                <tr>
                  <th>{{ summaryTableLabels.month }}</th>
                  <th>{{ summaryTableLabels.contractCount }}</th>
                  <th>{{ summaryTableLabels.customerCount }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in monthlyTrendSummaryRows" :key="row.month">
                  <td>{{ row.label }}</td>
                  <td>{{ row.contractCount }}</td>
                  <td>{{ row.customerCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel chart-panel">
          <h3>월별 수수료 추이</h3>
          <div v-if="isCommissionTrendLoading" class="chart-state">
            <v-progress-circular indeterminate color="#f97316" size="22" width="2" />
            <span>월별 수수료 추이를 불러오는 중입니다.</span>
          </div>
          <div v-else-if="commissionTrendError" class="chart-state chart-state--error">
            {{ commissionTrendError }}
          </div>
          <div v-else-if="commissionTrendItems.length === 0 || !hasCommissionTrendValue" class="chart-state">
            월별 수수료 데이터가 없습니다.
          </div>
          <div v-else class="line-chart-wrap" @mouseleave="hideCommissionTooltip">
            <svg class="line-chart" viewBox="0 0 520 170" role="img" aria-label="월별 수수료 추이 차트">
              <g class="line-chart__grid">
                <line v-for="y in [20, 60, 100, 140]" :key="`fee-h-${y}`" x1="24" :y1="y" x2="500" :y2="y" />
                <line v-for="point in commissionTrendPoints" :key="`fee-v-${point.x}`" :x1="point.x" y1="16" :x2="point.x" y2="145" />
                <line
                  v-if="showCommissionZeroLine"
                  class="line-chart__zero-line"
                  x1="24"
                  :y1="commissionZeroLineY"
                  x2="500"
                  :y2="commissionZeroLineY"
                />
              </g>
              <polyline :points="commissionTrendPolyline" fill="none" stroke="#16a34a" stroke-width="3" />
              <circle
                v-for="point in commissionTrendPoints"
                :key="`f-${point.month}`"
                class="line-chart__point"
                :cx="point.x"
                :cy="point.y"
                r="5"
                fill="#16a34a"
                @mouseenter="showCommissionTooltip(point)"
                @mousemove="showCommissionTooltip(point)"
              />
              <g class="line-chart__labels">
                <text v-for="point in commissionTrendPoints" :key="`fee-${point.month}`" :x="point.x" y="164">{{ point.label }}</text>
              </g>
            </svg>
            <div
              v-if="commissionTooltip.visible"
              class="line-chart-tooltip"
              :style="{ left: `${commissionTooltip.x}%`, top: `${commissionTooltip.y}%` }"
            >
              <strong>{{ commissionTooltip.label }}</strong>
              <span><i class="chart-legend__dot chart-legend__dot--green"></i>수수료 {{ commissionTooltip.amount }}원</span>
            </div>
          </div>
          <div class="chart-legend">
            <span><i class="chart-legend__dot chart-legend__dot--green"></i>{{ summaryTableLabels.commission }}</span>
          </div>
          <div v-if="commissionTrendSummaryRows.length" class="chart-summary-table">
            <table>
              <thead>
                <tr>
                  <th>{{ summaryTableLabels.month }}</th>
                  <th>{{ summaryTableLabels.commission }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in commissionTrendSummaryRows" :key="row.month">
                  <td>{{ row.label }}</td>
                  <td>{{ row.amount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <aside class="fp-dashboard__side" aria-label="일정 및 상담">
      <section class="side-panel calendar-panel">
        <h3>일정 캘린더</h3>
        <div class="calendar-panel__month">
          <v-icon icon="mdi-chevron-left" size="18" />
          <strong>2024년 7월</strong>
          <v-icon icon="mdi-chevron-right" size="18" />
        </div>
        <div class="calendar-grid">
          <span v-for="day in weekDays" :key="day" class="calendar-grid__weekday">{{ day }}</span>
          <button
            v-for="day in calendarDays"
            :key="day.date"
            type="button"
            class="calendar-grid__day"
            :class="{
              'calendar-grid__day--active': day.date === 1,
              'calendar-grid__day--today': day.hasSchedule,
              'calendar-grid__day--muted': day.muted,
            }"
          >
            {{ day.label }}
          </button>
        </div>
        <div class="calendar-panel__legend">
          <span><i></i>상담</span>
          <span><i></i>만기</span>
        </div>
      </section>

      <section class="side-panel schedule-panel">
        <div class="schedule-panel__heading">
          <h3>오늘 상담 일정</h3>
          <span>7월 1일 (월)</span>
        </div>
        <div class="schedule-list">
          <article v-for="item in schedules" :key="item.name" class="schedule-card" :class="{ 'is-done': item.done }">
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.type }}</span>
            </div>
            <button type="button">{{ item.done ? '수정' : '일지' }}</button>
          </article>
        </div>
        <button class="schedule-panel__memo" type="button">메모 추가하기</button>
      </section>
    </aside>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getFpDashboardContractStatus,
  getFpDashboardContractDistribution,
  getFpDashboardMonthlyContractCustomerTrend,
  getFpDashboardMonthlyCommissionTrend,
  getFpDashboardSummary,
} from '../../api/dashboard'
const chartColors = ['#2563eb', '#f97316', '#16a34a', '#f59e0b', '#7c3aed', '#0f766e']
const summary = ref(createEmptySummary())
const isSummaryLoading = ref(false)
const summaryError = ref('')
const contractStatusSummary = ref(createEmptyContractStatusSummary())
const isContractStatusLoading = ref(false)
const contractStatusError = ref('')
const distribution = ref(createEmptyContractDistribution())
const isDistributionLoading = ref(false)
const distributionError = ref('')
const monthlyTrend = ref(createEmptyMonthlyTrend())
const isTrendLoading = ref(false)
const trendError = ref('')
const commissionTrend = ref(createEmptyCommissionTrend())
const isCommissionTrendLoading = ref(false)
const commissionTrendError = ref('')
const trendTooltip = ref({
  visible: false,
  label: '',
  contracts: '0',
  customers: '0',
  x: 0,
  y: 0,
})
const commissionTooltip = ref({
  visible: false,
  label: '',
  amount: '0',
  x: 0,
  y: 0,
})

const comparisonLabel = computed(() => formatClosingMonth(summary.value.comparisonClosingMonth))
const summaryTableLabels = {
  month: '\uC6D4',
  contractCount: '\uACC4\uC57D \uAC74\uC218',
  customerCount: '\uACE0\uAC1D \uC218',
  commission: '\uC218\uC218\uB8CC',
}

const metrics = computed(() => [
  {
    icon: 'mdi-file-document-outline',
    value: formatCount(summary.value.newContractCount),
    unit: '건',
    label: '신규 계약 수',
    change: `${formatSignedCount(summary.value.newContractDiff)} 전월 대비`,
    isDown: Number(summary.value.newContractDiff) < 0,
    color: '#2563eb',
    tone: '#eef4ff',
  },
  {
    icon: 'mdi-trending-up',
    value: formatDecimal(summary.value.retentionRate, 1),
    unit: '%',
    label: '유지율',
    change: `${formatSignedDecimal(summary.value.retentionRateDiff, 1)}%p 전월 대비`,
    isDown: Number(summary.value.retentionRateDiff) < 0,
    color: '#16a34a',
    tone: '#eafaf0',
  },
  {
    icon: 'mdi-podium-gold',
    value: formatNullableCount(summary.value.branchRank),
    unit: '위',
    label: '지점 내 자신의 순위',
    change: formatRankChange(summary.value.branchRankChange),
    isDown: Number(summary.value.branchRankChange) > 0,
    color: '#f97316',
    tone: '#fff1e8',
  },
  {
    icon: 'mdi-account-group-outline',
    value: formatCount(summary.value.customerCount),
    unit: '명',
    label: '담당 고객 수',
    change: `${formatSignedCount(summary.value.customerDiff)} 전월 대비`,
    isDown: Number(summary.value.customerDiff) < 0,
    color: '#2563eb',
    tone: '#eef4ff',
  },
  {
    icon: 'mdi-account-plus-outline',
    value: formatCount(summary.value.newHandoverCount),
    unit: '명',
    label: '신규 인수인계',
    change: `${formatSignedCount(summary.value.handoverDiff)} 전월 대비`,
    isDown: Number(summary.value.handoverDiff) < 0,
    color: '#7c3aed',
    tone: '#f3edff',
  },
  {
    icon: 'mdi-cash-multiple',
    value: formatCurrencyNumber(summary.value.expectedCommissionAmount),
    unit: '원',
    label: '수수료',
    change: `${formatSignedCurrency(summary.value.commissionDiffAmount)} 전월 대비`,
    isDown: Number(summary.value.commissionDiffAmount) < 0,
    color: '#f97316',
    tone: '#fff1e8',
  },
])

const contractStatusCards = computed(() => [
  {
    label: '전체 계약',
    value: formatCount(contractStatusSummary.value.totalContractCount),
    caption: '전월 마감 기준 전체 계약',
    className: 'status-card--total',
  },
  {
    label: '유지',
    value: formatCount(contractStatusSummary.value.maintenanceContractCount),
    caption: '정상 유지 중인 계약',
    className: 'status-card--normal',
  },
  {
    label: '실효',
    value: formatCount(contractStatusSummary.value.lapsedContractCount),
    caption: '실효 상태의 계약',
    className: 'status-card--lapse',
  },
  {
    label: '해지',
    value: formatCount(contractStatusSummary.value.terminatedContractCount),
    caption: '해지 처리된 계약',
    className: 'status-card--terminated',
  },
  {
    label: '만기',
    value: formatCount(contractStatusSummary.value.completedContractCount),
    caption: '만기된 계약',
    className: 'status-card--completed',
  },
])

const insurerBars = computed(() => {
  const items = buildTopItems(distribution.value.insuranceCompanies, 'insuranceCompanyName')
  const maxCount = Math.max(...items.map((item) => item.contractCount), 1)

  return items.map((item) => ({
    label: item.label,
    value: item.contractCount,
    height: Math.max((item.contractCount / maxCount) * 100, 8),
  }))
})

const productSummary = computed(() => {
  const items = distribution.value.insuranceCategories.map((item) => ({
    label: item.label ?? item.insuranceCategoryName ?? '-',
    contractCount: toNumber(item.contractCount),
  }))
  const total = items.reduce((sum, item) => sum + item.contractCount, 0)

  return items.map((item, index) => ({
    label: item.label,
    value: item.contractCount.toLocaleString('ko-KR'),
    ratio: total > 0 ? ((item.contractCount / total) * 100).toFixed(1) : '0.0',
    rawValue: item.contractCount,
    color: chartColors[index % chartColors.length],
  }))
})

const donutGradient = computed(() => {
  if (productSummary.value.length === 0) {
    return '#f1f5f9'
  }

  const total = productSummary.value.reduce((sum, item) => sum + item.rawValue, 0)
  let cursor = 0

  const stops = productSummary.value.map((item) => {
    const start = cursor
    const end = total > 0 ? cursor + (item.rawValue / total) * 100 : cursor
    cursor = end

    return `${item.color} ${start}% ${end}%`
  })

  return `conic-gradient(${stops.join(', ')})`
})

const monthlyTrendItems = computed(() => monthlyTrend.value.monthlyTrends)

const monthlyTrendPoints = computed(() => {
  const items = monthlyTrendItems.value
  const maxValue = Math.max(
    ...items.map((item) => item.newContractCount),
    ...items.map((item) => item.customerCount),
    1,
  )

  return {
    contracts: items.map((item, index) => buildMonthlyTrendPoint(item, index, items.length, item.newContractCount, maxValue)),
    customers: items.map((item, index) => buildMonthlyTrendPoint(item, index, items.length, item.customerCount, maxValue)),
  }
})

const monthlyTrendPolyline = computed(() => ({
  contracts: monthlyTrendPoints.value.contracts.map((point) => `${point.x},${point.y}`).join(' '),
  customers: monthlyTrendPoints.value.customers.map((point) => `${point.x},${point.y}`).join(' '),
}))

const monthlyTrendSummaryRows = computed(() =>
  monthlyTrendItems.value.map((item) => ({
    month: item.month,
    label: item.label,
    contractCount: `${formatCount(item.newContractCount)}\uAC74`,
    customerCount: `${formatCount(item.customerCount)}\uBA85`,
  })),
)

const commissionTrendItems = computed(() => commissionTrend.value.monthlyTrends)
const hasCommissionTrendValue = computed(() =>
  commissionTrendItems.value.some((item) => item.netCommissionAmount !== 0),
)

const commissionTrendRange = computed(() => {
  const values = commissionTrendItems.value.map((item) => item.netCommissionAmount)
  const minValue = Math.min(...values, 0)
  const maxValue = Math.max(...values, 0)

  if (minValue === maxValue) {
    if (minValue === 0) {
      return { min: 0, max: 1 }
    }

    return {
      min: Math.min(minValue, 0),
      max: Math.max(maxValue, 0),
    }
  }

  return {
    min: minValue,
    max: maxValue,
  }
})

const commissionTrendPoints = computed(() => {
  const items = commissionTrendItems.value
  const range = commissionTrendRange.value

  return items.map((item, index) =>
    buildRangeTrendPoint(item, index, items.length, item.netCommissionAmount, range.min, range.max),
  )
})

const commissionTrendPolyline = computed(() =>
  commissionTrendPoints.value.map((point) => `${point.x},${point.y}`).join(' '),
)

const showCommissionZeroLine = computed(
  () => commissionTrendRange.value.min < 0 && commissionTrendRange.value.max > 0,
)

const commissionZeroLineY = computed(() =>
  calculateTrendYPosition(0, commissionTrendRange.value.min, commissionTrendRange.value.max),
)

const commissionTrendSummaryRows = computed(() =>
  commissionTrendItems.value.map((item) => ({
    month: item.month,
    label: item.label,
    amount: `${formatCurrencyNumber(item.netCommissionAmount)}\uC6D0`,
  })),
)

onMounted(() => {
  loadDashboardSummary()
  loadContractStatusSummary()
  loadContractDistribution()
  loadMonthlyContractCustomerTrend()
  loadMonthlyCommissionTrend()
})

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const scheduleDates = new Set([1, 3, 5, 8, 12, 15, 18, 22, 25, 29])
const calendarDays = [
  { label: 30, date: 0, muted: true },
  ...Array.from({ length: 31 }, (_, index) => ({ label: index + 1, date: index + 1, muted: false })),
].map((day) => ({
  ...day,
  hasSchedule: scheduleDates.has(day.date),
}))

const schedules = [
  { name: '이수진', type: '신계약 상담 · 대면', done: true },
  { name: '박정호', type: '계약 갱신 · 전화', done: true },
  { name: '최미영', type: '보험료 납입 · 방문', done: false },
  { name: '김태현', type: '민원 처리 · 대면', done: false },
  { name: '정윤혜', type: '신계약 상담 · 화상', done: false },
]

async function loadDashboardSummary() {
  summaryError.value = ''
  isSummaryLoading.value = true

  try {
    const response = await getFpDashboardSummary()
    summary.value = normalizeSummary(response?.result)
  } catch (error) {
    summary.value = createEmptySummary()
    summaryError.value =
      error.response?.data?.message ||
      error.message ||
      '설계사 대시보드 요약 정보를 불러오지 못했습니다.'
  } finally {
    isSummaryLoading.value = false
  }
}

async function loadContractStatusSummary() {
  contractStatusError.value = ''
  isContractStatusLoading.value = true

  try {
    const response = await getFpDashboardContractStatus()
    contractStatusSummary.value = normalizeContractStatusSummary(response?.result)
  } catch (error) {
    contractStatusSummary.value = createEmptyContractStatusSummary()
    contractStatusError.value =
      error.response?.data?.message ||
      error.message ||
      '계약 상태 정보를 불러오지 못했습니다.'
  } finally {
    isContractStatusLoading.value = false
  }
}

async function loadContractDistribution() {
  distributionError.value = ''
  isDistributionLoading.value = true

  try {
    const response = await getFpDashboardContractDistribution()
    distribution.value = normalizeContractDistribution(response?.result)
  } catch (error) {
    distribution.value = createEmptyContractDistribution()
    distributionError.value =
      error.response?.data?.message ||
      error.message ||
      '계약 분포 정보를 불러오지 못했습니다.'
  } finally {
    isDistributionLoading.value = false
  }
}

async function loadMonthlyContractCustomerTrend() {
  trendError.value = ''
  isTrendLoading.value = true

  try {
    const response = await getFpDashboardMonthlyContractCustomerTrend()
    monthlyTrend.value = normalizeMonthlyTrend(response?.result)
  } catch (error) {
    monthlyTrend.value = createEmptyMonthlyTrend()
    trendError.value =
      error.response?.data?.message ||
      error.message ||
      '월별 계약/고객 추이를 불러오지 못했습니다.'
  } finally {
    isTrendLoading.value = false
  }
}

async function loadMonthlyCommissionTrend() {
  commissionTrendError.value = ''
  isCommissionTrendLoading.value = true

  try {
    const response = await getFpDashboardMonthlyCommissionTrend()
    commissionTrend.value = normalizeCommissionTrend(response?.result)
  } catch (error) {
    commissionTrend.value = createEmptyCommissionTrend()
    commissionTrendError.value =
      error.response?.data?.message ||
      error.message ||
      '월별 수수료 추이를 불러오지 못했습니다.'
  } finally {
    isCommissionTrendLoading.value = false
  }
}

function normalizeSummary(payload) {
  const fallback = createEmptySummary()

  return {
    referenceDate: payload?.referenceDate ?? fallback.referenceDate,
    comparisonClosingMonth: payload?.comparisonClosingMonth ?? fallback.comparisonClosingMonth,
    newContractCount: toNumber(payload?.newContractCount),
    newContractDiff: toNumber(payload?.newContractDiff),
    retentionRate: toNumber(payload?.retentionRate),
    retentionRateDiff: toNumber(payload?.retentionRateDiff),
    branchRank: payload?.branchRank == null ? null : toNumber(payload.branchRank),
    branchRankChange: payload?.branchRankChange == null ? null : toNumber(payload.branchRankChange),
    customerCount: toNumber(payload?.customerCount),
    customerDiff: toNumber(payload?.customerDiff),
    newHandoverCount: toNumber(payload?.newHandoverCount),
    handoverDiff: toNumber(payload?.handoverDiff),
    expectedCommissionAmount: toNumber(payload?.expectedCommissionAmount),
    commissionDiffAmount: toNumber(payload?.commissionDiffAmount),
  }
}

function normalizeContractStatusSummary(payload) {
  return {
    totalContractCount: toNumber(payload?.totalContractCount),
    maintenanceContractCount: toNumber(payload?.maintenanceContractCount),
    lapsedContractCount: toNumber(payload?.lapsedContractCount),
    terminatedContractCount: toNumber(payload?.terminatedContractCount),
    completedContractCount: toNumber(payload?.completedContractCount),
  }
}

function normalizeContractDistribution(payload) {
  return {
    referenceDate: payload?.referenceDate ?? '',
    closingMonth: payload?.closingMonth ?? '',
    totalContractCount: toNumber(payload?.totalContractCount),
    insuranceCompanies: normalizeDistributionItems(payload?.insuranceCompanies, 'insuranceCompanyName'),
    insuranceCategories: normalizeDistributionItems(payload?.insuranceCategories, 'insuranceCategoryName'),
  }
}

function normalizeMonthlyTrend(payload) {
  return {
    referenceDate: payload?.referenceDate ?? '',
    startMonth: payload?.startMonth ?? '',
    endMonth: payload?.endMonth ?? '',
    monthlyTrends: normalizeMonthlyTrendItems(payload?.monthlyTrends),
  }
}

function normalizeCommissionTrend(payload) {
  return {
    referenceDate: payload?.referenceDate ?? '',
    startMonth: payload?.startMonth ?? '',
    endMonth: payload?.endMonth ?? '',
    monthlyTrends: normalizeCommissionTrendItems(payload?.monthlyTrends),
  }
}

function normalizeMonthlyTrendItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    month: item?.month ?? '',
    label: formatMonthLabel(item?.month),
    newContractCount: toNumber(item?.newContractCount),
    customerCount: toNumber(item?.customerCount),
  }))
}

function normalizeCommissionTrendItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    month: item?.month ?? '',
    label: formatMonthLabel(item?.month),
    netCommissionAmount: toNumber(item?.netCommissionAmount),
  }))
}

function normalizeDistributionItems(items, labelKey) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => ({
      ...item,
      label: item?.[labelKey] ?? '-',
      contractCount: toNumber(item?.contractCount),
    }))
    .filter((item) => item.contractCount > 0)
}

function createEmptySummary() {
  const today = new Date()
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  return {
    referenceDate: toDateInputValue(today),
    comparisonClosingMonth: `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`,
    newContractCount: 0,
    newContractDiff: 0,
    retentionRate: 0,
    retentionRateDiff: 0,
    branchRank: null,
    branchRankChange: null,
    customerCount: 0,
    customerDiff: 0,
    newHandoverCount: 0,
    handoverDiff: 0,
    expectedCommissionAmount: 0,
    commissionDiffAmount: 0,
  }
}

function createEmptyContractStatusSummary() {
  return {
    totalContractCount: 0,
    maintenanceContractCount: 0,
    lapsedContractCount: 0,
    terminatedContractCount: 0,
    completedContractCount: 0,
  }
}

function createEmptyContractDistribution() {
  return {
    referenceDate: '',
    closingMonth: '',
    totalContractCount: 0,
    insuranceCompanies: [],
    insuranceCategories: [],
  }
}

function createEmptyMonthlyTrend() {
  return {
    referenceDate: '',
    startMonth: '',
    endMonth: '',
    monthlyTrends: [],
  }
}

function createEmptyCommissionTrend() {
  return {
    referenceDate: '',
    startMonth: '',
    endMonth: '',
    monthlyTrends: [],
  }
}

function buildMonthlyTrendPoint(item, index, length, value, maxValue) {
  const minX = 24
  const maxX = 499
  const x = length <= 1 ? minX : minX + ((maxX - minX) / (length - 1)) * index
  const y = calculateTrendYPosition(toNumber(value), 0, Math.max(maxValue, 1))

  return {
    month: item.month,
    label: item.label,
    contracts: item.newContractCount,
    customers: item.customerCount,
    value: toNumber(value),
    x: Math.round(x),
    y: Math.round(y),
  }
}

function buildRangeTrendPoint(item, index, length, value, minValue, maxValue) {
  const minX = 24
  const maxX = 499
  const x = length <= 1 ? minX : minX + ((maxX - minX) / (length - 1)) * index
  const y = calculateTrendYPosition(toNumber(value), minValue, maxValue)

  return {
    month: item.month,
    label: item.label,
    value: toNumber(value),
    x: Math.round(x),
    y: Math.round(y),
  }
}

function calculateTrendYPosition(value, minValue, maxValue) {
  const minY = 20
  const maxY = 140
  const range = maxValue - minValue

  if (range <= 0) {
    return maxY
  }

  return minY + ((maxValue - value) / range) * (maxY - minY)
}

function showTrendTooltip(point) {
  trendTooltip.value = {
    visible: true,
    label: point.label,
    contracts: formatCount(point.contracts),
    customers: formatCount(point.customers),
    x: Math.min(Math.max((point.x / 520) * 100, 12), 88),
    y: Math.min(Math.max((point.y / 170) * 100, 18), 82),
  }
}

function hideTrendTooltip() {
  trendTooltip.value.visible = false
}

function showCommissionTooltip(point) {
  commissionTooltip.value = {
    visible: true,
    label: point.label,
    amount: formatCount(point.value),
    x: Math.min(Math.max((point.x / 520) * 100, 12), 88),
    y: Math.min(Math.max((point.y / 170) * 100, 18), 82),
  }
}

function hideCommissionTooltip() {
  commissionTooltip.value.visible = false
}

function buildTopItems(items, labelKey) {
  const normalizedItems = items.map((item) => ({
    label: item.label ?? item?.[labelKey] ?? '-',
    contractCount: toNumber(item.contractCount),
  }))

  if (normalizedItems.length <= 5) {
    return normalizedItems
  }

  const visibleItems = normalizedItems.slice(0, 5)
  const etcCount = normalizedItems
    .slice(5)
    .reduce((sum, item) => sum + item.contractCount, 0)

  if (etcCount === 0) {
    return visibleItems
  }

  return [
    ...visibleItems,
    {
      label: '기타',
      contractCount: etcCount,
    },
  ]
}

function toNumber(value) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatCount(value) {
  return toNumber(value).toLocaleString('ko-KR')
}

function formatNullableCount(value) {
  if (value == null) {
    return '-'
  }

  return formatCount(value)
}

function formatDecimal(value, fractionDigits = 1) {
  return toNumber(value).toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function formatSignedCount(value) {
  const numberValue = toNumber(value)
  const sign = numberValue > 0 ? '+' : ''
  return `${sign}${numberValue.toLocaleString('ko-KR')}건`
}

function formatSignedDecimal(value, fractionDigits = 1) {
  const numberValue = toNumber(value)
  const sign = numberValue > 0 ? '+' : ''

  return `${sign}${numberValue.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

function formatRankChange(value) {
  if (value == null) {
    return '전월 순위 없음'
  }

  const numberValue = toNumber(value)

  if (numberValue === 0) {
    return '순위 변동 없음'
  }

  const sign = numberValue > 0 ? '+' : ''
  return `${sign}${numberValue.toLocaleString('ko-KR')}순위 전월 대비`
}

function formatCurrencyNumber(value) {
  return Math.round(toNumber(value)).toLocaleString('ko-KR')
}

function formatSignedCurrency(value) {
  const numberValue = Math.round(toNumber(value))
  const sign = numberValue > 0 ? '+' : ''

  return `${sign}${numberValue.toLocaleString('ko-KR')}원`
}

function formatClosingMonth(value) {
  if (!value) {
    return '전월'
  }

  const [year, month] = String(value).split('-')

  if (!year || !month) {
    return value
  }

  return `${year}년 ${Number(month)}월`
}

function formatMonthLabel(value) {
  if (!value) {
    return '-'
  }

  const [, month] = String(value).split('-')

  if (!month) {
    return value
  }

  return `${Number(month)}월`
}

function toDateInputValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
</script>

<style scoped>
.fp-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 18px;
  color: #111827;
}

.fp-dashboard__main {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.fp-dashboard__heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.fp-dashboard__heading-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
}

.fp-dashboard__heading h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
}

.fp-dashboard__heading p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.fp-dashboard__notice {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 16px;
  border: 1px solid #fb923c;
  border-radius: 8px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 12px;
}

.fp-dashboard__notice span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
}

.fp-dashboard__notice strong {
  font-size: 11px;
}

.fp-dashboard__error {
  padding: 10px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metric-card,
.panel,
.side-panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.metric-card {
  min-height: 112px;
  padding: 14px 16px;
}

.metric-card__icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  margin-bottom: 8px;
}

.metric-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-card__value strong {
  font-size: 24px;
  line-height: 1;
}

.metric-card__value span,
.metric-card p {
  color: #6b7280;
}

.metric-card p {
  margin: 7px 0 0;
  font-size: 12px;
}

.metric-card small {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  color: #16a34a;
  font-size: 11px;
  font-weight: 700;
}

.panel {
  padding: 16px;
}

.panel h3,
.side-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}

.panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel__link {
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
}

.panel__link::after {
  content: '›';
  margin-left: 5px;
}

.contract-overview__cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.contract-overview__state {
  min-height: 98px;
  display: grid;
  place-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.contract-overview__state--error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.status-card {
  min-height: 98px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.status-card span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 800;
}

.status-card span::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.status-card strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}

.status-card small {
  margin-left: 2px;
  font-size: 13px;
  font-weight: 500;
}

.status-card p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.status-card--review {
  border-color: #fbbf24;
  background: #fffbeb;
  color: #f59e0b;
}

.status-card--complete {
  border-color: #86efac;
  background: #ecfdf5;
  color: #16a34a;
}

.status-card--total {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
}

.status-card--normal {
  border-color: #86efac;
  background: #ecfdf5;
  color: #16a34a;
}

.status-card--lapse {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.status-card--terminated {
  border-color: #e5e7eb;
  background: #f8fafc;
  color: #64748b;
}

.status-card--completed {
  border-color: #fde68a;
  background: #fffbeb;
  color: #d97706;
}

.status-card strong {
  color: #111827;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-panel {
  min-height: 205px;
}

.chart-state {
  min-height: 160px;
  display: grid;
  place-items: center;
  gap: 8px;
  margin-top: 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.chart-state--error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.bar-chart {
  height: 160px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
  align-items: end;
  gap: 14px;
  margin-top: 12px;
  padding: 0 16px 4px;
  background:
    linear-gradient(to top, #e5e7eb 1px, transparent 1px) 0 0 / 100% 25%;
}

.bar-chart__item {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 11px;
}

.bar-chart__item strong {
  color: #111827;
  font-size: 11px;
}

.bar-chart__bar {
  width: min(54px, 100%);
  align-self: end;
  border-radius: 5px 5px 0 0;
  background: #f97316;
}

.donut-summary {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 20px;
  min-height: 160px;
}

.donut-summary__chart {
  width: 118px;
  height: 118px;
  display: grid;
  place-items: center;
  justify-self: center;
  border-radius: 999px;
  background: conic-gradient(#2563eb 0 32%, #f97316 32% 56%, #16a34a 56% 74%, #f59e0b 74% 88%, #7c3aed 88% 100%);
  position: relative;
}

.donut-summary__chart::after {
  content: '';
  position: absolute;
  inset: 32px;
  border-radius: 999px;
  background: #ffffff;
  z-index: 0;
}

.donut-summary ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: #6b7280;
}

.donut-summary li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 7px;
}

.donut-summary li span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.donut-summary li strong {
  color: #111827;
}

.line-chart {
  width: 100%;
  height: 170px;
}

.line-chart-wrap {
  position: relative;
  margin-top: 8px;
}

.line-chart__grid line {
  stroke: #e5e7eb;
  stroke-dasharray: 3 4;
}

.line-chart__point {
  cursor: pointer;
}

.line-chart__point:hover {
  stroke: #ffffff;
  stroke-width: 2px;
}

.chart-summary-table {
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.chart-summary-table table {
  width: 100%;
  border-collapse: collapse;
}

.chart-summary-table th,
.chart-summary-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
}

.chart-summary-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
}

.chart-summary-table td {
  color: #111827;
  font-weight: 600;
}

.chart-summary-table tbody tr:last-child td {
  border-bottom: 0;
}

.line-chart__labels text {
  fill: #6b7280;
  font-size: 11px;
  text-anchor: middle;
}

.line-chart-tooltip {
  position: absolute;
  z-index: 5;
  display: grid;
  gap: 6px;
  min-width: 132px;
  padding: 9px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14);
  color: #475569;
  font-size: 11px;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 10px));
}

.line-chart-tooltip strong,
.line-chart-tooltip span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.line-chart-tooltip strong {
  color: #111827;
  font-size: 12px;
}

.chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: #6b7280;
  font-size: 11px;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chart-legend__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
}

.chart-legend__dot--orange {
  background: #f97316;
}

.chart-legend__dot--blue {
  background: #2563eb;
}

.chart-legend__dot--green {
  background: #16a34a;
}

.fp-dashboard__side {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 16px;
}

.side-panel {
  padding: 18px 16px;
}

.calendar-panel__month,
.schedule-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.calendar-panel__month {
  margin: 16px 0 10px;
  color: #6b7280;
}

.calendar-panel__month strong {
  color: #111827;
  font-size: 13px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-grid__weekday {
  text-align: center;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.calendar-grid__weekday:first-child {
  color: #ef4444;
}

.calendar-grid__weekday:last-of-type {
  color: #2563eb;
}

.calendar-grid__day {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #111827;
  font-size: 12px;
  cursor: pointer;
}

.calendar-grid__day--active {
  background: #f97316;
  color: #ffffff;
  font-weight: 800;
}

.calendar-grid__day--muted {
  color: #94a3b8;
}

.calendar-grid__day--today::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 3px;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #f97316;
  transform: translateX(-50%);
}

.calendar-grid__day--active::after {
  background: #ffffff;
}

.calendar-panel__legend {
  display: flex;
  gap: 14px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 11px;
}

.calendar-panel__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.calendar-panel__legend i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f97316;
}

.calendar-panel__legend span + span i {
  background: #ef4444;
}

.schedule-panel__heading {
  margin-bottom: 12px;
}

.schedule-panel__heading span {
  color: #94a3b8;
  font-size: 11px;
}

.schedule-list {
  display: grid;
  gap: 8px;
}

.schedule-card {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 9px 10px 12px;
  border-radius: 7px;
  background: #fff1e8;
}

.schedule-card.is-done {
  background: #f8fafc;
}

.schedule-card strong,
.schedule-card span {
  display: block;
}

.schedule-card strong {
  font-size: 12px;
}

.schedule-card span {
  margin-top: 2px;
  color: #6b7280;
  font-size: 11px;
}

.schedule-card button {
  min-width: 34px;
  height: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: #ffffff;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.schedule-card:not(.is-done) button {
  border-color: #f97316;
  background: #f97316;
  color: #ffffff;
}

.schedule-panel__memo {
  width: 100%;
  height: 42px;
  margin-top: 12px;
  border: 0;
  border-radius: 7px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1280px) {
  .fp-dashboard {
    grid-template-columns: 1fr;
  }

  .fp-dashboard__side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .metric-grid,
  .contract-overview__cards,
  .chart-grid,
  .fp-dashboard__side {
    grid-template-columns: 1fr;
  }

  .donut-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .fp-dashboard__notice,
  .panel__title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .bar-chart {
    gap: 10px;
    padding-inline: 4px;
  }

  .bar-chart__bar {
    width: 42px;
  }
}
</style>
