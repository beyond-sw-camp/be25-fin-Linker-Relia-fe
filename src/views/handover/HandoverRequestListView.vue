<template>
  <section class="handover-page" aria-label="인수인계 목록">
    <div class="handover-page__summary">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="handover-summary-card"
        :style="{ '--accent': card.accent, '--tone': card.tone }"
      >
        <span class="handover-summary-card__dot" aria-hidden="true"></span>
        <div class="handover-summary-card__value">
          <strong>{{ card.value }}</strong>
          <span>건</span>
        </div>
        <p>{{ card.label }}</p>
      </article>
    </div>

    <section class="handover-panel">
      <div class="handover-panel__header">
        <h1>인수인계 목록</h1>

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
            density="compact"
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
            density="compact"
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
            density="compact"
            hide-details
            class="handover-filters__select"
            aria-label="요청 유형"
          />
          <v-text-field
            v-model.trim="filters.customerName"
            placeholder="고객명"
            variant="outlined"
            density="compact"
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

import { getHandovers, getHandoverSummary } from '../../api/handovers'
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
})
const isLoading = ref(false)

const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
const showBranchColumn = computed(() => isHqManager.value)
const tableColumnCount = computed(() => (showBranchColumn.value ? 10 : 9))
const filteredRows = computed(() => handoverRows.value)
const primaryActionLabel = computed(() => (isHqManager.value ? '상세 보기' : '결재 처리'))

const selectedBranchOption = computed(() =>
  branches.value.find((branch) => branch.value === filters.organizationCode) ?? null,
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
  },
  {
    label: '이번 달 완료',
    value: formatCount(summary.value.thisMonthCompletedCount),
    accent: '#14b8a6',
    tone: '#dff7f2',
  },
  {
    label: '이번 달 전체',
    value: formatCount(summary.value.thisMonthTotalCount),
    accent: '#8b5cf6',
    tone: '#f0edff',
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
    const [summaryResponse, handoversResponse] = await Promise.all([
      getHandoverSummary(buildSummaryParams()),
      getHandovers(params),
    ])

    summary.value = normalizeSummary(summaryResponse?.result)
    handoverRows.value = normalizeRows(handoversResponse?.result)
    normalizePage(handoversResponse?.result)
  } catch {
    summary.value = createSampleSummary()
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
    if (selectedBranchOption.value?.organizationId) {
      params.organizationId = selectedBranchOption.value.organizationId
    }
  }

  params.page = currentPage.value
  params.size = pageSize.value

  return params
}

function buildSummaryParams() {
  const params = {}

  if (showBranchFilter.value && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
    if (selectedBranchOption.value?.organizationId) {
      params.organizationId = selectedBranchOption.value.organizationId
    }
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
  }
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
  if (!code) {
    return ''
  }

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
</script>

<style scoped>
.handover-page {
  display: grid;
  gap: 18px;
  width: 100%;
}

.handover-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.handover-summary-card {
  min-height: 120px;
  padding: 16px 20px;
  border: 1px solid #e9edf4;
  border-radius: 8px;
  background: #ffffff;
}

.handover-summary-card__dot {
  display: block;
  width: 12px;
  height: 12px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: var(--tone);
}

.handover-summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.handover-summary-card__value strong {
  color: #202124;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.05;
}

.handover-summary-card__value span,
.handover-summary-card p {
  color: #8b8f98;
}

.handover-summary-card p {
  display: block;
  margin: 2px 0 0;
  font-size: 12px;
}

.handover-panel {
  display: grid;
  gap: 10px;
}

.handover-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.handover-panel h1 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 800;
}

.handover-filters {
  display: grid;
  grid-template-columns: 136px 136px 180px 56px;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  width: max-content;
}

.handover-filters--with-branch {
  grid-template-columns: 180px 136px 136px 180px 56px;
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
  height: 34px;
  width: 56px;
  min-width: 56px;
  border-radius: 6px;
  background: #f97316;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: none;
}

.handover-table {
  overflow-x: auto;
  border: 1px solid #eef0f4;
  border-radius: 8px;
  background: #ffffff;
}

.handover-table table {
  width: 100%;
  min-width: 930px;
  border-collapse: collapse;
}

.handover-table th,
.handover-table td {
  height: 52px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f6;
  color: #686f7a;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.handover-table tr:last-child td {
  border-bottom: 0;
}

.handover-table th {
  height: 40px;
  background: #fbfbfc;
  color: #777d86;
  font-size: 12px;
  font-weight: 800;
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
  font-weight: 800;
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
  color: #8b8f98;
  font-size: 13px;
}

.handover-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  min-height: 24px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
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
  font-weight: 800;
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
  color: #1d73bd;
}

.handover-action {
  min-width: 76px;
  min-height: 28px;
  padding: 5px 12px;
  border: 1px solid #d8dce3;
  border-radius: 6px;
  background: #ffffff;
  color: #6f7680;
  font-size: 12px;
  font-weight: 700;
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
  .handover-page__summary {
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
</style>
