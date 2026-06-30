<template>
  <section class="consultation-page">
    <v-snackbar v-model="showCreatedToast" color="success" :timeout="3000">
      상담일지가 등록되었습니다.
    </v-snackbar>

    <section class="metric-row">
      <article v-for="metric in metrics" :key="metric.label">
        <v-icon :icon="metric.icon" size="18" />
        <div class="metric-row__value">
          <strong>{{ metric.value }}</strong>
          <span>건</span>
        </div>
        <span>{{ metric.label }}</span>
      </article>
    </section>

    <section class="filter-panel">
      <h3>검색 및 필터</h3>
      <div class="filter-grid">
        <v-select
          v-if="showBranchFilter"
          v-model="filters.organizationCode"
          :items="branches"
          item-title="title"
          item-value="value"
          label="지점 선택"
          variant="outlined"
          density="comfortable"
          hide-details
          :loading="isLoadingBranches"
          :disabled="isLoadingBranches"
        />
        <v-text-field
          v-model="filters.customerName"
          label="고객명"
          placeholder="고객명 입력"
          variant="outlined"
          density="comfortable"
          hide-details
          @keyup.enter="searchConsultations"
        />
        <v-select
          v-model="filters.consultationType"
          :items="consultationTypeOptions"
          item-title="label"
          item-value="value"
          label="상담 유형"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-select
          v-model="filters.consultationChannel"
          :items="channelOptions"
          item-title="label"
          item-value="value"
          label="상담 방식"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-text-field
          v-model="filters.startedAt"
          label="시작일"
          type="date"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-text-field
          v-model="filters.endedAt"
          label="종료일"
          type="date"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-select
          v-model="filters.sortOrder"
          :items="sortOptions"
          item-title="label"
          item-value="value"
          label="정렬"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </div>
      <v-alert v-if="branchErrorMessage || branchFpErrorMessage" type="warning" variant="tonal" density="comfortable">
        {{ branchErrorMessage || branchFpErrorMessage }}
      </v-alert>
      <div class="filter-actions">
        <v-btn class="search-button" @click="searchConsultations">
          검색
        </v-btn>
        <v-btn variant="outlined" class="reset-button" @click="resetFilters">
          초기화
        </v-btn>
        <v-btn v-if="canCreateConsultation" class="create-button" @click="goToCreate">
          <v-icon icon="mdi-plus" size="16" />
          상담일지 작성
        </v-btn>
      </div>
    </section>

    <section class="consultation-panel">
      <header>
        <span>{{ rangeLabel }}</span>
      </header>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <div class="consultation-table">
        <table>
          <thead>
            <tr>
              <th>상담일시</th>
              <th>고객명</th>
              <th>상담 유형</th>
              <th>상담 방식</th>
              <th>계약번호</th>
              <th>담당 FP</th>
              <th>다음 상담 예정</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" class="consultation-table__state">
                <v-progress-circular indeterminate color="#f97316" size="26" />
                <span>상담 목록을 불러오는 중입니다.</span>
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="consultation in visibleRows"
                :key="getConsultationKey(consultation)"
                class="is-clickable"
                @click="goToDetail(consultation)"
              >
                <td>{{ formatDateTime(consultation.consultedAt) }}</td>
                <td class="consultation-table__strong">{{ consultation.customerName || '-' }}</td>
                <td>
                  <span class="consultation-badge" :class="`consultation-badge--${consultation.consultationType || 'NONE'}`">
                    {{ getConsultationTypeLabel(consultation.consultationType) }}
                  </span>
                </td>
                <td>{{ getConsultationChannelLabel(consultation.consultationChannel) }}</td>
                <td>{{ consultation.contractCode || consultation.contractId || '-' }}</td>
                <td>{{ consultation.fpName || consultation.fpId || '-' }}</td>
                <td>{{ formatDateTime(consultation.nextScheduledAt) }}</td>
                <td>
                  <button type="button" class="detail-button" @click.stop="goToDetail(consultation)">상세</button>
                </td>
              </tr>
            </template>
            <tr v-if="!isLoading && visibleRows.length === 0">
              <td colspan="8" class="consultation-table__empty">조건에 맞는 상담 내역이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="consultation-panel__pagination">
        <span>{{ rangeLabel }}</span>
        <v-pagination
          :model-value="currentPage"
          :length="Math.max(totalPages, 1)"
          total-visible="7"
          rounded="circle"
          :disabled="isLoading"
          @update:model-value="changePage"
        />
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getConsultations } from '../../api/consultations'
import { getOrganizationFps } from '../../api/organizations'
import { USER_ROLES } from '../../constants/auth'
import {
  getConsultationChannelLabel,
  getConsultationTypeLabel,
} from '../../constants/customer'
import { useAuthStore } from '../../stores/auth'
import { useBranchFilter } from '../../composables/useBranchFilter'
import { formatDateTime } from '../../utils/formatters'
import { getSavedConsultations } from '../../utils/consultationDrafts'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const LIST_STATE_STORAGE_KEY = 'consultation-list-state'
const {
  branches,
  showBranchFilter,
  isLoadingBranches,
  branchErrorMessage,
  initializeBranchFilter,
} = useBranchFilter(authStore)

const consultationTypeOptions = [
  { label: '전체', value: '' },
  { label: '신규', value: 'NEW_CONTRACT' },
  { label: '보험금 청구', value: 'CLAIM' },
  { label: '갱신', value: 'RENEWAL' },
  { label: '해지', value: 'TERMINATION' },
]
const channelOptions = [
  { label: '전체', value: '' },
  { label: '방문', value: 'VISIT' },
  { label: '전화', value: 'PHONE' },
  { label: '메시지', value: 'MESSAGE' },
]
const sortOptions = [
  { label: '최신 상담일순', value: 'latest' },
  { label: '오래된 상담일순', value: 'oldest' },
  { label: '다음 상담 예정일순', value: 'nextSchedule' },
]

const filters = reactive({
  organizationCode: '',
  consultationType: '',
  consultationChannel: '',
  customerName: '',
  startedAt: '',
  endedAt: '',
  sortOrder: 'latest',
})

const consultationRows = ref([])
const localCompletedRows = ref([])
const branchFpFilter = ref(null)
const branchFpErrorMessage = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const contractCount = ref(0)
const isLoading = ref(false)
const isResettingFilters = ref(false)
const isRestoringListState = ref(false)
const errorMessage = ref('')
const showCreatedToast = ref(false)

const canCreateConsultation = computed(() => authStore.userRole === USER_ROLES.FP)
const selectedBranchOption = computed(() => {
  if (!filters.organizationCode) return null
  return branches.value.find((branch) => branch.value === filters.organizationCode) ?? null
})
const allRows = computed(() => mergeConsultationRows(consultationRows.value, localCompletedRows.value))
const filteredRows = computed(() => sortRows(allRows.value.filter((row) => {
  if (showBranchFilter.value && filters.organizationCode && !matchesOrganization(row, filters.organizationCode)) return false
  if (filters.consultationType && row.consultationType !== filters.consultationType) return false
  if (filters.consultationChannel && row.consultationChannel !== filters.consultationChannel) return false
  if (filters.customerName.trim() && !String(row.customerName || '').includes(filters.customerName.trim())) return false
  if (filters.startedAt && toDateOnly(row.consultedAt) < filters.startedAt) return false
  if (filters.endedAt && toDateOnly(row.consultedAt) > filters.endedAt) return false
  return true
})))
const visibleRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const totalElements = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.ceil(totalElements.value / pageSize.value))
const metrics = computed(() => [
  { icon: 'mdi-file-document-outline', value: totalElements.value.toLocaleString('ko-KR'), label: '전체 상담일지' },
  { icon: 'mdi-swap-horizontal-bold', value: contractCount.value.toLocaleString('ko-KR'), label: '계약 전환 건수' },
])
const rangeLabel = computed(() => {
  if (totalElements.value === 0) return '총 0건'
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, totalElements.value)
  return `총 ${totalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건 표시`
})

watch(
  () => [
    filters.consultationType,
    filters.organizationCode,
    filters.consultationChannel,
    filters.startedAt,
    filters.endedAt,
    filters.sortOrder,
  ],
  () => {
    if (isRestoringListState.value) return
    currentPage.value = 1
  },
)

watch(
  () => filters.customerName,
  () => {
    if (isRestoringListState.value) return
    currentPage.value = 1
  },
)

watch(
  () => filters.organizationCode,
  async () => {
    if (isRestoringListState.value) return
    if (isResettingFilters.value) return
    currentPage.value = 1
    await loadBranchFpFilter()
    await loadConsultations()
  },
)

onMounted(async () => {
  await initializeBranchFilter()

  const shouldRefreshAfterCreate = route.query.refreshAfterCreate === 'true'

  if (shouldRefreshAfterCreate) {
    clearListState()
    resetFilterValues()
    showCreatedToast.value = true
  } else {
    await restoreListState()
  }

  await loadBranchFpFilter()
  localCompletedRows.value = getSavedConsultations().map(normalizeConsultation)
  await loadConsultations()

  if (shouldRefreshAfterCreate) {
    await router.replace({ name: route.name })
  }
})

async function searchConsultations() {
  currentPage.value = 1
  await loadBranchFpFilter()
  await loadConsultations()
}

async function resetFilters() {
  isResettingFilters.value = true

  try {
    resetFilterValues()
    branchFpFilter.value = null
    clearListState()
    await loadConsultations()
  } finally {
    isResettingFilters.value = false
  }
}

function resetFilterValues() {
  filters.consultationType = ''
  filters.organizationCode = ''
  filters.consultationChannel = ''
  filters.customerName = ''
  filters.startedAt = ''
  filters.endedAt = ''
  filters.sortOrder = 'latest'
  currentPage.value = 1
}

async function changePage(page) {
  currentPage.value = page
  await loadConsultations()
}

async function loadBranchFpFilter() {
  branchFpFilter.value = null
  branchFpErrorMessage.value = ''

  if (!showBranchFilter.value || !filters.organizationCode) {
    return
  }

  const branch = selectedBranchOption.value

  if (!branch?.organizationId) {
    return
  }

  try {
    const fps = []
    let page = 0
    let totalPages = 1
    let isOneBasedPage = false

    do {
      const { pageResult, usedPage } = await getOrganizationFpsPage(branch.organizationId, page)
      const result = pageResult ?? {}
      const content = Array.isArray(result.content) ? result.content : []

      fps.push(...content)
      totalPages = Number(result.totalPages ?? result.totalPage ?? 1) || 1
      isOneBasedPage = usedPage === 1 && page === 0
      page = usedPage + 1
    } while ((isOneBasedPage ? page <= totalPages : page < totalPages) && page < 20)

    branchFpFilter.value = {
      fpIds: new Set(fps.map((fp) => fp.id ?? fp.userId ?? fp.fpId).filter(Boolean)),
      fpNames: new Set(fps.map((fp) => fp.userName ?? fp.fpName ?? fp.name).filter(Boolean)),
    }
  } catch (error) {
    branchFpFilter.value = {
      fpIds: new Set(),
      fpNames: new Set(),
    }
    branchFpErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점 설계사 목록을 불러오지 못했습니다.'
  }
}

async function getOrganizationFpsPage(organizationId, page) {
  const params = {
    organizationId,
    page,
    size: 1000,
  }

  try {
    const pageResult = await getOrganizationFps(params)
    return { pageResult, usedPage: page }
  } catch (error) {
    if (page !== 0 || error.response?.status !== 400) {
      throw error
    }

    const pageResult = await getOrganizationFps({
      ...params,
      page: 1,
    })
    return { pageResult, usedPage: 1 }
  }
}

async function loadConsultations() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await getConsultations(buildParams())
    const result = response?.result ?? {}
    const rows = Array.isArray(result.content)
      ? result.content
      : Array.isArray(result.consultations?.content)
        ? result.consultations.content
        : Array.isArray(result.consultations)
          ? result.consultations
          : []

    consultationRows.value = rows.map(normalizeConsultation)
    localCompletedRows.value = getSavedConsultations().map(normalizeConsultation)
    contractCount.value = Number(result.contractCount ?? 0)
  } catch (error) {
    consultationRows.value = []
    contractCount.value = 0
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '상담 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function buildParams() {
  const params = {
    page: 0,
    size: 1000,
    sort: getApiSortParam(filters.sortOrder),
  }

  if (filters.consultationType) params.consultationType = filters.consultationType
  if (filters.consultationChannel) params.consultationChannel = filters.consultationChannel
  if (filters.customerName.trim()) params.customerName = filters.customerName.trim()
  if (filters.startedAt) params.startedAt = filters.startedAt
  if (filters.endedAt) params.endedAt = filters.endedAt

  if (showBranchFilter.value && filters.organizationCode) {
    params.organizationCode = filters.organizationCode

    if (selectedBranchOption.value?.organizationId) {
      params.organizationId = selectedBranchOption.value.organizationId
    }
  }

  return params
}

function getApiSortParam(sortOrder) {
  if (sortOrder === 'oldest') return 'consultedAt,asc'
  if (sortOrder === 'nextSchedule') return 'nextScheduledAt,asc'
  return 'consultedAt,desc'
}

function normalizeConsultation(consultation) {
  const consultationType =
    consultation.consultationType ??
    consultation.type ??
    consultation.consultation_type ??
    consultation.consultationTypeCode ??
    ''
  const consultationChannel =
    consultation.consultationChannel ??
    consultation.channel ??
    consultation.consultation_channel ??
    consultation.consultationChannelCode ??
    ''

  return {
    ...consultation,
    consultationId: consultation.consultationId ?? consultation.id,
    consultationType,
    consultationChannel,
    customerName: consultation.customerName ?? consultation.customer?.customerName,
    contractCode: consultation.contractCode ?? consultation.contract?.contractCode,
    fpId: consultation.fpId ?? consultation.fp?.id ?? consultation.fp?.fpId ?? consultation.fp?.userId,
    fpName: consultation.fpName ?? consultation.fp?.userName,
    organizationCode:
      consultation.organizationCode ??
      consultation.branchCode ??
      consultation.fp?.organizationCode ??
      consultation.organization?.organizationCode,
    organizationName:
      consultation.organizationName ??
      consultation.branchName ??
      consultation.fp?.organizationName ??
      consultation.organization?.organizationName,
  }
}

function goToCreate() {
  router.push({ name: 'consultation-create' })
}

function goToDetail(consultation) {
  const consultationId = consultation.consultationId ?? consultation.id
  if (!consultationId) return
  saveListState()
  router.push({ name: 'consultation-detail', params: { consultationId } })
}

function saveListState() {
  window.sessionStorage.setItem(LIST_STATE_STORAGE_KEY, JSON.stringify({
    routeName: route.name,
    filters: { ...filters },
    currentPage: currentPage.value,
  }))
}

async function restoreListState() {
  const rawState = window.sessionStorage.getItem(LIST_STATE_STORAGE_KEY)
  if (!rawState) return

  try {
    const state = JSON.parse(rawState)
    if (state?.routeName !== route.name) return

    isRestoringListState.value = true
    Object.assign(filters, state.filters || {})
    currentPage.value = Number(state.currentPage) || 1
    await nextTick()
  } catch {
    // 저장된 목록 상태가 깨져 있으면 무시하고 기본값으로 조회합니다.
  } finally {
    isRestoringListState.value = false
    clearListState()
  }
}

function clearListState() {
  window.sessionStorage.removeItem(LIST_STATE_STORAGE_KEY)
}

function getConsultationKey(consultation) {
  return consultation.consultationId ?? `${consultation.customerId}-${consultation.consultedAt}`
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    if (filters.sortOrder === 'oldest') {
      return getTime(a.consultedAt) - getTime(b.consultedAt)
    }
    if (filters.sortOrder === 'nextSchedule') {
      return getTime(a.nextScheduledAt, Number.MAX_SAFE_INTEGER) - getTime(b.nextScheduledAt, Number.MAX_SAFE_INTEGER)
    }
    return getTime(b.consultedAt) - getTime(a.consultedAt)
  })
}

function getTime(value, fallback = 0) {
  const time = new Date(value || '').getTime()
  return Number.isNaN(time) ? fallback : time
}

function toDateOnly(value) {
  return value ? String(value).slice(0, 10) : ''
}

function matchesOrganization(row, organizationCode) {
  if (!organizationCode) return true
  if (row.organizationCode) return row.organizationCode === organizationCode

  const filter = branchFpFilter.value

  if (!filter) return true

  return (
    (row.fpId && filter.fpIds.has(row.fpId)) ||
    (row.fpName && filter.fpNames.has(row.fpName))
  )
}

function mergeConsultationRows(serverRows, localRows) {
  const serverIds = new Set(serverRows.map((row) => row.consultationId).filter(Boolean))
  return [
    ...serverRows,
    ...localRows.filter((row) => !serverIds.has(row.consultationId)),
  ]
}
</script>

<style scoped>
.consultation-page {
  display: grid;
  gap: 18px;
  min-width: 0;
  color: #111827;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 18px;
}

.filter-panel,
.consultation-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.metric-row article {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.metric-row article :deep(.v-icon) {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 10px;
  background: #fff7ed;
  color: #f97316;
}

.metric-row__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.metric-row strong {
  font-size: 34px;
  line-height: 1;
  color: #1f2937;
}

.metric-row span {
  color: #6b7280;
  font-size: 13px;
}

.metric-row__value span {
  font-size: 13px;
}

.filter-panel {
  display: grid;
  gap: 16px;
  padding: 16px 18px;
}

.filter-panel h3,
.consultation-panel h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.filter-panel :deep(.v-field) {
  min-height: 40px;
  border-radius: 10px;
  box-shadow: none;
}

.filter-panel :deep(.v-field__input) {
  font-size: 13px;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.filter-actions :deep(.v-btn) {
  height: 40px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
}

.search-button {
  padding: 0 18px;
}

.reset-button {
  padding: 0 16px;
}

.search-button,
.create-button {
  background: #f97316;
  color: #ffffff;
}

.reset-button {
  color: #475569;
  border-color: #d1d5db;
}

.consultation-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  border-color: #edf1f7;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.consultation-panel header {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
}

.consultation-panel header span {
  color: #64748b;
  font-size: 12px;
}

.consultation-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
}

.consultation-table table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.consultation-table th,
.consultation-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
}

.consultation-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.consultation-table tr:last-child td {
  border-bottom: 0;
}

.consultation-table tr.is-clickable {
  cursor: pointer;
}

.consultation-table tr.is-clickable:hover {
  background: #fff7ed;
}

.consultation-table__strong {
  color: #f97316;
  font-weight: 700;
}

.consultation-table__state,
.consultation-table__empty {
  height: 140px;
  text-align: center;
  color: #64748b;
}

.consultation-table__state span {
  display: block;
  margin-top: 8px;
}

.consultation-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 5px;
  background: #fff7ed;
  color: #f97316;
  font-size: 11px;
  font-weight: 800;
}

.consultation-badge--CLAIM {
  background: #eff6ff;
  color: #2563eb;
}

.consultation-badge--RENEWAL {
  background: #ecfdf5;
  color: #16a34a;
}

.consultation-badge--TERMINATION {
  background: #fef2f2;
  color: #dc2626;
}

.detail-button {
  height: 26px;
  padding: 0 10px;
  border: 1px solid #f97316;
  border-radius: 6px;
  background: #ffffff;
  color: #f97316;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.consultation-panel__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
}

.consultation-panel__pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 1100px) {
  .metric-row,
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .consultation-table th,
  .consultation-table td {
    padding: 12px 10px;
    font-size: 12px;
  }
}

@media (max-width: 720px) {
  .metric-row,
  .filter-grid,
  .filter-actions,
  .consultation-panel__pagination {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
