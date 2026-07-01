<template>
  <section class="contract-detail-page">
    <PageBackLink label="보유 계약 목록" @click="goToContractList" />

    <div v-if="isContractDetailLoading" class="contract-detail-state">
      <v-progress-circular indeterminate color="#f97316" />
      <p>계약 상세 정보를 불러오는 중입니다.</p>
    </div>

    <v-alert v-else-if="contractDetailError" type="error" variant="tonal">
      {{ contractDetailError }}
    </v-alert>

    <template v-else>
    <section class="contract-detail-card">
      <header class="contract-detail-card__header">
        <h3>1. 계약 요약</h3>
      </header>
      <div class="contract-detail-card__body contract-summary-grid">
        <div v-for="item in summaryItems" :key="item.label" class="contract-summary-item">
          <span>{{ item.label }}</span>
          <strong v-if="item.type !== 'status'">{{ item.value }}</strong>
          <span v-else class="contract-detail-badge" :class="getContractStatusBadgeClass(item.value)">
            {{ item.value }}
          </span>
        </div>
      </div>
    </section>

    <section class="contract-detail-card">
      <header class="contract-detail-card__header">
        <h3>2. 고객 기본 정보</h3>
      </header>
      <div class="contract-detail-card__body detail-info-grid">
        <div v-for="item in customerItems" :key="item.label" class="detail-info-row">
          <span>{{ item.label }}</span>
          <strong v-if="item.type !== 'status'">{{ item.value }}</strong>
          <span v-else class="contract-detail-badge" :class="getCustomerStatusBadgeClass(item.value)">
            {{ item.value }}
          </span>
        </div>
      </div>
    </section>

    <section class="contract-detail-card">
      <header class="contract-detail-card__header">
        <h3>3. 계약 상세 정보</h3>
      </header>
      <div class="contract-detail-card__body detail-info-grid">
        <div v-for="item in contractInfoItems" :key="item.label" class="detail-info-row">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="contract-detail-card">
      <header class="contract-detail-card__header">
        <h3>4. 보장 요약</h3>
      </header>
      <div class="contract-detail-card__body">
        <div class="coverage-summary-box">
          {{ contractDetail.coverageInfo.coverageSummary }}
        </div>
      </div>
    </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getContractDetail } from '../../api/contracts'
import PageBackLink from '../../components/common/PageBackLink.vue'

const route = useRoute()
const router = useRouter()

const contractDetail = ref(createEmptyContractDetail())
const isContractDetailLoading = ref(false)
const contractDetailError = ref('')

onMounted(() => {
  loadContractDetail()
})

watch(
  () => route.params.contractId,
  () => {
    loadContractDetail()
  },
)

const summaryItems = computed(() => [
  { label: '계약번호', value: contractDetail.value.contractSummary.contractCode },
  { label: '고객명', value: contractDetail.value.contractSummary.customerName },
  { label: '보험상품', value: contractDetail.value.contractSummary.insuranceProductName },
  { label: '계약 상태', value: getContractStatusLabel(contractDetail.value.contractSummary.contractStatus), type: 'status' },
  { label: '월 보험료', value: formatCurrency(contractDetail.value.contractSummary.monthlyPremium) },
  { label: '계약 시작일', value: formatDate(contractDetail.value.contractSummary.contractStartDate) },
  { label: '만기일', value: formatDate(contractDetail.value.contractSummary.contractEndDate) },
])

const customerItems = computed(() => [
  { label: '고객명', value: contractDetail.value.customerInfo.customerName },
  { label: '이메일', value: contractDetail.value.customerInfo.customerEmail },
  { label: '고객 상태', value: getDisplayCustomerStatus(), type: 'status' },
  { label: '주소', value: contractDetail.value.customerInfo.customerAddress },
  {
    label: '성별 / 생년월일',
    value: `${contractDetail.value.customerInfo.customerGender} / ${formatDate(contractDetail.value.customerInfo.customerBirthDate)}`,
  },
  {
    label: '직업 / 직장명',
    value: `${contractDetail.value.customerInfo.customerJob} / ${contractDetail.value.customerInfo.customerCompanyName}`,
  },
  { label: '연락처', value: contractDetail.value.customerInfo.customerPhone },
])

const contractInfoItems = computed(() => [
  { label: '보험사', value: contractDetail.value.contractInfo.insuranceCompanyName },
  { label: '계약 만기일', value: formatDate(contractDetail.value.contractInfo.contractEndDate) },
  { label: '보종', value: contractDetail.value.contractInfo.insuranceCategoryName },
  { label: '보장 종료일', value: formatDate(contractDetail.value.contractInfo.coverageEndDate) },
  { label: '보험상품', value: contractDetail.value.contractInfo.insuranceProductName },
  { label: '납입 기간', value: `${contractDetail.value.contractInfo.paymentPeriodYears ?? '-'}년` },
  { label: '계약일', value: formatDate(contractDetail.value.contractInfo.contractDate) },
  { label: '납입 주기', value: contractDetail.value.contractInfo.paymentCycle },
  { label: '계약 시작일', value: formatDate(contractDetail.value.contractInfo.contractStartDate) },
  { label: '월 보험료', value: formatCurrency(contractDetail.value.contractInfo.monthlyPremium) },
  { label: '보장 시작일', value: formatDate(contractDetail.value.contractInfo.coverageStartDate) },
  { label: '담당 설계사', value: getFpDisplayName() },
  { label: '등록일', value: formatDateTime(contractDetail.value.contractInfo.createdAt) },
])

async function loadContractDetail() {
  const contractId = route.params.contractId

  if (!contractId) {
    contractDetailError.value = '계약 상세 조회에 필요한 계약 ID가 없습니다.'
    return
  }

  contractDetailError.value = ''
  isContractDetailLoading.value = true

  try {
    const response = await getContractDetail(contractId)
    contractDetail.value = normalizeContractDetail(response?.result)
  } catch (error) {
    contractDetail.value = createEmptyContractDetail()
    contractDetailError.value =
      error.response?.data?.message ||
      error.message ||
      '계약 상세 정보를 불러오지 못했습니다.'
  } finally {
    isContractDetailLoading.value = false
  }
}

function goToContractList() {
  const from = route.query.from

  if (from === 'customer-detail' && typeof route.query.customerId === 'string') {
    const target = {
      name: 'customer-detail',
      params: { customerId: route.query.customerId },
    }

    if (typeof route.query.returnFrom === 'string' && route.query.returnFrom.length > 0) {
      target.query = { from: route.query.returnFrom }
    }

    router.push(target)
    return
  }

  if (typeof from === 'string' && ['fp-contracts', 'branch-contracts', 'hq-contracts'].includes(from)) {
    router.push({ name: from })
    return
  }

  router.push({ name: 'fp-contracts' })
}

function normalizeContractDetail(detail) {
  const empty = createEmptyContractDetail()

  return {
    contractSummary: {
      ...empty.contractSummary,
      ...(detail?.contractSummary ?? {}),
    },
    customerInfo: {
      ...empty.customerInfo,
      ...(detail?.customerInfo ?? {}),
    },
    contractInfo: {
      ...empty.contractInfo,
      ...(detail?.contractInfo ?? {}),
    },
    coverageInfo: {
      ...empty.coverageInfo,
      ...(detail?.coverageInfo ?? {}),
    },
  }
}

function createEmptyContractDetail() {
  return {
    contractSummary: {
      contractCode: '-',
      customerName: '-',
      customerStatus: '-',
      insuranceCompanyName: '-',
      insuranceProductName: '-',
      contractStatus: '-',
      monthlyPremium: 0,
      contractStartDate: '',
      contractEndDate: '',
      paymentPeriodYears: null,
      paymentCycle: '-',
    },
    customerInfo: {
      customerName: '-',
      customerGender: '-',
      customerBirthDate: '',
      customerPhone: '-',
      customerEmail: '-',
      customerAddress: '-',
      customerJob: '-',
      customerCompanyName: '-',
    },
    contractInfo: {
      insuranceCompanyName: '-',
      insuranceCategoryName: '-',
      insuranceProductName: '-',
      contractDate: '',
      contractStartDate: '',
      contractEndDate: '',
      coverageStartDate: '',
      coverageEndDate: '',
      paymentPeriodYears: null,
      paymentCycle: '-',
      monthlyPremium: 0,
      fpName: '-',
      fpOrganizationName: '-',
      createdAt: '',
    },
    coverageInfo: {
      coverageSummary: '-',
    },
  }
}

function getDisplayCustomerStatus() {
  return getCustomerStatusLabel(contractDetail.value.contractSummary.customerStatus)
}

function getFpDisplayName() {
  const { fpName, fpOrganizationName } = contractDetail.value.contractInfo

  if (fpName && fpOrganizationName) {
    return `${fpName} / ${fpOrganizationName}`
  }

  return fpName || fpOrganizationName || '-'
}

function getContractStatusBadgeClass(status) {
  if (status === '유지' || status === 'MAINTENANCE') return 'contract-detail-badge--success'
  if (status === '실효' || status === 'LAPSE') return 'contract-detail-badge--danger'
  if (status === '만기' || status === 'COMPLETED') return 'contract-detail-badge--warning'
  if (status === '해지' || status === 'TERMINATED') return 'contract-detail-badge--neutral'
  return 'contract-detail-badge--neutral'
}

function getContractStatusLabel(status) {
  if (status === 'MAINTENANCE') return '유지'
  if (status === 'LAPSE') return '실효'
  if (status === 'COMPLETED') return '만기'
  if (status === 'TERMINATED') return '해지'
  return status || '-'
}

function getCustomerStatusBadgeClass(status) {
  if (status === '계약 고객' || status === 'CONTRACTED') return 'contract-detail-badge--success'
  if (status === '잠재 고객' || status === 'PROSPECT') return 'contract-detail-badge--info'
  if (status === '종료 고객' || status === 'CLOSED') return 'contract-detail-badge--neutral'
  return 'contract-detail-badge--neutral'
}

function getCustomerStatusLabel(status) {
  if (status === 'CONTRACTED') return '계약 고객'
  if (status === 'PROSPECT') return '잠재 고객'
  if (status === 'CLOSED') return '종료 고객'
  return status || '-'
}

function formatDate(value) {
  return value ? value.replaceAll('-', '.') : '-'
}

function formatDateTime(value) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16).replaceAll('-', '.')
}

function formatCurrency(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR')}원`
}
</script>

<style scoped>
.contract-detail-page {
  display: grid;
  gap: 16px;
  color: #111827;
}

.contract-detail-card {
  overflow: hidden;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.contract-detail-card__header {
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
  background: #ffffff;
}

.contract-detail-card__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.contract-detail-card__body {
  padding: 18px;
}

.contract-detail-state {
  display: grid;
  min-height: 220px;
  place-items: center;
  gap: 10px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
  color: #64748b;
}

.contract-detail-state p {
  margin: 0;
  font-size: 13px;
}

.contract-summary-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.contract-summary-item,
.detail-info-row {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.contract-summary-item span:first-child,
.detail-info-row span:first-child {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.contract-summary-item strong,
.detail-info-row strong {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-info-row {
  min-height: 44px;
}

.contract-detail-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.contract-detail-badge--success {
  background: #dcfce7;
  color: #16a34a;
}

.contract-detail-badge--danger {
  background: #fee2e2;
  color: #dc2626;
}

.contract-detail-badge--warning {
  background: #fef3c7;
  color: #d97706;
}

.contract-detail-badge--neutral {
  background: #f1f5f9;
  color: #64748b;
}

.contract-detail-badge--info {
  background: #dbeafe;
  color: #2563eb;
}

.coverage-summary-box {
  min-height: 54px;
  padding: 16px;
  border: 1px solid #edf1f7;
  border-radius: 10px;
  background: #f8fafc;
  color: #111827;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1180px) {
  .contract-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .detail-info-grid {
    grid-template-columns: 1fr;
  }

  .contract-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
