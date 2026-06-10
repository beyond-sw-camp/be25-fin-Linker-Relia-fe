<template>
  <section class="customer-detail">
    <button class="customer-detail__back" type="button" @click="goBack">
      <v-icon icon="mdi-arrow-left" size="16" />
      고객 목록으로 돌아가기
    </button>

    <div v-if="customerErrorMessage" class="detail-state">
      <v-alert type="error" variant="tonal">{{ customerErrorMessage }}</v-alert>
    </div>

    <div v-else-if="isLoadingCustomer" class="detail-state">
      <v-progress-circular indeterminate color="#f97316" />
      <p>고객 기본 정보를 불러오는 중입니다.</p>
    </div>

    <template v-else-if="customer">
      <div class="customer-detail__heading">
        <h2>고객 상세</h2>
        <p>고객 기본 정보는 상단에 유지하고, 하단에서 계약/상담/브리핑/설계사 이력을 확인할 수 있습니다.</p>
      </div>

      <section class="customer-profile">
        <div class="customer-profile__identity">
          <div class="customer-profile__avatar">
            <v-icon icon="mdi-account-outline" size="22" />
          </div>
          <div>
            <div class="customer-profile__name-row">
              <strong>{{ customer.customerName }}</strong>
              <span class="customer-profile__status">
                {{ customer.interestYn ? '관심 고객' : getCustomerStatusLabel(customer.customerStatus) }}
              </span>
              <span v-if="customer.customerGrade" class="customer-profile__grade">
                {{ getCustomerGradeLabel(customer.customerGrade) }}
              </span>
            </div>
            <p>{{ formatDate(customer.customerBirthDate) }} · {{ customer.customerGender || '-' }}</p>
            <p>담당 설계사: {{ customer.fpName || '-' }}</p>
            <p>소속 지점: {{ customer.organizationName || '-' }}</p>
          </div>
        </div>

        <div class="customer-profile__meta">
          <p><v-icon icon="mdi-phone-outline" size="14" />{{ formatPhone(customer.customerPhone) }}</p>
          <p><v-icon icon="mdi-email-outline" size="14" />{{ formatNullableText(customer.customerEmail) }}</p>
          <p><v-icon icon="mdi-map-marker-outline" size="14" />{{ formatNullableText(customer.customerAddress) }}</p>
          <p><v-icon icon="mdi-briefcase-outline" size="14" />{{ customerCompanyText }}</p>
          <p><v-icon icon="mdi-calendar-month-outline" size="14" />최근 상담: {{ formatDate(customer.lastConsultedAt) }}</p>
          <p><v-icon icon="mdi-calendar-clock-outline" size="14" />다음 상담: {{ formatDate(customer.nextConsultedAt) }}</p>
        </div>
      </section>

      <div class="customer-detail__summary">
        <article v-for="card in summaryCards" :key="card.label" class="detail-card">
          <div class="detail-card__icon">
            <v-icon :icon="card.icon" size="18" />
          </div>
          <div class="detail-card__value">
            <strong>{{ card.value }}</strong>
            <span>{{ card.unit }}</span>
          </div>
          <p>{{ card.label }}</p>
        </article>
      </div>

      <section class="customer-detail__panel">
        <div class="detail-tabs" role="tablist" aria-label="고객 상세 탭">
          <button
            v-for="tab in detailTabs"
            :key="tab.value"
            type="button"
            class="detail-tabs__button"
            :class="{ 'detail-tabs__button--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="detail-section">
          <template v-if="activeTab === 'contracts'">
            <div v-if="contracts.errorMessage" class="detail-state">
              <v-alert type="error" variant="tonal">{{ contracts.errorMessage }}</v-alert>
            </div>
            <div v-else-if="contracts.isLoading" class="detail-state">
              <v-progress-circular indeterminate color="#f97316" />
            </div>
            <div v-else-if="contracts.items.length > 0" class="detail-table">
              <table>
                <thead>
                  <tr>
                    <th>보험사명</th>
                    <th>상품명</th>
                    <th>월 보험료</th>
                    <th>계약 시작일</th>
                    <th>계약 상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contract in contracts.items" :key="contract.contractId">
                    <td>{{ contract.insuranceCompanyName }}</td>
                    <td>{{ contract.insuranceProductName }}</td>
                    <td>{{ formatCurrency(contract.monthlyPremium) }}</td>
                    <td>{{ formatDate(contract.contractStartedAt) }}</td>
                    <td>{{ getContractStatusLabel(contract.contractStatus) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="detail-empty">보유 계약이 없습니다.</div>
          </template>

          <template v-else-if="activeTab === 'consultations'">
            <div v-if="consultations.errorMessage" class="detail-state">
              <v-alert type="error" variant="tonal">{{ consultations.errorMessage }}</v-alert>
            </div>
            <div v-else-if="consultations.isLoading" class="detail-state">
              <v-progress-circular indeterminate color="#f97316" />
            </div>
            <template v-else-if="consultations.items.length > 0">
              <div class="detail-table">
                <table>
                  <thead>
                    <tr>
                      <th>차수</th>
                      <th>상담 일자</th>
                      <th>상담 유형</th>
                      <th>상담 방식</th>
                      <th>작성 설계사</th>
                      <th>다음 상담 예정일</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="consultation in consultations.items" :key="consultation.consultationId">
                      <td>{{ consultation.consultationSequence }}</td>
                      <td>{{ formatDateTime(consultation.consultedAt) }}</td>
                      <td>{{ getConsultationTypeLabel(consultation.consultationType) }}</td>
                      <td>{{ getConsultationChannelLabel(consultation.consultationChannel) }}</td>
                      <td>{{ consultation.fpName || consultation.fpId || '-' }}</td>
                      <td>{{ formatDateTime(consultation.nextScheduledAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="detail-pagination">
                <v-pagination
                  :model-value="consultationPageNumber"
                  :length="Math.max(consultations.page.totalPages, 1)"
                  total-visible="7"
                  rounded="circle"
                  @update:model-value="changeConsultationPage"
                />
              </div>
            </template>
            <div v-else class="detail-empty">상담 이력이 없습니다.</div>
          </template>

          <template v-else-if="activeTab === 'briefing'">
            <div v-if="briefing.errorMessage" class="detail-state">
              <v-alert type="error" variant="tonal">{{ briefing.errorMessage }}</v-alert>
            </div>
            <div v-else-if="briefing.isLoading" class="detail-state">
              <v-progress-circular indeterminate color="#f97316" />
            </div>
            <div v-else-if="briefing.item?.briefingContent" class="briefing-box">
              <div class="briefing-box__title">
                <v-icon icon="mdi-sparkles" size="18" />
                <strong>AI 상담 브리핑</strong>
              </div>
              <p class="briefing-box__content">{{ briefing.item.briefingContent }}</p>
              <p class="briefing-box__timestamp">생성 시각: {{ formatDateTime(briefing.item.createdAt) }}</p>
            </div>
            <div v-else class="detail-empty">생성된 AI 브리핑이 없습니다.</div>
          </template>

          <template v-else>
            <div v-if="fpHistories.errorMessage" class="detail-state">
              <v-alert type="error" variant="tonal">{{ fpHistories.errorMessage }}</v-alert>
            </div>
            <div v-else-if="fpHistories.isLoading" class="detail-state">
              <v-progress-circular indeterminate color="#f97316" />
            </div>
            <template v-else-if="fpHistories.items.length > 0">
              <div class="detail-table">
                <table>
                  <thead>
                    <tr>
                      <th>차수</th>
                      <th>변경 일시</th>
                      <th>이전 담당</th>
                      <th>신규 담당</th>
                      <th>변경 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="history in fpHistories.items" :key="history.historyId">
                      <td>{{ history.customerFpSequence }}</td>
                      <td>{{ formatDateTime(history.changedAt) }}</td>
                      <td>{{ history.beforeFpName || '-' }}</td>
                      <td>{{ history.afterFpName || '-' }}</td>
                      <td>{{ formatNullableText(history.changedReason) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="detail-pagination">
                <v-pagination
                  :model-value="fpHistoryPageNumber"
                  :length="Math.max(fpHistories.page.totalPages, 1)"
                  total-visible="7"
                  rounded="circle"
                  @update:model-value="changeFpHistoryPage"
                />
              </div>
            </template>
            <div v-else class="detail-empty">설계사 변경 이력이 없습니다.</div>
          </template>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getConsultationChannelLabel,
  getConsultationTypeLabel,
  getContractStatusLabel,
  getCustomerGradeLabel,
  getCustomerStatusLabel,
} from '../../constants/customer'
import { useCustomerDetail } from '../../composables/useCustomerDetail'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNullableText,
  formatPhone,
} from '../../utils/formatters'

const route = useRoute()
const router = useRouter()
const customerId = computed(() => route.params.customerId)
const activeTab = ref('contracts')

const {
  customer,
  isLoadingCustomer,
  customerErrorMessage,
  contracts,
  consultations,
  briefing,
  fpHistories,
  loadCustomer,
  loadContracts,
  loadConsultations,
  loadBriefing,
  loadFpHistories,
  changeConsultationPage,
  changeFpHistoryPage,
} = useCustomerDetail(customerId)

const detailTabs = [
  { label: '보유 계약', value: 'contracts' },
  { label: '상담 이력', value: 'consultations' },
  { label: 'AI 브리핑 요약', value: 'briefing' },
  { label: '설계사 변경 이력', value: 'history' },
]

const summaryCards = computed(() => [
  {
    label: '보유 계약 수',
    value: customer.value?.contractSummary?.totalContractCount ?? 0,
    unit: '건',
    icon: 'mdi-file-document-outline',
  },
  {
    label: '월 보험료 합계',
    value: formatCurrency(customer.value?.contractSummary?.totalMonthlyPremium).replace('원', ''),
    unit: '원',
    icon: 'mdi-cash-multiple',
  },
  {
    label: '정상 계약 수',
    value: customer.value?.contractSummary?.activeContractCount ?? 0,
    unit: '건',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: '만기 임박 계약 수',
    value: customer.value?.contractSummary?.maturityDueContractCount ?? 0,
    unit: '건',
    icon: 'mdi-clock-fast',
  },
])

const customerCompanyText = computed(() => {
  const company = customer.value?.customerCompanyName
  const job = customer.value?.customerJob

  if (company && job) {
    return `${company} / ${job}`
  }

  return company || job || '-'
})

const consultationPageNumber = computed(() => consultations.page.page || 1)
const fpHistoryPageNumber = computed(() => fpHistories.page.page || 1)

watch(
  () => activeTab.value,
  async (tab) => {
    if (tab === 'contracts') {
      await loadContracts()
      return
    }

    if (tab === 'consultations') {
      await loadConsultations()
      return
    }

    if (tab === 'briefing') {
      await loadBriefing()
      return
    }

    await loadFpHistories()
  },
)

watch(
  () => customerId.value,
  async () => {
    activeTab.value = 'contracts'
    await loadCustomer()
    await loadContracts(true)
  },
)

onMounted(async () => {
  await loadCustomer()
  await loadContracts()
})

function goBack() {
  const from = route.query.from

  if (typeof from === 'string' && from.length > 0) {
    router.push({ name: from })
    return
  }

  router.push('/')
}
</script>

<style scoped>
.customer-detail {
  display: grid;
  gap: 18px;
}

.customer-detail__back {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.customer-detail__heading h2 {
  margin: 0 0 6px;
  font-size: 28px;
  color: #111827;
}

.customer-detail__heading p {
  margin: 0;
  color: #6b7280;
}

.customer-profile {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 18px;
  padding: 22px;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  background: #ffffff;
}

.customer-profile__identity {
  display: flex;
  gap: 14px;
}

.customer-profile__avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff5eb;
  color: #f97316;
}

.customer-profile__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.customer-profile__name-row strong {
  font-size: 20px;
  color: #111827;
}

.customer-profile__status,
.customer-profile__grade {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.customer-profile__status {
  color: #2563eb;
  background: #e8f0ff;
}

.customer-profile__grade {
  color: #6b7280;
  background: #f8fafc;
}

.customer-profile__identity p,
.customer-profile__meta p {
  margin: 0 0 8px;
  color: #64748b;
}

.customer-profile__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 18px;
}

.customer-profile__meta p {
  display: flex;
  align-items: center;
  gap: 6px;
}

.customer-detail__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.detail-card {
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
}

.detail-card__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  margin-bottom: 12px;
  background: #f8fafc;
  color: #2563eb;
}

.detail-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.detail-card__value strong {
  font-size: 34px;
  line-height: 1;
  color: #1f2937;
}

.detail-card p {
  display: block;
  margin: 6px 0 0;
  color: #64748b;
}

.customer-detail__panel {
  padding: 12px;
  border: 1px solid #e9edf5;
  border-radius: 18px;
  background: #ffffff;
}

.detail-tabs {
  display: flex;
  gap: 2px;
  padding: 0 4px;
  border-bottom: 1px solid #eef2f7;
  overflow-x: auto;
}

.detail-tabs__button {
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 12px 10px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.detail-tabs__button--active {
  color: #f97316;
  border-bottom-color: #f97316;
  font-weight: 700;
}

.detail-section {
  padding: 16px 4px 4px;
}

.detail-state,
.detail-empty {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 220px;
  color: #64748b;
}

.detail-table {
  overflow-x: auto;
  border: 1px solid #eff3f8;
  border-radius: 16px;
}

.detail-table table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 13px;
  color: #475569;
}

.detail-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.briefing-box {
  padding: 18px;
  border: 1px solid #ffe7d6;
  border-radius: 16px;
  background: linear-gradient(180deg, #fffaf5 0%, #fffdfb 100%);
}

.briefing-box__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #f97316;
}

.briefing-box__content {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  white-space: pre-wrap;
}

.briefing-box__timestamp {
  margin: 18px 0 0;
  text-align: right;
  color: #94a3b8;
  font-size: 12px;
}

.detail-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .customer-detail__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .customer-profile {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .customer-detail__summary {
    grid-template-columns: 1fr;
  }

  .customer-profile__meta {
    grid-template-columns: 1fr;
  }
}
</style>
