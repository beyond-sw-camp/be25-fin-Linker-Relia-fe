<template>
  <section class="detail-page">
    <nav class="detail-breadcrumb">
      <span>상담 관리</span>
      <v-icon icon="mdi-chevron-right" size="15" />
      <strong>{{ isDraft ? '임시저장 상담일지 상세' : '상담일지 상세' }}</strong>
    </nav>

    <div class="detail-heading">
      <div>
        <h2>{{ isDraft ? '임시저장 상담일지 상세조회' : '상담일지 상세조회' }}</h2>
        <p>선택한 상담일지의 주요 정보와 유형별 상세 내용을 확인합니다.</p>
      </div>
      <div class="detail-actions">
        <v-btn variant="outlined" @click="goList">목록</v-btn>
        <v-btn v-if="isDraft" class="primary-button" @click="goEdit">수정</v-btn>
      </div>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>

    <section v-else class="detail-card">
      <header>
        <span class="badge">{{ getConsultationTypeLabel(detail.consultationType) }}</span>
        <strong>{{ customerName }}</strong>
        <em>{{ formatDateTime(detail.consultedAt) }}</em>
      </header>

      <dl class="detail-summary">
        <div>
          <dt>상담 방식</dt>
          <dd>{{ getConsultationChannelLabel(detail.consultationChannel) }}</dd>
        </div>
        <div>
          <dt>계약</dt>
          <dd>{{ detail.contractCode || detail.contractId || '-' }}</dd>
        </div>
        <div>
          <dt>다음 상담 예정</dt>
          <dd>{{ formatDateTime(detail.nextScheduledAt) }}</dd>
        </div>
        <div>
          <dt>상태</dt>
          <dd>{{ isDraft ? '임시저장' : '등록완료' }}</dd>
        </div>
      </dl>

      <section class="detail-section">
        <h3>상담 내용</h3>
        <p>{{ detail.consultationContent || '-' }}</p>
      </section>

      <section class="detail-section detail-section--blue">
        <h3>유형별 상세 요약</h3>
        <div class="detail-items">
          <div v-for="item in typeDetailItems" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getConsultation } from '../../api/consultations'
import { USER_ROLES } from '../../constants/auth'
import { getConsultationChannelLabel, getConsultationTypeLabel } from '../../constants/customer'
import { useAuthStore } from '../../stores/auth'
import { getConsultationDraft } from '../../utils/consultationDrafts'
import { formatDateTime } from '../../utils/formatters'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const consultationListRouteByRole = {
  [USER_ROLES.FP]: 'fp-consultations',
  [USER_ROLES.BRANCH_MANAGER]: 'branch-consultations',
  [USER_ROLES.HQ_MANAGER]: 'hq-consultations',
}

const detail = ref({})
const errorMessage = ref('')
const isDraft = computed(() => route.name === 'consultation-draft-detail')
const customerName = computed(() => (
  detail.value.customerName ||
  detail.value.selectedCustomer?.customerName ||
  detail.value.customerInfo?.customerName ||
  '-'
))

const typeDetailItems = computed(() => {
  if (detail.value.consultationType === 'NEW_CONTRACT') {
    const source = detail.value.newDetail || {}
    return [
      { label: '월 소득', value: source.monthlyIncome || '-' },
      { label: '기존 보험 보유', value: source.hasExistingInsurance ? '예' : '아니오' },
      { label: '월 보험료', value: source.monthlyInsurancePremium || '-' },
      { label: '관심 보장', value: source.coverageTypesText || arrayText(source.coverageTypes) },
    ]
  }
  if (detail.value.consultationType === 'CLAIM') {
    const source = detail.value.claimDetail || {}
    return [
      { label: '청구 사유', value: source.claimReason || '-' },
      { label: '사고일', value: source.incidentDate || '-' },
      { label: '예상 청구 금액', value: source.claimAmount || '-' },
    ]
  }
  if (detail.value.consultationType === 'RENEWAL') {
    const source = detail.value.renewalDetail || {}
    return [
      { label: '갱신 사유', value: source.renewalReason || '-' },
      { label: '희망 갱신일', value: source.desiredRenewalDate || '-' },
      { label: '예상 보험료', value: source.expectedPremium || '-' },
    ]
  }

  const source = detail.value.cancelDetail || {}
  return [
    { label: '해지 검토 사유', value: arrayText(source.reviewReasons) },
+   { label: '유지 방안', value: arrayText(source.retentionPlans) },
+   { label: '고객 의사', value: source.customerIntent || '-' },
+   { label: '상담 결과', value: source.result || '-' },
    { label: '유지 가능성', value: retentionLabel(source.retentionPossibility) },
  ]
})

onMounted(async () => {
  if (isDraft.value) {
    const draft = getConsultationDraft(route.params.draftId)
    if (!draft) {
      errorMessage.value = '임시저장 상담일지를 찾을 수 없습니다.'
      return
    }
    detail.value = draft
    return
  }

  try {
    const response = await getConsultation(route.params.consultationId)
    detail.value = response?.result ?? {}
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || '상담일지를 불러오지 못했습니다.'
  }
})

function goList() {
  const routeName = consultationListRouteByRole[authStore.userRole] ?? 'fp-consultations'
  router.push(isDraft.value ? { name: 'consultation-drafts' } : { name: routeName })
}

function goEdit() {
  router.push({ name: 'consultation-draft-edit', params: { draftId: route.params.draftId } })
}

function arrayText(value) {
  return Array.isArray(value) && value.length ? value.join(', ') : '-'
}

function yesNo(value) {
  return value ? '예' : '아니오'
}

function retentionLabel(value) {
  return ({ HIGH: '높음', MEDIUM: '보통', LOW: '낮음' })[value] || '-'
}
</script>

<style scoped>
.detail-page {
  display: grid;
  gap: 16px;
  max-width: 980px;
  margin: 0 auto;
  color: #111827;
}

.detail-breadcrumb,
.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-breadcrumb {
  color: #94a3b8;
  font-size: 12px;
}

.detail-breadcrumb strong {
  color: #111827;
}

.detail-heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.detail-heading h2 {
  margin: 0;
  font-size: 18px;
}

.detail-heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.primary-button {
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
}

.detail-card {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.detail-card header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-card header strong {
  font-size: 16px;
}

.detail-card header em {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
  font-style: normal;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 9px;
  border-radius: 5px;
  background: #fff7ed;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary,
.detail-items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.detail-summary {
  margin: 0;
}

.detail-summary div,
.detail-items div {
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 6px;
  background: #f8fafc;
}

.detail-summary dt,
.detail-items span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.detail-summary dd,
.detail-items strong {
  margin: 0;
  color: #111827;
  font-size: 13px;
}

.detail-section {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.detail-section--blue {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.detail-section h3,
.detail-section p {
  margin: 0;
}

.detail-section h3 {
  font-size: 14px;
}

.detail-section p {
  color: #475569;
  font-size: 13px;
  white-space: pre-wrap;
}

@media (max-width: 760px) {
  .detail-heading,
  .detail-card header {
    display: grid;
  }

  .detail-card header em {
    margin-left: 0;
  }

  .detail-summary,
  .detail-items {
    grid-template-columns: 1fr;
  }
}
</style>
