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
        <p>{{ consultationContentText }}</p>
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

import { getConsultation, getConsultationDraftFromApi } from '../../api/consultations'
import { USER_ROLES } from '../../constants/auth'
import { getConsultationChannelLabel, getConsultationTypeLabel } from '../../constants/customer'
import { useAuthStore } from '../../stores/auth'
import {
  getConsultationDraft,
  getSavedConsultation,
  normalizeDraftResponse,
} from '../../utils/consultationDrafts'
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
const consultationContentText = computed(() => (
  detail.value.consultationContent ||
  detail.value.specialNote ||
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
      { label: '보험료 변동 사유', value: arrayText(source.premiumChangeReasons) },
      { label: '고객 반응', value: source.customerReaction || '-' },
      { label: '고객 관심사항', value: arrayText(source.renewalInterests ?? source.interests ?? source.customerInterests) },
      { label: '후속조치', value: arrayText(source.nextActions) },
      { label: '결정 예정일', value: formatDate(source.decisionExpectedDate) },
      { label: '희망 갱신일', value: source.desiredRenewalDate || '-' },
      { label: '예상 보험료', value: source.expectedPremium || '-' },
    ]
  }

  const source = detail.value.cancelDetail || {}
  return [
    { label: '해지 검토 사유', value: arrayText(source.reviewReasons) },
    { label: '유지 방안', value: arrayText(source.retentionPlans) },
    { label: '고객 의사', value: source.customerIntent || '-' },
    { label: '상담 결과', value: source.result || '-' },
    { label: '유지 가능성', value: retentionLabel(source.retentionPossibility) },
  ]
})

onMounted(async () => {
  if (isDraft.value) {
    const draft = await loadDraftDetail(route.params.draftId)
    if (!draft) {
      errorMessage.value = '임시저장 상담일지를 찾을 수 없습니다.'
      return
    }
    detail.value = draft
    return
  }

  try {
    const response = await getConsultation(route.params.consultationId)
    detail.value = mergeSavedDetail(response?.result ?? {})
  } catch (error) {
    const localDetail = getSavedConsultation(route.params.consultationId)
    if (localDetail) {
      detail.value = localDetail
      return
    }
    errorMessage.value = error.response?.data?.message || error.message || '상담일지를 불러오지 못했습니다.'
  }
})

async function loadDraftDetail(draftId) {
  try {
    const response = await getConsultationDraftFromApi(draftId)
    const draft = normalizeDraftResponse(response?.result ?? response)
    if (draft) return draft
  } catch {
    // 서버 임시저장 조회 실패 시 브라우저 임시저장을 사용합니다.
  }

  return getConsultationDraft(draftId)
}

function mergeSavedDetail(serverDetail) {
  const localDetail = getSavedConsultation(route.params.consultationId) || {}
  return {
    ...localDetail,
    ...serverDetail,
    specialNote: serverDetail.specialNote || localDetail.specialNote || localDetail.consultationContent,
    consultationContent: serverDetail.consultationContent || serverDetail.specialNote || localDetail.consultationContent || localDetail.specialNote,
    newDetail: serverDetail.newDetail || localDetail.newDetail,
    claimDetail: serverDetail.claimDetail || localDetail.claimDetail,
    renewalDetail: serverDetail.renewalDetail || localDetail.renewalDetail,
    cancelDetail: serverDetail.cancelDetail || localDetail.cancelDetail,
  }
}

function goList() {
  const routeName = consultationListRouteByRole[authStore.userRole] ?? 'fp-consultations'
  router.push(isDraft.value ? { name: 'consultation-drafts' } : { name: routeName })
}

function goEdit() {
  router.push({ name: 'consultation-draft-edit', params: { draftId: route.params.draftId } })
}

function arrayText(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  return items.length ? items.join(', ') : '-'
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-'
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
