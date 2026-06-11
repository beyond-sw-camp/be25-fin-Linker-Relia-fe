<template>
  <section class="customer-page">
    <div class="customer-page__toolbar">
      <div v-if="showBranchFilter" class="customer-page__filters">
        <v-select
          v-model="filters.organizationCode"
          :items="branches"
          item-title="title"
          item-value="value"
          label="지점 선택"
          variant="outlined"
          density="comfortable"
          hide-details
          :loading="isLoadingBranches"
          class="customer-page__organization-filter"
        />
      </div>

      <div class="customer-page__filter-row">
        <div class="status-tabs" role="tablist" aria-label="관심 고객 사유">
          <button
            type="button"
            class="status-tabs__button"
            :class="{ 'status-tabs__button--active': filters.interestReason === '' }"
            @click="filters.interestReason = ''"
          >
            전체
          </button>
          <button
            v-for="option in interestReasonOptions"
            :key="option.value"
            type="button"
            class="status-tabs__button"
            :class="{ 'status-tabs__button--active': filters.interestReason === option.value }"
            @click="filters.interestReason = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="customer-page__search-group">
          <v-text-field
            v-model="filters.customerName"
            label="고객명"
            placeholder="고객명을 입력하세요"
            variant="outlined"
            density="comfortable"
            hide-details
            class="customer-page__name-filter"
            @keyup.enter="searchCustomers"
          />

          <v-btn class="customer-page__search-button" @click="searchCustomers">검색</v-btn>
          <v-btn variant="outlined" class="customer-page__reset-button" @click="resetFilters">
            초기화
          </v-btn>
        </div>
      </div>
    </div>

    <v-alert v-if="branchErrorMessage" type="warning" variant="tonal" density="comfortable">
      {{ branchErrorMessage }}
    </v-alert>

    <div class="customer-page__summary">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <div class="summary-card__value">
          <strong>{{ card.value }}</strong>
          <span>명</span>
        </div>
        <p>{{ card.label }}</p>
      </article>
    </div>

    <section class="customer-panel">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <div v-if="isLoading" class="customer-panel__state">
        <v-progress-circular indeterminate color="#f97316" />
        <p>관심 고객 목록을 불러오는 중입니다.</p>
      </div>

      <template v-else-if="customers.length > 0">
        <div class="customer-table">
          <table>
            <thead>
              <tr>
                <th>고객명</th>
                <th>생년월일</th>
                <th>연락처</th>
                <th>고객 상태</th>
                <th>관심 고객 사유</th>
                <th>최근 상담일</th>
                <th>미납 회차</th>
                <th>갱신 D-Day</th>
                <th>만기 D-Day</th>
                <th>지점명</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in customers" :key="customer.customerId">
                <td>
                  <button class="customer-table__link" type="button" @click="goToCustomerDetail(customer.customerId)">
                    {{ formatNullableText(customer.customerName) }}
                  </button>
                </td>
                <td>{{ formatDate(customer.customerBirthDate) }}</td>
                <td>{{ formatPhone(customer.customerPhone) }}</td>
                <td>{{ getCustomerStatusLabel(customer.customerStatus) }}</td>
                <td>{{ getInterestReasonLabel(customer.interestReason) }}</td>
                <td>{{ formatDate(customer.lastConsultedAt) }}</td>
                <td>{{ formatNullableNumber(customer.unpaidInstallmentCount) }}</td>
                <td>{{ formatDDay(customer.renewalDDay) }}</td>
                <td>{{ formatDDay(customer.maturityDDay) }}</td>
                <td>{{ formatNullableText(customer.organizationName) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="customer-page__pagination">
          <span>총 {{ customerPage.totalElements.toLocaleString('ko-KR') }}건</span>
          <v-pagination
            :model-value="filters.page"
            :length="Math.max(customerPage.totalPages, 1)"
            total-visible="7"
            rounded="circle"
            @update:model-value="changePage"
          />
        </div>
      </template>

      <div v-else class="customer-panel__state">
        <p>조건에 맞는 관심 고객이 없습니다.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  INTEREST_REASON_OPTIONS,
  getCustomerStatusLabel,
  getInterestReasonLabel,
} from '../../constants/customer'
import { useInterestCustomerList } from '../../composables/useInterestCustomerList'
import { useAuthStore } from '../../stores/auth'
import { formatDate, formatNullableText, formatPhone } from '../../utils/formatters'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const {
  filters,
  customers,
  customerPage,
  summary,
  branches,
  isLoading,
  errorMessage,
  showBranchFilter,
  isLoadingBranches,
  branchErrorMessage,
  initialize,
  searchCustomers,
  resetFilters,
  changePage,
} = useInterestCustomerList(authStore, route, router)

const interestReasonOptions = [
  ...INTEREST_REASON_OPTIONS,
]

const summaryCards = computed(() => [
  {
    label: '전체 관심 고객',
    value: summary.value.totalInterestCustomerCount.toLocaleString('ko-KR'),
    accent: '#2563eb',
    tone: '#eff6ff',
    icon: 'mdi-star-outline',
  },
  {
    label: '보험료 미납',
    value: summary.value.unpaidInterestCustomerCount.toLocaleString('ko-KR'),
    accent: '#ef4444',
    tone: '#fff1f2',
    icon: 'mdi-alert-circle-outline',
  },
  {
    label: '갱신 예정',
    value: summary.value.renewalDueInterestCustomerCount.toLocaleString('ko-KR'),
    accent: '#f59e0b',
    tone: '#fff7ed',
    icon: 'mdi-refresh-circle',
  },
  {
    label: '만기 예정',
    value: summary.value.maturityDueInterestCustomerCount.toLocaleString('ko-KR'),
    accent: '#8b5cf6',
    tone: '#f5f3ff',
    icon: 'mdi-calendar-clock-outline',
  },
])

onMounted(() => {
  initialize()
})

function goToCustomerDetail(customerId) {
  router.push({
    name: 'customer-detail',
    params: { customerId },
    query: {
      from: route.name,
    },
  })
}

function formatNullableNumber(value) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function formatDDay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return '-'
  }

  if (parsed === 0) {
    return 'D-Day'
  }

  if (parsed > 0) {
    return `D-${parsed}`
  }

  return `D+${Math.abs(parsed)}`
}
</script>

<style scoped>
.customer-page {
  display: grid;
  gap: 18px;
}

.customer-page__toolbar {
  display: grid;
  gap: 16px;
}

.customer-page__filters {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.customer-page__filter-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.customer-page__organization-filter,
.customer-page__reason-filter {
  min-width: 0;
  width: 252px;
  flex: 0 0 auto;
}

.status-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
}

.status-tabs__button {
  padding: 12px 18px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
}

.status-tabs__button--active {
  color: #f97316;
  border-bottom-color: #f97316;
  font-weight: 700;
}

.customer-page__search-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex: 0 0 auto;
}

.customer-page__name-filter {
  width: 240px;
  flex: 0 0 auto;
}

.customer-page__search-button {
  height: 40px;
  border-radius: 10px;
  background: #f97316;
  color: #ffffff;
  padding: 0 18px;
}

.customer-page__reset-button {
  height: 40px;
  border-radius: 10px;
  border-color: #d1d5db;
  color: #475569;
  padding: 0 16px;
}

.customer-page__summary {
  overflow-x: auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.summary-card__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  margin-bottom: 12px;
}

.summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.summary-card__value strong {
  font-size: 34px;
  line-height: 1;
  color: #1f2937;
}

.summary-card__value span,
.summary-card p {
  margin: 0;
  color: #6b7280;
}

.summary-card p {
  font-size: 13px;
}

.customer-panel {
  padding: 12px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #edf1f7;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.customer-panel__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 260px;
  color: #64748b;
}

.customer-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
}

.customer-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1360px;
}

.customer-table th,
.customer-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: center;
  color: #475569;
}

.customer-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.customer-table__link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #f97316;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}

.customer-page__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .customer-page__filter-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .customer-page__search-group {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .customer-page__filters,
  .customer-page__filter-row,
  .customer-page__pagination {
    display: grid;
    grid-template-columns: 1fr;
  }

  .customer-page__organization-filter,
  .customer-page__name-filter {
    width: 100%;
  }

  .customer-page__search-group {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }

  .customer-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
