<template>
  <section class="handover-page" aria-label="인수인계 목록">
    <div v-if="showScopeLine" class="handover-scope-line" aria-label="현재 조회 범위">
      <span>조회 기준</span>
      <strong>{{ handoverScopeName }}</strong>
    </div>

    <div class="handover-page__summary">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="handover-summary-card"
        :style="{ '--accent': card.accent, '--tone': card.tone }"
      >
        <div class="handover-summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <div class="handover-summary-card__value">
          <strong>{{ card.value }}</strong>
          <span>건</span>
        </div>
        <p>{{ card.label }}</p>
      </article>
    </div>

    <section v-if="showTrendAnalytics" class="handover-analytics" aria-label="인수인계 현황 분석">
      <article class="handover-analytics-card handover-trend-card">
        <div class="handover-analytics-card__header">
          <h2>
            월별 인수인계 요청 추이
            <span>최근 6개월</span>
          </h2>
        </div>

        <div class="handover-line-chart" role="img" aria-label="최근 6개월 월별 인수인계 요청 건수">
          <div v-if="monthlyTrendRows.length === 0" class="handover-line-chart__empty">
            월별 인수인계 요청 추이 데이터가 없습니다.
          </div>
          <div class="handover-line-chart__unit">(건)</div>
          <svg v-if="monthlyTrendRows.length > 0" viewBox="0 0 640 220" preserveAspectRatio="xMidYMid meet">
            <g class="handover-line-chart__grid">
              <line v-for="tick in trendTicks" :key="tick.value" x1="42" x2="620" :y1="tick.y" :y2="tick.y" />
            </g>
            <g class="handover-line-chart__axis-labels">
              <text v-for="tick in trendTicks" :key="`label-${tick.value}`" x="12" :y="tick.y + 4">
                {{ tick.value }}
              </text>
            </g>
            <polyline class="handover-line-chart__line" :points="trendPolylinePoints" />
            <g v-for="point in trendChartPoints" :key="point.label">
              <circle class="handover-line-chart__point" :cx="point.x" :cy="point.y" r="4" />
              <text class="handover-line-chart__value" :x="point.x" :y="point.y - 12">{{ point.value }}</text>
              <text class="handover-line-chart__month" :x="point.x" y="210">{{ point.label }}</text>
            </g>
          </svg>
        </div>
      </article>

      <article v-if="showBranchAnalytics" class="handover-analytics-card handover-branch-card">
        <div class="handover-analytics-card__header">
          <h2>이번 달 지점별 현황 요약</h2>
        </div>

        <div class="handover-branch-table">
          <table>
            <thead>
              <tr>
                <th>지점명</th>
                <th>이번 달 요청</th>
                <th>완료율</th>
                <th>결재 대기</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branchSummaryRows" :key="branch.organizationId || branch.name">
                <td>{{ branch.name }}</td>
                <td>{{ formatCount(branch.requestCount) }}건</td>
                <td>
                  {{ formatPercent(branch.completionRate) }}
                  <span class="handover-branch-table__meta">({{ formatCount(branch.completedCount) }}건)</span>
                </td>
                <td>
                  <span class="handover-branch-table__pending-dot" aria-hidden="true"></span>
                  {{ formatCount(branch.pendingCount) }}건
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="handover-panel">
      <div class="handover-panel__header">
        <form
          class="handover-filters"
          :class="{ 'handover-filters--with-branch': showBranchFilter }"
          @submit.prevent="searchHandovers"
        >
          <v-select
            v-if="showBranchFilter"
            v-model="filters.organizationCode"
            :items="branches"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            :loading="isLoadingBranches"
            class="handover-filters__branch"
            aria-label="지점 선택"
          />
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            class="handover-filters__select"
            aria-label="진행 상태"
          />
          <v-select
            v-model="filters.requestType"
            :items="requestTypeOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            hide-details
            class="handover-filters__select"
            aria-label="요청 유형"
          />
          <v-text-field
            v-model.trim="filters.customerName"
            placeholder="고객명"
            variant="outlined"
            density="comfortable"
            hide-details
            class="handover-filters__search"
            @keyup.enter="searchHandovers"
          />
          <v-btn class="handover-filters__button" type="submit">검색</v-btn>
        </form>
      </div>

      <v-alert v-if="branchErrorMessage" type="warning" variant="tonal" density="comfortable">
        {{ branchErrorMessage }}
      </v-alert>

      <div class="handover-table">
        <table>
          <thead>
            <tr>
              <th>고객명</th>
              <th>등급</th>
              <th v-if="showBranchColumn">지점</th>
              <th>현재 FP</th>
              <th>추천 FP</th>
              <th>요청 유형</th>
              <th>진행 상태</th>
              <th>요청일</th>
              <th>결재 완료일</th>
              <th><span class="sr-only">처리</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td :colspan="tableColumnCount" class="handover-table__state">
                <v-progress-circular indeterminate color="#f97316" size="28" />
                <span>인수인계 목록을 불러오는 중입니다.</span>
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td :colspan="tableColumnCount" class="handover-table__state">
                조건에 맞는 인수인계 요청이 없습니다.
              </td>
            </tr>
            <tr v-for="handover in filteredRows" v-else :key="handover.handoverId">
              <td>
                <button class="handover-table__customer" type="button" @click="goToHandoverDetail(handover)">
                  {{ handover.customerName }}
                </button>
              </td>
              <td>{{ getCustomerGradeLabel(handover.customerGrade) }}</td>
              <td v-if="showBranchColumn">{{ handover.organizationName }}</td>
              <td>
                <span :class="{ 'handover-table__muted': !handover.currentManagerName }">
                  {{ handover.currentManagerName || '- (해촉)' }}
                </span>
              </td>
              <td>
                <span :class="{ 'handover-table__muted': !handover.recommendedFpName }">
                  {{ handover.recommendedFpName || '-' }}
                </span>
              </td>
              <td>
                <span class="handover-badge" :class="getRequestTypeClass(handover.requestType)">
                  {{ getRequestTypeLabel(handover.requestType) }}
                </span>
              </td>
              <td>
                <span class="handover-status" :class="getStatusClass(handover.status)">
                  <span class="handover-status__dot" aria-hidden="true"></span>
                  {{ getStatusLabel(handover.status) }}
                </span>
              </td>
              <td>{{ handover.requestedAt }}</td>
              <td>{{ handover.approvedAt }}</td>
              <td>
                <button
                  v-if="handover.status === 'MANAGER_PENDING'"
                  class="handover-action handover-action--primary"
                  type="button"
                  @click="goToHandoverDetail(handover)"
                >
                  {{ primaryActionLabel }}
                </button>
                <button
                  v-else
                  class="handover-action"
                  type="button"
                  @click="goToHandoverDetail(handover)"
                >
                  상세 보기
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="handover-pagination">
        <span>{{ rangeLabel }}</span>
        <v-pagination
          :model-value="currentPage"
          :length="Math.max(totalPages, 1)"
          total-visible="7"
          rounded="circle"
          @update:model-value="changePage"
        />
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getHandoverBranchSummary, getHandovers, getHandoverSummary, getHandoverTrend } from '../../api/handovers'
import { useBranchFilter } from '../../composables/useBranchFilter'
import { getCustomerGradeLabel } from '../../constants/customer'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { branches, showBranchFilter, isLoadingBranches, branchErrorMessage, initializeBranchFilter } =
  useBranchFilter(authStore)

const statusOptions = [
  { title: '전체 상태', value: 'ALL' },
  { title: '결재 대기', value: 'MANAGER_PENDING' },
  { title: '완료', value: 'COMPLETED' },
]

const requestTypeOptions = [
  { title: '전체 유형', value: 'ALL' },
  { title: '해촉', value: 'RESIGNATION' },
  { title: '수동', value: 'VOLUNTARY' },
]

const filters = reactive({
  organizationCode: '',
  status: 'ALL',
  requestType: 'ALL',
  customerName: '',
})

const handoverRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(0)
const summary = ref({
  pendingCount: 0,
  thisMonthCompletedCount: 0,
  thisMonthTotalCount: 0,
  branchSummaries: [],
})
const branchSummaries = ref([])
const trendRows = ref([])
const isLoading = ref(false)

const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
const isSystemAdmin = computed(() => authStore.userRole === USER_ROLES.SYSTEM_ADMIN)
const canViewOrganizationWideHandovers = computed(() => isHqManager.value || isSystemAdmin.value)
const showTrendAnalytics = computed(() => canViewOrganizationWideHandovers.value)
const showBranchAnalytics = computed(() => isHqManager.value)
const showBranchColumn = computed(() => canViewOrganizationWideHandovers.value)
const showScopeLine = computed(() => showBranchFilter.value)
const tableColumnCount = computed(() => (showBranchColumn.value ? 10 : 9))
const filteredRows = computed(() => handoverRows.value)
const selectedBranchOption = computed(() =>
  branches.value.find((branch) => branch.value === filters.organizationCode) ?? null,
)
const handoverScopeName = computed(() => {
  if (showBranchFilter.value) {
    return filters.organizationCode
      ? (selectedBranchOption.value?.organizationName ?? filters.organizationCode)
      : '전사 전체'
  }

  return authStore.user?.organizationName ?? '소속 지점'
})
const primaryActionLabel = computed(() => (canViewOrganizationWideHandovers.value ? '상세 보기' : '결재 처리'))
const monthlyTrendRows = computed(() => normalizeMonthlyTrend(trendRows.value))
const branchSummaryRows = computed(() => normalizeBranchSummaries(branchSummaries.value))
const trendMaxValue = computed(() => {
  const maxValue = Math.max(...monthlyTrendRows.value.map((row) => row.value), 0)
  return Math.max(10, Math.ceil(maxValue / 10) * 10)
})
const trendTicks = computed(() => {
  const maxValue = trendMaxValue.value
  return [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0]
    .map((value) => ({
      value,
      y: getTrendY(value),
    }))
})
const trendChartPoints = computed(() => {
  const rows = monthlyTrendRows.value
  const chartLeft = 72
  const chartRight = 600
  const step = rows.length > 1 ? (chartRight - chartLeft) / (rows.length - 1) : 0

  return rows.map((row, index) => ({
    ...row,
    x: chartLeft + step * index,
    y: getTrendY(row.value),
  }))
})
const trendPolylinePoints = computed(() =>
  trendChartPoints.value.map((point) => `${point.x},${point.y}`).join(' '),
)

const rangeLabel = computed(() => {
  if (totalElements.value === 0) {
    return '총 0건'
  }

  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, totalElements.value)
  return `총 ${totalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건`
})

const summaryCards = computed(() => [
  {
    label: '결재 대기',
    value: formatCount(summary.value.pendingCount),
    accent: '#f97316',
    tone: '#fff1e8',
    icon: 'mdi-timer-sand',
  },
  {
    label: '이번 달 완료',
    value: formatCount(summary.value.thisMonthCompletedCount),
    accent: '#14b8a6',
    tone: '#dff7f2',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: '이번 달 전체',
    value: formatCount(summary.value.thisMonthTotalCount),
    accent: '#8b5cf6',
    tone: '#f0edff',
    icon: 'mdi-file-document-outline',
  },
])

onMounted(async () => {
  await initializeBranchFilter()
  loadHandovers()
})

watch(
  () => [filters.organizationCode, filters.status, filters.requestType, filters.customerName],
  () => {
    currentPage.value = 1
    loadHandovers()
  },
)

function searchHandovers() {
  currentPage.value = 1
  loadHandovers()
}

function changePage(page) {
  currentPage.value = page
  loadHandovers()
}

async function loadHandovers() {
  isLoading.value = true

  try {
    const params = buildRequestParams()
    const [summaryResult, handoversResult, trendResult, branchSummaryResult] = await Promise.allSettled([
      getHandoverSummary(buildSummaryParams()),
      getHandovers(params),
      showTrendAnalytics.value ? getHandoverTrend(buildTrendParams()) : Promise.resolve({ result: [] }),
      showBranchAnalytics.value ? getHandoverBranchSummary() : Promise.resolve({ result: [] }),
    ])

    if (summaryResult.status === 'fulfilled') {
      summary.value = normalizeSummary(summaryResult.value?.result)
    } else {
      summary.value = createSampleSummary()
    }

    if (handoversResult.status === 'fulfilled') {
      handoverRows.value = normalizeRows(handoversResult.value?.result)
      normalizePage(handoversResult.value?.result)
    } else {
      handoverRows.value = createSampleHandovers()
      totalElements.value = handoverRows.value.length
      totalPages.value = 1
    }

    trendRows.value = trendResult.status === 'fulfilled'
      ? normalizeTrendResponse(trendResult.value?.result)
      : []

    branchSummaries.value = branchSummaryResult.status === 'fulfilled'
      ? extractBranchSummaries(branchSummaryResult.value?.result)
      : createSampleSummary().branchSummaries
  } catch {
    summary.value = createSampleSummary()
    branchSummaries.value = createSampleSummary().branchSummaries
    trendRows.value = []
    handoverRows.value = createSampleHandovers()
    totalElements.value = handoverRows.value.length
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function buildRequestParams() {
  const params = {}

  if (filters.status !== 'ALL') {
    params.status = filters.status
  }

  if (filters.requestType !== 'ALL') {
    params.requestType = filters.requestType
  }

  if (filters.customerName) {
    params.customerName = filters.customerName
  }

  if (showBranchFilter.value && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  params.page = currentPage.value
  params.size = pageSize.value

  return params
}

function buildSummaryParams() {
  const params = {}

  if (showBranchFilter.value && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  return params
}

function buildTrendParams() {
  const params = {}

  if (showBranchFilter.value && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  return params
}

function normalizePage(source = {}) {
  currentPage.value = Number(source.page ?? currentPage.value)
  pageSize.value = Number(source.size ?? pageSize.value)
  totalElements.value = Number(source.totalElements ?? handoverRows.value.length)
  totalPages.value = Number(source.totalPages ?? 1)
}

function normalizeSummary(source = {}) {
  return {
    pendingCount: Number(source.pendingCount ?? 0),
    thisMonthCompletedCount: Number(source.thisMonthCompletedCount ?? 0),
    thisMonthTotalCount: Number(source.thisMonthTotalCount ?? 0),
    branchSummaries:
      source.branchSummaries ??
      source.branchSummary ??
      source.organizationSummaries ??
      source.organizationSummary ??
      [],
  }
}

function extractBranchSummaries(source = {}) {
  if (Array.isArray(source)) {
    return source.some(isBranchSummaryRow) ? source : []
  }

  const rows =
    source.branchSummaries ??
    source.branchSummary ??
    source.organizationSummaries ??
    source.organizationSummary ??
    source.content

  if (Array.isArray(rows)) {
    return rows
  }

  if (source.result) {
    return extractBranchSummaries(source.result)
  }

  return findBranchSummaryRows(source)
}

function findBranchSummaryRows(source) {
  if (!source || typeof source !== 'object') {
    return []
  }

  for (const value of Object.values(source)) {
    if (Array.isArray(value) && value.some(isBranchSummaryRow)) {
      return value
    }

    if (value && typeof value === 'object') {
      const nestedRows = findBranchSummaryRows(value)
      if (nestedRows.length > 0) {
        return nestedRows
      }
    }
  }

  return []
}

function isBranchSummaryRow(row) {
  return Boolean(
    row &&
    typeof row === 'object' &&
    (row.organizationId || row.organizationName || row.branchName) &&
    (
      row.totalCount !== undefined ||
      row.completedCount !== undefined ||
      row.pendingCount !== undefined ||
      row.completionRate !== undefined ||
      row.pendingRate !== undefined
    ),
  )
}

function normalizeTrendResponse(source) {
  if (Array.isArray(source)) {
    return source
  }

  return (
    source?.content ??
    []
  )
}

function normalizeRows(source) {
  const content = Array.isArray(source?.content) ? source.content : source

  if (!Array.isArray(content)) {
    return []
  }

  return content.map((handover) => ({
    handoverId: handover.handoverRequestId,
    customerId: null,
    customerName: handover.customerName ?? '-',
    customerGrade: handover.customerGrade ?? handover.customer?.customerGrade ?? '-',
    organizationName: resolveBranchName(handover) ?? handover.organizationName ?? handover.branchName ?? '-',
    organizationCode: handover.organizationCode ?? handover.branchCode ?? '',
    organizationId: handover.organizationId ?? null,
    currentManagerName: handover.currentFpName ?? '',
    recommendedFpName: getRecommendedFpName(handover),
    requestType: normalizeRequestType(handover.requestType),
    status: handover.requestStatus ?? 'MANAGER_PENDING',
    requestedAt: formatDate(handover.createdAt),
    approvedAt: formatDate(
      handover.approvedAt ??
      handover.completedAt ??
      handover.approvalCompletedAt ??
      handover.reviewedAt,
    ),
  }))
}

function resolveBranchName(handover = {}) {
  const code = handover.organizationCode ?? handover.branchCode
  if (!code) return ''

  const branch = branches.value.find((branchOption) => branchOption.value === code)
  return branch?.organizationName ?? branch?.branchName ?? ''
}

function getRecommendedFpName(handover = {}) {
  return (
    handover.recommendation?.recommendFpName ??
    handover.recommendFpName ??
    ''
  )
}

function createSampleSummary() {
  return {
    pendingCount: 12,
    thisMonthCompletedCount: 34,
    thisMonthTotalCount: 46,
    branchSummaries: [
      {
        organizationId: 'sample-branch-1',
        organizationName: '강남지점',
        totalCount: 24,
        completedCount: 19,
        completionRate: 79,
        pendingCount: 7,
        pendingRate: 29,
      },
      {
        organizationId: 'sample-branch-2',
        organizationName: '서초지점',
        totalCount: 18,
        completedCount: 15,
        completionRate: 83,
        pendingCount: 4,
        pendingRate: 22,
      },
      {
        organizationId: 'sample-branch-3',
        organizationName: '송파지점',
        totalCount: 15,
        completedCount: 10,
        completionRate: 67,
        pendingCount: 5,
        pendingRate: 33,
      },
      {
        organizationId: 'sample-branch-4',
        organizationName: '분당지점',
        totalCount: 12,
        completedCount: 9,
        completionRate: 75,
        pendingCount: 3,
        pendingRate: 25,
      },
      {
        organizationId: 'sample-branch-5',
        organizationName: '남양지점',
        totalCount: 11,
        completedCount: 8,
        completionRate: 72,
        pendingCount: 3,
        pendingRate: 27,
      },
      {
        organizationId: 'sample-branch-6',
        organizationName: '수원지점',
        totalCount: 10,
        completedCount: 7,
        completionRate: 65,
        pendingCount: 4,
        pendingRate: 40,
      },
    ],
  }
}

function createSampleHandovers() {
  return [
    {
      handoverId: 'HO-001',
      customerId: null,
      customerName: '홍길동',
      customerGrade: 'GOLD',
      organizationName: '강남지점',
      organizationCode: 'BR001',
      currentManagerName: '',
      recommendedFpName: '이설계',
      requestType: 'RESIGNATION',
      status: 'MANAGER_PENDING',
      requestedAt: '2026-06-01',
      approvedAt: '-',
    },
    {
      handoverId: 'HO-002',
      customerId: null,
      customerName: '김영희',
      customerGrade: 'SILVER',
      organizationName: '서초지점',
      organizationCode: 'BR002',
      currentManagerName: '이설계',
      recommendedFpName: '박설계',
      requestType: 'VOLUNTARY',
      status: 'MANAGER_PENDING',
      requestedAt: '2026-05-28',
      approvedAt: '-',
    },
    {
      handoverId: 'HO-003',
      customerId: null,
      customerName: '박민수',
      customerGrade: 'VIP',
      organizationName: '강남지점',
      organizationCode: 'BR001',
      currentManagerName: '',
      recommendedFpName: '최설계',
      requestType: 'RESIGNATION',
      status: 'COMPLETED',
      requestedAt: '2026-05-20',
      approvedAt: '2026-05-21',
    },
  ]
}

function getRequestTypeLabel(type) {
  return normalizeRequestType(type) === 'RESIGNATION' ? '해촉' : '수동'
}

function getRequestTypeClass(type) {
  return normalizeRequestType(type) === 'RESIGNATION' ? 'handover-badge--termination' : 'handover-badge--manual'
}

function normalizeRequestType(type) {
  const value = String(type ?? '').trim().toUpperCase()

  if (value === 'RESIGNATION') {
    return 'RESIGNATION'
  }

  return 'VOLUNTARY'
}

function getStatusLabel(status) {
  return status === 'COMPLETED' ? '완료' : '결재 대기'
}

function getStatusClass(status) {
  return status === 'COMPLETED' ? 'handover-status--completed' : 'handover-status--pending'
}

function goToHandoverDetail(handover) {
  if (!handover.handoverId) {
    return
  }

  router.push({
    name: 'handover-detail',
    params: { handoverRequestId: handover.handoverId },
    query: { from: route.name },
  })
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-'
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function normalizeMonthlyTrend(source) {
  const rows = Array.isArray(source) ? source : []

  return rows.slice(-6).map((row, index) => ({
    label: formatTrendMonth(row.yearMonth, index),
    value: Number(row.requestCount ?? 0),
  }))
}

function normalizeBranchSummaries(source) {
  const rows = Array.isArray(source) ? source : []

  return rows.map((row) => {
    const requestCount = Number(row.totalCount ?? row.requestCount ?? row.count ?? 0)
    const completedCount = Number(row.completedCount ?? row.completeCount ?? 0)
    const pendingCount = Number(row.pendingCount ?? row.managerPendingCount ?? row.approvalPendingCount ?? 0)

    return {
      organizationId: row.organizationId ?? null,
      name: row.organizationName ?? row.branchName ?? row.name ?? '-',
      requestCount,
      completedCount,
      completionRate: Number(row.completionRate ?? row.completedRate ?? calculateRate(completedCount, requestCount)),
      pendingCount,
      pendingRate: Number(row.pendingRate ?? calculateRate(pendingCount, requestCount)),
    }
  })
}

function calculateRate(count, totalCount) {
  return totalCount > 0 ? (count / totalCount) * 100 : 0
}

function formatTrendMonth(value, index) {
  if (value) {
    const text = String(value)
    const monthMatch = text.match(/(\d{1,2})(?:월)?$/)

    if (monthMatch) {
      return `${Number(monthMatch[1])}월`
    }
  }

  return `${index + 1}월`
}

function getTrendY(value) {
  const chartTop = 28
  const chartBottom = 178
  const ratio = trendMaxValue.value > 0 ? Number(value ?? 0) / trendMaxValue.value : 0
  return chartBottom - (chartBottom - chartTop) * ratio
}
</script>

<style scoped>
.handover-page {
  display: grid;
  gap: 18px;
  width: 100%;
  min-width: 0;
}

.handover-scope-line {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.handover-scope-line::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f97316;
}

.handover-scope-line span {
  color: #8b8f98;
  font-size: 12px;
  font-weight: 800;
}

.handover-scope-line strong {
  color: #202124;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.handover-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.handover-summary-card {
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.handover-summary-card__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  margin-bottom: 12px;
}

.handover-summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.handover-summary-card__value strong {
  font-size: 34px;
  line-height: 1;
  color: #1f2937;
}

.handover-summary-card__value span,
.handover-summary-card p {
  margin: 0;
  color: #6b7280;
}

.handover-summary-card__value span {
  font-size: 13px;
}

.handover-summary-card p {
  font-size: 13px;
}

.handover-analytics {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.handover-analytics-card {
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.handover-analytics-card__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.handover-analytics-card__header h2 {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 800;
}

.handover-analytics-card__header span {
  padding: 0;
  border: 0;
  color: #8b8f98;
  font-size: 11px;
  font-weight: 600;
}

.handover-line-chart {
  position: relative;
  min-height: 230px;
}

.handover-line-chart__empty {
  min-height: 230px;
  display: grid;
  place-items: center;
  color: #8b8f98;
  font-size: 13px;
}

.handover-line-chart__unit {
  position: absolute;
  top: 8px;
  left: 0;
  color: #686f7a;
  font-size: 12px;
  font-weight: 700;
}

.handover-line-chart svg {
  display: block;
  width: 100%;
  height: 230px;
  max-width: 100%;
}

.handover-line-chart__grid line {
  stroke: #e5e7eb;
  stroke-dasharray: 4 5;
}

.handover-line-chart__axis-labels text,
.handover-line-chart__month {
  fill: #686f7a;
  font-size: 12px;
  font-weight: 700;
}

.handover-line-chart__line {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.handover-line-chart__point {
  fill: #3b82f6;
  stroke: #ffffff;
  stroke-width: 2;
}

.handover-line-chart__value {
  fill: #202124;
  font-size: 12px;
  font-weight: 800;
  text-anchor: middle;
}

.handover-line-chart__month {
  text-anchor: middle;
}

.handover-branch-table {
  max-height: 230px;
  overflow: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
}

.handover-branch-table table {
  width: 100%;
  border-collapse: collapse;
}

.handover-branch-table th,
.handover-branch-table td {
  height: 34px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f6;
  color: #686f7a;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}

.handover-branch-table tr:last-child td {
  border-bottom: 0;
}

.handover-branch-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fbfbfc;
  color: #777d86;
  font-weight: 800;
}

.handover-branch-table td:nth-child(n + 2),
.handover-branch-table th:nth-child(n + 2) {
  text-align: center;
}

.handover-branch-table__pending-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  margin-right: 6px;
  border-radius: 999px;
  background: #f97316;
}

.handover-branch-table__meta {
  margin-left: 4px;
  color: #9aa0a8;
  font-size: 11px;
  font-weight: 700;
}

.handover-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.handover-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 16px;
}

.handover-panel__title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.handover-panel h1 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 800;
}

.handover-filters {
  display: grid;
  grid-template-columns: repeat(3, 160px) 55px;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
  width: max-content;
}

.handover-filters--with-branch {
  grid-template-columns: repeat(4, 160px) 55px;
}

.handover-filters__branch,
.handover-filters__select {
  width: 100%;
  min-width: 0;
}

.handover-filters__search {
  width: 100%;
  min-width: 0;
}

.handover-filters__button {
  width: 55px;
  height: 34px;
  min-width: 0;
  border: 1px solid rgba(249, 115, 22, 0.28);
  border-radius: 10px;
  background: #fff7ed;
  color: #f97316;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  padding: 0 18px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.handover-filters__button:hover {
  transform: translateY(-1px);
  border-color: rgba(249, 115, 22, 0.55);
  background: #ffedd5;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);
}

.handover-filters__button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.08);
}

.handover-filters :deep(.v-field) {
  min-height: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: none;
}

.handover-filters :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 14px;
}

.handover-filters__search :deep(input::placeholder) {
  color: #64748b;
  font-size: 14px;
  opacity: 1;
}

.handover-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
  background: #ffffff;
}

.handover-table table {
  width: 100%;
  min-width: 930px;
  border-collapse: collapse;
}

.handover-table th,
.handover-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
}

.handover-table tr:last-child td {
  border-bottom: 0;
}

.handover-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.handover-table th:last-child,
.handover-table td:last-child {
  text-align: center;
}

.handover-table__customer {
  padding: 0;
  border: 0;
  background: transparent;
  color: #f97316;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.handover-table__muted {
  color: #b4b8c0;
}

.handover-table__state {
  height: 160px;
  text-align: center;
  color: #8b8f98;
}

.handover-table__state span {
  display: block;
  margin-top: 10px;
}

.handover-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
}

.handover-pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

.handover-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.handover-badge--termination {
  background: #ffe9ea;
  color: #ef4444;
}

.handover-badge--manual {
  background: #eeeafe;
  color: #5f5be8;
}

.handover-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
}

.handover-status__dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: currentColor;
}

.handover-status--pending {
  color: #f97316;
}

.handover-status--completed {
  color: #16a34a;
}

.handover-action {
  min-width: 0;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid #d8dce3;
  border-radius: 8px;
  background: #ffffff;
  color: #6f7680;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.handover-action--primary {
  border-color: #ffb17d;
  color: #f97316;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 960px) {
  .handover-page__summary,
  .handover-analytics {
    grid-template-columns: 1fr;
  }

  .handover-panel__header,
  .handover-filters,
  .handover-pagination {
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .handover-filters__select,
  .handover-filters__search {
    width: 100%;
  }
}

@media (max-width: 1280px) {
  .handover-table th,
  .handover-table td {
    padding: 12px 10px;
    font-size: 12px;
  }
}
</style>
