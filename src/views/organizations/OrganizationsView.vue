<template>
  <section class="organizations-page">
    <header class="page-header" :class="{ 'page-header--compact': mode === 'branches' || mode === 'fps' }">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDescription }}</p>
      </div>

    </header>

    <template v-if="mode === 'chart'">
      <div class="organization-workspace">
        <section class="organization-tree-panel panel" aria-label="조직 구조">
          <div class="organization-tree-panel__header">
            <div class="tree-title">
              <span class="mdi mdi-family-tree" aria-hidden="true"></span>
              <strong>조직 구조</strong>
            </div>
            <button class="tree-collapse-button" type="button" aria-label="조직 구조 접기">
              <span class="mdi mdi-chevron-up" aria-hidden="true"></span>
              <span class="mdi mdi-chevron-down" aria-hidden="true"></span>
            </button>
          </div>

          <LoadingState v-if="isOrganizationLoading" compact message="조직 정보를 불러오고 있습니다." />
          <ErrorState v-else-if="organizationError" :message="organizationError" />
          <EmptyState v-else-if="organizationRows.length === 0" compact message="조회된 조직 정보가 없습니다." />

          <nav v-else class="organization-tree" aria-label="조직 계층 구조">
            <div
              v-for="root in organizationRoots"
              :key="root.id"
              class="organization-tree__root"
            >
              <button
                class="tree-root-button"
                type="button"
                :class="{ active: selectedOrganizationId === root.id }"
                :aria-expanded="expandedOrganizationIds.includes(root.id)"
                @click="selectHeadquarters(root)"
              >
                <span
                  class="mdi"
                  :class="expandedOrganizationIds.includes(root.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                  aria-hidden="true"
                ></span>
                <span class="mdi mdi-office-building-outline" aria-hidden="true"></span>
                <span>
                  {{ root.organizationName }}
                  <small>(Headquarters)</small>
                </span>
              </button>

              <div
                v-if="root.children?.length && expandedOrganizationIds.includes(root.id)"
                class="tree-children"
              >
                <button
                  v-for="branch in root.children"
                  :key="branch.id"
                  class="tree-child-button"
                  type="button"
                  :class="{
                    active: selectedOrganizationId === branch.id,
                    limited: isOrganizationLimited(branch),
                  }"
                  @click="selectBranchOrganization(branch)"
                >
                  {{ branch.organizationName }}
                </button>
              </div>
            </div>
          </nav>
        </section>

        <section class="organization-list panel">
          <div class="organization-list__header">
            <div>
              <h3>구성원 목록</h3>
              <p>{{ selectedOrganizationLabel }}</p>
            </div>
            <div class="organization-list__tools">
              <span>
                전체 <strong>{{ formatCount(organizationMemberTotalElements) }}명</strong>
              </span>
            </div>
          </div>

          <form
            class="organization-member-filters"
            :class="{ 'organization-member-filters--restricted': !canAccessAllOrganizations }"
            @submit.prevent="searchOrganizationMembers"
          >
            <label class="field">
              <span>이름</span>
              <input
                v-model.trim="organizationMemberFilters.keyword"
                type="search"
                placeholder="이름 검색"
                @keyup.enter="searchOrganizationMembers"
              />
            </label>
            <label v-if="canAccessAllOrganizations" class="field">
              <span>지점명</span>
              <input
                v-model.trim="organizationMemberFilters.branchKeyword"
                type="search"
                placeholder="지점명 검색"
                @keyup.enter="searchOrganizationMembers"
              />
            </label>
            <label v-if="canAccessAllOrganizations" class="field">
              <span>지점</span>
              <select
                v-model="organizationMemberFilters.organizationId"
                @change="changeOrganizationMemberBranchFilter"
              >
                <option value="">전체 지점</option>
                <option
                  v-for="branch in organizationBranchRows"
                  :key="branch.id"
                  :value="branch.id"
                >
                  {{ branch.organizationName }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>정렬</span>
              <select v-model="organizationMemberFilters.sort" @change="searchOrganizationMembers">
                <option
                  v-for="option in organizationMemberSortOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <div class="organization-member-filter-actions">
              <button class="button button--secondary" type="button" @click="resetOrganizationMemberFilters">
                초기화
              </button>
              <button class="button button--primary" type="submit">
                조회
              </button>
            </div>
          </form>

          <div v-if="selectedBranchSummary" class="branch-summary-strip">
            <div class="branch-summary-strip__main">
              <strong>{{ selectedBranchSummary.organizationName }}</strong>
              <span>{{ selectedBranchSummary.organizationCode }}</span>
            </div>
            <StatusBadge :status="selectedBranchSummary.organizationStatus" />
            <div class="branch-summary-strip__meta">
              <span>{{ selectedBranchSummary.organizationAddress || '-' }}</span>
              <span>{{ selectedBranchSummary.organizationPhone || '-' }}</span>
            </div>
          </div>

          <template v-if="!isSelectedBranchSummaryOnly">
            <LoadingState v-if="isOrganizationMembersLoading" message="구성원 목록을 불러오고 있습니다." />
            <ErrorState v-else-if="organizationMembersError" :message="organizationMembersError" />
            <div v-else class="table-scroll table-scroll--flush organization-member-table">
              <table>
                <colgroup>
                  <col class="member-col--name" />
                  <col class="member-col--branch" />
                  <col class="member-col--role" />
                  <col class="member-col--code" />
                  <col class="member-col--email" />
                  <col class="member-col--phone" />
                  <col class="member-col--status" />
                </colgroup>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>소속 지점</th>
                    <th>역할</th>
                    <th>사번 또는 코드</th>
                    <th>이메일</th>
                    <th>전화번호</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="member in organizationMemberRows"
                    :key="member.id"
                    :class="{ 'clickable-row': isClickableFpMember(member) }"
                    @click="goToOrganizationMemberDetail(member)"
                  >
                    <td><strong>{{ member.userName }}</strong></td>
                    <td>{{ member.organizationName }}</td>
                    <td>{{ getRoleLabel(member.userRole) }}</td>
                    <td>{{ member.empCode || '-' }}</td>
                    <td>{{ member.email || '-' }}</td>
                    <td>{{ member.phone || '-' }}</td>
                    <td><StatusBadge :status="member.userStatus" /></td>
                  </tr>
                  <tr v-if="organizationMemberRows.length === 0">
                    <td colspan="7">
                      <EmptyState compact message="조회된 구성원이 없습니다." />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="organization-pagination">
              <span>총 {{ formatCount(organizationMemberTotalElements) }}건</span>
              <v-pagination
                :model-value="organizationMemberFilters.page"
                :length="organizationMemberTotalPages"
                total-visible="7"
                rounded="circle"
                @update:model-value="changeOrganizationMemberPage"
              />
            </div>
          </template>
        </section>
      </div>
    </template>

    <template v-else-if="mode === 'branches'">
      <section class="panel organization-list-panel">
        <div class="panel__header">
          <div>
            <h3>지점 목록</h3>
            <p>FP 검색 필터에서 사용하는 지점 목록입니다.</p>
          </div>
        </div>

        <LoadingState v-if="isBranchesLoading" message="지점 목록을 불러오고 있습니다." />
        <ErrorState v-else-if="branchesError" :message="branchesError" />
        <EmptyState v-else-if="branches.length === 0" message="조회된 지점이 없습니다." />
        <div v-else class="table-scroll organization-table-scroll">
          <table>
            <thead>
              <tr>
                <th>지점명</th>
                <th>지점장명</th>
                <th>지점 코드</th>
                <th>주소</th>
                <th>전화번호</th>
                <th>상태</th>
                <th>설계사 수</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branches" :key="branch.organizationId">
                <td>{{ branch.organizationName }}</td>
                <td>{{ getBranchManagerName(branch) }}</td>
                <td>{{ branch.organizationCode }}</td>
                <td>{{ branch.organizationAddress || '-' }}</td>
                <td>{{ branch.organizationPhone || '-' }}</td>
                <td><StatusBadge :status="branch.organizationStatus" /></td>
                <td>{{ formatNullableCount(getBranchAdvisorCount(branch)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-else-if="mode === 'fps'">
      <section class="panel organization-filter-panel">
        <div
          class="filter-grid"
          :class="{ 'filter-grid--restricted-fp': !canAccessAllOrganizations }"
        >
          <label class="field">
            <span>검색어</span>
            <input
              v-model.trim="fpFilters.keyword"
              type="search"
              placeholder="이름 검색"
              @keyup.enter="searchFps"
            />
          </label>
          <label v-if="canAccessAllOrganizations" class="field">
            <span>지점</span>
            <select v-model="fpFilters.organizationId">
              <option value="">전체 지점</option>
              <option
                v-for="branch in branches"
                :key="branch.organizationId"
                :value="branch.organizationId"
              >
                {{ branch.organizationName }} ({{ branch.organizationCode }})
              </option>
            </select>
          </label>
          <label class="field">
            <span>정렬</span>
            <select v-model="fpFilters.sort" @change="searchFps">
              <option
                v-for="option in fpSortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <div class="organization-filter-actions">
            <button class="button button--secondary" type="button" @click="resetFpFilters">
              초기화
            </button>
            <button class="button button--primary" type="button" @click="loadFps">
              조회
            </button>
          </div>
        </div>
      </section>

      <section class="panel organization-list-panel">
        <div class="panel__header">
          <div>
            <h3>FP 목록</h3>
            <p>총 {{ formatCount(fpPage.totalElements) }}명의 FP가 조회되었습니다.</p>
          </div>
        </div>

        <LoadingState v-if="isFpsLoading" message="FP 목록을 불러오고 있습니다." />
        <ErrorState v-else-if="fpsError" :message="fpsError" />
        <EmptyState v-else-if="fpPage.content.length === 0" message="조회된 FP가 없습니다." />
        <template v-else>
          <div class="table-scroll organization-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>사번</th>
                  <th>소속 지점</th>
                  <th>전화번호</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th v-if="canResignFp" class="table-action-cell">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fp in fpPage.content"
                  :key="fp.id"
                >
                  <td><strong>{{ fp.userName }}</strong></td>
                  <td>{{ fp.empCode || '-' }}</td>
                  <td>{{ fp.organizationName }}</td>
                  <td>{{ fp.phone || '-' }}</td>
                  <td>{{ fp.email || '-' }}</td>
                  <td><StatusBadge :status="fp.userStatus" /></td>
                  <td v-if="canResignFp" class="table-action-cell">
                    <button
                      class="table-action-button table-action-button--danger"
                      type="button"
                      :disabled="isResignedFp(fp)"
                      @click.stop="openResignModal(fp, $event)"
                    >
                      {{ getResignButtonLabel(fp) }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="organization-pagination">
            <span>총 {{ formatCount(fpPage.totalElements) }}건</span>
            <v-pagination
              :model-value="fpPage.page"
              :length="Math.max(fpPage.totalPages, 1)"
              total-visible="7"
              rounded="circle"
              @update:model-value="changeFpPage"
            />
          </div>
        </template>
      </section>
    </template>

    <template v-else>
      <section class="panel organization-detail-panel">
        <div class="detail-toolbar">
          <button v-if="!isFpMyPage" class="button button--secondary" type="button" @click="goToFpList">
            목록으로
          </button>
          <v-text-field
            v-model="detailClosingMonth"
            type="month"
            label="기준월"
            variant="outlined"
            density="comfortable"
            hide-details
            :max="latestAvailableClosingMonth"
            class="organization-month-field organization-month-field--detail"
            @update:model-value="reloadCurrentFpDetail"
          />
        </div>

        <LoadingState v-if="isFpDetailLoading" message="FP 상세 정보를 불러오고 있습니다." />
        <ErrorState v-else-if="fpDetailError" :message="fpDetailError" />
        <EmptyState v-else-if="!fpDetail" message="FP 상세 정보가 없습니다." />
        <template v-else>
          <div class="fp-profile">
            <div class="fp-profile__avatar">{{ fpDetail.fpName?.slice(0, 1) || '-' }}</div>
            <div class="fp-profile__content">
              <h3>{{ fpDetail.fpName }}</h3>
              <p>{{ fpDetail.empCode }} · {{ fpDetail.organizationName }}</p>
              <dl>
                <div>
                  <dt>연락처</dt>
                  <dd>{{ fpDetail.phone || '-' }}</dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{{ fpDetail.email || '-' }}</dd>
                </div>
                <div>
                  <dt>입사일</dt>
                  <dd>{{ formatDate(fpDetail.hireDate) }}</dd>
                </div>
              </dl>
            </div>
            <button
              v-if="canResignFp && !isFpMyPage"
              class="button button--danger fp-profile__action"
              type="button"
              :disabled="isResignedFp(fpDetail)"
              @click="openResignModal(fpDetail, $event)"
            >
              {{ getResignButtonLabel(fpDetail) }}
            </button>
          </div>

          <div v-if="fpDetail.performanceSummary" class="summary-grid">
            <article class="summary-card">
              <span class="summary-card__label">유지 계약 총 수</span>
              <strong class="summary-card__value">
                {{ formatCount(fpDetail.performanceSummary.completedContractCount) }}<small>건</small>
              </strong>
              <p v-if="getPerformanceChangeLabel(fpDetail.performanceSummary)" class="summary-card__trend">
                {{ getPerformanceChangeLabel(fpDetail.performanceSummary) }}
              </p>
            </article>
            <article class="summary-card">
              <span class="summary-card__label">이달의 신규 계약</span>
              <strong class="summary-card__value">
                {{ formatCount(fpDetail.performanceSummary.newContractCount) }}<small>건</small>
              </strong>
            </article>
            <article class="summary-card">
              <span class="summary-card__label">계약 유지율</span>
              <strong class="summary-card__value">
                {{ formatPercent(fpDetail.performanceSummary.retentionRate) }}
              </strong>
            </article>
            <article class="summary-card summary-card--rank">
              <div class="rank-metric">
                <span class="summary-card__label">전 지점 순위</span>
                <strong class="summary-card__value">
                  {{ formatCount(fpDetail.performanceSummary.totalRank) }}<small>등</small>
                </strong>
              </div>
              <div class="rank-divider" aria-hidden="true"></div>
              <div class="rank-metric">
                <span class="summary-card__label">지점 내 순위</span>
                <strong class="summary-card__value summary-card__value--rank-highlight">
                  <span class="mdi mdi-crown" aria-hidden="true"></span>
                  {{ formatCount(fpDetail.performanceSummary.branchRank) }}<small>등</small>
                </strong>
              </div>
            </article>
          </div>
          <EmptyState v-else message="해당 기준월 성과 데이터가 없습니다." compact />
        </template>
      </section>

      <section class="panel organization-list-panel">
        <div class="panel__header">
          <div>
            <h3>{{ isFpMyPage ? '내 계약 목록' : 'FP 계약 목록' }}</h3>
            <p>{{ isFpMyPage ? '내가 담당하는 계약 목록입니다.' : '해당 FP가 담당하는 계약 목록입니다.' }}</p>
          </div>
        </div>

        <LoadingState v-if="isContractsLoading" message="계약 목록을 불러오고 있습니다." />
        <ErrorState v-else-if="contractsError" :message="contractsError" />
        <EmptyState v-else-if="contractPage.content.length === 0" message="조회된 계약이 없습니다." />
        <template v-else>
          <div class="table-scroll organization-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>고객명</th>
                  <th>보험유형</th>
                  <th>보험사</th>
                  <th>계약일</th>
                  <th>월 보험료</th>
                  <th>계약상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contract in contractPage.content" :key="getContractKey(contract)">
                  <td>{{ contract.customerName }}</td>
                  <td>{{ contract.insuranceType }}</td>
                  <td>{{ contract.insuranceCompany }}</td>
                  <td>{{ formatDate(contract.contractDate) }}</td>
                  <td>{{ formatCurrency(contract.monthlyPremium) }}</td>
                  <td><StatusBadge :status="contract.contractStatus" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="organization-pagination">
            <span>총 {{ formatCount(contractPage.totalElements) }}건</span>
            <v-pagination
              :model-value="contractPage.page"
              :length="Math.max(contractPage.totalPages, 1)"
              total-visible="7"
              rounded="circle"
              @update:model-value="changeContractPage"
            />
          </div>
        </template>
      </section>
    </template>

    <v-alert
      v-if="resignNoticeMessage"
      :type="resignNoticeType"
      variant="tonal"
      density="comfortable"
      class="termination-alert"
    >
      {{ resignNoticeMessage }}
    </v-alert>

    <div
      v-if="isResignModalOpen"
      class="termination-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="termination-modal-title"
    >
      <div class="termination-modal__backdrop" @click="closeResignModal"></div>
      <form
        ref="resignModalPanel"
        class="termination-modal__panel"
        tabindex="-1"
        @keydown="handleResignModalKeydown"
        @submit.prevent="submitResignFp"
      >
        <header class="termination-modal__header">
          <div>
            <h3 id="termination-modal-title">설계사 해촉 처리</h3>
            <p>해촉 처리 전 설계사 정보를 확인하세요. 해촉일은 오늘 날짜로 처리됩니다.</p>
          </div>
          <button type="button" aria-label="해촉 처리 창 닫기" @click="closeResignModal">
            <span class="mdi mdi-close" aria-hidden="true"></span>
          </button>
        </header>

        <v-alert
          v-if="resignErrorMessage"
          type="error"
          variant="tonal"
          density="comfortable"
        >
          {{ resignErrorMessage }}
        </v-alert>

        <v-alert
          v-if="resignResult"
          type="success"
          variant="tonal"
          density="comfortable"
        >
          해촉 처리가 완료되었습니다. 자동 생성된 인수인계 요청
          {{ formatCount(resignResult.handoverRequestCount) }}건
        </v-alert>

        <dl class="termination-summary">
          <div>
            <dt>설계사명</dt>
            <dd>{{ selectedResignFpName }}</dd>
          </div>
          <div>
            <dt>사번</dt>
            <dd>{{ selectedResignFp?.empCode || '-' }}</dd>
          </div>
          <div>
            <dt>소속 지점</dt>
            <dd>{{ selectedResignFp?.organizationName || '-' }}</dd>
          </div>
          <div>
            <dt>담당 고객 수</dt>
            <dd>{{ formatNullableCount(selectedResignCustomerCount) }}</dd>
          </div>
          <div>
            <dt>보유 계약 수</dt>
            <dd>{{ formatNullableCount(selectedResignContractCount) }}</dd>
          </div>
        </dl>

        <p class="termination-notice">
          해촉 처리 시 오늘 날짜 기준으로 담당 고객에 대한 인수인계 요청이 자동 생성됩니다.
        </p>

        <div class="termination-modal__actions">
          <button
            v-if="resignResult"
            class="button button--secondary"
            type="button"
            @click="goToResignationHandovers"
          >
            인수인계 목록 보기
          </button>
          <button
            class="button button--secondary"
            type="button"
            :disabled="isResignSubmitting"
            @click="closeResignModal"
          >
            {{ resignResult ? '닫기' : '취소' }}
          </button>
          <button
            v-if="!resignResult"
            class="button button--danger"
            type="submit"
            :disabled="isResignSubmitting"
          >
            {{ isResignSubmitting ? '처리 중...' : '해촉 처리' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getOrganizationFpContracts,
  getOrganizationFpDetail,
  getMyOrganizationFpContracts,
  getMyOrganizationFpDetail,
  getOrganizationMembers,
  getOrganizations,
  getOrganizationsBranches,
  resignOrganizationFp,
} from '../../api/organizations'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  mode: {
    type: String,
    default: 'chart',
    validator(value) {
      return ['chart', 'branches', 'fps', 'fp-detail', 'fp-my-page'].includes(value)
    },
  },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const organizations = ref([])
const branches = ref([])
const fpPage = ref(createEmptyPage(10))
const fpDetail = ref(null)
const contractPage = ref(createEmptyPage(10))
const selectedResignFp = ref(null)
const resignResult = ref(null)
const resignModalPanel = ref(null)
const resignModalTrigger = ref(null)

const isOrganizationLoading = ref(false)
const isOrganizationMembersLoading = ref(false)
const isBranchesLoading = ref(false)
const isFpsLoading = ref(false)
const isFpDetailLoading = ref(false)
const isContractsLoading = ref(false)
const isResignModalOpen = ref(false)
const isResignSubmitting = ref(false)

const organizationError = ref('')
const organizationMembersError = ref('')
const branchesError = ref('')
const fpsError = ref('')
const fpDetailError = ref('')
const contractsError = ref('')
const resignErrorMessage = ref('')
const resignNoticeMessage = ref('')
const resignNoticeType = ref('success')

const organizationStatus = ref('')
const organizationListPage = ref(1)
const organizationListSize = 5
const selectedOrganizationId = ref('')
const selectedOrganizationType = ref('')
const expandedOrganizationIds = ref([])
const detailClosingMonth = ref(getLatestAvailableClosingMonth())
const organizationMembersPage = ref(createEmptyPage(10))

const organizationMemberFilters = reactive({
  page: 1,
  size: 10,
  keyword: '',
  branchKeyword: '',
  organizationId: '',
  sort: 'ROLE_ASC',
})

const fpFilters = reactive({
  page: 1,
  size: 10,
  keyword: '',
  organizationId: '',
  sort: 'NAME_ASC',
})

const contractFilters = reactive({
  page: 1,
  size: 10,
})

const organizationStatusOptions = [
  { label: '전체', value: '' },
  { label: '활성', value: 'ACTIVE' },
  { label: '비활성', value: 'INACTIVE' },
]

const organizationMemberSortOptions = [
  { label: '역할순', value: 'ROLE_ASC' },
  { label: '이름 오름차순', value: 'NAME_ASC' },
  { label: '이름 내림차순', value: 'NAME_DESC' },
  { label: '지점명순', value: 'BRANCH_ASC' },
  { label: '사번순', value: 'EMP_CODE_ASC' },
]

const fpSortOptions = [
  { label: '이름 오름차순', value: 'NAME_ASC' },
  { label: '이름 내림차순', value: 'NAME_DESC' },
  { label: '지점명순', value: 'BRANCH_ASC' },
  { label: '사번순', value: 'EMP_CODE_ASC' },
]

const latestAvailableClosingMonth = computed(() => getLatestAvailableClosingMonth())
const canResignFp = computed(() => authStore.userRole === USER_ROLES.BRANCH_MANAGER)
const canAccessAllOrganizations = computed(() => (
  authStore.userRole === USER_ROLES.SYSTEM_ADMIN ||
  authStore.userRole === USER_ROLES.HQ_MANAGER
))
const isFpMyPage = computed(() => props.mode === 'fp-my-page')

const selectedResignFpName = computed(() => (
  selectedResignFp.value?.fpName
  ?? selectedResignFp.value?.userName
  ?? '-'
))

const selectedResignCustomerCount = computed(() => (
  selectedResignFp.value?.customerCount
  ?? null
))

const selectedResignContractCount = computed(() => (
  selectedResignFp.value?.contractCount
  ?? null
))

const pageTitle = computed(() => {
  if (props.mode === 'chart') return '조직도 조회'
  if (props.mode === 'branches') return '지점 목록 조회'
  if (props.mode === 'fps' && selectedFpBranchName.value) return `${selectedFpBranchName.value} 설계사 목록`
  if (props.mode === 'fps') return 'FP 목록'
  if (props.mode === 'fp-my-page') return '마이 페이지'
  return 'FP 상세'
})

const pageDescription = computed(() => {
  if (props.mode === 'chart') return 'Relia 전체 조직도를 조회합니다.'
  if (props.mode === 'branches') return '지점 선택에 사용하는 조직 목록입니다.'
  if (props.mode === 'fps' && selectedFpBranchName.value) {
    return `${selectedFpBranchName.value}에 소속된 설계사 목록을 조회합니다.`
  }
  if (props.mode === 'fps') return '검색 조건으로 FP 실적 목록을 조회합니다.'
  if (props.mode === 'fp-my-page') return '내 기본 정보와 성과 정보를 조회합니다.'
  return 'FP 기본 정보, 성과 요약, 계약 목록을 조회합니다.'
})

const organizationRoots = computed(() => (
  organizations.value.map((organization) => ({
    ...organization,
    children: filterOrganizationsByStatus(Array.isArray(organization.children) ? organization.children : []),
  }))
))
const organizationRows = computed(() => flattenOrganizations(organizations.value))
const organizationBranchRows = computed(() => (
  organizationRows.value.filter((organization) => organization.organizationType === 'BRANCH')
))
const currentUserOrganizationName = computed(() => (
  authStore.organizationName || authStore.user?.organizationName || ''
))
const organizationMemberRows = computed(() => organizationMembersPage.value.content ?? [])
const organizationMemberTotalPages = computed(() => (
  Math.max(Number(organizationMembersPage.value.totalPages ?? 0), 1)
))
const organizationMemberTotalElements = computed(() => (
  Number(organizationMembersPage.value.totalElements ?? organizationMemberRows.value.length)
))
const selectedBranchOrganization = computed(() => (
  organizationBranchRows.value.find((organization) => String(organization.id) === String(selectedOrganizationId.value)) ?? null
))
const isSelectedBranchSummaryOnly = computed(() => (
  !canAccessAllOrganizations.value &&
  selectedOrganizationType.value === 'BRANCH' &&
  Boolean(selectedBranchOrganization.value) &&
  !isCurrentUserBranch(selectedBranchOrganization.value)
))
const selectedOrganizationLabel = computed(() => {
  const effectiveOrganizationId = organizationMemberFilters.organizationId || selectedOrganizationId.value
  const selected = organizationRows.value.find((organization) => String(organization.id) === String(effectiveOrganizationId))

  if (selected?.organizationType === 'BRANCH') {
    return `${selected.organizationName} 구성원`
  }

  return '전체 구성원'
})
const selectedBranchSummary = computed(() => {
  const organizationId = organizationMemberFilters.organizationId || (
    selectedOrganizationType.value === 'BRANCH' ? selectedOrganizationId.value : ''
  )

  if (!organizationId) return null

  return branches.value.find((branch) => String(branch.organizationId) === String(organizationId)) ||
    organizationBranchRows.value.find((branch) => String(branch.id) === String(organizationId)) ||
    null
})

const filteredOrganizationRows = computed(() => {
  const selectedOrganization = organizationRows.value.find((organization) => organization.id === selectedOrganizationId.value)
  const scopedRows = selectedOrganization && selectedOrganization.organizationType !== 'HQ'
    ? [selectedOrganization]
    : organizationRows.value

  return organizationStatus.value
    ? scopedRows.filter((organization) => organization.organizationStatus === organizationStatus.value)
    : scopedRows
})

const organizationListTotalPages = computed(() => (
  Math.max(Math.ceil(filteredOrganizationRows.value.length / organizationListSize), 1)
))

const paginatedOrganizationRows = computed(() => {
  const start = (organizationListPage.value - 1) * organizationListSize
  return filteredOrganizationRows.value.slice(start, start + organizationListSize)
})

const selectedFpBranchName = computed(() => {
  if (!fpFilters.organizationId) return ''

  const branch = branches.value.find((item) => String(item.organizationId) === String(fpFilters.organizationId))
  return branch?.organizationName ?? normalizeQueryValue(route.query.organizationName)
})

watch(
  () => props.mode,
  () => initializePage(),
)

watch(organizationListTotalPages, (totalPages) => {
  if (organizationListPage.value > totalPages) {
    organizationListPage.value = totalPages
  }
})

watch(organizationMemberTotalPages, (totalPages) => {
  if (organizationMemberFilters.page > totalPages) {
    organizationMemberFilters.page = totalPages
  }
})

onMounted(() => {
  initializePage()
})

onBeforeUnmount(() => {
  resignModalTrigger.value = null
})

async function initializePage() {
  if (props.mode === 'chart') {
    await loadOrganizationChart()
    return
  }

  if (props.mode === 'branches') {
    await loadBranches()
    return
  }

  if (props.mode === 'fps') {
    applyFpFiltersFromQuery()
    await Promise.all([loadBranches(), loadFps()])
    return
  }

  if (props.mode === 'fp-my-page') {
    await loadMyFpDetail()
    return
  }

  await reloadFpDetail()
}

async function loadOrganizationChart() {
  await loadOrganizations()
  await loadBranches()

  if (applyOrganizationSelectionFromQuery()) {
    await loadOrganizationMembers()
    return
  }

  await loadOrganizationMembers()
}

async function loadOrganizations() {
  organizationError.value = ''
  isOrganizationLoading.value = true

  try {
    organizations.value = await getOrganizations()
    organizationListPage.value = 1
    branches.value = organizationBranchRows.value.map(normalizeBranch)
    expandedOrganizationIds.value = collectExpandableOrganizationIds(organizations.value)
    applyDefaultSelectedOrganization()
  } catch {
    organizations.value = []
    selectedOrganizationId.value = ''
    selectedOrganizationType.value = ''
    expandedOrganizationIds.value = []
    organizationError.value = '조직 정보를 불러오지 못했습니다.'
  } finally {
    isOrganizationLoading.value = false
  }
}

async function loadOrganizationMembers() {
  if (isSelectedBranchSummaryOnly.value) {
    organizationMembersPage.value = createEmptyPage(organizationMemberFilters.size)
    organizationMembersError.value = ''
    isOrganizationMembersLoading.value = false
    return
  }

  organizationMembersError.value = ''
  isOrganizationMembersLoading.value = true

  try {
    organizationMembersPage.value = normalizePageResponse(
      await getOrganizationMembers(buildOrganizationMemberParams()),
      organizationMemberFilters,
    )
  } catch {
    organizationMembersPage.value = createEmptyPage(organizationMemberFilters.size)
    organizationMembersError.value = '구성원 목록을 불러오지 못했습니다.'
  } finally {
    isOrganizationMembersLoading.value = false
  }
}

function buildOrganizationMemberParams() {
  const params = {
    page: organizationMemberFilters.page,
    size: organizationMemberFilters.size,
    sort: organizationMemberFilters.sort || 'ROLE_ASC',
    ...(organizationMemberFilters.keyword ? { keyword: organizationMemberFilters.keyword } : {}),
    ...(canAccessAllOrganizations.value && organizationMemberFilters.branchKeyword
      ? { branchKeyword: organizationMemberFilters.branchKeyword }
      : {}),
  }

  const organizationId = resolveMemberOrganizationId()
  if (organizationId) {
    params.organizationId = organizationId
  }

  return params
}

function resolveMemberOrganizationId() {
  if (!canAccessAllOrganizations.value) {
    return findCurrentUserBranch()?.id || ''
  }

  if (organizationMemberFilters.organizationId) {
    return organizationMemberFilters.organizationId
  }

  if (selectedOrganizationType.value === 'BRANCH') {
    return selectedOrganizationId.value
  }

  return ''
}

async function loadBranches() {
  branchesError.value = ''
  isBranchesLoading.value = true

  try {
    const branchOptions = await getOrganizationsBranches()
    if (branchOptions.length > 0) {
      branches.value = branchOptions.map(normalizeBranch)
      return
    }

    const organizationTree = await getOrganizations()
    const branchNodes = flattenOrganizations(organizationTree)
      .filter((organization) => organization.organizationType === 'BRANCH')

    if (branchNodes.length > 0) {
      branches.value = branchNodes.map(normalizeBranch)
      return
    }

    branches.value = []
  } catch {
    branches.value = []
    branchesError.value = '지점 목록을 불러오지 못했습니다.'
  } finally {
    isBranchesLoading.value = false
  }
}

async function loadFps() {
  fpsError.value = ''
  isFpsLoading.value = true

  try {
    fpPage.value = normalizePageResponse(
      await getOrganizationMembers(buildFpParams()),
      fpFilters,
    )
  } catch {
    fpPage.value = createEmptyPage(fpFilters.size)
    fpsError.value = 'FP 목록을 불러오지 못했습니다.'
  } finally {
    isFpsLoading.value = false
  }
}

async function reloadFpDetail() {
  const fpId = route.params.fpId

  if (!fpId) {
    fpDetail.value = null
    contractPage.value = createEmptyPage(contractFilters.size)
    return
  }

  await Promise.all([loadFpDetail(String(fpId)), loadFpContracts(String(fpId))])
}

async function reloadCurrentFpDetail() {
  if (isFpMyPage.value) {
    await loadMyFpDetail()
    return
  }

  await reloadFpDetail()
}

async function loadFpDetail(fpId) {
  fpDetailError.value = ''
  isFpDetailLoading.value = true

  try {
    fpDetail.value = await getOrganizationFpDetail(fpId, buildDetailParams())
  } catch {
    fpDetail.value = null
    fpDetailError.value = 'FP 상세 정보를 불러오지 못했습니다.'
  } finally {
    isFpDetailLoading.value = false
  }
}

async function loadFpContracts(fpId) {
  contractsError.value = ''
  isContractsLoading.value = true

  try {
    contractPage.value = await getOrganizationFpContracts(fpId, contractFilters)
  } catch {
    contractPage.value = createEmptyPage(contractFilters.size)
    contractsError.value = '계약 목록을 불러오지 못했습니다.'
  } finally {
    isContractsLoading.value = false
  }
}

async function loadMyFpContracts() {
  contractsError.value = ''
  isContractsLoading.value = true

  try {
    contractPage.value = await getMyOrganizationFpContracts(contractFilters)
  } catch {
    contractPage.value = createEmptyPage(contractFilters.size)
    contractsError.value = '계약 목록을 불러오지 못했습니다.'
  } finally {
    isContractsLoading.value = false
  }
}

function buildFpParams() {
  return {
    page: fpFilters.page,
    size: fpFilters.size,
    role: USER_ROLES.FP,
    sort: fpFilters.sort || 'NAME_ASC',
    ...(fpFilters.keyword ? { keyword: fpFilters.keyword } : {}),
    ...(fpFilters.organizationId ? { organizationId: fpFilters.organizationId } : {}),
  }
}

async function loadMyFpDetail() {
  fpDetailError.value = ''
  isFpDetailLoading.value = true
  contractPage.value = createEmptyPage(contractFilters.size)
  const contractsPromise = loadMyFpContracts()

  try {
    fpDetail.value = await getMyOrganizationFpDetail(buildDetailParams())
  } catch (error) {
    fpDetail.value = null
    fpDetailError.value = getMyFpDetailErrorMessage(error)
  } finally {
    isFpDetailLoading.value = false
  }

  await contractsPromise
}

function applyOrganizationSelectionFromQuery() {
  const organizationId = normalizeQueryValue(route.query.organizationId)
  const organizationType = normalizeQueryValue(route.query.organizationType)

  if (!organizationId || organizationType !== 'BRANCH') return false

  const branch = organizationBranchRows.value.find((organization) => (
    String(organization.id) === String(organizationId)
  ))

  if (!branch) return false

  selectedOrganizationId.value = branch.id
  selectedOrganizationType.value = 'BRANCH'
  organizationMemberFilters.page = 1
  organizationMemberFilters.sort = 'ROLE_ASC'
  organizationMemberFilters.organizationId = canAccessAllOrganizations.value ? branch.id : ''

  return true
}

function applyFpFiltersFromQuery() {
  const organizationId = normalizeQueryValue(route.params.organizationId) || normalizeQueryValue(route.query.organizationId)

  if (!organizationId) return

  fpFilters.page = 1
  fpFilters.organizationId = organizationId
}

function buildDetailParams() {
  return detailClosingMonth.value ? { closingMonth: detailClosingMonth.value } : {}
}

function changeOrganizationStatus(value) {
  organizationStatus.value = value
  organizationListPage.value = 1
}

function changeOrganizationListPage(page) {
  organizationListPage.value = page
}

function searchOrganizationMembers() {
  organizationMemberFilters.page = 1
  loadOrganizationMembers()
}

function changeOrganizationMemberBranchFilter() {
  organizationMemberFilters.page = 1

  if (!organizationMemberFilters.organizationId) {
    const rootId = findDefaultRootOrganizationId(organizations.value)
    selectedOrganizationId.value = rootId
    selectedOrganizationType.value = rootId ? 'HQ' : ''
    loadOrganizationMembers()
    return
  }

  const selectedBranch = organizationBranchRows.value.find((organization) => (
    String(organization.id) === String(organizationMemberFilters.organizationId)
  ))

  if (selectedBranch) {
    selectedOrganizationId.value = selectedBranch.id
    selectedOrganizationType.value = 'BRANCH'
  }

  loadOrganizationMembers()
}

function resetOrganizationMemberFilters() {
  organizationMemberFilters.page = 1
  organizationMemberFilters.keyword = ''
  organizationMemberFilters.branchKeyword = ''
  organizationMemberFilters.organizationId = canAccessAllOrganizations.value && selectedOrganizationType.value === 'BRANCH'
    ? selectedOrganizationId.value
    : ''
  organizationMemberFilters.sort = 'ROLE_ASC'
  loadOrganizationMembers()
}

function changeOrganizationMemberPage(page) {
  organizationMemberFilters.page = page
  loadOrganizationMembers()
}

function selectHeadquarters(organization) {
  toggleOrganizationExpansion(organization.id)

  if (!canAccessAllOrganizations.value) {
    return
  }

  selectedOrganizationId.value = organization.id
  selectedOrganizationType.value = 'HQ'
  organizationMemberFilters.page = 1
  organizationMemberFilters.organizationId = ''
  loadOrganizationMembers()
}

function selectBranchOrganization(organization) {
  selectedOrganizationId.value = organization.id
  selectedOrganizationType.value = 'BRANCH'
  organizationMemberFilters.page = 1
  organizationMemberFilters.sort = 'ROLE_ASC'
  organizationMemberFilters.organizationId = canAccessAllOrganizations.value ? organization.id : ''

  if (!canAccessAllOrganizations.value && !isCurrentUserBranch(organization)) {
    organizationMembersError.value = ''
    organizationMembersPage.value = createEmptyPage(organizationMemberFilters.size)
    return
  }

  loadOrganizationMembers()
}

function toggleOrganizationExpansion(organizationId) {
  if (expandedOrganizationIds.value.includes(organizationId)) {
    expandedOrganizationIds.value = expandedOrganizationIds.value.filter((id) => id !== organizationId)
    return
  }

  expandedOrganizationIds.value = [...expandedOrganizationIds.value, organizationId]
}

function searchFps() {
  fpFilters.page = 1
  loadFps()
}

function resetFpFilters() {
  fpFilters.page = 1
  fpFilters.keyword = ''
  fpFilters.organizationId = ''
  fpFilters.sort = 'NAME_ASC'
  loadFps()
}

function changeFpPage(page) {
  fpFilters.page = page
  loadFps()
}

function changeContractPage(page) {
  contractFilters.page = page

  if (isFpMyPage.value) {
    loadMyFpContracts()
    return
  }

  loadFpContracts(String(route.params.fpId))
}

async function openResignModal(fp, event = null) {
  if (isResignedFp(fp)) {
    return
  }

  resignModalTrigger.value = event?.currentTarget ?? getActiveElement()
  resignErrorMessage.value = ''
  resignResult.value = null

  const fpId = getFpIdentifier(fp)
  let fpDetailForResign = null

  if (fpId) {
    try {
      fpDetailForResign = await getOrganizationFpDetail(fpId, buildDetailParams())
    } catch {
      fpDetailForResign = null
    }
  }

  selectedResignFp.value = normalizeResignTargetFp({
    ...fp,
    ...(fpDetailForResign ?? {}),
  })
  isResignModalOpen.value = true

  await nextTick()
  focusFirstResignModalElement()
}

function closeResignModal() {
  if (isResignSubmitting.value) return

  isResignModalOpen.value = false
  selectedResignFp.value = null
  resignErrorMessage.value = ''
  resignResult.value = null

  restoreResignModalTriggerFocus()
}

function handleResignModalKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeResignModal()
    return
  }

  if (event.key !== 'Tab') {
    return
  }

  trapResignModalFocus(event)
}

function trapResignModalFocus(event) {
  const focusableElements = getResignModalFocusableElements()

  if (focusableElements.length === 0) {
    event.preventDefault()
    resignModalPanel.value?.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = getActiveElement()

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function focusFirstResignModalElement() {
  const [firstElement] = getResignModalFocusableElements()
  const target = firstElement ?? resignModalPanel.value
  target?.focus()
}

function restoreResignModalTriggerFocus() {
  const trigger = resignModalTrigger.value
  resignModalTrigger.value = null

  nextTick(() => {
    if (trigger && typeof trigger.focus === 'function' && containsElement(trigger)) {
      trigger.focus()
    }
  })
}

function getResignModalFocusableElements() {
  const panel = resignModalPanel.value
  if (!panel) return []

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(panel.querySelectorAll(selector))
    .filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null)
}

function getActiveElement() {
  return typeof document === 'undefined' ? null : document.activeElement
}

function containsElement(element) {
  return typeof document !== 'undefined' && document.contains(element)
}

async function submitResignFp() {
  const fpId = getSelectedResignFpId()

  if (!fpId) {
    resignErrorMessage.value = '해촉 처리할 설계사를 확인한 뒤 다시 시도해 주세요.'
    return
  }

  resignErrorMessage.value = ''
  resignNoticeMessage.value = ''
  isResignSubmitting.value = true

  try {
    const resignedAt = getTodayDateInputValue()
    const result = await resignOrganizationFp(fpId, {
      resignedAt,
    })

    resignResult.value = result ?? {
      handoverRequestCount: 0,
    }
    resignNoticeType.value = 'success'
    resignNoticeMessage.value = `해촉 처리가 완료되었습니다. 자동 생성된 인수인계 요청 ${formatCount(resignResult.value.handoverRequestCount)}건`
    applyResignResultToCurrentFp(fpId, result)
    await refetchCurrentFpData()
  } catch (error) {
    if (isAlreadyResignedError(error)) {
      resignResult.value = { handoverRequestCount: 0 }
      resignNoticeType.value = 'success'
      resignNoticeMessage.value = '이미 해촉 처리된 설계사입니다.'
      applyResignResultToCurrentFp(fpId, {
        userStatus: 'RESIGNED',
        resignedAt: selectedResignFp.value?.resignedAt ?? getTodayDateInputValue(),
      })
      await refetchCurrentFpData()
      return
    }

    resignErrorMessage.value = getResignErrorMessage(error)
  } finally {
    isResignSubmitting.value = false
  }
}

function getSelectedResignFpId() {
  return getFpIdentifier(selectedResignFp.value)
}

function normalizeResignTargetFp(fp) {
  if (!fp) return null

  return {
    ...fp,
    customerCount: fp.customerCount
      ?? fp.customerTotalCount
      ?? fp.totalCustomerCount
      ?? fp.performanceSummary?.customerCount
      ?? fp.performanceSummary?.customerTotalCount
      ?? fp.performanceSummary?.totalCustomerCount
      ?? null,
    contractCount: fp.contractCount
      ?? fp.heldContractCount
      ?? fp.activeContractCount
      ?? fp.totalContractCount
      ?? fp.performanceSummary?.contractCount
      ?? fp.performanceSummary?.heldContractCount
      ?? fp.performanceSummary?.activeContractCount
      ?? fp.performanceSummary?.completedContractCount
      ?? fp.performanceSummary?.totalContractCount
      ?? null,
  }
}

function getResignButtonLabel(fp) {
  return isResignedFp(fp) ? '해촉 완료' : '해촉 처리'
}

function isResignedFp(fp) {
  if (!fp) return false

  return fp.userStatus === 'RESIGNED' || Boolean(fp.resignedAt)
}

function getFpIdentifier(fp) {
  return fp?.fpId
    ?? fp?.id
    ?? fp?.userId
    ?? fp?.advisorId
    ?? null
}

async function refetchCurrentFpData() {
  if (props.mode === 'fps') {
    await loadFps()
    return
  }

  if (props.mode === 'fp-detail') {
    await reloadFpDetail()
  }
}

function applyResignResultToCurrentFp(fpId, result = {}) {
  const nextStatus = result?.userStatus ?? 'RESIGNED'
  const nextResignedAt = result?.resignedAt ?? getTodayDateInputValue()
  const patch = {
    userStatus: nextStatus,
    resignedAt: nextResignedAt,
  }

  selectedResignFp.value = mergeFpById(selectedResignFp.value, fpId, patch)
  fpDetail.value = mergeFpById(fpDetail.value, fpId, patch)

  if (Array.isArray(fpPage.value.content)) {
    fpPage.value = {
      ...fpPage.value,
      content: fpPage.value.content.map((fp) => mergeFpById(fp, fpId, patch)),
    }
  }
}

function mergeFpById(fp, fpId, patch) {
  if (!fp || String(getFpIdentifier(fp)) !== String(fpId)) {
    return fp
  }

  return {
    ...fp,
    ...patch,
  }
}

function getResignErrorMessage(error) {
  if (isAlreadyResignedError(error)) {
    return '이미 해촉 처리된 설계사입니다.'
  }

  if (error?.response?.data?.errorCode === 'ORG_003') {
    return '존재하지 않는 설계사입니다.'
  }

  return error?.response?.data?.message || '해촉 처리에 실패했습니다.'
}

function getMyFpDetailErrorMessage(error) {
  const status = error?.response?.status

  if (status === 401) {
    return '로그인이 만료되었거나 인증 정보가 없습니다. 다시 로그인해 주세요.'
  }

  if (status === 403) {
    return '마이 페이지에 접근할 권한이 없습니다.'
  }

  if (status === 404) {
    return '설계사 정보를 찾을 수 없습니다.'
  }

  return error?.response?.data?.message || '내 정보를 불러오지 못했습니다.'
}

function isAlreadyResignedError(error) {
  const status = error?.response?.status
  const errorCode = error?.response?.data?.errorCode

  return status === 409 || errorCode === 'ORG_004'
}

function goToResignationHandovers() {
  router.push({
    name: 'handover-requests',
  })
}

function goToFpDetail(fpId) {
  router.push({
    name: 'organization-fp-detail',
    params: { fpId },
    query: {
      from: route.name,
      ...(selectedOrganizationType.value === 'BRANCH'
        ? {
            organizationId: selectedOrganizationId.value,
            organizationType: selectedOrganizationType.value,
          }
        : {}),
    },
  })
}

function isClickableFpMember(member) {
  return authStore.userRole !== USER_ROLES.FP &&
    member.userRole === USER_ROLES.FP &&
    Boolean(member.fpId)
}

function goToOrganizationMemberDetail(member) {
  if (!isClickableFpMember(member)) return

  goToFpDetail(member.fpId)
}

function goToBranchAdvisors(organization) {
  if (organization.organizationType !== 'BRANCH') return

  router.push({
    name: 'organization-branch-advisors',
    params: {
      organizationId: organization.organizationId ?? organization.id,
    },
    query: {
      organizationName: organization.organizationName,
    },
  })
}

function goToFpList() {
  const fromRouteName = normalizeQueryValue(route.query.from)

  if (fromRouteName === 'organization-chart' || fromRouteName === 'admin-organizations') {
    router.push({
      name: fromRouteName,
      query: {
        ...(route.query.organizationId ? { organizationId: route.query.organizationId } : {}),
        ...(route.query.organizationType ? { organizationType: route.query.organizationType } : {}),
      },
    })
    return
  }

  if (authStore.userRole === USER_ROLES.SYSTEM_ADMIN) {
    router.push({ name: 'admin-organizations' })
    return
  }

  router.push({ name: 'hq-advisors' })
}

function normalizeQueryValue(value) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ? String(value) : ''
}

function flattenOrganizations(nodes) {
  return nodes.flatMap((node) => [
    node,
    ...flattenOrganizations(Array.isArray(node.children) ? node.children : []),
  ])
}

function filterOrganizationsByStatus(nodes) {
  if (!organizationStatus.value) return nodes

  return nodes
    .filter((node) => node.organizationStatus === organizationStatus.value)
    .map((node) => ({
      ...node,
      children: filterOrganizationsByStatus(Array.isArray(node.children) ? node.children : []),
    }))
}

function normalizeBranch(branch) {
  return {
    ...branch,
    organizationId: branch.organizationId ?? branch.id,
  }
}

function getBranchAdvisorCount(branch) {
  return branch.advisorCount
    ?? branch.fpCount
    ?? branch.advisorTotalCount
    ?? branch.totalAdvisorCount
    ?? branch.totalFpCount
    ?? branch.userCount
    ?? branch.fpUserCount
    ?? null
}

function getBranchManagerName(branch) {
  return branch.branchManagerName
    ?? branch.managerName
    ?? branch.organizationManagerName
    ?? branch.manager?.userName
    ?? branch.branchManager?.userName
    ?? '-'
}

function getContractKey(contract) {
  return contract.id
    ?? contract.contractId
    ?? contract.contractCode
    ?? `${contract.customerId ?? contract.customerName}-${contract.insuranceCompany}-${contract.contractDate}`
}

function collectExpandableOrganizationIds(nodes) {
  return nodes
    .filter((node) => Array.isArray(node.children) && node.children.length > 0)
    .map((node) => node.id)
}

function findDefaultRootOrganizationId(nodes) {
  return nodes[0]?.id ?? ''
}

function applyDefaultSelectedOrganization() {
  if (canAccessAllOrganizations.value) {
    const rootId = findDefaultRootOrganizationId(organizations.value)
    selectedOrganizationId.value = rootId
    selectedOrganizationType.value = rootId ? 'HQ' : ''
    organizationMemberFilters.organizationId = ''
    return
  }

  const currentBranch = findCurrentUserBranch()
  selectedOrganizationId.value = currentBranch?.id ?? ''
  selectedOrganizationType.value = currentBranch ? 'BRANCH' : ''
  organizationMemberFilters.organizationId = ''
}

function findCurrentUserBranch() {
  const currentOrganizationName = currentUserOrganizationName.value
  if (!currentOrganizationName) return null

  return organizationBranchRows.value.find((branch) => branch.organizationName === currentOrganizationName) ?? null
}

function isOrganizationLimited(organization) {
  if (canAccessAllOrganizations.value || organization.organizationType !== 'BRANCH') {
    return false
  }

  return !isCurrentUserBranch(organization)
}

function isCurrentUserBranch(organization) {
  return Boolean(currentUserOrganizationName.value) && organization.organizationName === currentUserOrganizationName.value
}

function normalizePageResponse(source, fallbackFilters) {
  const content = Array.isArray(source?.content)
    ? source.content
    : Array.isArray(source?.members)
      ? source.members
      : Array.isArray(source)
        ? source
        : []

  return {
    content: content.map(normalizeOrganizationMember),
    page: Number(source?.page ?? source?.number ?? fallbackFilters.page ?? 1),
    size: Number(source?.size ?? fallbackFilters.size ?? 10),
    totalElements: Number(source?.totalElements ?? source?.totalCount ?? content.length),
    totalPages: Number(source?.totalPages ?? Math.ceil(content.length / Number(fallbackFilters.size ?? 10)) ?? 0),
  }
}

function normalizeOrganizationMember(member) {
  return {
    id: member.id ?? member.userId ?? member.empCode ?? `${member.userName}-${member.email}`,
    fpId: member.fpId ?? '',
    empCode: member.empCode ?? member.employeeCode ?? member.code ?? '',
    userName: member.userName ?? member.name ?? '-',
    organizationId: member.organizationId ?? '',
    organizationName: member.organizationName ?? member.branchName ?? '-',
    userRole: member.userRole ?? member.role ?? '',
    email: member.email ?? '',
    phone: member.phone ?? member.phoneNumber ?? '',
    userStatus: member.userStatus ?? member.status ?? '',
  }
}

function getRoleLabel(role) {
  const roleMap = {
    HQ_MANAGER: '본사 영업 담당자',
    BRANCH_MANAGER: '지점장',
    FP: '설계사',
    SYSTEM_ADMIN: '시스템 관리자',
  }

  return roleMap[role] ?? role ?? '-'
}

function getUserStatusLabel(status) {
  const statusMap = {
    ACTIVE: '재직',
    RESIGNED: '퇴사',
  }

  return statusMap[status] ?? status ?? '-'
}

function createEmptyPage(size) {
  return {
    content: [],
    page: 1,
    size,
    totalElements: 0,
    totalPages: 0,
  }
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatNullableCount(value) {
  if (value === null || value === undefined || value === '') return '-'
  return formatCount(value)
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function getPerformanceChangeLabel(summary) {
  const rawValue = summary?.contractChangeRate
    ?? summary?.completedContractChangeRate
    ?? summary?.monthOverMonthRate
    ?? summary?.growthRate
    ?? null

  if (rawValue === null || rawValue === undefined || rawValue === '') return ''

  const value = Number(rawValue)
  if (!Number.isFinite(value)) return ''

  const prefix = value > 0 ? '▲' : value < 0 ? '▼' : '-'
  const formattedValue = Math.abs(value).toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return `전월 대비 ${prefix} ${formattedValue}%`
}

function formatCurrency(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR')}원`
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function getLatestAvailableClosingMonth() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getTodayDateInputValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const StatusBadge = defineComponent({
  name: 'StatusBadge',
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(componentProps) {
    return () => {
      const statusMap = {
        ACTIVE: ['ACTIVE', 'success'],
        INACTIVE: ['INACTIVE', 'muted'],
        RESIGNED: ['퇴사', 'danger'],
        NORMAL: ['정상', 'success'],
        LAPSED: ['실효', 'danger'],
      }
      const [label, tone] = statusMap[componentProps.status] ?? [componentProps.status || '-', 'muted']
      return h('span', { class: ['status-badge', `status-badge--${tone}`] }, label)
    }
  },
})

const LoadingState = defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup(componentProps) {
    return () => h('div', { class: ['state-box', { 'state-box--compact': componentProps.compact }] }, [
      h('div', { class: 'state-spinner' }),
      h('p', componentProps.message),
    ])
  },
})

const ErrorState = defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  setup(componentProps) {
    return () => h('div', { class: 'state-box state-box--error' }, [h('p', componentProps.message)])
  },
})

const EmptyState = defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup(componentProps) {
    return () => h('div', { class: ['state-box', { 'state-box--compact': componentProps.compact }] }, [
      h('p', componentProps.message),
    ])
  },
})

</script>

<style scoped>
.organizations-page {
  display: grid;
  gap: 20px;
  color: #111827;
}

.page-header,
.panel__header,
.detail-toolbar,
.organization-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.25;
}

.page-header--compact h2 {
  font-size: 18px;
}

.page-header p,
.panel__header p {
  margin: 6px 0 0;
  color: #3f2a22;
}

.page-header--compact p {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.panel {
  position: relative;
  padding: 22px;
  border: 1px solid #e8b9a8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

.organization-filter-panel,
.organization-list-panel,
.organization-detail-panel {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.organization-list-panel .panel__header {
  margin-bottom: 14px;
}

.organization-list-panel .panel__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #111827;
}

.organization-list-panel .panel__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.organization-detail-panel .detail-toolbar {
  margin-bottom: 14px;
}

.organization-detail-panel .fp-profile {
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.organization-detail-panel .fp-profile__avatar {
  width: 52px;
  height: 52px;
  background: #fff7ed;
  color: #f97316;
  font-size: 20px;
}

.organization-detail-panel .fp-profile h3 {
  font-size: 18px;
}

.organization-detail-panel .fp-profile p {
  margin: 4px 0 12px;
  font-size: 12px;
}

.organization-detail-panel .summary-grid {
  gap: 12px;
  margin-top: 16px;
}

.organization-detail-panel .summary-card {
  min-height: 108px;
  padding: 16px;
  box-shadow: none;
}

.organization-detail-panel .summary-card__value {
  font-size: 26px;
}

.panel__header {
  margin-bottom: 18px;
}

.panel__header h3 {
  margin: 0;
  font-size: 22px;
}

.button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 2px;
  font-weight: 800;
  cursor: pointer;
}

.button--primary {
  background: #b33a00;
  color: #ffffff;
}

.button--secondary {
  border-color: #e2b8a8;
  background: #eef4fb;
  color: #1f2937;
}

.button--danger {
  background: #dc2626;
  color: #ffffff;
}

.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.organization-workspace {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.organization-tree-panel {
  min-height: 640px;
  overflow: hidden;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.organization-tree-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
  margin-bottom: 14px;
  padding: 0 0 12px;
  border-bottom: 1px solid #e5e7eb;
}

.tree-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.tree-title .mdi {
  color: #f05a1a;
  font-size: 18px;
}

.tree-collapse-button {
  width: 24px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #3f2a22;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

.tree-collapse-button .mdi {
  height: 10px;
  line-height: 10px;
}

.organization-tree {
  padding: 2px 0 4px;
}

.organization-tree__root {
  display: grid;
  gap: 10px;
}

.tree-root-button,
.tree-child-button {
  width: 100%;
  border: 0;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  text-align: left;
  letter-spacing: 0;
}

.tree-root-button {
  display: grid;
  grid-template-columns: 14px 18px minmax(0, 1fr);
  align-items: start;
  gap: 4px;
  padding: 0 2px;
  font-size: 13px;
  font-weight: 800;
}

.tree-root-button > span:last-child {
  display: grid;
  gap: 2px;
}

.tree-root-button small {
  color: #1f2937;
  font-size: 12px;
  font-weight: 800;
}

.tree-root-button .mdi {
  color: #f05a1a;
  font-size: 17px;
}

.tree-children {
  position: relative;
  display: grid;
  gap: 6px;
  margin-left: 12px;
  padding: 4px 0 0 16px;
}

.tree-children::before {
  position: absolute;
  top: 0;
  bottom: 4px;
  left: 0;
  width: 1px;
  background: #f0c7b8;
  content: "";
}

.tree-child-button {
  position: relative;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 3px;
  font-size: 13px;
}

.tree-child-button::before {
  position: absolute;
  top: 50%;
  left: -16px;
  width: 16px;
  height: 1px;
  background: #f0c7b8;
  content: "";
}

.tree-child-button.active {
  background: #fff0e9;
  color: #f05a1a;
  font-weight: 800;
}

.tree-child-button:disabled {
  color: #94a3b8;
  opacity: 0.58;
}

.tree-child-button:disabled::before {
  background: #e5e7eb;
}

.tree-child-button.limited.active {
  color: #f05a1a;
  opacity: 1;
}

.organization-member-filters {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(150px, 1fr) minmax(170px, 1fr) minmax(150px, 0.8fr) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.organization-member-filters--restricted {
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 0.7fr) auto;
}

.organization-member-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.branch-summary-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 14px;
  padding: 13px 16px;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #fffbf7;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.branch-summary-strip__main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.branch-summary-strip__main strong {
  color: #f97316;
  font-size: 15px;
  font-weight: 900;
}

.branch-summary-strip__main span {
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}

.branch-summary-strip__meta {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.branch-summary-strip__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.organization-member-table table {
  width: 100%;
  min-width: 860px;
  table-layout: fixed;
}

.organization-member-table {
  border: 1px solid #f0f3f8;
  border-radius: 8px;
}

.organization-member-table th,
.organization-member-table td {
  padding: 11px 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #475569;
  font-size: 12px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.organization-member-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 800;
}

.member-col--name {
  width: 10%;
}

.member-col--branch {
  width: 13%;
}

.member-col--role {
  width: 15%;
}

.member-col--code {
  width: 13%;
}

.member-col--email {
  width: 24%;
}

.member-col--phone {
  width: 17%;
}

.member-col--status {
  width: 8%;
}

.organization-member-table td:nth-child(7) .status-badge {
  justify-content: center;
  min-width: 54px;
}

.org-canvas {
  min-height: 500px;
  overflow-x: auto;
  padding: 26px 30px 46px;
}

.canvas-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e8b9a8;
  background: #ffffff;
}

.canvas-toolbar__divider {
  width: 1px;
  height: 22px;
  background: #e8b9a8;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #130a06;
  cursor: pointer;
  font-size: 22px;
}

.icon-button--ghost {
  color: #4d2b1c;
}

.org-chart {
  min-width: 980px;
  padding: 14px 10px 0;
}

.org-chart__roots {
  display: grid;
  gap: 44px;
}

.org-chart__root-group {
  display: grid;
  justify-items: center;
  gap: 78px;
}

.org-node {
  width: 180px;
  min-height: 84px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 6px;
  border-radius: 2px;
  text-align: center;
}

.org-node span {
  color: #4b332a;
  font-size: 13px;
}

.org-node strong {
  font-size: 17px;
  line-height: 1.3;
}

.org-node--hq {
  position: relative;
  width: 280px;
  min-height: 120px;
  background: #b33a00;
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(63, 26, 7, 0.18);
}

.org-node--hq::after {
  position: absolute;
  bottom: -78px;
  left: 50%;
  width: 2px;
  height: 78px;
  background: #b33a00;
  content: "";
}

.org-node--hq span {
  color: #ffffff;
  font-weight: 800;
}

.org-node--hq strong {
  font-size: 21px;
}

.org-node--hq small {
  width: 84%;
  padding: 7px 10px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 12px;
}

.org-branches {
  position: relative;
  width: min-content;
  display: grid;
  grid-template-columns: repeat(5, 180px);
  gap: 62px 44px;
  padding-top: 62px;
}

.org-branches::before {
  position: absolute;
  top: 0;
  left: 90px;
  right: 90px;
  height: 2px;
  background: #b33a00;
  content: "";
}

.org-node--branch {
  position: relative;
  border: 2px solid #e2b8a8;
  background: #ffffff;
}

.org-node--branch::before {
  position: absolute;
  top: -64px;
  left: 50%;
  width: 2px;
  height: 60px;
  background: #b33a00;
  content: "";
}

.organization-list {
  overflow: hidden;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.organization-list__header {
  min-height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 0;
  border-bottom: 0;
  background: transparent;
}

.organization-list__header h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.organization-list__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.organization-list__tools {
  display: flex;
  align-items: center;
  gap: 18px;
}

.organization-list__tools span {
  color: #64748b;
  font-size: 13px;
}

.organization-list__tools strong,
.text-accent {
  color: #f97316;
}

.status-tabs {
  display: flex;
}

.status-tabs button {
  min-height: 32px;
  padding: 0 16px;
  border: 1px solid #e8b9a8;
  border-right: 0;
  background: #ffffff;
  color: #4b332a;
  cursor: pointer;
}

.status-tabs button:first-child {
  border-radius: 4px 0 0 4px;
}

.status-tabs button:last-child {
  border-right: 1px solid #e8b9a8;
  border-radius: 0 4px 4px 0;
}

.status-tabs button.active {
  background: #f8eee8;
  color: #b33a00;
  font-weight: 800;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 220px;
  gap: 14px;
}

.organization-filter-panel .filter-grid {
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 1fr) 220px auto;
  align-items: end;
}

.organization-filter-panel .filter-grid--restricted-fp {
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 0.8fr) auto;
}

.organization-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.field input,
.field select {
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #d9e0ea;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
}

.organization-month-field {
  align-self: end;
}

.organization-month-field--detail {
  width: 180px;
  flex: 0 0 180px;
  margin-left: auto;
}

.organization-month-field :deep(.v-field) {
  border-radius: 8px;
  box-shadow: none;
}

.field--month {
  width: 200px;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #e8eef5;
  border-radius: 8px;
}

.table-scroll--flush {
  border: 0;
  border-radius: 0;
}

table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

th,
td {
  padding: 17px 30px;
  border-bottom: 1px solid #e8b9a8;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f7fbff;
  color: #3f2a22;
  font-size: 14px;
  font-weight: 700;
}

.organization-table-scroll {
  border: 1px solid #f0f3f8;
  border-radius: 8px;
}

.organization-table-scroll table {
  min-width: 980px;
}

.organization-table-scroll th,
.organization-table-scroll td {
  padding: 11px 13px;
  border-bottom: 1px solid #e5e7eb;
  color: #475569;
  font-size: 12px;
  text-align: left;
}

.organization-table-scroll th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 800;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.table-action-cell {
  width: 82px;
  text-align: center;
}

.table-action-button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #e2b8a8;
  border-radius: 4px;
  background: #ffffff;
  color: #4b332a;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.table-action-button--danger {
  border-color: #fecaca;
  color: #dc2626;
}

.table-action-button:hover {
  background: #fff7ed;
}

.table-action-button:disabled {
  border-color: #d8dce3;
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.table-action-button:disabled:hover {
  background: #f8fafc;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: #fff7ed;
}

.status-badge {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 0 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.status-badge--success {
  background: #ffd9cb;
  color: #111827;
}

.status-badge--danger {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge--muted {
  background: #f1f5f9;
  color: #64748b;
}

.organization-pagination {
  margin-top: 14px;
  color: #64748b;
  font-size: 13px;
}

.organization-list .organization-pagination {
  padding: 0 30px 18px;
}

.organization-pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

.fp-profile {
  display: flex;
  gap: 18px;
  align-items: center;
}

.fp-profile__content {
  min-width: 0;
  flex: 1;
}

.fp-profile__action {
  margin-left: auto;
  flex: 0 0 auto;
}

.fp-profile__avatar {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #fff7ed;
  color: #b33a00;
  font-size: 26px;
  font-weight: 900;
}

.fp-profile h3 {
  margin: 0;
  font-size: 24px;
}

.fp-profile p {
  margin: 6px 0 14px;
  color: #64748b;
}

.fp-profile dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  gap: 20px;
  margin: 0;
}

.fp-profile dt {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
}

.fp-profile dd {
  margin: 2px 0 0;
  color: #334155;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.summary-card {
  min-height: 124px;
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.03);
}

.summary-card__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.summary-card__value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: #111827;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}

.summary-card__value small {
  font-size: 15px;
  font-weight: 800;
}

.summary-card__trend {
  margin: 0;
  color: #ef4444;
  font-size: 12px;
  font-weight: 800;
}

.summary-card--rank {
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
}

.rank-metric {
  display: grid;
  gap: 12px;
}

.rank-divider {
  align-self: stretch;
  background: #e5e7eb;
}

.summary-card__value--rank-highlight {
  color: #111827;
}

.summary-card__value--rank-highlight .mdi {
  align-self: start;
  color: #f59e0b;
  font-size: 20px;
  line-height: 1;
}

.termination-alert {
  margin-top: -4px;
}

.termination-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
}

.termination-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
}

.termination-modal__panel {
  position: relative;
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.24);
}

.termination-modal__header,
.termination-modal__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.termination-modal__header h3 {
  margin: 0;
  font-size: 22px;
}

.termination-modal__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.termination-modal__header button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-size: 20px;
}

.termination-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.termination-summary div {
  min-height: 70px;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid #e8eef5;
  border-radius: 6px;
  background: #f8fafc;
}

.termination-summary dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.termination-summary dd {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
}

.termination-notice {
  margin: 0;
  padding: 12px 14px;
  border-radius: 6px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
  font-weight: 800;
}

.termination-modal__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.state-box {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 10px;
  border: 1px dashed #d9e0ea;
  border-radius: 8px;
  color: #64748b;
  text-align: center;
}

.state-box--compact {
  min-height: 96px;
  margin-top: 0;
}

.state-box--error {
  border-color: #fecaca;
  color: #dc2626;
}

.state-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #fed7aa;
  border-top-color: #b33a00;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .org-branches {
    grid-template-columns: repeat(3, 180px);
  }
}

@media (max-width: 1024px) {
  .filter-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .organization-filter-panel .filter-grid {
    grid-template-columns: 1fr;
  }

  .organization-filter-actions {
    justify-content: flex-start;
  }

  .organization-workspace {
    grid-template-columns: 1fr;
  }

  .branch-summary-strip {
    grid-template-columns: 1fr;
  }

  .organization-tree-panel {
    min-height: auto;
  }

  .page-header,
  .panel__header,
  .detail-toolbar,
  .organization-pagination,
  .fp-profile,
  .organization-list__header,
  .organization-list__tools {
    align-items: stretch;
    flex-direction: column;
  }

  .field--month {
    width: 100%;
  }

  .organization-month-field--detail {
    width: 100%;
    flex-basis: auto;
    margin-left: 0;
  }

  .fp-profile__action {
    margin-left: 0;
  }

  .fp-profile dl {
    grid-template-columns: 1fr;
  }

  .termination-summary {
    grid-template-columns: 1fr;
  }

  .org-canvas {
    padding-left: 18px;
    padding-right: 18px;
  }

  .org-chart {
    min-width: 720px;
  }

  .org-branches {
    grid-template-columns: repeat(2, 180px);
  }
}
</style>
