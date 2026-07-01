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
        <v-btn class="contract-page__search-button" @click="searchContracts">검색</v-btn>
        <v-btn variant="outlined" class="contract-page__reset-button" @click="resetContractFilters">
          초기화
        </v-btn>
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
        <small v-if="card.caption">{{ card.caption }}</small>
      </article>
    </div>

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
          <v-select
            v-model="contractSort"
            :items="sortOptions"
            item-title="label"
            item-value="value"
            label="정렬"
            variant="outlined"
            density="comfortable"
            hide-details
            class="contract-sort__select"
          />
        </div>
      </div>

    <section class="contract-panel">
      <div class="contract-table">
        <table>
          <thead>
            <tr>
              <th v-for="column in contractTableColumns" :key="column.key">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isContractListLoading">
              <td :colspan="contractTableColumns.length" class="contract-table__state">
                <v-progress-circular indeterminate color="#f97316" size="28" />
                <span>계약 목록을 불러오는 중입니다.</span>
              </td>
            </tr>
            <tr v-else-if="contractListError">
              <td :colspan="contractTableColumns.length" class="contract-table__state contract-table__state--error">
                {{ contractListError }}
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="contract in contractRows"
                :key="contract.contractCode"
                class="is-clickable"
                @click="goToContractDetail(contract)"
              >
                <td v-if="hasContractTableColumn('contractCode')">
                  <span>{{ contract.contractCode }}</span>
                </td>
                <td v-if="hasContractTableColumn('customerName')">
                  <span class="contract-table__customer">{{ contract.customerName }}</span>
                </td>
                <td v-if="hasContractTableColumn('insuranceCompanyName')">{{ contract.insuranceCompanyName }}</td>
                <td v-if="hasContractTableColumn('insuranceProductName')" class="contract-table__strong">{{ contract.insuranceProductName }}</td>
                <td v-if="hasContractTableColumn('contractDate')">{{ formatDate(contract.contractDate) }}</td>
                <td v-if="hasContractTableColumn('monthlyPremium')" class="contract-table__strong">{{ formatPremium(contract.monthlyPremium) }}</td>
                <td v-if="hasContractTableColumn('contractStatus')">
                  <span class="contract-badge" :class="getContractStatusBadgeClass(contract.contractStatus)">
                    {{ getContractStatusLabel(contract.contractStatus) }}
                  </span>
                </td>
                <td v-if="hasContractTableColumn('contractEndDate')">
                  <span>{{ formatDate(contract.contractEndDate) }}</span>
                  <span
                    v-if="shouldShowMaturityBadge(contract.contractStatus)"
                    class="contract-badge contract-badge--warning"
                  >
                    {{ getContractStatusLabel(contract.contractStatus) }}
                  </span>
                </td>
              </tr>
            </template>
            <tr v-if="!isContractListLoading && !contractListError && contractRows.length === 0">
              <td :colspan="contractTableColumns.length" class="contract-table__empty">조건에 맞는 계약이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

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
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getContractSummary,
  getContracts,
} from '../../api/contracts'
import {
  CONTRACT_BRANCH_OPTIONS,
  CONTRACT_INSURER_OPTIONS,
} from '../../data/contractMocks'

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

const summaryCards = computed(() => [
  {
    label: '전체 보유 계약',
    value: formatCount(contractSummary.value.totalContractCount),
    caption: '',
    accent: '#f97316',
    tone: '#fff1e8',
    icon: 'mdi-file-document-outline',
  },
  {
    label: '수금 계약',
    value: formatCount(contractSummary.value.normalPaymentCount),
    caption: '',
    accent: '#16a34a',
    tone: '#dcfce7',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: '미수금 계약',
    value: formatCount(contractSummary.value.unpaidCount),
    caption: '',
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
  {
    label: '갱신 임박 계약',
    value: formatCount(contractSummary.value.renewalSoonCount),
    caption: '',
    accent: '#2563eb',
    tone: '#dbeafe',
    icon: 'mdi-autorenew',
  },
])

const showPaymentStatusColumn = computed(() => filters.status === 'ALL')

const contractTableColumns = computed(() => {
  const columns = [
    { key: 'contractCode', label: '계약번호' },
    { key: 'customerName', label: '고객명' },
    { key: 'insuranceCompanyName', label: '보험사' },
    { key: 'insuranceProductName', label: '보험상품' },
    { key: 'contractDate', label: '계약일' },
    { key: 'monthlyPremium', label: '월 보험료' },
  ]

  if (showPaymentStatusColumn.value) {
    columns.push({ key: 'contractStatus', label: '납부 여부' })
  }

  columns.push({ key: 'contractEndDate', label: '만기일' })

  return columns
})

const rangeLabel = computed(() => {
  if (totalElements.value === 0) {
    return '총 0건 중 0-0건 표시'
  }

  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, totalElements.value)

  return `총 ${totalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건 표시`
})


watch(
  () => [filters.branch, filters.insurer, filters.status],
  () => {
    currentPage.value = 1
    loadContractList()
  },
)

watch(
  () => [filters.branch, filters.insurer],
  () => {
    loadContractSummary()
  },
)

watch(
  () => contractSort.value,
  () => {
    currentPage.value = 1
    loadContractList()
  },
)

onMounted(() => {
  loadContractList()
  loadContractSummary()
})

function changeStatus(status) {
  filters.status = status
}

async function searchContracts() {
  currentPage.value = 1
  await Promise.all([
    loadContractList(),
    loadContractSummary(),
  ])
}

async function resetContractFilters() {
  currentPage.value = 1
  filters.branch = 'ALL'
  filters.insurer = 'ALL'
  filters.status = 'ALL'
  contractSort.value = 'LATEST_CONTRACT'
  await Promise.all([
    loadContractList(),
    loadContractSummary(),
  ])
}

function hasContractTableColumn(key) {
  return contractTableColumns.value.some((column) => column.key === key)
}

function shouldShowMaturityBadge(status) {
  if (filters.status === 'EXPIRING_SOON' || filters.status === 'RENEWAL_SOON') {
    return false
  }

  return isNearMaturityContract(status)
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


function buildContractListParams() {
  const params = {
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
  const params = {}

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
    renewalSoonCount: Number(summary?.renewalSoonCount ?? 0),
  }
}

function createEmptyContractSummary() {
  return {
    totalContractCount: 0,
    normalPaymentCount: 0,
    unpaidCount: 0,
    lapseExpectedCount: 0,
    expiringSoonCount: 0,
    renewalSoonCount: 0,
  }
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
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
  min-width: 0;
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
  gap: 12px;
  min-width: 0;
}

.contract-page__filter {
  width: 160px;
  flex: 0 0 auto;
}

.contract-page__toolbar :deep(.v-field) {
  min-height: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: none;
}

.contract-page__toolbar :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 14px;
}

.contract-page__create-button {
  min-width: 124px;
  height: 40px;
  background: #f97316;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  border-radius: 10px;
}

.contract-page__search-button {
  width: 55px;
  min-width: 55px;
  height: 34px;
  border: 1px solid rgba(249, 115, 22, 0.28);
  border-radius: 10px;
  background: #fff7ed;
  color: #f97316;
  padding: 0 18px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.contract-page__search-button:hover {
  transform: translateY(-1px);
  border-color: rgba(249, 115, 22, 0.55);
  background: #ffedd5;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);
}

.contract-page__search-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.08);
}

.contract-page__reset-button {
  width: 55px;
  min-width: 55px;
  height: 34px;
  border-radius: 10px;
  border-color: #d1d5db;
  color: #475569;
  padding: 0 16px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
}

.contract-page__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
}

.contract-page__summary-state {
  min-height: 150px;
  display: grid;
  place-items: center;
  gap: 10px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  color: #64748b;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.contract-page__summary-state--error {
  color: #ef4444;
}

.contract-summary-card {
  min-height: 0;
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.contract-summary-card__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  margin-bottom: 12px;
}

.contract-summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.contract-summary-card__value strong {
  font-size: 34px;
  line-height: 1;
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
  margin: 0;
  font-size: 13px;
}

.contract-panel {
  padding: 12px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.contract-list-controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.contract-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  overflow-x: auto;
}

.contract-tabs__button {
  padding: 12px 18px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
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

.contract-sort__select {
  width: 160px;
  flex: 0 0 auto;
}

.contract-sort__select :deep(.v-field) {
  min-height: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: none;
}

.contract-sort__select :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 14px;
}

.contract-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
}

.contract-table table {
  width: 100%;
  border-collapse: collapse;
}

.contract-table table {
  min-width: 980px;
}

.contract-table th,
.contract-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: center;
  color: #475569;
  white-space: nowrap;
}

.contract-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.contract-table tr.is-clickable {
  cursor: pointer;
}

.contract-table tr.is-clickable:hover {
  background: #fff7ed;
}

.contract-table__customer {
  color: #f97316;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.contract-table__strong {
  font-weight: 400;
  color: #475569;
}

.contract-table tr:last-child td {
  border-bottom: 0;
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
  font-size: 12px;
}

.contract-panel__pagination-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.contract-panel__pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 1280px) {
  .contract-table th,
  .contract-table td {
    padding: 12px 10px;
    font-size: 12px;
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

  .contract-page__filter {
    width: 100%;
  }

  .contract-page__create-button {
    width: 100%;
  }

  .contract-page__search-button,
  .contract-page__reset-button {
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

  .contract-sort__select {
    width: 100%;
  }

  .contract-page__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 560px) {
  .contract-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
