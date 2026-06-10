<template>
  <section class="customer-page">
    <div class="customer-page__toolbar">
      <div class="customer-page__filters">
        <div class="status-tabs" role="tablist" aria-label="고객 유형">
          <button
            v-for="option in CUSTOMER_FILTER_OPTIONS"
            :key="option.value"
            type="button"
            class="status-tabs__button"
            :class="{ 'status-tabs__button--active': filters.customerType === option.value }"
            @click="filters.customerType = option.value"
          >
            {{ option.label }}
          </button>
        </div>

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
          class="customer-page__branch-filter"
        />
      </div>

      <div class="customer-page__search">
        <v-text-field
          v-model="filters.keyword"
          placeholder="고객명을 입력하세요"
          variant="outlined"
          density="comfortable"
          hide-details
          @keyup.enter="searchCustomers"
        />
        <v-btn class="customer-page__search-button" @click="searchCustomers">검색</v-btn>
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
        <p>고객 목록을 불러오는 중입니다.</p>
      </div>

      <template v-else-if="customers.length > 0">
        <div class="customer-table">
          <table>
            <thead>
              <tr>
                <th>고객명</th>
                <th>생년월일</th>
                <th>연락처</th>
                <th v-if="showBranchFilter">소속 지점</th>
                <th>보유 계약 수</th>
                <th>월 보험료</th>
                <th>최근 상담일</th>
                <th>다음 상담 예정일</th>
                <th>고객 등급</th>
                <th>고객 상태</th>
                <th v-if="filters.customerType === CUSTOMER_FILTERS.INTEREST">관심 사유</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in customers" :key="customer.customerId">
                <td>
                  <button class="customer-table__link" type="button" @click="goToCustomerDetail(customer.customerId)">
                    {{ customer.customerName }}
                  </button>
                </td>
                <td>{{ formatDate(customer.customerBirthDate) }}</td>
                <td>{{ formatPhone(customer.customerPhone) }}</td>
                <td v-if="showBranchFilter">{{ customer.organizationName || '-' }}</td>
                <td>{{ customer.contractCount ?? 0 }}</td>
                <td>{{ formatCurrency(customer.monthlyPremium) }}</td>
                <td>{{ formatDate(customer.lastConsultedAt) }}</td>
                <td>{{ formatDate(customer.nextConsultedAt) }}</td>
                <td>{{ getCustomerGradeLabel(customer.customerGrade) }}</td>
                <td>
                  <span
                    class="customer-status"
                    :class="{
                      'customer-status--interest': customer.interestYn,
                    }"
                  >
                    {{ customer.interestYn ? '관심 고객' : getCustomerStatusLabel(customer.customerStatus) }}
                  </span>
                </td>
                <td v-if="filters.customerType === CUSTOMER_FILTERS.INTEREST">
                  {{ getInterestReasonLabel(customer.interestReason) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="customer-page__pagination">
          <span>
            총 {{ customerPage.totalElements.toLocaleString('ko-KR') }}건
          </span>
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
        <p>조건에 맞는 고객이 없습니다.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { USER_ROLES } from '../../constants/auth'
import {
  CUSTOMER_FILTERS,
  CUSTOMER_FILTER_OPTIONS,
  getCustomerGradeLabel,
  getCustomerStatusLabel,
  getInterestReasonLabel,
} from '../../constants/customer'
import { useCustomerList } from '../../composables/useCustomerList'
import { useAuthStore } from '../../stores/auth'
import { formatCurrency, formatDate, formatPhone } from '../../utils/formatters'

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
  changePage,
} = useCustomerList(authStore)

const summaryCards = computed(() => [
  {
    label: '전체 고객 수',
    value: summary.value.totalCustomerCount.toLocaleString('ko-KR'),
    accent: '#2563eb',
    tone: '#eff6ff',
    icon: 'mdi-account-group-outline',
  },
  {
    label: '계약 고객',
    value: summary.value.contractedCustomerCount.toLocaleString('ko-KR'),
    accent: '#f97316',
    tone: '#fff7ed',
    icon: 'mdi-file-document-outline',
  },
  {
    label: '잠재 고객',
    value: summary.value.prospectCustomerCount.toLocaleString('ko-KR'),
    accent: '#16a34a',
    tone: '#ecfdf3',
    icon: 'mdi-sprout-outline',
  },
  {
    label: '관심 고객',
    value: summary.value.interestCustomerCount.toLocaleString('ko-KR'),
    accent: '#ef4444',
    tone: '#fff1f2',
    icon: 'mdi-alert-outline',
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
</script>

<style scoped>
.customer-page {
  display: grid;
  gap: 18px;
}

.customer-page__toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.customer-page__filters {
  display: flex;
  align-items: center;
  gap: 12px;
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

.customer-page__branch-filter {
  width: 180px;
}

.customer-page__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(360px, 100%);
}

.customer-page__search :deep(.v-input) {
  flex: 1;
}

.customer-page__search-button {
  height: 40px;
  border-radius: 10px;
  background: #f97316;
  color: #ffffff;
}

.customer-page__summary {
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
  min-width: 1180px;
}

.customer-table th,
.customer-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: left;
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
}

.customer-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #e8f0ff;
}

.customer-status--interest {
  color: #ef4444;
  background: #fff1f2;
}

.customer-page__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .customer-page__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .customer-page__toolbar,
  .customer-page__filters,
  .customer-page__search,
  .customer-page__pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .customer-page__summary {
    grid-template-columns: 1fr;
  }

  .customer-page__branch-filter {
    width: 100%;
  }
}
</style>
