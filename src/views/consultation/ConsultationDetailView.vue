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

const cancelBooleanGroups = [
  {
    label: '보험료/납입 이슈',
    keys: [
      ['premiumBurden', '보험료 부담'],
      ['renewalPremiumBurden', '갱신 보험료 부담'],
      ['paymentDifficulty', '납입 유지 어려움'],
    ],
  },
  {
    label: '보장/상품 이슈',
    keys: [
      ['coverageDissatisfaction', '보장 불만'],
      ['duplicateInsurance', '중복 가입'],
      ['productRemodelingReview', '상품 리모델링 검토'],
    ],
  },
  {
    label: '타사 비교/이동',
    keys: [
      ['comparingOtherCompany', '타사 상품 비교'],
      ['movingToOtherCompany', '타사 이동 예정'],
    ],
  },
  {
    label: '서비스 불만',
    keys: [
      ['plannerContactDissatisfaction', '설계사 연락 불만'],
      ['managementDissatisfaction', '관리 부족 불만'],
    ],
  },
]

const typeDetailItems = computed(() => {
  if (detail.value.consultationType === 'NEW_CONTRACT') {
    const source = detail.value.newDetail || {}
    return [
      { label: '월 소득', value: moneyText(source.monthlyIncome) },
      { label: '기존 보험 보유', value: booleanText(source.hasExistingInsurance) },
      { label: '월 보험료', value: moneyText(source.monthlyInsurancePremium) },
      { label: '가입 기준', value: source.insurancePriority || '-' },
      { label: '관심 보장', value: source.coverageTypesText || coverageTypesText(source.coverageTypes ?? source.coverageTypeList) },
      { label: '제안 상품', value: proposedProductsText(source.proposedProducts ?? detail.value.selectedProposedProducts) },
    ]
  }
  if (detail.value.consultationType === 'CLAIM') {
    const source = detail.value.claimDetail || {}
    return [
      { label: '청구 유형', value: claimTypeText(source.claimType) },
      { label: '청구 사유', value: source.claimReasonDetail || source.claimReason || '-' },
      { label: '발생일 또는 진단일', value: source.incidentDate || '-' },
      { label: '병원명', value: source.hospitalName || '-' },
      { label: '진단/치료', value: source.diagnosisOrTreatment || '-' },
      { label: '입원 여부', value: hospitalizationStatusText(source.hospitalizationStatus) },
      { label: '수술 여부', value: surgeryStatusText(source.surgeryStatus) },
      { label: '검토 항목', value: arrayText(source.reviewItems) },
      { label: '상담 결과', value: source.result || '-' },
      { label: '후속조치', value: arrayText(source.nextActions) },
    ]
  }
  if (detail.value.consultationType === 'RENEWAL') {
    const source = detail.value.renewalDetail || {}
    return [
      { label: '갱신 사유', value: source.renewalReason || '-' },
      { label: '갱신 예정일', value: formatDate(source.renewalScheduledDate) },
      { label: '현재 보험료', value: moneyText(source.currentPremium) },
      { label: '갱신 보험료', value: moneyText(source.renewalPremium) },
      { label: '보험료 변동률', value: rateText(source.premiumChangeRate) },
      { label: '보장 변경 유형', value: renewalChangeTypeText(source.coverageChangeType || source.changeType) },
      { label: '보장 변경 상세', value: source.coverageChangeDetail || source.changeDetail || '-' },
      { label: '보험료 변동 사유', value: renewalPremiumReasonsText(source.premiumChangeReasonTypes ?? source.premiumChangeReasons) },
      { label: '고객 반응', value: renewalCustomerReactionText(source.customerReaction) },
      { label: '고객 관심사항', value: renewalInterestsText(source.interestTypes ?? source.renewalInterests ?? source.interests ?? source.customerInterests) },
      { label: '후속조치', value: arrayText(source.nextActions) },
      { label: '결정 예정일', value: formatDate(source.decisionExpectedDate) },
      { label: '상담 결과', value: renewalResultText(source.consultationResult || source.result) },
    ]
  }

  const source = detail.value.cancelDetail || {}
  const currentItems = [
    { label: '해지 검토 사유', value: terminationReasonsText(source.reviewReasons ?? source.terminationReasons) },
    { label: '해지 사유 상세', value: source.reasonDetail || source.cancelReasonDetail || '-' },
    { label: '유지 방안', value: terminationRetentionPlansText(source.retentionPlans ?? source.retentionPlanTypes) },
    { label: '고객 의사', value: terminationCustomerIntentText(source.customerIntent) },
    { label: '유지 가능성', value: retentionLabel(source.retentionPossibility) },
    { label: '상담 결과', value: terminationResultText(source.result || source.consultationResult) },
    { label: '후속조치', value: arrayText(source.nextActions) },
  ]
  const hasExtendedItems = [
    source.reviewReasons,
    source.terminationReasons,
    source.reasonDetail,
    source.cancelReasonDetail,
    source.retentionPlans,
    source.retentionPlanTypes,
    source.customerIntent,
    source.result,
    source.consultationResult,
    source.nextActions,
  ].some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))

  if (hasExtendedItems) return currentItems

  return [
    ...cancelBooleanGroups.map((group) => ({
      label: group.label,
      value: cancelGroupText(source, group.keys),
    })),
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
    newDetail: mergeDetailObject(localDetail.newDetail, serverDetail.newDetail),
    claimDetail: mergeDetailObject(localDetail.claimDetail, serverDetail.claimDetail),
    renewalDetail: mergeDetailObject(localDetail.renewalDetail, serverDetail.renewalDetail),
    cancelDetail: mergeDetailObject(localDetail.cancelDetail, serverDetail.cancelDetail),
  }
}

function mergeDetailObject(localValue, serverValue) {
  return {
    ...(localValue || {}),
    ...(serverValue || {}),
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

function claimTypeText(value) {
  const labels = {
    MEDICAL_EXPENSE: '실손의료비 보장',
    HOSPITALIZATION: '입원 보장',
    OUTPATIENT: '통원 보장',
    SURGERY: '수술 보장',
    DIAGNOSIS: '진단 보장',
    INJURY: '상해 보장',
  }
  return labels[value] || value || '-'
}

function hospitalizationStatusText(value) {
  const labels = {
    HOSPITALIZED: '입원',
    HOSPITALIZATION: '입원',
    OUTPATIENT: '통원',
    NONE: '해당 없음',
  }
  return labels[value] || value || '-'
}

function surgeryStatusText(value) {
  const labels = {
    SURGERY: '수술함',
    YES: '수술함',
    NONE: '수술 안 함',
    NO: '수술 안 함',
  }
  return labels[value] || value || '-'
}

function renewalChangeTypeText(value) {
  const labels = {
    SAME: '변경 없음',
    NONE: '변경 없음',
    EXPAND: '보장 확대',
    EXPANDED: '보장 확대',
    REDUCE: '보장 축소',
    REDUCED: '보장 축소',
  }
  return labels[value] || value || '-'
}

function renewalPremiumReasonsText(value) {
  const labels = {
    AGE_INCREASE: '연령 증가',
    RISK_CHANGE: '위험률 변경',
    LOSS_RATIO_CHANGE: '손해율 변경',
    COVERAGE_CHANGE: '보장 변경',
    OTHER: '기타',
  }
  return mappedArrayText(value, labels)
}

function renewalCustomerReactionText(value) {
  const labels = {
    '신중함': '부정적',
    NEGATIVE: '부정적',
    NEUTRAL: '보통',
    POSITIVE: '긍정적',
  }
  return labels[value] || value || '-'
}

function renewalInterestsText(value) {
  const labels = {
    PREMIUM: '보험료',
    COVERAGE: '보장 범위',
    MATURITY: '만기',
    REFUND: '환급금',
    ALTERNATIVE_PRODUCT: '대체상품',
  }
  return mappedArrayText(value, labels)
}

function renewalResultText(value) {
  const labels = {
    RENEWAL_ACCEPTED: '갱신확정',
    PENDING_DECISION: '결정보류',
    COMPARING_PRODUCTS: '상품비교중',
    ADDITIONAL_CONSULTATION: '추가상담필요',
  }
  return labels[value] || value || '-'
}

function mappedArrayText(value, labels) {
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  return items.length ? items.map((item) => labels[item] || item).join(', ') : '-'
}

function terminationReasonsText(value) {
  const labels = {
    PREMIUM_BURDEN: '보험료 부담',
    RENEWAL_PREMIUM_BURDEN: '갱신 후 보험료 인상 부담',
    PAYMENT_DIFFICULTY: '경제적 사정',
    COVERAGE_DISSATISFACTION: '보장 불만족',
    DUPLICATE_INSURANCE: '중복 가입',
    PLANNER_CONTACT_DISSATISFACTION: '설계사 서비스 불만',
    MANAGEMENT_DISSATISFACTION: '관리 부족 불만',
    PRODUCT_REVIEW: '대체 상품 검토 중',
    COMPARING_OTHER_COMPANY: '타사 상품 비교 중',
    MOVING_TO_OTHER_COMPANY: '타사 이동 예정',
    OTHER: '기타',
  }
  return mappedArrayText(value, labels)
}

function terminationRetentionPlansText(value) {
  const labels = {
    PREMIUM_ADJUSTMENT: '보험료 감액 설계',
    RIDER_ADJUSTMENT: '특약 조정',
    COVERAGE_REDESIGN: '보장 리모델링',
    PAYMENT_DEFERRAL: '납입 유예 검토',
    ALTERNATIVE_PRODUCT: '대체 상품 제안',
    RETENTION_RECOMMENDATION: '유지 권유',
    OTHER: '기타',
  }
  return mappedArrayText(value, labels)
}

function terminationCustomerIntentText(value) {
  const labels = {
    IMMEDIATE_TERMINATION: '즉시 해지 희망',
    REVIEW_BEFORE_TERMINATION: '해지 검토 중',
    REVIEW_MAINTENANCE: '유지 검토 중',
    DISCUSS_WITH_FAMILY: '가족과 상의 예정',
    FOLLOW_UP_CONSULTATION: '추후 재상담 희망',
  }
  return labels[value] || value || '-'
}

function terminationResultText(value) {
  const labels = {
    RETAINED: '유지',
    TERMINATION_IN_PROGRESS: '해지 진행',
    TERMINATION_DEFERRED: '해지 보류',
    FOLLOW_UP_REQUIRED: '재상담 예정',
  }
  return labels[value] || value || '-'
}

function cancelGroupText(source, keys) {
  const items = keys
    .filter(([key]) => isPositiveFlag(source[key]))
    .map(([, label]) => label)
  return items.length ? items.join(', ') : '-'
}

function isPositiveFlag(value) {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    return ['true', 'y', 'yes', '1'].includes(value.trim().toLowerCase())
  }
  return false
}

function booleanText(value) {
  if (value === true) return '예'
  if (value === false) return '아니오'
  return '-'
}

function moneyText(value) {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString('ko-KR') : String(value)
}

function rateText(value) {
  if (value === null || value === undefined || value === '') return '-'
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return String(value)
  const prefix = numberValue > 0 ? '+' : ''
  return `${prefix}${numberValue}%`
}

function proposedProductsText(value) {
  if (!Array.isArray(value) || !value.length) return '-'
  return value
    .map((product) => product.insuranceProductName || product.productName || product.name || product.insuranceProductId)
    .filter(Boolean)
    .join(', ') || '-'
}

function coverageTypesText(value) {
  const labelMap = {
    CANCER: '암',
    HEART: '심장',
    LIFE: '생명',
    DEATH: '사망',
    LONG_TERM_CARE: '장기요양',
  }
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(',').map((item) => item.trim()).filter(Boolean)

  return items.length ? items.map((item) => labelMap[item] || item).join(', ') : '-'
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-'
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
