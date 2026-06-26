<template>
  <section class="handover-detail" aria-label="인수인계 요청 상세">
    <header class="handover-detail__header">
      <div class="handover-detail__title-row">
        <button class="handover-detail__back" type="button" @click="goBack">← 목록</button>
        <span class="handover-detail__divider">/</span>
        <h1>요청 상세</h1>
        <span class="handover-detail-status" :class="getStatusClass(detail.requestStatus)">
          {{ getStatusLabel(detail.requestStatus) }}
        </span>
      </div>
    </header>

    <div v-if="isLoading" class="handover-detail-state">
      <v-progress-circular indeterminate color="#f97316" size="28" />
      <span>인수인계 상세 정보를 불러오는 중입니다.</span>
    </div>

    <v-alert v-else-if="errorMessage" type="error" variant="tonal">
      {{ errorMessage }}
    </v-alert>

    <div v-else class="handover-detail__body">
      <div class="handover-detail__left">
        <section class="handover-card">
          <h2>고객 정보</h2>

          <div class="customer-info-grid">
            <div class="detail-field">
              <span>고객명</span>
              <strong>{{ detail.customer.customerName }}</strong>
            </div>
            <div class="detail-field">
              <span>나이</span>
              <strong>{{ formatCustomerAge(detail.customer.customerAge) }}</strong>
            </div>
            <div class="detail-field">
              <span>등급</span>
              <strong>
                <span class="grade-badge" :class="getGradeClass(detail.customer.customerGrade)">
                  {{ detail.customer.customerGrade || '-' }}
                </span>
              </strong>
            </div>
            <div class="detail-field">
              <span>요청 유형</span>
              <strong>{{ getRequestTypeLabel(detail.requestType) }}</strong>
            </div>
            <div class="detail-field">
              <span>기존 담당</span>
              <strong :class="{ 'detail-field__muted': !detail.customer.currentFpName }">
                {{ detail.customer.currentFpName || '없음 (해촉)' }}
              </strong>
            </div>
          </div>

          <div class="detail-list">
            <div class="detail-list__row">
              <span>보유 계약</span>
              <strong>{{ detail.customer.contractSummary || '-' }}</strong>
            </div>
            <div class="detail-list__row">
              <span>월 보험료</span>
              <strong>{{ formatCurrency(detail.customer.monthlyPremium) }}</strong>
            </div>
            <div class="detail-list__row">
              <span>최근 상담일</span>
              <strong>{{ formatDate(detail.customer.lastConsultedAt) }}</strong>
            </div>
            <div class="detail-list__row">
              <span>주 상담채널</span>
              <strong>
                <span class="channel-badge">{{ getChannelLabel(detail.customer.mainConsultationChannel) }}</span>
              </strong>
            </div>
          </div>
        </section>

        <section class="handover-card handover-history-card">
          <h2>인수인계 이력</h2>
          <div v-if="hasHistory" class="history-row">
            <span>{{ formatDate(detail.handoverHistory.changedAt) }}</span>
            <strong>{{ formatPreviousFpChangeText(detail.handoverHistory.previousFpName) }}</strong>
          </div>
          <p v-else>이력 없음</p>
        </section>
      </div>

      <aside class="handover-card recommendation-card">
        <h2>추천 설계사</h2>

        <div v-if="detail.recommendation.rejectedFpName" class="reject-banner">
          반려 이력 · {{ detail.recommendation.rejectedFpName }} → {{ recommendationFlowLabel }}
        </div>

        <div class="recommended-fp">
          <div class="recommended-fp__avatar">{{ fpInitial }}</div>
          <div>
            <strong>{{ detail.recommendation.recommendedFpName || '-' }}</strong>
            <span>경력 {{ recommendedCareerText }} · {{ recommendedBranchText }}</span>
          </div>
        </div>

        <div class="match-list">
          <div class="match-list__row">
            <span>주요 보종</span>
            <strong class="specialty-list">
              <span
                v-for="category in specialtyCategories"
                :key="category"
                class="specialty-badge"
              >
                {{ category }}
              </span>
            </strong>
          </div>
          <div class="match-list__row">
            <span>유지율</span>
            <strong class="match-list__rate">{{ formatPercent(detail.recommendation.retentionRate) }}</strong>
          </div>
          <div class="match-list__row">
            <span>선호 연령대</span>
            <strong>{{ formatAgeBand(detail.recommendation.preferredCustomerAge) }}</strong>
          </div>
          <div class="match-list__row">
            <span>주 상담채널</span>
            <strong>
              <span class="channel-badge">{{ getChannelLabel(detail.recommendation.consultationChannel) }}</span>
            </strong>
          </div>
        </div>

        <blockquote class="recommendation-comment">
          "{{ detail.recommendation.recommendationReason || '추천 사유가 없습니다.' }}"
        </blockquote>

        <div v-if="showApprovalActions" class="approval-actions">
          <button
            class="approval-actions__approve"
            type="button"
            :disabled="isSubmitting"
            @click="submitApproval('APPROVED')"
          >
            승인
          </button>
          <button
            class="approval-actions__reject"
            type="button"
            :disabled="isSubmitting"
            @click="openRejectModal"
          >
            반려
          </button>
          <button
            class="approval-actions__assign"
            type="button"
            :disabled="isSubmitting"
            @click="openAssignModal"
          >
            직접 지정
          </button>
        </div>
      </aside>
    </div>

    <div v-if="isRejectModalOpen" class="reject-modal" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
      <div class="reject-modal__backdrop" @click="closeRejectModal"></div>
      <form class="reject-modal__panel" @submit.prevent="submitReject">
        <div class="reject-modal__header">
          <h2 id="reject-modal-title">반려 사유 입력</h2>
          <button type="button" aria-label="닫기" @click="closeRejectModal">×</button>
        </div>
        <textarea
          ref="rejectionReasonInput"
          v-model.trim="rejectionReason"
          rows="4"
          placeholder="반려 사유를 입력해주세요."
          autofocus
          @input="rejectErrorMessage = ''"
        ></textarea>
        <p v-if="rejectErrorMessage">{{ rejectErrorMessage }}</p>
        <div class="reject-modal__actions">
          <button class="reject-modal__cancel" type="button" @click="closeRejectModal">취소</button>
          <button class="reject-modal__submit" type="submit" :disabled="isSubmitting">반려 처리</button>
        </div>
      </form>
    </div>

    <div v-if="isAssignModalOpen" class="assign-modal" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
      <div class="assign-modal__backdrop" @click="closeAssignModal"></div>
      <section class="assign-modal__panel">
        <div class="assign-modal__header">
          <h2 id="assign-modal-title">설계사 직접 지정</h2>
          <button type="button" aria-label="닫기" @click="closeAssignModal">×</button>
        </div>

        <v-alert v-if="assignErrorMessage" type="error" variant="tonal" density="comfortable">
          {{ assignErrorMessage }}
        </v-alert>

        <div class="assign-list" :class="{ 'is-loading': isLoadingAssignableFps && assignableFps.length > 0 }">
          <div v-if="isLoadingAssignableFps && assignableFps.length === 0" class="assign-list__state">
            <v-progress-circular indeterminate color="#f97316" size="24" />
            <span>지정 가능한 설계사를 불러오는 중입니다.</span>
          </div>
          <button
            v-for="fp in assignableFps"
            :key="fp.fpId"
            type="button"
            class="assign-fp-row"
            :class="{ 'is-selected': selectedFpId === fp.fpId }"
            @click="selectedFpId = fp.fpId"
          >
            <span class="assign-fp-row__main">
              <strong>{{ fp.fpName }}</strong>
              <small>경력 {{ formatCareerYears(fp.careerYears) }} · 담당 {{ formatCount(fp.customerCount) }}명</small>
            </span>
            <span class="assign-fp-row__meta">
              <span>{{ fp.specialtyCategory || '-' }}</span>
              <span>{{ formatAgeBand(fp.preferredCustomerAge) }}</span>
              <span>{{ getChannelLabel(fp.consultationChannel) }}</span>
              <strong>{{ formatPercent(fp.retentionRate) }}</strong>
            </span>
          </button>
          <div v-if="!isLoadingAssignableFps && assignableFps.length === 0" class="assign-list__state">
            지정 가능한 설계사가 없습니다.
          </div>
          <v-progress-linear
            v-if="isLoadingAssignableFps && assignableFps.length > 0"
            class="assign-list__loading"
            indeterminate
            color="#f97316"
            height="2"
          />
        </div>

        <div class="assign-modal__pagination">
          <span>{{ assignRangeLabel }}</span>
          <v-pagination
            :model-value="assignPage"
            :length="Math.max(assignTotalPages, 1)"
            total-visible="5"
            rounded="circle"
            @update:model-value="changeAssignPage"
          />
        </div>

        <div class="assign-modal__actions">
          <button class="assign-modal__cancel" type="button" @click="closeAssignModal">취소</button>
          <button
            class="assign-modal__submit"
            type="button"
            :disabled="isSubmitting || !selectedFpId"
            @click="submitAssign"
          >
            지정 완료
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  assignHandoverFp,
  getAssignableFps,
  getHandoverDetail,
  processHandoverApproval,
} from '../../api/handovers'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const detail = reactive(createEmptyDetail())
const isLoading = ref(false)
const isSubmitting = ref(false)
const isRejectModalOpen = ref(false)
const isAssignModalOpen = ref(false)
const isLoadingAssignableFps = ref(false)
const rejectionReason = ref('')
const rejectionReasonInput = ref(null)
const rejectErrorMessage = ref('')
const assignErrorMessage = ref('')
const errorMessage = ref('')
const assignableFps = ref([])
const selectedFpId = ref('')
const assignPage = ref(1)
const assignPageSize = ref(5)
const assignTotalElements = ref(0)
const assignTotalPages = ref(0)

const hasHistory = computed(() => Boolean(detail.handoverHistory.previousFpName || detail.handoverHistory.changedAt))
const showApprovalActions = computed(() =>
  authStore.userRole === USER_ROLES.BRANCH_MANAGER &&
  detail.canApprove &&
  detail.requestStatus === 'MANAGER_PENDING',
)
const specialtyCategories = computed(() => {
  const categories = detail.recommendation.specialtyCategories
  const normalizedCategories = Array.isArray(categories)
    ? categories.map((category) => String(category).trim()).filter(Boolean)
    : []

  return normalizedCategories.length > 0 ? normalizedCategories : ['-']
})
const fpInitial = computed(() => (detail.recommendation.recommendedFpName || '?').trim().slice(0, 1))
const recommendedCareerText = computed(() => '6년')
const recommendedBranchText = computed(() => authStore.user.organizationName || '소속 지점')
const isDirectAssignedRecommendation = computed(() =>
  String(detail.recommendation.recommendationReason ?? '').includes('직접 지정'),
)
const recommendationFlowLabel = computed(() =>
  isDirectAssignedRecommendation.value ? '직접 지정' : '재추천됨',
)
const assignRangeLabel = computed(() => {
  if (assignTotalElements.value === 0) {
    return '총 0명'
  }

  const start = (assignPage.value - 1) * assignPageSize.value + 1
  const end = Math.min(assignPage.value * assignPageSize.value, assignTotalElements.value)
  return `총 ${assignTotalElements.value.toLocaleString('ko-KR')}명 중 ${start}-${end}명`
})

onMounted(() => {
  loadDetail()
})

watch(
  () => route.params.handoverRequestId,
  (handoverRequestId, previousHandoverRequestId) => {
    if (!handoverRequestId || handoverRequestId === previousHandoverRequestId) {
      return
    }

    resetRejectModal()
    resetAssignModal()
    loadDetail()
  },
)

async function loadDetail() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await getHandoverDetail(route.params.handoverRequestId)
    Object.assign(detail, normalizeDetail(response?.result))
  } catch (error) {
    Object.assign(detail, createSampleDetail())
    errorMessage.value = error.response?.data?.message || ''
  } finally {
    isLoading.value = false
  }
}

async function submitApproval(approvalStatus) {
  isSubmitting.value = true

  try {
    await processHandoverApproval(detail.handoverRequestId, {
      approvalStatus,
      rejectionReason: approvalStatus === 'REJECTED' ? rejectionReason.value.trim() : null,
    })
    await loadDetail()
    resetRejectModal()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '결재 처리에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function openRejectModal() {
  rejectionReason.value = ''
  rejectErrorMessage.value = ''
  isRejectModalOpen.value = true
}

function closeRejectModal() {
  if (isSubmitting.value) {
    return
  }

  resetRejectModal()
}

function resetRejectModal() {
  isRejectModalOpen.value = false
  rejectionReason.value = ''
  rejectErrorMessage.value = ''
}

function submitReject() {
  const reason = String(rejectionReasonInput.value?.value ?? rejectionReason.value).trim()
  rejectionReason.value = reason

  if (!reason) {
    rejectErrorMessage.value = '반려 사유를 입력해주세요.'
    return
  }

  submitApproval('REJECTED')
}

async function openAssignModal() {
  selectedFpId.value = ''
  assignErrorMessage.value = ''
  assignPage.value = 1
  isAssignModalOpen.value = true
  await loadAssignableFps()
}

function closeAssignModal() {
  if (isSubmitting.value) {
    return
  }

  resetAssignModal()
}

function resetAssignModal() {
  isAssignModalOpen.value = false
  selectedFpId.value = ''
  assignErrorMessage.value = ''
}

async function loadAssignableFps() {
  isLoadingAssignableFps.value = true
  assignErrorMessage.value = ''

  try {
    const response = await getAssignableFps(detail.handoverRequestId, {
      page: assignPage.value,
      size: assignPageSize.value,
    })
    const page = response?.result ?? {}
    assignableFps.value = normalizeAssignableFps(page)
    assignPage.value = Number(page.page ?? assignPage.value)
    assignPageSize.value = Number(page.size ?? assignPageSize.value)
    assignTotalElements.value = Number(page.totalElements ?? assignableFps.value.length)
    assignTotalPages.value = Number(page.totalPages ?? 1)
  } catch (error) {
    assignableFps.value = []
    assignTotalElements.value = 0
    assignTotalPages.value = 0
    assignErrorMessage.value =
      error.response?.data?.message || error.message || '지정 가능한 설계사 목록을 불러오지 못했습니다.'
  } finally {
    isLoadingAssignableFps.value = false
  }
}

function changeAssignPage(page) {
  if (page === assignPage.value || isLoadingAssignableFps.value) {
    return
  }

  assignPage.value = page
  selectedFpId.value = ''
  loadAssignableFps()
}

async function submitAssign() {
  if (!selectedFpId.value) {
    assignErrorMessage.value = '지정할 설계사를 선택해주세요.'
    return
  }

  isSubmitting.value = true
  assignErrorMessage.value = ''

  try {
    await assignHandoverFp(detail.handoverRequestId, {
      assignedFpId: selectedFpId.value,
    })
    resetAssignModal()
    await loadDetail()
  } catch (error) {
    assignErrorMessage.value = error.response?.data?.message || error.message || '설계사 직접 지정에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function normalizeDetail(source = {}) {
  return {
    handoverRequestId: source.handoverRequestId ?? '',
    requestType: source.requestType ?? 'RESIGNATION',
    requestStatus: source.requestStatus ?? 'MANAGER_PENDING',
    createdAt: source.createdAt ?? null,
    customer: {
      customerId: source.customer?.customerId ?? '',
      customerName: source.customer?.customerName ?? '-',
      customerAge:
        source.customer?.customerAge ??
        source.customer?.age ??
        calculateAge(source.customer?.customerBirthDate ?? source.customer?.birthDate),
      customerGrade: source.customer?.customerGrade ?? '-',
      currentFpName: source.customer?.currentFpName ?? '',
      contractSummary: source.customer?.contractSummary ?? '',
      monthlyPremium: source.customer?.monthlyPremium ?? 0,
      lastConsultedAt: source.customer?.lastConsultedAt ?? null,
      mainConsultationChannel: source.customer?.mainConsultationChannel ?? '',
    },
    handoverHistory: {
      previousFpName: source.handoverHistory?.previousFpName ?? '',
      changedAt: source.handoverHistory?.changedAt ?? null,
    },
    recommendation: {
      recommendationId: source.recommendation?.recommendationId ?? '',
      recommendedFpName: source.recommendation?.recommendedFpName ?? '-',
      specialtyCategories: normalizeSpecialtyCategories(source.recommendation),
      retentionRate: source.recommendation?.retentionRate ?? source.recommendation?.retentionRatePercent ?? null,
      preferredCustomerAge:
        source.recommendation?.preferredCustomerAge ??
        source.recommendation?.preferredAge ??
        source.recommendation?.preferredCustomerAgeGroup ??
        null,
      consultationChannel:
        source.recommendation?.consultationChannel ??
        source.recommendation?.mainConsultationChannel ??
        '',
      recommendationReason: source.recommendation?.recommendationReason ?? '',
      approvalStatus: source.recommendation?.approvalStatus ?? 'PENDING',
      rejectedFpName: source.recommendation?.rejectedFpName ?? '',
    },
    canApprove: Boolean(source.canApprove),
  }
}

function createEmptyDetail() {
  return normalizeDetail()
}

function createSampleDetail() {
  return normalizeDetail({
    handoverRequestId: route.params.handoverRequestId,
    requestType: 'RESIGNATION',
    requestStatus: 'MANAGER_PENDING',
    customer: {
      customerName: '홍길동',
      customerAge: 42,
      customerGrade: 'GOLD',
      currentFpName: '',
      contractSummary: '실손 2건 · 종신 1건',
      monthlyPremium: 320000,
      lastConsultedAt: '2026-05-12T10:00:00',
      mainConsultationChannel: 'PHONE',
    },
    handoverHistory: {},
    recommendation: {
      recommendedFpName: '최설계',
      specialtyCategories: ['실손', '종신'],
      retentionRate: 88.7,
      preferredCustomerAge: 40,
      consultationChannel: 'PHONE',
      recommendationReason: '실손 보종 전문, 담당 고객 수 여유 있어 균등 배분에 적합합니다.',
      rejectedFpName: '박설계',
    },
    canApprove: true,
  })
}

function normalizeSpecialtyCategories(recommendation = {}) {
  const categories = recommendation.specialtyCategories

  if (Array.isArray(categories)) {
    return categories.flatMap((category) => splitCategories(category))
  }

  return splitCategories(recommendation.specialtyCategory ?? recommendation.specialtyCategories)
}

function normalizeAssignableFps(source) {
  const content = Array.isArray(source?.content) ? source.content : source

  if (!Array.isArray(content)) {
    return []
  }

  return content.map((fp) => ({
    fpId: fp.fpId ?? fp.assignedFpId ?? fp.userId ?? '',
    fpName: fp.fpName ?? fp.userName ?? '-',
    careerYears: fp.careerYears ?? null,
    specialtyCategory: fp.specialtyCategory ?? '',
    preferredCustomerAge: fp.preferredCustomerAge ?? null,
    consultationChannel: fp.consultationChannel ?? '',
    customerCount: fp.customerCount ?? 0,
    contractCount: fp.contractCount ?? 0,
    retentionRate: fp.retentionRate ?? null,
  })).filter((fp) => fp.fpId)
}

function splitCategories(value) {
  if (!value) {
    return []
  }

  return String(value)
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean)
}

function goBack() {
  router.push({ name: route.query.from || getHandoverListRouteName() })
}

function formatPreviousFpChangeText(previousFpName) {
  return previousFpName ? `${previousFpName} 설계사에서 변경` : '이전 담당 설계사에서 변경'
}

function getHandoverListRouteName() {
  if (authStore.userRole === USER_ROLES.FP) {
    return 'handover-received'
  }

  if (authStore.userRole === USER_ROLES.HQ_MANAGER) {
    return 'handover-monitoring'
  }

  return 'handover-requests'
}

function getStatusLabel(status) {
  return status === 'COMPLETED' ? '완료' : '결재 대기'
}

function getStatusClass(status) {
  return status === 'COMPLETED' ? 'handover-detail-status--completed' : 'handover-detail-status--pending'
}

function getRequestTypeLabel(type) {
  return type === 'VOLUNTARY' ? '수동' : '해촉 자동'
}

function getChannelLabel(channel) {
  const labels = {
    PHONE: '전화',
    VISIT: '방문',
    MESSAGE: '메시지',
    ONLINE: '온라인',
    VIDEO: '화상',
    CHAT: '채팅',
  }
  const normalizedChannel = String(channel ?? '').toUpperCase()

  return labels[normalizedChannel] || channel || '-'
}

function getGradeClass(grade) {
  return `grade-badge--${String(grade || '').toLowerCase()}`
}

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('ko-KR')}원`
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatCareerYears(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${Number(value).toLocaleString('ko-KR')}년`
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-'
}

function formatCustomerAge(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `만 ${Number(value).toLocaleString('ko-KR')}세`
}

function calculateAge(birthDate) {
  if (!birthDate) {
    return null
  }

  const birthday = new Date(birthDate)

  if (Number.isNaN(birthday.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - birthday.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate())

  if (!hasBirthdayPassed) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${Number(value).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function formatAgeBand(value) {
  if (!value) {
    return '-'
  }

  return `${value}대`
}
</script>

<style scoped>
.handover-detail {
  display: grid;
  gap: 16px;
}

.handover-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.handover-detail__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.handover-detail__back {
  border: 0;
  padding: 0;
  background: transparent;
  color: #9aa0a6;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.handover-detail__divider {
  color: #c5c9cf;
}

.handover-detail h1 {
  margin: 0;
  color: #202124;
  font-size: 18px;
  font-weight: 800;
}

.handover-detail-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.handover-detail-status--pending {
  background: #ffe9dc;
  color: #f97316;
}

.handover-detail-status--completed {
  background: #e7f1fb;
  color: #1d73bd;
}

.handover-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(360px, 5fr);
  gap: 12px;
}

.handover-detail__left {
  display: grid;
  gap: 10px;
}

.handover-card {
  padding: 16px;
  border: 1px solid #e7e9ee;
  border-radius: 8px;
  background: #ffffff;
}

.handover-card h2 {
  margin: 0 0 14px;
  color: #202124;
  font-size: 13px;
  font-weight: 800;
}

.customer-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
}

.detail-field {
  display: grid;
  gap: 4px;
}

.detail-field span,
.detail-list__row span,
.match-list__row span {
  color: #9aa0a6;
  font-size: 12px;
  font-weight: 700;
}

.detail-field strong {
  color: #202124;
  font-size: 13px;
  font-weight: 800;
}

.detail-field__muted {
  color: #9aa0a6 !important;
}

.detail-list {
  display: grid;
  gap: 0;
  margin-top: 18px;
  padding-top: 8px;
  border-top: 1px solid #f0f1f4;
}

.detail-list__row,
.match-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  gap: 18px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-list__row:last-child,
.match-list__row:last-child {
  border-bottom: 0;
}

.detail-list__row strong,
.match-list__row strong {
  color: #202124;
  font-size: 12px;
  font-weight: 800;
  text-align: right;
}

.grade-badge,
.channel-badge,
.specialty-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.grade-badge {
  background: #fff0d8;
  color: #d98a00;
}

.grade-badge--vip {
  background: #f3e8ff;
  color: #7c3aed;
}

.grade-badge--silver {
  background: #eef2f7;
  color: #64748b;
}

.channel-badge {
  background: #e8f3ff;
  color: #1d73bd;
}

.handover-history-card {
  min-height: 84px;
}

.history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7b818b;
  font-size: 12px;
}

.handover-history-card p {
  margin: 0;
  color: #a2a7af;
  font-size: 12px;
  text-align: right;
}

.recommendation-card {
  align-self: start;
}

.reject-banner {
  margin-bottom: 12px;
  padding: 8px 14px;
  border: 1px solid #ffb8b8;
  border-radius: 5px;
  background: #fff0f0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.recommended-fp {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0 14px;
  border-bottom: 1px solid #f0f1f4;
}

.recommended-fp__avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ffe9dc;
  color: #f97316;
  font-size: 13px;
  font-weight: 900;
}

.recommended-fp strong,
.recommended-fp span {
  display: block;
}

.recommended-fp strong {
  color: #202124;
  font-size: 14px;
  font-weight: 900;
}

.recommended-fp span {
  margin-top: 2px;
  color: #9aa0a6;
  font-size: 12px;
}

.match-list {
  margin-top: 14px;
}

.specialty-list {
  display: inline-flex;
  justify-content: flex-end;
  gap: 6px;
}

.specialty-badge {
  background: #fff0d8;
  color: #c47b00;
}

.match-list__rate {
  color: #22a06b !important;
}

.recommendation-comment {
  margin: 14px 0 0;
  padding: 12px 14px;
  border: 1px solid #fee0bb;
  border-radius: 6px;
  background: #fffaf3;
  color: #9a5c13;
  font-size: 12px;
  font-weight: 700;
}

.approval-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.approval-actions button {
  min-height: 34px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.approval-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.approval-actions__approve {
  border: 1px solid #35b87f;
  background: #edfdf5;
  color: #13965f;
}

.approval-actions__reject {
  border: 1px solid #ff6b6b;
  background: #ffffff;
  color: #ef4444;
}

.approval-actions__assign {
  border: 1px solid #a5b4fc;
  background: #f5f7ff;
  color: #4f46e5;
}

.handover-detail-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #7b818b;
}

.reject-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
}

.reject-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
}

.reject-modal__panel {
  position: relative;
  width: min(420px, 100%);
  padding: 18px;
  border: 1px solid #f1c6c6;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.reject-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.reject-modal__header h2 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 900;
}

.reject-modal__header button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #f5f6f8;
  color: #7b818b;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.reject-modal textarea {
  width: 100%;
  resize: vertical;
  padding: 12px;
  border: 1px solid #e2e5ea;
  border-radius: 8px;
  color: #202124;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.reject-modal textarea:focus {
  border-color: #ff8a8a;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.reject-modal p {
  margin: 8px 0 0;
  color: #ef4444;
  font-size: 12px;
  font-weight: 700;
}

.reject-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.reject-modal__actions button {
  min-width: 78px;
  min-height: 34px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.reject-modal__cancel {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #6f7680;
}

.reject-modal__submit {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #ffffff;
}

.assign-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
}

.assign-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
}

.assign-modal__panel {
  position: relative;
  width: min(720px, 100%);
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe1f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.assign-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assign-modal__header h2 {
  margin: 0;
  color: #202124;
  font-size: 16px;
  font-weight: 900;
}

.assign-modal__header button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #f5f6f8;
  color: #7b818b;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.assign-list {
  position: relative;
  display: grid;
  gap: 8px;
}

.assign-list.is-loading .assign-fp-row {
  opacity: 0.72;
  pointer-events: none;
}

.assign-list__loading {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  border-radius: 999px;
}

.assign-list__state {
  min-height: 140px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #8b8f98;
  font-size: 13px;
  text-align: center;
}

.assign-fp-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(260px, 1.4fr);
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #e7e9ee;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.assign-fp-row:hover,
.assign-fp-row.is-selected {
  border-color: #f97316;
  background: #fff7ed;
}

.assign-fp-row__main strong,
.assign-fp-row__main small {
  display: block;
}

.assign-fp-row__main strong {
  color: #202124;
  font-size: 14px;
  font-weight: 900;
}

.assign-fp-row__main small {
  margin-top: 4px;
  color: #8b8f98;
  font-size: 12px;
  font-weight: 700;
}

.assign-fp-row__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.assign-fp-row__meta span,
.assign-fp-row__meta strong {
  display: inline-flex;
  align-items: center;
  min-height: 23px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  font-weight: 800;
}

.assign-fp-row__meta strong {
  background: #ecfdf3;
  color: #169b62;
}

.assign-modal__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #8b8f98;
  font-size: 12px;
}

.assign-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.assign-modal__actions button {
  min-width: 78px;
  min-height: 34px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.assign-modal__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.assign-modal__cancel {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #6f7680;
}

.assign-modal__submit {
  border: 1px solid #f97316;
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 960px) {
  .handover-detail__body {
    grid-template-columns: 1fr;
  }

  .customer-info-grid {
    grid-template-columns: 1fr;
  }

  .assign-fp-row,
  .assign-modal__pagination {
    grid-template-columns: 1fr;
    display: grid;
  }

  .assign-fp-row__meta {
    justify-content: flex-start;
  }
}
</style>
