<template>
  <section class="customer-detail">
    <div v-if="customerErrorMessage" class="detail-state">
      <v-alert type="error" variant="tonal">{{ customerErrorMessage }}</v-alert>
    </div>

    <div v-else-if="isLoadingCustomer" class="detail-state">
      <v-progress-circular indeterminate color="#f97316" />
      <p>고객 기본 정보를 불러오는 중입니다.</p>
    </div>

    <template v-else-if="customer">
      <PageBackLink :label="backLinkLabel" @click="goBack" />

      <section class="customer-profile">
        <div class="customer-profile__identity">
          <div class="customer-profile__avatar">
            <v-icon icon="mdi-account-outline" size="22" />
          </div>
          <div>
            <div class="customer-profile__name-row">
              <strong>{{ customer.customerName }}</strong>
              <span
                class="customer-profile__status"
                :class="getCustomerStatusBadgeClass(customer.interestYn, customer.customerStatus)"
              >
                {{ customer.interestYn ? '관심 고객' : getCustomerStatusLabel(customer.customerStatus) }}
              </span>
              <span v-if="customer.interestReason" class="customer-profile__interest-reason">
                {{ getInterestReasonLabel(customer.interestReason) }}
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

        <div v-if="interestDetailCards.length > 0" class="customer-profile__signals">
          <article
            v-for="item in interestDetailCards"
            :key="item.label"
            class="signal-card"
            :style="{ background: item.tone, borderColor: item.borderColor }"
          >
            <div class="signal-card__icon" :style="{ color: item.accent, background: item.iconTone }">
              <v-icon :icon="item.icon" size="18" />
            </div>
            <div class="signal-card__body">
              <p>{{ item.label }}</p>
              <strong :style="{ color: item.accent }">{{ item.value }}</strong>
            </div>
          </article>
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
            <template v-else>
              <div class="contracts-toolbar">
                <div class="contracts-toolbar__filters" role="tablist" aria-label="계약 상태 필터">
                  <button
                    v-for="option in contractStatusOptions"
                    :key="option.value || 'ALL'"
                    type="button"
                    class="contracts-toolbar__filter"
                    :class="{
                      'contracts-toolbar__filter--active': contracts.params.contractStatus === option.value,
                    }"
                    @click="changeContractStatus(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <span class="contracts-toolbar__count">
                  총 {{ contracts.page.totalElements.toLocaleString('ko-KR') }}건
                </span>
              </div>

              <p class="contracts-toolbar__meta">{{ contractLifecycleDateLabel }} 기준으로 표시됩니다.</p>

              <div
                v-if="contracts.items.length > 0"
                class="detail-table"
                :class="contractsTableClass"
              >
                <table>
                  <thead>
                    <tr>
                      <th>보험사명</th>
                      <th>상품명</th>
                      <th>월 보험료</th>
                      <th>계약 시작일</th>
                      <th>계약 종료일</th>
                      <th>계약 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="contract in contracts.items"
                      :key="contract.contractId"
                      class="detail-table__row detail-table__row--clickable"
                      @click="goToContractDetail(contract)"
                    >
                      <td>{{ contract.insuranceCompanyName }}</td>
                      <td>{{ contract.insuranceProductName }}</td>
                      <td>{{ formatCurrency(contract.monthlyPremium) }}</td>
                      <td>{{ formatDate(contract.contractStartDate) }}</td>
                      <td>{{ formatDate(getContractLifecycleDate(contract)) }}</td>
                      <td>{{ getContractStatusLabel(contract.contractStatus) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="contracts.items.length > 0" class="detail-pagination">
                <v-pagination
                  :model-value="contractPageNumber"
                  :length="Math.max(contracts.page.totalPages, 1)"
                  total-visible="7"
                  rounded="circle"
                  @update:model-value="changeContractPage"
                />
              </div>
              <div v-else class="detail-empty detail-empty--compact">보유 계약이 없습니다.</div>
            </template>
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
                    <tr
                      v-for="consultation in consultations.items"
                      :key="consultation.consultationId"
                      class="detail-table__row detail-table__row--clickable"
                      @click="goToConsultationDetail(consultation)"
                    >
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
            <div class="briefing-box">
              <div class="briefing-box__header">
                <div class="briefing-box__identity">
                  <span class="briefing-box__sparkle">
                    <v-icon icon="mdi-auto-fix" size="28" />
                  </span>
                  <div>
                    <h3>AI 상담 브리핑</h3>
                    <p>AI가 고객의 상담 이력을 분석하여 핵심 내용을 요약해 드립니다.</p>
                  </div>
                </div>

                <div v-if="briefing.item?.createdAt || briefing.item?.updatedAt" class="briefing-box__meta">
                  <span>최근 생성일</span>
                  <strong>{{ formatDateTime(briefing.item.createdAt || briefing.item.updatedAt) }}</strong>
                  <button
                    class="briefing-box__button"
                    :class="{ 'briefing-box__button--complete': !briefing.item?.canGenerate }"
                    type="button"
                    :disabled="!briefing.item?.canGenerate || briefing.isGenerating"
                    @click="createBriefing"
                  >
                    <v-progress-circular
                      v-if="briefing.isGenerating"
                      indeterminate
                      color="white"
                      size="17"
                      width="2"
                    />
                    <v-icon v-else :icon="briefing.item?.canGenerate ? 'mdi-auto-fix' : 'mdi-check'" size="17" />
                    {{ briefing.isGenerating ? 'AI 브리핑 생성 중...' : briefing.item?.canGenerate ? 'AI 브리핑 다시 생성' : '최신 브리핑' }}
                  </button>
                </div>
              </div>

              <div v-if="briefing.errorMessage" class="briefing-box__alert" role="alert">
                <v-icon icon="mdi-alert-circle-outline" size="20" />
                {{ briefing.errorMessage }}
              </div>

              <div v-if="briefing.isLoading" class="briefing-box__loading">
                <v-progress-circular indeterminate color="#8b5cf6" size="30" width="3" />
                <span>AI 상담 브리핑을 불러오는 중입니다.</span>
              </div>

              <div v-else-if="briefing.item?.briefingContent" class="briefing-box__result">
                <p class="briefing-box__content">{{ briefing.item.briefingContent }}</p>
              </div>

              <div v-else class="briefing-box__empty">
                <div class="briefing-box__empty-visual" aria-hidden="true">
                  <v-icon icon="mdi-text-box-outline" size="42" />
                  <span><v-icon icon="mdi-star-four-points" size="18" /></span>
                </div>
                <div class="briefing-box__empty-copy">
                  <h4>아직 생성된 AI 상담 브리핑이 없습니다.</h4>
                  <p>고객과의 상담 이력이 쌓이면 AI가 핵심 상담 흐름과 주요 내용을 분석하여 요약 브리핑을 제공합니다.</p>
                  <button
                    class="briefing-box__button"
                    type="button"
                    :disabled="!briefing.item?.canGenerate || briefing.isGenerating"
                    @click="createBriefing"
                  >
                    <v-progress-circular
                      v-if="briefing.isGenerating"
                      indeterminate
                      color="white"
                      size="17"
                      width="2"
                    />
                    <v-icon v-else icon="mdi-auto-fix" size="18" />
                    {{ briefing.isGenerating ? 'AI 브리핑 생성 중...' : 'AI 브리핑 생성' }}
                  </button>
                </div>
              </div>
            </div>
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
  CONTRACT_STATUS_OPTIONS,
  getConsultationChannelLabel,
  getConsultationTypeLabel,
  getContractStatusLabel,
  getCustomerGradeLabel,
  getInterestReasonLabel,
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
import PageBackLink from '../../components/common/PageBackLink.vue'

const route = useRoute()
const router = useRouter()
const customerId = computed(() => route.params.customerId)
const activeTab = ref('contracts')
const backLinkLabel = computed(() => {
  const from = typeof route.query.from === 'string' ? route.query.from : ''

  if (['fp-contracts', 'branch-contracts', 'hq-contracts'].includes(from)) {
    return '계약 목록'
  }

  return '고객 목록'
})

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
  createBriefing,
  loadFpHistories,
  changeContractPage,
  changeContractStatus,
  changeConsultationPage,
  changeFpHistoryPage,
} = useCustomerDetail(customerId)

const detailTabs = [
  { label: '보유 계약', value: 'contracts' },
  { label: '상담 이력', value: 'consultations' },
  { label: 'AI 브리핑 요약', value: 'briefing' },
  { label: '설계사 변경 이력', value: 'history' },
]
const contractStatusOptions = CONTRACT_STATUS_OPTIONS

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
    label: '유지 계약 수',
    value: customer.value?.contractSummary?.contractStatusCounts?.MAINTENANCE ?? 0,
    unit: '건',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: '만기 계약 수',
    value: customer.value?.contractSummary?.contractStatusCounts?.COMPLETED ?? 0,
    unit: '건',
    icon: 'mdi-calendar-check-outline',
  },
  {
    label: '해지 계약 수',
    value: customer.value?.contractSummary?.contractStatusCounts?.TERMINATED ?? 0,
    unit: '건',
    icon: 'mdi-close-circle-outline',
  },
  {
    label: '실효 계약 수',
    value: customer.value?.contractSummary?.contractStatusCounts?.LAPSED ?? 0,
    unit: '건',
    icon: 'mdi-alert-circle-outline',
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
const contractPageNumber = computed(() => contracts.page.page || 1)
const contractLifecycleDateLabel = computed(() => {
  if (contracts.params.contractStatus === 'COMPLETED') {
    return '계약 만기일'
  }

  if (contracts.params.contractStatus === 'TERMINATED') {
    return '계약 해지일'
  }

  return '계약 종료일'
})
const contractsTableClass = computed(() => {
  if (contracts.params.contractStatus === 'COMPLETED') {
    return 'detail-table--completed'
  }

  if (contracts.params.contractStatus === 'TERMINATED') {
    return 'detail-table--terminated'
  }

  return 'detail-table--default'
})

const interestDetailCards = computed(() => {
  const detail = customer.value

  if (!detail?.interestReason) {
    return []
  }

  const items = []

  if (detail.interestReason === 'UNPAID') {
    items.push({
      label: '미납 회차',
      value: formatNullableText(detail.unpaidInstallmentCount),
      icon: 'mdi-alert-circle-outline',
      accent: '#dc2626',
      tone: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
      iconTone: '#fee2e2',
      borderColor: '#fecdd3',
    })
  }

  if (detail.interestReason === 'RENEWAL_DUE') {
    items.push({
      label: '갱신 D-Day',
      value: formatDDay(detail.renewalDDay),
      icon: 'mdi-refresh-circle',
      accent: '#d97706',
      tone: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
      iconTone: '#ffedd5',
      borderColor: '#fed7aa',
    })
    if (detail.contractEndDate) {
      items.push({
        label: '계약 종료일',
        value: formatDate(detail.contractEndDate),
        icon: 'mdi-calendar-end',
        accent: '#b45309',
        tone: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
        iconTone: '#fef3c7',
        borderColor: '#fde68a',
      })
    }
  }

  if (detail.interestReason === 'MATURITY_DUE') {
    items.push({
      label: '만기 D-Day',
      value: formatDDay(detail.maturityDDay),
      icon: 'mdi-calendar-clock-outline',
      accent: '#7c3aed',
      tone: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
      iconTone: '#ede9fe',
      borderColor: '#ddd6fe',
    })
    if (detail.contractEndDate) {
      items.push({
        label: '계약 종료일',
        value: formatDate(detail.contractEndDate),
        icon: 'mdi-calendar-end',
        accent: '#6d28d9',
        tone: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
        iconTone: '#f3e8ff',
        borderColor: '#e9d5ff',
      })
    }
  }

  return items
})

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
    await Promise.all([loadCustomer(), loadContracts(true), loadBriefing(true)])
  },
)

onMounted(async () => {
  await Promise.all([loadCustomer(), loadContracts(), loadBriefing()])
})

function goToConsultationDetail(consultation) {
  const consultationId = consultation?.consultationId ?? consultation?.id
  const from = typeof route.query.from === 'string' ? route.query.from : ''

  if (!consultationId) {
    consultations.errorMessage = '상담 상세 조회에 필요한 상담 ID가 없습니다.'
    return
  }

  router.push({
    name: 'consultation-detail',
    params: { consultationId },
    query: {
      from: 'customer-detail',
      customerId: customerId.value,
      returnFrom: from,
    },
  })
}

function goToContractDetail(contract) {
  const contractId = contract?.contractId ?? contract?.id
  const from = typeof route.query.from === 'string' ? route.query.from : ''

  if (!contractId) {
    contracts.errorMessage = '계약 상세 조회에 필요한 계약 ID가 없습니다.'
    return
  }

  router.push({
    name: 'contract-detail',
    params: { contractId },
    query: {
      from: 'customer-detail',
      customerId: customerId.value,
      returnFrom: from,
    },
  })
}

function goBack() {
  const returnTo = route.query.returnTo
  const from = route.query.from

  if (typeof returnTo === 'string' && returnTo.length > 0) {
    router.push(returnTo)
    return
  }

  if (typeof from === 'string' && from.length > 0) {
    router.push({ name: from })
    return
  }

  router.push('/')
}

function getContractLifecycleDate(contract) {
  if (contract?.contractStatus === 'TERMINATED') {
    return contract?.contractTerminatedAt ?? contract?.contractEndDate ?? ''
  }

  return contract?.contractEndDate ?? ''
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

function getCustomerStatusBadgeClass(interestYn, customerStatus) {
  if (interestYn) {
    return 'customer-profile__status--interest'
  }

  if (customerStatus === 'PROSPECT') {
    return 'customer-profile__status--prospect'
  }

  if (customerStatus === 'CONTRACTED') {
    return 'customer-profile__status--contracted'
  }

  if (customerStatus === 'CLOSED') {
    return 'customer-profile__status--closed'
  }

  return 'customer-profile__status--default'
}
</script>

<style scoped>
.customer-detail {
  display: grid;
  gap: 16px;
}

.customer-profile {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 18px;
  padding: 18px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
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
.customer-profile__interest-reason,
.customer-profile__grade {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.customer-profile__status {
  color: #475569;
  background: #f8fafc;
}

.customer-profile__status--default {
  color: #475569;
  background: #f8fafc;
}

.customer-profile__status--interest {
  color: #ea580c;
  background: #fff7ed;
}

.customer-profile__status--prospect {
  color: #2563eb;
  background: #e8f0ff;
}

.customer-profile__status--contracted {
  color: #15803d;
  background: #dcfce7;
}

.customer-profile__status--closed {
  color: #dc2626;
  background: #fee2e2;
}

.customer-profile__interest-reason {
  color: #f97316;
  background: #fff7ed;
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

.customer-profile__signals {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.signal-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
}

.signal-card__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  flex: 0 0 auto;
}

.signal-card__body {
  min-width: 0;
}

.signal-card__body p {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.signal-card__body strong {
  display: block;
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.customer-detail__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.detail-card {
  padding: 16px 18px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
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
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
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

.contracts-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.contracts-toolbar__filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.contracts-toolbar__filter {
  border: 1px solid #dbe3ee;
  border-radius: 999px;
  padding: 8px 14px;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.contracts-toolbar__filter--active {
  border-color: #f97316;
  background: #fff7ed;
  color: #ea580c;
}

.contracts-toolbar__count {
  color: #64748b;
  font-size: 13px;
}

.contracts-toolbar__meta {
  margin: -6px 0 12px;
  color: #64748b;
  font-size: 12px;
}

.detail-state,
.detail-empty {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 220px;
  color: #64748b;
}

.detail-empty--compact {
  min-height: 120px;
}

.detail-table {
  overflow-x: auto;
  border: 1px solid #eff3f8;
  border-radius: 18px;
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

.detail-table--default th:nth-child(5),
.detail-table--completed th:nth-child(5),
.detail-table--terminated th:nth-child(5) {
  position: relative;
  color: transparent;
}

.detail-table--default th:nth-child(5)::after,
.detail-table--completed th:nth-child(5)::after,
.detail-table--terminated th:nth-child(5)::after {
  position: absolute;
  inset: 50% 16px auto;
  transform: translateY(-50%);
  color: #64748b;
  white-space: nowrap;
  content: '계약 종료일';
}

.detail-table--completed th:nth-child(5)::after {
  content: '계약 만기일';
}

.detail-table--terminated th:nth-child(5)::after {
  content: '계약 해지일';
}

.detail-table__row--clickable {
  cursor: pointer;
}

.detail-table__row--clickable:hover td {
  background: #f8fafc;
}

.briefing-box {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border: 1px solid rgba(196, 181, 253, 0.6);
  border-radius: 20px;
  background:
    radial-gradient(circle at 88% 18%, rgba(216, 180, 254, 0.3), transparent 29%),
    radial-gradient(circle at 14% 92%, rgba(153, 246, 228, 0.25), transparent 34%),
    linear-gradient(135deg, rgba(250, 245, 255, 0.92), rgba(240, 253, 250, 0.8));
  box-shadow: 0 16px 40px rgba(124, 58, 237, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.briefing-box::before {
  position: absolute;
  top: -70px;
  right: -40px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.38);
  content: '';
  filter: blur(4px);
  pointer-events: none;
}

.briefing-box__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(196, 181, 253, 0.42);
}

.briefing-box__identity {
  display: flex;
  align-items: center;
  gap: 16px;
}

.briefing-box__sparkle {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.66);
  color: #8b5cf6;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.14);
}

.briefing-box__identity h3,
.briefing-box__empty-copy h4 {
  margin: 0;
  color: #334155;
}

.briefing-box__identity h3 {
  font-size: 20px;
}

.briefing-box__identity p,
.briefing-box__empty-copy p {
  margin: 6px 0 0;
  color: #64748b;
  line-height: 1.65;
}

.briefing-box__meta {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: end;
  gap: 4px 10px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.briefing-box__meta strong {
  color: #475569;
}

.briefing-box__meta .briefing-box__button {
  grid-column: 1 / -1;
  margin-top: 6px;
}

.briefing-box__alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.88);
  color: #b91c1c;
  font-size: 13px;
}

.briefing-box__loading {
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
}

.briefing-box__result {
  position: relative;
  margin-top: 20px;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.54);
  box-shadow: inset 0 1px 0 #ffffff;
}

.briefing-box__content {
  margin: 0;
  color: #334155;
  line-height: 1.85;
  white-space: pre-line;
}

.briefing-box__empty {
  position: relative;
  min-height: 210px;
  display: grid;
  grid-template-columns: minmax(180px, 0.7fr) minmax(280px, 1fr);
  align-items: center;
  gap: 28px;
  padding: 18px 28px 4px;
}

.briefing-box__empty-visual {
  position: relative;
  width: 112px;
  height: 112px;
  display: grid;
  place-items: center;
  justify-self: center;
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 36px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(237, 233, 254, 0.72));
  color: #818cf8;
  box-shadow: 0 18px 36px rgba(99, 102, 241, 0.15), 18px 12px 40px rgba(45, 212, 191, 0.12);
  transform: rotate(4deg);
}

.briefing-box__empty-visual span {
  position: absolute;
  top: -12px;
  right: -12px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  color: #a78bfa;
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.14);
}

.briefing-box__empty-copy {
  padding-left: 32px;
  border-left: 1px solid rgba(196, 181, 253, 0.45);
}

.briefing-box__empty-copy h4 {
  font-size: 18px;
}

.briefing-box__button {
  min-width: 190px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 20px;
  border: 0;
  border-radius: 10px;
  padding: 10px 18px;
  background: linear-gradient(110deg, #8b5cf6, #818cf8 58%, #5eead4);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(99, 102, 241, 0.2);
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
}

.briefing-box__button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 13px 26px rgba(99, 102, 241, 0.26);
}

.briefing-box__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.briefing-box__button--complete {
  min-width: 150px;
  min-height: 36px;
  padding: 7px 14px;
  opacity: 0.86;
}

.detail-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .customer-profile {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .customer-profile__meta {
    grid-template-columns: 1fr;
  }

  .briefing-box {
    padding: 18px;
  }

  .briefing-box__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .briefing-box__meta {
    justify-content: start;
  }

  .briefing-box__empty {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 28px 0 6px;
  }

  .briefing-box__empty-copy {
    padding: 22px 0 0;
    border-top: 1px solid rgba(196, 181, 253, 0.45);
    border-left: 0;
  }

  .briefing-box__button {
    width: 100%;
  }
}
</style>
