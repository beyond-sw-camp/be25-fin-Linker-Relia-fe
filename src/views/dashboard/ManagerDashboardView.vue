<template>
  <section class="manager-dashboard" aria-label="관리자 대시보드">
    <div class="dashboard-filter">
      <label v-if="isHqManager" class="dashboard-filter__field">
        <span>지점 선택</span>
        <select v-model="selectedBranch" :disabled="isLoadingBranches">
          <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
            {{ branch.label }}
          </option>
        </select>
        <small v-if="branchErrorMessage" class="dashboard-filter__error">{{ branchErrorMessage }}</small>
      </label>

      <label class="dashboard-filter__field">
        <span>기간 선택</span>
        <select v-model="selectedMonth" :disabled="isLoadingMonths">
          <option v-for="month in monthOptions" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
        <small v-if="monthErrorMessage" class="dashboard-filter__error">{{ monthErrorMessage }}</small>
      </label>
    </div>

    <section class="report-panel">
      <div class="report-panel__heading">
        <h2>종합 실적 보고서</h2>
        <p :class="{ 'report-panel__message--error': summaryErrorMessage }">{{ reportDescription }}</p>
      </div>

      <div class="metric-grid">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong :class="{ 'is-danger': metric.danger }">
            {{ metric.value }}<small>{{ metric.unit }}</small>
          </strong>
          <p v-if="metric.secondaryLabel" class="metric-card__secondary">
            {{ metric.secondaryLabel }} {{ metric.secondaryValue }}{{ metric.secondaryUnit }}
          </p>
          <p :class="metric.trendClass">{{ metric.caption }}</p>
        </article>
      </div>

      <div class="top-performer-grid">
        <article v-for="performer in topPerformers" :key="performer.eyebrow" class="top-performer-card">
          <span>{{ performer.eyebrow }}</span>
          <p><strong>{{ performer.name }}</strong> {{ performer.meta }}</p>
        </article>
      </div>
    </section>

    <div class="chart-grid">
      <section v-for="chart in donutCharts" :key="chart.title" class="chart-panel">
        <div class="chart-panel__header">
          <h3>{{ chart.title }}</h3>
          <div v-if="!isDistributionLoading && !distributionErrorMessage && chart.items.length > 0" class="chart-panel__total">
            총 {{ chart.total }}건
          </div>
        </div>
        <div v-if="isDistributionLoading" class="chart-panel__state">
          <p>계약 비율 정보를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="distributionErrorMessage" class="chart-panel__state chart-panel__state--error">
          <p>{{ distributionErrorMessage }}</p>
        </div>
        <div v-else-if="chart.items.length === 0" class="chart-panel__state">
          <p>표시할 계약 비율 데이터가 없습니다.</p>
        </div>
        <div v-else class="donut-summary">
          <div class="donut-chart" :style="{ background: chart.gradient }">
          </div>
          <ul>
            <li v-for="item in chart.items" :key="item.label">
              <i :style="{ backgroundColor: item.color }"></i>
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <em>{{ item.ratio }}</em>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section class="ranking-panel">
      <div class="ranking-panel__heading">
        <div>
          <div class="ranking-panel__tabs">
            <button
              type="button"
              class="ranking-panel__tab"
              :class="{ active: !isBranchRankingView }"
              @click="rankingTab = 'advisor'"
            >
              설계사 순위
            </button>
            <button
              type="button"
              class="ranking-panel__tab"
              :class="{ active: isBranchRankingView }"
              :disabled="!isAllBranchSelected"
              @click="rankingTab = 'branch'"
            >
              지점 순위
            </button>
            <span class="ranking-panel__hint">{{ rankingHint }}</span>
          </div>
          <h2>{{ rankingTitle }}</h2>
        </div>

        <div v-if="isBranchRankingView" class="ranking-panel__controls">
          <select v-model="selectedBranchRankOrder" class="ranking-panel__sort" @change="handleBranchRankOrderChange">
            <option value="TOP">상위 순위</option>
            <option value="BOTTOM">하위 순위</option>
          </select>
        </div>
        <div v-else class="ranking-panel__controls">
          <select v-model="selectedAdvisorSortKey" class="ranking-panel__sort" @change="handleAdvisorSortChange">
            <option value="TOP">상위 순위</option>
            <option value="BOTTOM">하위 순위</option>
          </select>
        </div>
      </div>

      <div class="ranking-table-wrap">
        <div v-if="isBranchRankingView && isBranchRankingLoading" class="ranking-table-state">
          <p>지점 순위를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="isBranchRankingView && branchRankingErrorMessage" class="ranking-table-state ranking-table-state--error">
          <p>{{ branchRankingErrorMessage }}</p>
          <button type="button" class="ranking-table-state__retry" @click="loadOrganizationBranchRankings">
            다시 시도
          </button>
        </div>
        <div v-else-if="isBranchRankingView && branchRankingItems.length === 0" class="ranking-table-state">
          <p>조회된 지점 순위가 없습니다.</p>
        </div>
        <table v-else-if="isBranchRankingView" class="ranking-table ranking-table--branch">
          <colgroup>
            <col class="branch-ranking-width--rank" />
            <col class="branch-ranking-width--name" />
            <col class="branch-ranking-width--amount" />
            <col class="branch-ranking-width--change" />
          </colgroup>
          <thead>
            <tr>
              <th class="branch-ranking-col--rank">순위</th>
              <th class="branch-ranking-col--name">지점명</th>
              <th class="branch-ranking-col--amount">최종 수입수수료</th>
              <th class="branch-ranking-col--change">전월 대비</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="branch in branchRankingItems" :key="branch.organizationId">
              <td class="branch-ranking-col--rank" :class="{ 'is-first': branch.rank === 1 }">#{{ branch.rank }}</td>
              <td class="branch-ranking-col--name">
                <div class="branch-cell">
                  <div>
                    <strong>{{ branch.organizationName }}</strong>
                    <small>{{ branch.organizationCode }}</small>
                  </div>
                </div>
              </td>
              <td class="branch-ranking-col--amount"><strong>{{ branch.commissionAmount }}</strong></td>
              <td class="branch-ranking-col--change" :class="branch.changeClass" :title="branch.previousRankTitle">
                {{ branch.changeLabel }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else-if="isAdvisorRankingLoading" class="ranking-table-state">
          <p>설계사 순위를 불러오는 중입니다.</p>
        </div>
        <div v-else-if="advisorRankingErrorMessage" class="ranking-table-state ranking-table-state--error">
          <p>{{ advisorRankingErrorMessage }}</p>
        </div>
        <div v-else-if="advisorRows.length === 0" class="ranking-table-state">
          <p>표시할 설계사 순위 데이터가 없습니다.</p>
        </div>
        <table v-else class="ranking-table ranking-table--advisor">
          <thead>
            <tr>
              <th
                v-for="column in advisorTableColumns"
                :key="column.key"
                :class="column.headerClass"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="advisor in advisorRows" :key="advisor.rowKey">
              <td
                v-for="column in advisorTableColumns"
                :key="column.key"
                :class="column.cellClass"
              >
                <span v-if="column.key === 'rank'" class="ranking-number" :class="{ 'is-first': advisor.rank === 1 }">
                  #{{ advisor.rank }}
                </span>
                <template v-else>
                  {{ getAdvisorCellValue(advisor, column.key) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ranking-panel__footer">
        <span>{{ footerText }}</span>
        <div v-if="isBranchRankingView && branchRankingPageInfo.totalPages > 0" class="ranking-pagination">
          <v-pagination
            :model-value="branchRankingPage"
            :length="Math.max(branchRankingPageInfo.totalPages, 1)"
            :disabled="isBranchRankingLoading"
            total-visible="7"
            rounded="circle"
            @update:model-value="changeBranchRankingPage"
          />
        </div>
        <div v-else-if="advisorRankingPageInfo.totalPages > 0" class="ranking-pagination">
          <v-pagination
            :model-value="advisorRankingPage"
            :length="Math.max(advisorRankingPageInfo.totalPages, 1)"
            :disabled="isAdvisorRankingLoading"
            total-visible="7"
            rounded="circle"
            @update:model-value="changeAdvisorRankingPage"
          />
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import {
  getDashboardClosingMonths,
  getOrganizationDashboardBranchRankings,
  getOrganizationDashboardContractDistribution,
  getOrganizationDashboardFpRankings,
  getOrganizationDashboardSummary,
} from '../../api/dashboard'
import { getBranchOrganizations } from '../../api/organizations'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const selectedBranch = ref('전체 지점')
const selectedMonth = ref('')
const rankingTab = ref('advisor')
const selectedAdvisorSortKey = ref('TOP')
const advisorRankingPage = ref(1)
const advisorRankingPageSize = 10
const advisorRankingPageInfo = ref(createEmptyAdvisorRankingPage())
const selectedBranchRankOrder = ref('TOP')
const branchRankingPage = ref(1)
const branchRankingPageSize = 10
const branchRankingPageInfo = ref(createEmptyBranchRankingPage())
const branchRankingItems = ref([])
const branchRankingClosingMonth = ref('')
const branchRankingComparisonMonth = ref('')
const isLoadingBranches = ref(false)
const isLoadingMonths = ref(false)
const isSummaryLoading = ref(false)
const isDistributionLoading = ref(false)
const isAdvisorRankingLoading = ref(false)
const isBranchRankingLoading = ref(false)
const branchErrorMessage = ref('')
const monthErrorMessage = ref('')
const summaryErrorMessage = ref('')
const distributionErrorMessage = ref('')
const advisorRankingErrorMessage = ref('')
const branchRankingErrorMessage = ref('')
const summary = ref(createEmptyOrganizationSummary())
const distribution = ref(createEmptyOrganizationDistribution())

const chartColors = ['#f97316', '#f59e0b', '#2563eb', '#0f766e', '#4f46e5', '#ec4899', '#14b8a6', '#64748b']

const fallbackBranchOptions = [
  { label: '강남본부 강남지점', value: 'gangnam' },
  { label: '서초 중앙 지점', value: 'seocho' },
  { label: '해운대 마린 지점', value: 'haeundae' },
  { label: '잠실 에비뉴 지점', value: 'jamsil' },
  { label: '판교 테크노 지점', value: 'pangyo' },
]

const branchOptions = ref([
  { label: '전체 지점', value: '전체 지점' },
  ...fallbackBranchOptions,
])

const fallbackMonthOptions = [
  { label: '2026년 05월', value: '2026-05' },
  { label: '2026년 04월', value: '2026-04' },
  { label: '2026년 03월', value: '2026-03' },
]

const monthOptions = ref(fallbackMonthOptions)

const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
const isAllBranchSelected = computed(() => isHqManager.value && selectedBranch.value === '전체 지점')
const selectedBranchOption = computed(() =>
  branchOptions.value.find((branch) => branch.value === selectedBranch.value) ?? null,
)
const currentBranchName = computed(() => {
  if (isHqManager.value) {
    return selectedBranchOption.value?.label ?? '전체 지점'
  }

  return authStore.user.organizationName || '강남본부 강남지점'
})

const isBranchRankingView = computed(() => isHqManager.value && rankingTab.value === 'branch')

const rankingTitle = computed(() => {
  if (isBranchRankingView.value) {
    return '지점별 순위'
  }

  if (isAllBranchSelected.value) {
    return '전체 지점 설계사 실적 순위'
  }

  return `${currentBranchName.value} 설계사 실적 순위`
})

const rankingHint = computed(() => {
  if (isBranchRankingView.value) {
    if (branchRankingClosingMonth.value) {
      const comparisonText = branchRankingComparisonMonth.value
        ? ` · ${formatClosingMonthLabel(branchRankingComparisonMonth.value)} 대비`
        : ''
      return `${formatClosingMonthLabel(branchRankingClosingMonth.value)} 기준${comparisonText}`
    }

    return '지점별 수입수수료 순위를 확인할 수 있습니다.'
  }

  if (isAllBranchSelected.value) {
    return '전체 지점의 설계사 실적을 통합해 보여줍니다.'
  }

  return '선택한 지점의 설계사 순위를 확인할 수 있습니다.'
})

const reportDescription = computed(() => {
  if (summaryErrorMessage.value) {
    return summaryErrorMessage.value
  }

  if (isSummaryLoading.value) {
    return '종합 실적 보고서를 불러오는 중입니다.'
  }

  return '맞춤형 고객 관계 관리 솔루션을 만나보세요.'
})

const footerText = computed(() => {
  if (isBranchRankingView.value) {
    if (branchRankingPageInfo.value.totalElements === 0) {
      return '총 0개 지점'
    }

    const start = (branchRankingPageInfo.value.page - 1) * branchRankingPageInfo.value.size + 1
    const end = start + branchRankingPageInfo.value.numberOfElements - 1
    return `총 ${formatNumber(branchRankingPageInfo.value.totalElements)}개 지점 중 ${start} - ${end} 표시`
  }

  if (advisorRankingPageInfo.value.totalElements === 0) {
    return '총 0명'
  }

  const start = (advisorRankingPageInfo.value.page - 1) * advisorRankingPageInfo.value.size + 1
  const end = start + advisorRankingPageInfo.value.numberOfElements - 1
  return `총 ${formatNumber(advisorRankingPageInfo.value.totalElements)}명 중 ${start} - ${end} 표시`
})

const metrics = computed(() => [
  {
    label: '설계사',
    value: formatNumber(summary.value.advisorCount),
    unit: '명',
    caption: formatCountDiffCaption(summary.value.advisorCountDiff, '명'),
    trendClass: getCountTrendClass(summary.value.advisorCountDiff),
  },
  {
    label: '고객',
    value: formatNumber(summary.value.customerCount),
    unit: '명',
    caption: formatCountDiffCaption(summary.value.customerCountDiff, '명'),
    trendClass: getCountTrendClass(summary.value.customerCountDiff),
  },
  {
    label: '계약',
    value: formatNumber(summary.value.contractCount),
    unit: '건',
    caption: formatCountDiffCaption(summary.value.contractCountDiff, '건'),
    trendClass: getCountTrendClass(summary.value.contractCountDiff),
  },
  {
    label: '관심 고객',
    value: formatNumber(summary.value.interestCustomerCount),
    unit: '명',
    caption: formatCountDiffCaption(summary.value.interestCustomerCountDiff, '명'),
    trendClass: getCountTrendClass(summary.value.interestCustomerCountDiff),
    danger: summary.value.interestCustomerCount > 0,
  },
  {
    label: '계약 성공률',
    value: formatDecimal(summary.value.contractSuccessRate, 1),
    unit: '%',
    caption: formatPercentDiffCaption(summary.value.contractSuccessRateDiff),
    trendClass: getRateTrendClass(summary.value.contractSuccessRateDiff),
  },
  {
    label: '계약 유지율',
    value: formatDecimal(summary.value.retentionRate, 1),
    unit: '%',
    caption: formatPercentDiffCaption(summary.value.retentionRateDiff),
    trendClass: getRateTrendClass(summary.value.retentionRateDiff),
  },
  {
    label: '해지 계약 수',
    value: formatNumber(summary.value.terminatedContractCount),
    unit: '건',
    caption: formatCountDiffCaption(summary.value.terminatedContractCountDiff, '건'),
    trendClass: getCountTrendClass(summary.value.terminatedContractCountDiff),
  },
  {
    label: '수입 수수료',
    value: formatNumber(summary.value.commissionAmount),
    unit: '원',
    caption: '',
    trendClass: 'is-muted',
    secondaryLabel: '지급 수수료',
    secondaryValue: formatNumber(summary.value.paymentCommissionAmount),
    secondaryUnit: '원',
  },
])

onMounted(() => {
  if (isHqManager.value) {
    loadBranchOptions()
  }

  loadClosingMonthOptions()
})

watch(
  [selectedBranch, selectedMonth],
  () => {
    if (!selectedMonth.value) {
      return
    }

    loadOrganizationSummary()
    loadOrganizationContractDistribution()
    advisorRankingPage.value = 1
    loadOrganizationAdvisorRankings()

    if (isHqManager.value) {
      branchRankingPage.value = 1
      loadOrganizationBranchRankings()
    }
  },
  { immediate: true },
)

watch(isAllBranchSelected, (isAllBranches) => {
  if (!isAllBranches && rankingTab.value === 'branch') {
    rankingTab.value = 'advisor'
  }
})

async function loadBranchOptions() {
  branchErrorMessage.value = ''
  isLoadingBranches.value = true

  try {
    const response = await getBranchOrganizations()
    const organizations = Array.isArray(response?.result) ? response.result : []

    if (organizations.length === 0) {
      branchOptions.value = [
        { label: '전체 지점', value: '전체 지점' },
        ...fallbackBranchOptions,
      ]
      return
    }

    branchOptions.value = [
      { label: '전체 지점', value: '전체 지점' },
      ...organizations.map((branch) => ({
        label: branch.organizationName ?? branch.organizationCode ?? '이름 없는 지점',
        value: branch.organizationCode ?? branch.organizationName ?? 'unknown',
      })),
    ]

    const hasSelectedBranch = branchOptions.value.some((branch) => branch.value === selectedBranch.value)
    if (!hasSelectedBranch) {
      selectedBranch.value = '전체 지점'
    }
  } catch (error) {
    branchErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점 목록을 불러오지 못했습니다. 기본 목록을 표시합니다.'
  } finally {
    isLoadingBranches.value = false
  }
}

async function loadClosingMonthOptions() {
  monthErrorMessage.value = ''
  isLoadingMonths.value = true

  try {
    const response = await getDashboardClosingMonths()
    const months = Array.isArray(response?.result) ? response.result : []

    if (months.length === 0) {
      monthOptions.value = fallbackMonthOptions
      selectedMonth.value = fallbackMonthOptions[0]?.value ?? ''
      return
    }

    monthOptions.value = months
      .map((month) => normalizeMonthOption(month))
      .filter((month) => Boolean(month.value))

    if (monthOptions.value.length === 0) {
      monthOptions.value = fallbackMonthOptions
    }

    const hasSelectedMonth = monthOptions.value.some((month) => month.value === selectedMonth.value)
    if (!hasSelectedMonth) {
      selectedMonth.value = monthOptions.value[0]?.value ?? fallbackMonthOptions[0].value
    }
  } catch (error) {
    monthOptions.value = fallbackMonthOptions
    selectedMonth.value = fallbackMonthOptions[0]?.value ?? ''
    monthErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '기간 목록을 불러오지 못했습니다. 기본 목록을 표시합니다.'
  } finally {
    isLoadingMonths.value = false
  }
}

async function loadOrganizationSummary() {
  summaryErrorMessage.value = ''
  isSummaryLoading.value = true

  try {
    const response = await getOrganizationDashboardSummary(buildOrganizationSummaryParams())
    summary.value = normalizeOrganizationSummary(response?.result)
  } catch (error) {
    summary.value = createEmptyOrganizationSummary()
    summaryErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '종합 실적 보고서를 불러오지 못했습니다.'
  } finally {
    isSummaryLoading.value = false
  }
}

async function loadOrganizationContractDistribution() {
  distributionErrorMessage.value = ''
  isDistributionLoading.value = true

  try {
    const response = await getOrganizationDashboardContractDistribution(buildOrganizationSummaryParams())
    distribution.value = normalizeOrganizationDistribution(response?.result)
  } catch (error) {
    distribution.value = createEmptyOrganizationDistribution()
    distributionErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '계약 비율 정보를 불러오지 못했습니다.'
  } finally {
    isDistributionLoading.value = false
  }
}

async function loadOrganizationAdvisorRankings() {
  advisorRankingErrorMessage.value = ''
  isAdvisorRankingLoading.value = true

  try {
    const response = await getOrganizationDashboardFpRankings(buildAdvisorRankingParams())
    advisorRankingItems.value = normalizeAdvisorRankingItems(response?.result)
    advisorRankingPageInfo.value = normalizeAdvisorRankingPage(response?.result?.rankings)
    advisorRankingPage.value = advisorRankingPageInfo.value.page
  } catch (error) {
    advisorRankingItems.value = []
    advisorRankingPageInfo.value = createEmptyAdvisorRankingPage()
    advisorRankingErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '설계사 순위를 불러오지 못했습니다.'
  } finally {
    isAdvisorRankingLoading.value = false
  }
}

async function loadOrganizationBranchRankings() {
  if (!isHqManager.value) {
    return
  }

  branchRankingErrorMessage.value = ''
  isBranchRankingLoading.value = true

  try {
    const response = await getOrganizationDashboardBranchRankings(buildBranchRankingParams())
    const result = response?.result

    branchRankingItems.value = normalizeBranchRankingItems(result?.rankings?.content)
    branchRankingPageInfo.value = normalizeBranchRankingPage(result?.rankings)
    branchRankingPage.value = branchRankingPageInfo.value.page
    branchRankingClosingMonth.value = result?.closingMonth ?? selectedMonth.value
    branchRankingComparisonMonth.value = result?.comparisonClosingMonth ?? ''
  } catch (error) {
    branchRankingItems.value = []
    branchRankingPageInfo.value = createEmptyBranchRankingPage()
    branchRankingClosingMonth.value = ''
    branchRankingComparisonMonth.value = ''
    branchRankingErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점 순위를 불러오지 못했습니다.'
  } finally {
    isBranchRankingLoading.value = false
  }
}

function handleAdvisorSortChange() {
  advisorRankingPage.value = 1
  loadOrganizationAdvisorRankings()
}

function handleBranchRankOrderChange() {
  branchRankingPage.value = 1
  loadOrganizationBranchRankings()
}

function buildAdvisorRankingParams() {
  return {
    ...buildOrganizationSummaryParams(),
    rankOrder: selectedAdvisorSortKey.value,
    page: advisorRankingPage.value,
    size: advisorRankingPageSize,
  }
}

function buildBranchRankingParams() {
  return {
    closingMonth: selectedMonth.value,
    rankOrder: selectedBranchRankOrder.value,
    page: branchRankingPage.value,
    size: branchRankingPageSize,
  }
}

function changeAdvisorRankingPage(page) {
  if (
    page < 1 ||
    page > advisorRankingPageInfo.value.totalPages ||
    page === advisorRankingPage.value ||
    isAdvisorRankingLoading.value
  ) {
    return
  }

  advisorRankingPage.value = page
  loadOrganizationAdvisorRankings()
}

function changeBranchRankingPage(page) {
  if (
    page < 1 ||
    page > branchRankingPageInfo.value.totalPages ||
    page === branchRankingPage.value ||
    isBranchRankingLoading.value
  ) {
    return
  }

  branchRankingPage.value = page
  loadOrganizationBranchRankings()
}

function buildOrganizationSummaryParams() {
  const params = {}

  if (selectedMonth.value) {
    params.closingMonth = selectedMonth.value
  }

  if (isHqManager.value && !isAllBranchSelected.value && selectedBranch.value) {
    params.organizationCode = selectedBranch.value
  }

  return params
}

function normalizeMonthOption(month) {
  if (typeof month === 'string') {
    return {
      label: formatClosingMonthLabel(month),
      value: month,
    }
  }

  const value =
    month?.closingMonth ??
    month?.month ??
    month?.value ??
    month?.label ??
    ''

  const label =
    month?.closingMonthLabel ??
    month?.monthLabel ??
    month?.label ??
    value

  return {
    label: formatClosingMonthLabel(label || value),
    value,
  }
}

function formatClosingMonthLabel(monthValue) {
  const source = String(monthValue ?? '').trim()
  const digits = source.replace(/\D/g, '')

  if (digits.length >= 6) {
    const year = digits.slice(0, 4)
    const month = digits.slice(4, 6).padStart(2, '0')
    return `${year}년 ${month}월`
  }

  const matched = source.match(/^(\d{4})년\s*(\d{1,2})월$/)
  if (matched) {
    return `${matched[1]}년 ${matched[2].padStart(2, '0')}월`
  }

  return source
}

function normalizeOrganizationSummary(payload) {
  return {
    advisorCount: toNumber(getValue(payload, ['advisorCount', 'fpCount', 'plannerCount', 'designerCount'])),
    advisorCountDiff: toNumber(getValue(payload, ['advisorCountDiff', 'fpCountDiff', 'plannerCountDiff', 'designerCountDiff'])),
    customerCount: toNumber(getValue(payload, ['customerCount', 'totalCustomerCount'])),
    customerCountDiff: toNumber(getValue(payload, ['customerCountDiff', 'totalCustomerCountDiff', 'customerDiff'])),
    contractCount: toNumber(getValue(payload, ['contractCount', 'totalContractCount'])),
    contractCountDiff: toNumber(getValue(payload, ['contractCountDiff', 'totalContractCountDiff'])),
    interestCustomerCount: toNumber(getValue(payload, ['interestCustomerCount', 'totalInterestCustomerCount'])),
    interestCustomerCountDiff: toNumber(getValue(payload, ['interestCustomerCountDiff', 'totalInterestCustomerCountDiff'])),
    contractSuccessRate: toNumber(getValue(payload, ['contractSuccessRate', 'contractAchievementRate', 'successRate'])),
    contractSuccessRateDiff: toNumber(getValue(payload, ['contractSuccessRateDiff', 'contractAchievementRateDiff', 'successRateDiff'])),
    retentionRate: toNumber(getValue(payload, ['retentionRate'])),
    retentionRateDiff: toNumber(getValue(payload, ['retentionRateDiff'])),
    terminatedContractCount: toNumber(getValue(payload, ['terminatedContractCount', 'cancelContractCount', 'lapseContractCount'])),
    terminatedContractCountDiff: toNumber(getValue(payload, ['terminatedContractCountDiff', 'cancelContractCountDiff', 'lapseContractCountDiff'])),
    commissionAmount: toNumber(getValue(payload, ['netIncomeCommissionAmount', 'commissionAmount', 'expectedCommissionAmount', 'totalCommissionAmount'])),
    commissionAmountDiff: toNumber(getValue(payload, ['netIncomeCommissionDiffAmount', 'commissionAmountDiff', 'expectedCommissionAmountDiff', 'totalCommissionAmountDiff'])),
    paymentCommissionAmount: toNumber(getValue(payload, ['totalPaymentCommissionAmount', 'paymentCommissionAmount'])),
    paymentCommissionAmountDiff: toNumber(getValue(payload, ['totalPaymentCommissionDiffAmount', 'paymentCommissionAmountDiff'])),
  }
}

function normalizeOrganizationDistribution(payload) {
  return {
    referenceDate: payload?.referenceDate ?? '',
    closingMonth: payload?.closingMonth ?? '',
    totalContractCount: toNumber(getValue(payload, ['totalContractCount', 'contractCount'])),
    insuranceCompanies: normalizeDistributionItems(payload?.insuranceCompanies, 'insuranceCompanyName'),
    insuranceCategories: normalizeDistributionItems(payload?.insuranceCategories, 'insuranceCategoryName'),
  }
}

function createEmptyOrganizationSummary() {
  return {
    advisorCount: 0,
    advisorCountDiff: 0,
    customerCount: 0,
    customerCountDiff: 0,
    contractCount: 0,
    contractCountDiff: 0,
    interestCustomerCount: 0,
    interestCustomerCountDiff: 0,
    contractSuccessRate: 0,
    contractSuccessRateDiff: 0,
    retentionRate: 0,
    retentionRateDiff: 0,
    terminatedContractCount: 0,
    terminatedContractCountDiff: 0,
    commissionAmount: 0,
    commissionAmountDiff: 0,
    paymentCommissionAmount: 0,
    paymentCommissionAmountDiff: 0,
  }
}

function createEmptyOrganizationDistribution() {
  return {
    referenceDate: '',
    closingMonth: '',
    totalContractCount: 0,
    insuranceCompanies: [],
    insuranceCategories: [],
  }
}

function normalizeDistributionItems(items, labelKey) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => ({
      ...item,
      label: item?.label ?? item?.[labelKey] ?? '-',
      contractCount: toNumber(item?.contractCount),
    }))
    .filter((item) => item.contractCount > 0)
}

function getValue(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key]
    }
  }

  return null
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const normalized = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function formatNumber(value) {
  return toNumber(value).toLocaleString('ko-KR')
}

function formatDecimal(value, fractionDigits = 1) {
  return toNumber(value).toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function formatSignedNumber(value, fractionDigits = 0) {
  const numericValue = toNumber(value)
  const absoluteValue = Math.abs(numericValue).toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  if (numericValue > 0) {
    return `▲ ${absoluteValue}`
  }

  if (numericValue < 0) {
    return `▼ ${absoluteValue}`
  }

  return absoluteValue
}

function formatCountDiffCaption(value, unit) {
  return `전월 대비 ${formatSignedNumber(value)}${unit}`
}

function formatPercentDiffCaption(value) {
  return `전월 대비 ${formatSignedNumber(value, 1)}%`
}

function formatCurrencyDiffCaption(value) {
  return `전월 대비 ${formatSignedNumber(value)}원`
}

function buildDonutItems(items) {
  const total = items.reduce((sum, item) => sum + item.contractCount, 0)

  return items.map((item, index) => ({
    label: item.label,
    value: `${formatNumber(item.contractCount)}건`,
    ratio: `${total > 0 ? ((item.contractCount / total) * 100).toFixed(1) : '0.0'}%`,
    rawValue: item.contractCount,
    color: chartColors[index % chartColors.length],
  }))
}

function buildDonutGradient(items) {
  const normalizedItems = buildDonutItems(items)

  if (normalizedItems.length === 0) {
    return '#f1f5f9'
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.rawValue, 0)
  let cursor = 0

  const stops = normalizedItems.map((item) => {
    const start = cursor
    const end = total > 0 ? cursor + (item.rawValue / total) * 100 : cursor
    cursor = end

    return `${item.color} ${start}% ${end}%`
  })

  return `conic-gradient(${stops.join(', ')})`
}

function normalizeAdvisorRankingItems(payload) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload?.rankings?.content)
        ? payload.rankings.content
        : Array.isArray(payload?.rankings)
          ? payload.rankings
        : Array.isArray(payload?.fps)
          ? payload.fps
          : []

  return items.map((item, index) => normalizeAdvisorRankingItem(item, index))
}

function normalizeAdvisorRankingPage(page) {
  if (!page) {
    return createEmptyAdvisorRankingPage()
  }

  return {
    page: Math.max(toNumber(page.page), 1),
    size: Math.max(toNumber(page.size), advisorRankingPageSize),
    totalElements: toNumber(page.totalElements),
    totalPages: toNumber(page.totalPages),
    numberOfElements: toNumber(page.numberOfElements),
    hasNext: Boolean(page.hasNext),
    hasPrevious: Boolean(page.hasPrevious),
  }
}

function createEmptyAdvisorRankingPage() {
  return {
    page: 1,
    size: advisorRankingPageSize,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    hasNext: false,
    hasPrevious: false,
  }
}

function normalizeBranchRankingItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => {
    const rankChange = toNullableNumber(item?.rankChange)
    const previousRank = toNullableNumber(item?.previousRank)

    return {
      rank: toNumber(item?.rank),
      organizationId: item?.organizationId ?? item?.organizationCode ?? item?.organizationName,
      organizationCode: item?.organizationCode ?? '-',
      organizationName: item?.organizationName ?? '-',
      commissionAmount: `${formatNumber(item?.netIncomeCommissionAmount)}원`,
      previousRank,
      previousRankTitle: previousRank === null ? '전월 순위 데이터 없음' : `전월 ${previousRank}위`,
      changeLabel: formatBranchRankChange(rankChange),
      changeClass: getBranchRankChangeClass(rankChange),
    }
  })
}

function normalizeBranchRankingPage(page) {
  if (!page) {
    return createEmptyBranchRankingPage()
  }

  return {
    page: Math.max(toNumber(page.page), 1),
    size: Math.max(toNumber(page.size), branchRankingPageSize),
    totalElements: toNumber(page.totalElements),
    totalPages: toNumber(page.totalPages),
    numberOfElements: toNumber(page.numberOfElements),
    hasNext: Boolean(page.hasNext),
    hasPrevious: Boolean(page.hasPrevious),
  }
}

function createEmptyBranchRankingPage() {
  return {
    page: 1,
    size: branchRankingPageSize,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    hasNext: false,
    hasPrevious: false,
  }
}

function formatBranchRankChange(rankChange) {
  if (rankChange === null) {
    return '신규'
  }

  if (rankChange > 0) {
    return `↑ ${rankChange} 상승`
  }

  if (rankChange < 0) {
    return `↓ ${Math.abs(rankChange)} 하락`
  }

  return '-'
}

function getBranchRankChangeClass(rankChange) {
  if (rankChange === null || rankChange === 0) {
    return 'branch-change--neutral'
  }

  return rankChange > 0 ? 'branch-change--up' : 'branch-change--down'
}

function normalizeAdvisorRankingItem(item, index) {
  const rank = toNumber(getValue(item, ['rank', 'ranking'])) || index + 1
  const newContractsRaw = toNullableNumber(getValue(item, ['newContractCount', 'latestContractCount']))
  const managedContractsRaw = toNullableNumber(getValue(item, ['managedContractCount', 'contractCount', 'contracts', 'totalContractCount']))
  const retentionRaw = toNullableNumber(getValue(item, ['retentionRate', 'retention', 'contractRetentionRate']))
  const customersRaw = toNullableNumber(getValue(item, ['customerCount', 'customers', 'managedCustomerCount']))
  const commissionAmountRaw = toNullableNumber(getValue(item, ['commissionAmount', 'totalCommissionAmount']))

  return {
    rank,
    empCode: getValue(item, ['empCode']) ?? null,
    name: getValue(item, ['fpName', 'userName', 'name']) ?? '-',
    branchName: getValue(item, ['organizationName', 'branchName']) ?? currentBranchName.value,
    organizationCode: getValue(item, ['organizationCode', 'branchCode']) ?? '',
    newContractsRaw,
    newContracts: formatMetricValue(newContractsRaw, '건'),
    managedContractsRaw,
    managedContracts: formatMetricValue(managedContractsRaw, '건'),
    retentionRaw,
    retention: formatMetricValue(retentionRaw, '%', 1),
    customersRaw,
    customers: formatMetricValue(customersRaw, '명'),
    commissionAmountRaw,
    commissionAmount: formatMetricValue(commissionAmountRaw, '원'),
  }
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalized = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : null
}

function formatMetricValue(value, unit, fractionDigits = 0) {
  if (value === null || value === undefined) {
    return null
  }

  const formatted = fractionDigits > 0
    ? formatDecimal(value, fractionDigits)
    : formatNumber(value)

  return `${formatted}${unit}`
}

function getCountTrendClass(value, zeroClass = 'is-muted') {
  const numericValue = toNumber(value)

  if (numericValue > 0) {
    return 'is-up'
  }

  if (numericValue < 0) {
    return 'is-down'
  }

  return zeroClass
}

function getRateTrendClass(value) {
  const numericValue = toNumber(value)

  if (numericValue > 0) {
    return 'is-goal'
  }

  if (numericValue < 0) {
    return 'is-down'
  }

  return 'is-muted'
}

const donutCharts = computed(() => [
  {
    title: '보험사별 계약 비율',
    total: formatNumber(distribution.value.totalContractCount),
    gradient: buildDonutGradient(distribution.value.insuranceCompanies),
    items: buildDonutItems(distribution.value.insuranceCompanies),
  },
  {
    title: '보종별 계약 비율',
    total: formatNumber(distribution.value.totalContractCount),
    gradient: buildDonutGradient(distribution.value.insuranceCategories),
    items: buildDonutItems(distribution.value.insuranceCategories),
  },
])

const advisorRowsByBranch = {
  '강남본부 강남지점': [
    { rank: 1, name: '홍길동 설계사', contracts: '88건', retention: '91.1%', customers: '256명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이미자 설계사', contracts: '81건', retention: '84.3%', customers: '213명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-silver' },
    { rank: 3, name: '박철수 설계사', contracts: '76건', retention: '79.6%', customers: '178명', unmanaged: '8명', status: '실효', statusClass: 'is-danger', rankClass: 'is-bronze' },
    { rank: 4, name: '최영희 설계사', contracts: '72건', retention: '76.2%', customers: '154명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '이정우 설계사', contracts: '69건', retention: '71.8%', customers: '134명', unmanaged: '3명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '김민준 설계사', contracts: '68건', retention: '70.2%', customers: '130명', unmanaged: '9명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '박지수 설계사', contracts: '47건', retention: '67.9%', customers: '116명', unmanaged: '1명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '김태호 설계사', contracts: '40건', retention: '67.1%', customers: '111명', unmanaged: '1명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '서초 중앙 지점': [
    { rank: 1, name: '정유진 설계사', contracts: '84건', retention: '89.4%', customers: '241명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '김하늘 설계사', contracts: '77건', retention: '85.8%', customers: '224명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '오세훈 설계사', contracts: '75건', retention: '80.9%', customers: '185명', unmanaged: '7명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '박예림 설계사', contracts: '63건', retention: '78.1%', customers: '152명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '윤서준 설계사', contracts: '61건', retention: '74.6%', customers: '145명', unmanaged: '5명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '조민성 설계사', contracts: '58건', retention: '71.3%', customers: '129명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '강도윤 설계사', contracts: '46건', retention: '69.2%', customers: '114명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '심다은 설계사', contracts: '41건', retention: '66.8%', customers: '109명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '해운대 마린 지점': [
    { rank: 1, name: '서지훈 설계사', contracts: '79건', retention: '90.2%', customers: '232명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이다혜 설계사', contracts: '74건', retention: '83.8%', customers: '201명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '배성우 설계사', contracts: '71건', retention: '81.5%', customers: '179명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '송미나 설계사', contracts: '65건', retention: '77.0%', customers: '160명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '문서현 설계사', contracts: '59건', retention: '73.2%', customers: '142명', unmanaged: '4명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '정태윤 설계사', contracts: '54건', retention: '70.6%', customers: '131명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '한수아 설계사', contracts: '48건', retention: '68.5%', customers: '117명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '류정민 설계사', contracts: '39건', retention: '66.4%', customers: '108명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '잠실 에비뉴 지점': [
    { rank: 1, name: '김서영 설계사', contracts: '82건', retention: '88.7%', customers: '238명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '최민혁 설계사', contracts: '78건', retention: '84.1%', customers: '220명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '안지민 설계사', contracts: '70건', retention: '80.2%', customers: '182명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '권도현 설계사', contracts: '66건', retention: '76.4%', customers: '158명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '나혜린 설계사', contracts: '60건', retention: '74.0%', customers: '144명', unmanaged: '5명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '황준호 설계사', contracts: '55건', retention: '71.1%', customers: '132명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '장유나 설계사', contracts: '49건', retention: '68.7%', customers: '120명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '서민규 설계사', contracts: '43건', retention: '65.9%', customers: '112명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '판교 테크노 지점': [
    { rank: 1, name: '윤재현 설계사', contracts: '86건', retention: '90.8%', customers: '248명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이수빈 설계사', contracts: '80건', retention: '85.0%', customers: '218명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '백지훈 설계사', contracts: '73건', retention: '79.4%', customers: '176명', unmanaged: '8명', status: '실효', statusClass: 'is-danger', rankClass: 'is-bronze' },
    { rank: 4, name: '한예슬 설계사', contracts: '67건', retention: '77.2%', customers: '159명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '문태양 설계사', contracts: '62건', retention: '73.8%', customers: '147명', unmanaged: '6명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '오하린 설계사', contracts: '56건', retention: '70.4%', customers: '133명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '노지환 설계사', contracts: '50건', retention: '68.0%', customers: '121명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '구서윤 설계사', contracts: '44건', retention: '66.1%', customers: '110명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
}

const allAdvisorRows = Object.entries(advisorRowsByBranch).flatMap(([branchName, rows]) =>
  rows.map((advisor) => ({
    ...advisor,
    empCode: null,
    branchName,
    newContractsRaw: null,
    newContracts: null,
    managedContractsRaw: toNumber(advisor.contracts),
    managedContracts: advisor.contracts,
    retentionRaw: toNumber(advisor.retention),
    customersRaw: toNumber(advisor.customers),
    commissionAmountRaw: null,
    commissionAmount: null,
    organizationCode: '',
  })),
)

const advisorRankingItems = ref([])

const overallTopAdvisor = computed(() =>
  advisorRows.value
    .slice()
    .sort((a, b) => toNumber(b.newContractsRaw ?? b.managedContractsRaw) - toNumber(a.newContractsRaw ?? a.managedContractsRaw))[0],
)

const advisorRows = computed(() => {
  const rows = [...advisorRankingItems.value]

  return rows.map((advisor) => ({
    ...advisor,
    rowKey: `${advisor.organizationCode ?? advisor.branchName ?? currentBranchName.value}-${advisor.name}`,
  }))
})

const advisorTableColumns = computed(() => {
  const columns = [
    { key: 'rank', label: '순위', headerClass: '', cellClass: '' },
    { key: 'name', label: '설계사명', headerClass: '', cellClass: '' },
  ]

  if (isAllBranchSelected.value) {
    columns.push({
      key: 'branchName',
      label: '소속 지점',
      headerClass: 'advisor-col--branch',
      cellClass: 'advisor-col--branch',
    })
  }

  columns.push(
    {
      key: 'customers',
      label: '담당 고객',
      headerClass: 'advisor-col--metric',
      cellClass: 'advisor-col--metric',
    },
    {
      key: 'newContracts',
      label: '신규 계약',
      headerClass: 'advisor-col--metric',
      cellClass: 'advisor-col--metric',
    },
    {
      key: 'managedContracts',
      label: '보유 계약',
      headerClass: 'advisor-col--metric',
      cellClass: 'advisor-col--metric',
    },
    {
      key: 'retention',
      label: '유지율',
      headerClass: 'advisor-col--metric',
      cellClass: 'advisor-col--metric',
    },
    {
      key: 'commissionAmount',
      label: '수수료',
      headerClass: 'advisor-col--metric',
      cellClass: 'advisor-col--metric',
    },
  )

  return columns
})

const topPerformers = computed(() => {
  if (!isAllBranchSelected.value) {
    return [
      {
        eyebrow: '해당 지점 1위 설계사',
        name: advisorRows.value[0]?.name ?? '-',
        meta: '',
      },
      {
        eyebrow: '1위 설계사 수수료',
        name: advisorRows.value[0]?.commissionAmount ?? '-',
        meta: '',
      },
    ]
  }

  return [
    {
      eyebrow: '전체 지점 1위 설계사',
      name: advisorRows.value[0]?.name ?? '-',
      meta: '',
    },
    {
      eyebrow: '전체 지점 1위 소속 지점',
      name: advisorRows.value[0]?.branchName ?? '-',
      meta: '',
    },
  ]
})

function getAdvisorCellValue(advisor, key) {
  const value = advisor[key]
  return value === null || value === undefined || value === '' ? '-' : value
}
</script>

<style scoped>
.manager-dashboard {
  display: grid;
  gap: 18px;
  color: #1f2937;
}

.dashboard-filter {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.dashboard-filter__field {
  display: grid;
  gap: 8px;
}

.dashboard-filter__field span {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.dashboard-filter__error {
  color: #dc2626;
  font-size: 12px;
}

.dashboard-filter__field select,
.ranking-panel__sort {
  min-width: 176px;
  height: 40px;
  padding: 0 34px 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background:
    linear-gradient(45deg, transparent 50%, #6b7280 50%) calc(100% - 18px) 50% / 7px 7px no-repeat,
    linear-gradient(135deg, #6b7280 50%, transparent 50%) calc(100% - 13px) 50% / 7px 7px no-repeat,
    #f8fafc;
  color: #111827;
  font-size: 14px;
  appearance: none;
}

.report-panel,
.chart-panel,
.ranking-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.report-panel {
  padding: 28px 16px 26px;
}

.report-panel__heading {
  margin: 0 10px 24px;
}

.report-panel__heading h2,
.ranking-panel__heading h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

.report-panel__heading p,
.ranking-panel__hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.report-panel__message--error {
  color: #dc2626;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  min-height: 104px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.metric-card span {
  display: block;
  margin-bottom: 9px;
  color: #6b7280;
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-bottom: 9px;
  color: #161c24;
  font-size: 27px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0;
}

.metric-card strong.is-danger {
  color: #dc2626;
}

.metric-card small {
  margin-left: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.metric-card p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.metric-card__secondary {
  margin: 0 0 9px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.is-up {
  color: #dc2626;
}

.is-down {
  color: #2563eb;
}

.is-goal {
  color: #f97316;
}

.is-muted {
  color: #4b5563;
}

.top-performer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.top-performer-card {
  min-height: 96px;
  padding: 24px;
  border: 1px solid #f97316;
  border-radius: 8px;
  background: #fff7ed;
}

.top-performer-card span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

.top-performer-card span strong {
  color: #64748b;
  font-size: 21px;
}

.top-performer-card p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 700;
}

.top-performer-card p strong {
  color: #f97316;
  font-size: 28px;
  font-weight: 900;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.chart-panel {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  padding: 30px 26px 24px;
}

.chart-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.chart-panel__total {
  display: inline-flex;
  align-items: center;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

.chart-panel__state {
  min-height: 166px;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.chart-panel__state--error {
  color: #dc2626;
}

.chart-panel h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.donut-summary {
  display: grid;
  grid-template-columns: minmax(132px, 190px) 1fr;
  align-items: start;
  gap: 22px;
  flex: 1;
}

.donut-chart {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-content: center;
  align-self: start;
  justify-self: center;
  border-radius: 999px;
  text-align: center;
}

.donut-chart::before {
  content: '';
  position: absolute;
  inset: 30px;
  border-radius: inherit;
  background: #ffffff;
}

.donut-summary ul {
  display: grid;
  gap: 13px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #6b7280;
  font-size: 13px;
}

.donut-summary li {
  display: grid;
  grid-template-columns: 11px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
}

.donut-summary i {
  width: 11px;
  height: 11px;
  border-radius: 999px;
}

.donut-summary li span {
  color: #475569;
}

.donut-summary li strong {
  color: #111827;
  font-size: 12px;
}

.donut-summary li em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
}

.ranking-panel {
  overflow: hidden;
}

.ranking-panel__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 28px 20px;
}

.ranking-panel__tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.ranking-panel__tab {
  min-width: 94px;
  height: 34px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.ranking-panel__tab.active {
  border-color: #fb923c;
  background: #fff7ed;
  color: #ea580c;
}

.ranking-panel__tab:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ranking-panel__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ranking-panel__sort {
  min-width: 140px;
}

.ranking-table-wrap {
  overflow-x: auto;
}

.ranking-table-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.ranking-table-state--error {
  color: #dc2626;
}

.ranking-table-state__retry {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 12px;
  font-weight: 800;
}

.branch-change--up {
  color: #16a34a;
}

.branch-change--down {
  color: #dc2626;
}

.branch-change--neutral {
  color: #64748b;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  font-size: 13px;
}

.ranking-table th {
  height: 42px;
  padding: 0 28px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.ranking-table td {
  height: 62px;
  padding: 0 22px;
  border-top: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 800;
  white-space: nowrap;
}

.ranking-table td.is-first {
  color: #f97316;
}

.ranking-table--advisor {
  min-width: 900px;
  table-layout: fixed;
}

.ranking-table--branch {
  table-layout: fixed;
}

.ranking-table--branch th,
.ranking-table--branch td {
  padding-left: 24px;
  padding-right: 24px;
}

.branch-ranking-width--rank {
  width: 10%;
}

.branch-ranking-width--name {
  width: 40%;
}

.branch-ranking-width--amount {
  width: 28%;
}

.branch-ranking-width--change {
  width: 22%;
}

.ranking-table--advisor th,
.ranking-table--advisor td {
  padding-left: 16px;
  padding-right: 16px;
}

.ranking-table--advisor th:first-child,
.ranking-table--advisor td:first-child {
  width: 72px;
  text-align: center;
}

.ranking-table--advisor th:nth-child(2),
.ranking-table--advisor td:nth-child(2) {
  width: 150px;
}

.ranking-table--advisor .advisor-col--branch {
  width: 170px;
  text-align: left;
}

.ranking-table--advisor .advisor-col--metric {
  width: 118px;
  text-align: center;
}

.ranking-table--branch th.branch-ranking-col--rank,
.ranking-table--branch td.branch-ranking-col--rank {
  text-align: center;
}

.ranking-table--branch th.branch-ranking-col--name,
.ranking-table--branch td.branch-ranking-col--name {
  text-align: left;
}

.ranking-table--branch th.branch-ranking-col--amount,
.ranking-table--branch td.branch-ranking-col--amount {
  text-align: right;
}

.ranking-table--branch th.branch-ranking-col--change,
.ranking-table--branch td.branch-ranking-col--change {
  text-align: center;
}

.branch-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-cell span {
  min-width: 34px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
}

.branch-cell strong,
.branch-cell small {
  display: block;
}

.branch-cell strong {
  color: #1f2937;
  font-size: 14px;
}

.branch-cell small {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.ranking-number {
  color: #1f2937;
  font-weight: 900;
}

.ranking-number.is-first {
  color: #f97316;
}

.status-pill {
  min-width: 52px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.is-normal {
  background: #ecfdf5;
  color: #16a34a;
}

.status-pill.is-warning {
  background: #fff7ed;
  color: #ea580c;
}

.status-pill.is-danger {
  background: #fef2f2;
  color: #dc2626;
}

.status-pill.is-info {
  background: #eff6ff;
  color: #2563eb;
}

.detail-button {
  min-width: 58px;
  height: 30px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.ranking-panel__footer {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid #e5e7eb;
  background: #f1f5f9;
  color: #6b7280;
  font-size: 12px;
}

.ranking-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    gap: 24px;
  }
}

@media (max-width: 960px) {
  .ranking-panel__heading {
    flex-direction: column;
  }
}

@media (max-width: 880px) {
  .dashboard-filter {
    display: grid;
  }

  .top-performer-grid,
  .chart-grid,
  .donut-summary {
    grid-template-columns: 1fr;
  }

  .chart-panel__header {
    flex-direction: column;
  }

  .dashboard-filter__field select,
  .dashboard-filter__field select {
    width: 100%;
  }

  .ranking-panel__tabs {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .report-panel,
  .chart-panel {
    padding: 24px 16px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .top-performer-grid {
    margin-top: 18px;
    gap: 14px;
  }

  .top-performer-card {
    padding: 22px;
  }

  .ranking-panel__heading,
  .ranking-table th,
  .ranking-table td {
    padding-left: 18px;
    padding-right: 18px;
  }

  .ranking-panel__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
