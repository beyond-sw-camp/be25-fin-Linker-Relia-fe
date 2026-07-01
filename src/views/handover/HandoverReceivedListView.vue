<template>
  <section class="received-page" aria-label="인수받은 고객 목록">
    <div class="received-summary">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="received-summary-card"
        :style="{ '--dot': card.color }"
      >
        <span class="received-summary-card__dot" aria-hidden="true">
          <v-icon :icon="card.icon" size="22" />
        </span>
        <div class="received-summary-card__value">
          <strong>{{ card.value }}</strong>
          <span>{{ card.unit }}</span>
        </div>
        <p>{{ card.label }}</p>
      </article>
    </div>

    <section class="received-panel">
      <div class="received-panel__header">
        <form class="received-search" @submit.prevent="searchReceivedRows">
          <v-text-field
            v-model.trim="filters.customerName"
            placeholder="고객명 검색"
            variant="outlined"
            density="comfortable"
            hide-details
            class="received-search__input"
            @keyup.enter="searchReceivedRows"
          />
          <v-btn class="received-search__button" type="submit">검색</v-btn>
        </form>
      </div>

      <div class="received-table">
        <table>
          <thead>
            <tr>
              <th>고객명</th>
              <th>등급</th>
              <th>이전 담당 설계사</th>
              <th>변경 사유</th>
              <th>인수일</th>
              <th><span class="sr-only">상세 보기</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="6" class="received-table__state">
                <v-progress-circular indeterminate color="#f97316" size="28" />
                <span>인수받은 고객 목록을 불러오는 중입니다.</span>
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="6" class="received-table__state">
                조건에 맞는 인수 고객이 없습니다.
              </td>
            </tr>
            <tr v-for="row in filteredRows" v-else :key="row.handoverRequestId || row.customerId">
              <td>
                <button class="received-table__customer" type="button" @click="goToHandoverDetail(row)">
                  {{ row.customerName }}
                </button>
              </td>
              <td>
                <span class="received-grade" :class="getGradeClass(row.customerGrade)">
                  {{ row.customerGrade || '-' }}
                </span>
              </td>
              <td>
                <span :class="{ 'received-table__muted': isResignationReason(row.changedReason) }">
                  {{ formatBeforeFp(row) }}
                </span>
              </td>
              <td>{{ row.changedReason || '-' }}</td>
              <td>{{ row.changedAt }}</td>
              <td>
                <button class="received-table__action" type="button" @click="goToHandoverDetail(row)">
                  상세 보기
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="received-pagination">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getReceivedHandovers, getReceivedHandoverSummary } from '../../api/handovers'

const router = useRouter()
const route = useRoute()

const filters = reactive({
  customerName: '',
})
const receivedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(0)
const summary = ref({
  thisMonthReceivedCount: 0,
  totalReceivedCount: 0,
  successRate: 0,
})
const isLoading = ref(false)

const summaryCards = computed(() => [
  {
    label: '이번 달 인수',
    value: formatCount(summary.value.thisMonthReceivedCount),
    unit: '명',
    color: '#c9f2e7',
    icon: 'mdi-account-arrow-right-outline',
  },
  {
    label: '누적 인수 건수',
    value: formatCount(summary.value.totalReceivedCount),
    unit: '명',
    color: '#ffeadf',
    icon: 'mdi-account-multiple-check-outline',
  },
  {
    label: '인수 계약 유지율',
    value: formatPercentValue(summary.value.successRate),
    unit: '%',
    color: '#eeebff',
    icon: 'mdi-chart-line',
  },
])

const filteredRows = computed(() => {
  if (!filters.customerName) {
    return receivedRows.value
  }

  return receivedRows.value.filter((row) => row.customerName.includes(filters.customerName))
})

const rangeLabel = computed(() => {
  if (totalElements.value === 0) {
    return '총 0건'
  }

  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, totalElements.value)
  return `총 ${totalElements.value.toLocaleString('ko-KR')}건 중 ${start}-${end}건`
})

onMounted(() => {
  loadReceived()
})

function searchReceivedRows() {
  currentPage.value = 1
  loadReceived()
  return filteredRows.value
}

function changePage(page) {
  currentPage.value = page
  loadReceived()
}

async function loadReceived() {
  isLoading.value = true

  try {
    const [summaryResponse, listResponse] = await Promise.all([
      getReceivedHandoverSummary(),
      getReceivedHandovers({ page: currentPage.value, size: pageSize.value }),
    ])

    summary.value = normalizeSummary(summaryResponse?.result)
    receivedRows.value = normalizeRows(listResponse?.result)
    normalizePage(listResponse?.result)
  } catch {
    summary.value = createSampleSummary()
    receivedRows.value = createSampleRows()
    totalElements.value = receivedRows.value.length
    totalPages.value = 1
  } finally {
    isLoading.value = false
  }
}

function normalizeSummary(source = {}) {
  return {
    thisMonthReceivedCount: Number(source.thisMonthReceivedCount ?? 0),
    totalReceivedCount: Number(source.totalReceivedCount ?? 0),
    successRate: Number(source.successRate ?? 0),
  }
}

function normalizeRows(source) {
  const content = Array.isArray(source?.content) ? source.content : source

  if (!Array.isArray(content)) {
    return []
  }

  return content.map((row) => ({
    handoverRequestId: row.handoverRequestId,
    customerId: row.customerId,
    customerName: row.customerName ?? '-',
    customerGrade: row.customerGrade ?? '-',
    beforeFpName: row.beforeFpName ?? '',
    changedReason: row.changedReason ?? '',
    changedAt: formatDate(row.changedAt),
  }))
}

function normalizePage(source = {}) {
  currentPage.value = Number(source.page ?? currentPage.value)
  pageSize.value = Number(source.size ?? pageSize.value)
  totalElements.value = Number(source.totalElements ?? receivedRows.value.length)
  totalPages.value = Number(source.totalPages ?? 1)
}

function createSampleSummary() {
  return {
    thisMonthReceivedCount: 2,
    totalReceivedCount: 15,
    successRate: 92.3,
  }
}

function createSampleRows() {
  return [
    {
      customerId: 'C001',
      handoverRequestId: 'HO-001',
      customerName: '홍길동',
      customerGrade: 'GOLD',
      beforeFpName: '김설계',
      changedReason: '설계사 해촉 자동 인수인계',
      changedAt: '2026-06-01',
    },
    {
      customerId: 'C002',
      handoverRequestId: 'HO-002',
      customerName: '이영희',
      customerGrade: 'SILVER',
      beforeFpName: '최설계',
      changedReason: '설계사 해촉 자동 인수인계',
      changedAt: '2026-06-01',
    },
    {
      customerId: 'C003',
      handoverRequestId: 'HO-003',
      customerName: '박민준',
      customerGrade: 'GOLD',
      beforeFpName: '오미래',
      changedReason: '지점 내 업무 재조정',
      changedAt: '2026-05-28',
    },
  ]
}

function goToHandoverDetail(row) {
  if (!row.handoverRequestId) {
    return
  }

  router.push({
    name: 'handover-detail',
    params: { handoverRequestId: row.handoverRequestId },
    query: { from: route.name },
  })
}

function formatBeforeFp(row) {
  if (!row.beforeFpName) {
    return '-'
  }

  return isResignationReason(row.changedReason) ? `${row.beforeFpName} (해촉)` : row.beforeFpName
}

function isResignationReason(reason) {
  return String(reason ?? '').includes('해촉')
}

function getGradeClass(grade) {
  return `received-grade--${String(grade || '').toLowerCase()}`
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatPercentValue(value) {
  return Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-'
}

</script>

<style scoped>
.received-page {
  display: grid;
  gap: 18px;
  width: 100%;
  min-width: 0;
}

.received-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.received-summary-card {
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.received-summary-card__dot {
  display: flex;
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: var(--dot);
  align-items: center;
  justify-content: center;
}

.received-summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.received-summary-card__value strong {
  color: #1f2937;
  font-size: 34px;
  line-height: 1;
}

.received-summary-card__value span,
.received-summary-card p {
  color: #8b8f98;
}

.received-summary-card__value span {
  font-size: 13px;
}

.received-summary-card p {
  display: block;
  margin: 0;
  font-size: 13px;
}

.received-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.received-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 16px;
}

.received-panel h1 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 900;
}

.received-search {
  display: grid;
  grid-template-columns: 240px auto;
  align-items: center;
  gap: 12px;
}

.received-search__input {
  width: 100%;
  min-width: 0;
}

.received-search__button {
  min-width: 64px;
  height: 40px;
  border-radius: 10px;
  background: #f97316;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  padding: 0 18px;
}

.received-search :deep(.v-field) {
  min-height: 40px;
  border-radius: 10px;
  box-shadow: none;
}

.received-search :deep(.v-field__input) {
  font-size: 13px;
}

.received-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
  background: #ffffff;
}

.received-table table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}

.received-table th,
.received-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
}

.received-table tr:last-child td {
  border-bottom: 0;
}

.received-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.received-table th:last-child,
.received-table td:last-child {
  text-align: center;
}

.received-table__customer {
  padding: 0;
  border: 0;
  background: transparent;
  color: #f97316;
  font-weight: 700;
  cursor: pointer;
}

.received-table__action {
  min-width: 0;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid #ffb17d;
  border-radius: 8px;
  background: #ffffff;
  color: #f97316;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.received-table__muted {
  color: #a4a9b2;
}

.received-table__state {
  height: 160px;
  text-align: center;
  color: #8b8f98;
}

.received-table__state span {
  display: block;
  margin-top: 10px;
}

.received-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
}

.received-pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

.received-grade {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff0d8;
  color: #c47b00;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.received-grade--silver {
  background: #eeeafe;
  color: #5f5be8;
}

.received-grade--vip {
  background: #f3e8ff;
  color: #7c3aed;
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
  .received-summary {
    grid-template-columns: 1fr;
  }

  .received-panel__header,
  .received-search,
  .received-pagination {
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .received-search__button {
    width: 100%;
  }
}

@media (max-width: 1280px) {
  .received-table th,
  .received-table td {
    padding: 12px 10px;
    font-size: 12px;
  }
}
</style>
