<template>
  <section class="handover-detail" aria-label="인수인계 요청 상세">
    <header class="handover-detail__header">
      <PageBackLink label="인수인계 요청 목록" @click="goBack" />
      <div class="handover-detail__title-row">
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
        <section class="handover-card customer-card">
          <h2>
            <v-icon icon="mdi-account-outline" size="25" />
            고객 요약
          </h2>

          <div class="customer-summary">
            <div class="summary-row summary-row--three">
              <div class="summary-field">
                <v-icon icon="mdi-account-outline" size="28" />
                <div>
                  <span>고객명</span>
                  <strong>{{ detail.customer.customerName }}</strong>
                </div>
              </div>
              <div class="summary-field">
                <v-icon icon="mdi-crown-outline" size="28" />
                <div>
                  <span>등급</span>
                  <strong>
                    <span class="grade-badge" :class="getGradeClass(detail.customer.customerGrade)">
                      {{ detail.customer.customerGrade || '-' }}
                    </span>
                  </strong>
                </div>
              </div>
              <div class="summary-field">
                <v-icon icon="mdi-calendar-blank-outline" size="28" />
                <div>
                  <span>나이</span>
                  <strong>{{ formatCustomerAge(detail.customer.customerAge) }}</strong>
                </div>
              </div>
            </div>

            <div class="summary-row summary-row--two">
              <div class="summary-field">
                <v-icon icon="mdi-file-document-outline" size="28" />
                <div>
                  <span>요청 유형</span>
                  <strong>{{ getRequestTypeLabel(detail.requestType) }}</strong>
                </div>
              </div>
              <div class="summary-field">
                <v-icon icon="mdi-account-outline" size="28" />
                <div>
                  <span>기존 담당</span>
                  <strong :class="{ 'text-muted': !detail.customer.currentFpName }">
                    {{ detail.customer.currentFpName || '없음 (이직)' }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="summary-row summary-row--two">
              <div class="summary-field">
                <v-icon icon="mdi-shield-check-outline" size="28" />
                <div>
                  <span>보유 계약</span>
                  <strong>{{ detail.customer.contractSummary || '-' }}</strong>
                </div>
              </div>
              <div class="summary-field">
                <v-icon icon="mdi-currency-krw" size="28" />
                <div>
                  <span>월 보험료</span>
                  <strong>{{ formatCurrency(detail.customer.monthlyPremium) }}</strong>
                </div>
              </div>
            </div>

            <div class="summary-row summary-row--two">
              <div class="summary-field">
                <v-icon icon="mdi-calendar-blank-outline" size="28" />
                <div>
                  <span>최근 상담일</span>
                  <strong>{{ formatDate(detail.customer.lastConsultedAt) }}</strong>
                </div>
              </div>
              <div class="summary-field">
                <v-icon icon="mdi-message-processing-outline" size="28" />
                <div>
                  <span>주 상담채널</span>
                  <strong>
                    <span class="channel-badge">{{ getChannelLabel(detail.customer.mainConsultationChannel) }}</span>
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="handover-card history-card">
          <h2>
            <v-icon icon="mdi-history" size="25" />
            인수인계 이력
          </h2>
          <div v-if="hasHistory" class="history-row">
            <span>{{ formatDate(detail.handoverHistory.changedAt) }}</span>
            <strong>{{ formatPreviousFpChangeText(detail.handoverHistory.previousFpName) }}</strong>
          </div>
          <div v-else class="empty-history">
            <v-icon icon="mdi-clipboard-search-outline" size="84" />
            <span>이력이 없습니다</span>
          </div>
        </section>
      </div>

      <div class="handover-detail__right">
        <section class="handover-card recommendation-card">
          <h2>
            <v-icon icon="mdi-account-outline" size="25" />
            추천 설계사
          </h2>

          <div v-if="detail.recommendation.rejectedFpName" class="reject-banner">
            반려 이력 · {{ detail.recommendation.rejectedFpName }} {{ recommendationFlowLabel }}
          </div>

          <div class="recommended-panel">
            <div class="recommended-fp">
              <div class="recommended-fp__avatar">{{ fpInitial }}</div>
              <div>
                <strong>{{ detail.recommendation.recommendedFpName || '-' }}</strong>
                <span>경력 {{ recommendedCareerText }} <b></b> {{ recommendedBranchText }}</span>
              </div>
            </div>

            <div class="match-grid">
              <div class="match-card match-card--blue">
                <v-icon icon="mdi-account-group-outline" size="34" />
                <span>전문 분야</span>
                <strong>{{ specialtyCategories.join(', ') }}</strong>
              </div>
              <div class="match-card match-card--green">
                <v-icon icon="mdi-chart-line" size="34" />
                <span>유지율</span>
                <strong>{{ formatPercent(detail.recommendation.retentionRate) }}</strong>
              </div>
              <div class="match-card match-card--purple">
                <v-icon icon="mdi-account-multiple-outline" size="34" />
                <span>선호 연령대</span>
                <strong>{{ formatAgeBand(detail.recommendation.preferredCustomerAge) }}</strong>
              </div>
              <div class="match-card match-card--blue">
                <v-icon icon="mdi-phone-outline" size="34" />
                <span>주 상담채널</span>
                <strong>{{ getChannelLabel(detail.recommendation.consultationChannel) }}</strong>
              </div>
            </div>

            <div v-if="hasRecommendationPoints" class="recommendation-points">
              <strong>
                <v-icon icon="mdi-star" size="18" />
                추천 포인트
              </strong>
              <ul>
                <li v-for="point in recommendationPoints" :key="point">{{ point }}</li>
              </ul>
            </div>
          </div>

          <div class="ai-briefing">
            <div class="ai-briefing__header">
              <div>
                <v-icon icon="mdi-creation" size="28" />
                <strong>AI 브리핑</strong>
                <span>AI 생성</span>
              </div>
              <p>AI가 고객 정보와 설계사 정보를 바탕으로 브리핑을 생성했습니다</p>
            </div>
            <div class="ai-briefing__body">
              <p>{{ aiBriefingText }}</p>
              <div class="briefing-evidence">
                <div v-for="item in evidenceCards" :key="item.title" class="evidence-card">
                  <v-icon :icon="item.icon" size="28" />
                  <div>
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="showApprovalActions" class="action-card">
          <button
            class="approval-actions__approve"
            type="button"
            :disabled="isSubmitting"
            @click="submitApproval('APPROVED')"
          >
            <v-icon icon="mdi-check-circle-outline" size="23" />
            승인
          </button>
          <button
            class="approval-actions__reject"
            type="button"
            :disabled="isSubmitting"
            @click="openRejectModal"
          >
            <v-icon icon="mdi-close" size="23" />
            반려
          </button>
          <button
            class="approval-actions__assign"
            type="button"
            :disabled="isSubmitting"
            @click="openAssignModal"
          >
            <v-icon icon="mdi-account-plus-outline" size="23" />
            직접 지정
          </button>
        </section>
      </div>
    </div>

    <div v-if="isRejectModalOpen" class="modal" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
      <div class="modal__backdrop" @click="closeRejectModal"></div>
      <form class="modal__panel modal__panel--small" @submit.prevent="submitReject">
        <div class="modal__header">
          <h2 id="reject-modal-title">반려 사유 입력</h2>
          <button type="button" aria-label="닫기" @click="closeRejectModal">
            <v-icon icon="mdi-close" size="20" />
          </button>
        </div>
        <textarea
          ref="rejectionReasonInput"
          v-model.trim="rejectionReason"
          rows="4"
          placeholder="반려 사유를 입력해 주세요."
          autofocus
          @input="rejectErrorMessage = ''"
        ></textarea>
        <p v-if="rejectErrorMessage" class="modal__error">{{ rejectErrorMessage }}</p>
        <div class="modal__actions">
          <button class="modal__cancel" type="button" @click="closeRejectModal">취소</button>
          <button class="modal__submit modal__submit--danger" type="submit" :disabled="isSubmitting">
            반려 처리
          </button>
        </div>
      </form>
    </div>

    <div v-if="isAssignModalOpen" class="modal" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
      <div class="modal__backdrop" @click="closeAssignModal"></div>
      <section class="modal__panel modal__panel--large">
        <div class="modal__header">
          <h2 id="assign-modal-title">설계사 직접 지정</h2>
          <button type="button" aria-label="닫기" @click="closeAssignModal">
            <v-icon icon="mdi-close" size="20" />
          </button>
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

        <div class="modal__actions">
          <button class="modal__cancel" type="button" @click="closeAssignModal">취소</button>
          <button
            class="modal__submit"
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
import PageBackLink from '../../components/common/PageBackLink.vue'
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
  detail.canApprove !== false &&
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
const recommendedCareerText = computed(() => formatCareerYears(detail.recommendation.careerYears ?? 6))
const recommendedBranchText = computed(() =>
  detail.recommendation.organizationName || authStore.user?.organizationName || '소속 지점',
)
const isDirectAssignedRecommendation = computed(() =>
  String(detail.recommendation.recommendationReason ?? '').includes('직접 지정'),
)
const recommendationFlowLabel = computed(() =>
  isDirectAssignedRecommendation.value ? '직접 지정됨' : '후 재추천됨',
)
const hasRecommendationPoints = computed(() => recommendationPoints.value.length > 0)
const recommendationPoints = computed(() => {
  const points = detail.recommendation.recommendationPoints

  if (Array.isArray(points)) {
    return points.map((point) => String(point).trim()).filter(Boolean)
  }

  return splitRecommendationText(points)
})
const aiBriefingText = computed(() => {
  if (detail.recommendation.aiBriefing) {
    return detail.recommendation.aiBriefing
  }

  if (detail.recommendation.recommendationReason) {
    return detail.recommendation.recommendationReason
  }

  return `${detail.customer.customerName} 고객은 ${detail.customer.customerGrade || '일반'} 등급이며 최근 상담 이력과 보유 계약을 고려했을 때 후속 관리가 중요합니다. ${detail.recommendation.recommendedFpName} FP는 ${specialtyCategories.value.join(', ')} 분야 경험이 있고, 고객 연령대와 상담 선호가 유사하여 유지성과 관리의 연속성과가 높으면 적합합니다.`
})
const evidenceCards = computed(() => {
  if (detail.recommendation.matchingReasons.length > 0) {
    return detail.recommendation.matchingReasons
  }

  return [
    {
      title: '고객 등급 적합',
      description: `${detail.customer.customerGrade || '고객'} 등급 고객 관리 경험`,
      icon: 'mdi-medal-outline',
    },
    {
      title: '연령대·유사 고객 경험',
      description: `${formatAgeBand(detail.recommendation.preferredCustomerAge)} 고객 다수 관리`,
      icon: 'mdi-account-multiple-outline',
    },
    {
      title: '가족보장 상품 경험',
      description: `${specialtyCategories.value[0] || '상품'} 설계 전문`,
      icon: 'mdi-shield-check-outline',
    },
    {
      title: '채널 선호 일치',
      description: `${getChannelLabel(detail.recommendation.consultationChannel)} 선호 고객과 일치`,
      icon: 'mdi-office-building-outline',
    },
  ]
})
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
    rejectErrorMessage.value = '반려 사유를 입력해 주세요.'
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
    assignErrorMessage.value = '지정할 설계사를 선택해 주세요.'
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
    handoverRequestId: source.handoverRequestId ?? route.params.handoverRequestId ?? '',
    requestType: source.requestType ?? 'VOLUNTARY',
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
      careerYears: source.recommendation?.careerYears ?? source.recommendation?.careerYear ?? null,
      organizationName: source.recommendation?.organizationName ?? source.recommendation?.branchName ?? '',
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
      recommendationPoints:
        source.recommendation?.recommendationPoints ??
        source.recommendation?.recommendationPointList ??
        source.recommendation?.recommendationPoint ??
        [],
      recommendationReason: source.recommendation?.recommendationReason ?? '',
      aiBriefing: source.recommendation?.aiBriefing ?? source.recommendation?.briefing ?? '',
      matchingReasons: normalizeMatchingReasons(
        source.recommendation?.matchingReasons ??
          source.recommendation?.matchingReasonList ??
          source.recommendation?.matchingReason ??
          source.matchingReasons,
      ),
      approvalStatus: source.recommendation?.approvalStatus ?? 'PENDING',
      rejectedFpName: source.recommendation?.rejectedFpName ?? '',
    },
    canApprove: source.canApprove ?? true,
  }
}

function createEmptyDetail() {
  return normalizeDetail()
}

function createSampleDetail() {
  return normalizeDetail({
    handoverRequestId: route.params.handoverRequestId,
    requestType: 'VOLUNTARY',
    requestStatus: 'MANAGER_PENDING',
    customer: {
      customerName: '윤주연',
      customerAge: 44,
      customerGrade: 'VIP',
      currentFpName: '이도진',
      contractSummary: '종신보험 1건',
      monthlyPremium: 230000,
      lastConsultedAt: '2026-05-10T10:00:00',
      mainConsultationChannel: 'MESSAGE',
    },
    handoverHistory: {},
    recommendation: {
      recommendedFpName: '조주림',
      careerYears: 6,
      organizationName: '세조지점',
      specialtyCategories: ['가족보장'],
      retentionRate: 80,
      preferredCustomerAge: 32,
      consultationChannel: 'PHONE',
      recommendationReason: '가족보장 상품 전문, 해당 고객과 유사 고객 관리 경험이 있어 적합합니다.',
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

function normalizeMatchingReasons(source) {
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((reason) => {
      const type = String(reason?.type ?? '').trim()
      const title = String(reason?.title ?? '').trim()
      const description = String(reason?.description ?? '').trim()

      return {
        type,
        title,
        description,
        icon: getMatchingReasonIcon(type, title),
      }
    })
    .filter((reason) => reason.title || reason.description)
}

function getMatchingReasonIcon(type, title = '') {
  const key = `${type} ${title}`.toUpperCase()

  if (key.includes('GRADE') || key.includes('등급')) {
    return 'mdi-medal-outline'
  }

  if (key.includes('AGE') || key.includes('연령') || key.includes('CUSTOMER')) {
    return 'mdi-account-multiple-outline'
  }

  if (key.includes('RETENTION') || key.includes('STABILITY') || key.includes('유지') || key.includes('안정')) {
    return 'mdi-shield-account-outline'
  }

  if (key.includes('PRODUCT') || key.includes('SPECIALTY') || key.includes('상품') || key.includes('전문')) {
    return 'mdi-shield-check-outline'
  }

  if (key.includes('CHANNEL') || key.includes('채널') || key.includes('상담')) {
    return 'mdi-office-building-outline'
  }

  return 'mdi-sparkles'
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

function splitRecommendationText(value) {
  if (!value) {
    return []
  }

  return String(value)
    .split(/\r?\n|[•·]/)
    .map((point) => point.trim())
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

  if ([USER_ROLES.HQ_MANAGER, USER_ROLES.SYSTEM_ADMIN].includes(authStore.userRole)) {
    return 'handover-monitoring'
  }

  return 'handover-requests'
}

function getStatusLabel(status) {
  const labels = {
    MANAGER_PENDING: '결재 대기',
    PENDING: '결재 대기',
    APPROVED: '승인 완료',
    REJECTED: '반려',
    COMPLETED: '완료',
  }

  return labels[status] || '결재 대기'
}

function getStatusClass(status) {
  if (['APPROVED', 'COMPLETED'].includes(status)) {
    return 'handover-detail-status--completed'
  }

  if (status === 'REJECTED') {
    return 'handover-detail-status--rejected'
  }

  return 'handover-detail-status--pending'
}

function getRequestTypeLabel(type) {
  const labels = {
    VOLUNTARY: '수동',
    RESIGNATION: '이직 자동',
    AUTO: '자동',
  }

  return labels[type] || type || '-'
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

  const normalizedValue = String(value)
  return normalizedValue.endsWith('대') ? normalizedValue : `${normalizedValue}대`
}
</script>

<style scoped>
.handover-detail {
  display: grid;
  gap: 16px;
  color: #111827;
}

.handover-detail__header {
  display: grid;
  gap: 14px;
}

.handover-detail__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.handover-detail h1 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
}

.handover-detail-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.handover-detail-status--pending {
  background: #fff7ed;
  color: #f97316;
}

.handover-detail-status--completed {
  background: #dcfce7;
  color: #16a34a;
}

.handover-detail-status--rejected {
  background: #fff0f0;
  color: #dc2626;
}

.handover-detail__body {
  display: grid;
  grid-template-columns: minmax(430px, 0.78fr) minmax(680px, 1.45fr);
  gap: 18px;
}

.handover-detail__left,
.handover-detail__right {
  display: grid;
  gap: 16px;
  align-content: start;
}

.handover-card,
.action-card {
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
}

.handover-card {
  padding: 16px 18px;
}

.handover-card h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.handover-card h2 .v-icon {
  color: #64748b;
}

.customer-summary {
  display: grid;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  overflow: hidden;
}

.summary-row {
  display: grid;
  border-bottom: 1px solid #eef2f7;
}

.summary-row:last-child {
  border-bottom: 0;
}

.summary-row--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-row--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-field {
  min-height: 78px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-right: 1px solid #eef2f7;
  background: #ffffff;
}

.summary-field:last-child {
  border-right: 0;
}

.summary-field .v-icon {
  color: #64748b;
}

.summary-field span {
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.summary-field strong {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.text-muted {
  color: #8a94a7 !important;
}

.grade-badge,
.channel-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.grade-badge {
  background: #ead7ff;
  color: #7d35ff;
}

.grade-badge--gold {
  background: #fff0d8;
  color: #d98a00;
}

.grade-badge--silver {
  background: #eef2f7;
  color: #64748b;
}

.channel-badge {
  background: #dcecff;
  color: #1277e9;
}

.history-card {
  min-height: 0;
}

.history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #686f7a;
  font-size: 13px;
}

.history-row strong {
  color: #111827;
  font-weight: 700;
}

.empty-history {
  min-height: 120px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  color: #686f7a;
  font-size: 13px;
}

.empty-history .v-icon {
  font-size: 58px !important;
  color: #93c5fd;
  filter: none;
}

.reject-banner {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 16px;
  padding: 8px 12px;
  border: 1px solid #ffc6c6;
  border-radius: 10px;
  background: #fff0f0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.recommended-panel {
  padding: 18px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #ffffff;
}

.recommended-fp {
  display: flex;
  align-items: center;
  gap: 16px;
}

.recommended-fp__avatar {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffd9c9, #fff0e7);
  color: #e65000;
  font-size: 18px;
  font-weight: 800;
  text-decoration: underline;
}

.recommended-fp strong,
.recommended-fp span {
  display: block;
}

.recommended-fp strong {
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.recommended-fp span {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.recommended-fp span b::before {
  content: "";
  display: inline-block;
  width: 1px;
  height: 16px;
  margin: 0 18px;
  vertical-align: -2px;
  background: #d8e0ec;
}

.match-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.match-card {
  min-height: 74px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  column-gap: 18px;
  row-gap: 3px;
  padding: 12px;
  border: 1px solid #edf1f7;
  border-radius: 10px;
  background: #f8fafc;
}

.match-card .v-icon {
  grid-row: span 2;
  justify-self: start;
  padding: 6px;
  border-radius: 999px;
  box-sizing: content-box;
  font-size: 22px !important;
}

.match-card span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.match-card strong {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.match-card--blue .v-icon {
  background: #eef7ff;
  color: #1677ff;
}

.match-card--green .v-icon {
  background: #eefaf2;
  color: #079447;
}

.match-card--green strong {
  color: #079447;
}

.match-card--purple .v-icon {
  background: #f5efff;
  color: #7442ff;
}

.recommendation-points {
  margin-top: 16px;
}

.recommendation-points strong {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.recommendation-points strong .v-icon {
  color: #2d7ff9;
}

.recommendation-points ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 8px 0 0;
  padding-left: 0;
  color: #686f7a;
  font-size: 13px;
  list-style-position: inside;
}

.ai-briefing {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  background: #f5f3ff;
}

.ai-briefing__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ddd6fe;
}

.ai-briefing__header div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-briefing__header .v-icon {
  color: #8b5cf6;
}

.ai-briefing__header strong {
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.ai-briefing__header span {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f0e4ff;
  color: #7a3df0;
  font-size: 12px;
  font-weight: 800;
}

.ai-briefing__header p {
  margin: 0;
  color: #8b5cf6;
  font-size: 12px;
}

.ai-briefing__body {
  padding: 12px 0 0;
}

.ai-briefing__body > p {
  margin: 0;
  color: #312e81;
  font-size: 13px;
  line-height: 1.75;
}

.briefing-evidence {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.evidence-card {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 10px;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
}

.evidence-card .v-icon {
  color: #1389ff;
}

.evidence-card strong,
.evidence-card span {
  display: block;
}

.evidence-card strong {
  color: #111827;
  font-size: 12px;
  font-weight: 700;
}

.evidence-card span {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.action-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 18px;
}

.action-card button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 10px;
  background: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  cursor: pointer;
}

.action-card button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.approval-actions__approve {
  border: 1px solid #f97316;
  background: #f97316 !important;
  color: #ffffff;
  box-shadow: none;
}

.approval-actions__reject {
  border: 1px solid #fecaca;
  color: #ef4444;
}

.approval-actions__assign {
  border: 1px solid #d8dce3;
  color: #6f7680;
}

.handover-detail-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #526079;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
}

.modal__panel {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.modal__panel--small {
  width: min(440px, 100%);
}

.modal__panel--large {
  width: min(760px, 100%);
}

.modal__header,
.modal__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal__header h2 {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.modal__header button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #f5f6f8;
  color: #526079;
  cursor: pointer;
}

.modal textarea {
  width: 100%;
  resize: vertical;
  padding: 12px;
  border: 1px solid #d8dce3;
  border-radius: 10px;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

.modal textarea:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

.modal__error {
  margin: 0;
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
}

.modal__actions {
  justify-content: flex-end;
}

.modal__actions button {
  min-width: 78px;
  min-height: 40px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  cursor: pointer;
}

.modal__cancel {
  border: 1px solid #d8dce3;
  background: #ffffff;
  color: #526079;
}

.modal__submit {
  border: 1px solid #f97316;
  background: #f97316;
  color: #ffffff;
}

.modal__submit--danger {
  border-color: #ef4444;
  background: #ef4444;
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
  border: 1px solid #edf1f7;
  border-radius: 10px;
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
  color: #111827;
  font-size: 14px;
  font-weight: 700;
}

.assign-fp-row__main small {
  margin-top: 4px;
  color: #526079;
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
  min-height: 24px;
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
  color: #526079;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .handover-detail__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .summary-row--three,
  .summary-row--two,
  .match-grid,
  .briefing-evidence,
  .action-card {
    grid-template-columns: 1fr;
  }

  .summary-field {
    border-right: 0;
    border-bottom: 1px solid #e1e7f0;
  }

  .summary-row:last-child .summary-field:last-child {
    border-bottom: 0;
  }

  .recommended-fp {
    align-items: flex-start;
  }

  .recommended-fp__avatar {
    width: 76px;
    height: 76px;
    font-size: 24px;
  }

  .recommended-fp strong {
    font-size: 24px;
  }

  .ai-briefing__header {
    align-items: flex-start;
    flex-direction: column;
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

