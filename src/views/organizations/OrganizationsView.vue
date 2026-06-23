<template>
  <section class="organizations-page">
    <header class="page-header">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDescription }}</p>
      </div>

      <div v-if="mode === 'fps'" class="page-header__actions">
        <button class="button button--secondary" type="button" @click="resetFpFilters">
          초기화
        </button>
        <button class="button button--primary" type="button" @click="loadFps">
          조회
        </button>
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
                @click="toggleOrganization(root.id)"
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
                  :class="{ active: selectedOrganizationId === branch.id }"
                  @click="selectOrganization(branch.id)"
                >
                  {{ branch.organizationName }}
                </button>
              </div>
            </div>
          </nav>
        </section>

        <section class="organization-list panel">
        <div class="organization-list__header">
          <h3>조직 리스트</h3>
          <div class="organization-list__tools">
            <span>
              전체 <strong>{{ formatCount(filteredOrganizationRows.length) }}개</strong> 조직
            </span>
            <div class="status-tabs" aria-label="조직 상태 필터">
              <button
                v-for="option in organizationStatusOptions"
                :key="option.value"
                type="button"
                :class="{ active: organizationStatus === option.value }"
                @click="changeOrganizationStatus(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="table-scroll table-scroll--flush">
          <table>
            <thead>
              <tr>
                <th>조직명</th>
                <th>조직 코드</th>
                <th>주소</th>
                <th>전화번호</th>
                <th>상태</th>
                <th class="table-action-cell">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="organization in paginatedOrganizationRows"
                :key="organization.id"
                :class="{ 'clickable-row': organization.organizationType === 'BRANCH' }"
                @click="goToBranchAdvisors(organization)"
              >
                <td>
                  <strong :class="{ 'text-accent': organization.organizationType === 'HQ' }">
                    {{ organization.organizationName }}
                  </strong>
                </td>
                <td>{{ organization.organizationCode }}</td>
                <td>{{ organization.organizationAddress || '-' }}</td>
                <td>{{ organization.organizationPhone || '-' }}</td>
                <td><StatusBadge :status="organization.organizationStatus" /></td>
                <td class="table-action-cell">
                  <button class="icon-button icon-button--ghost" type="button" aria-label="조직 수정" @click.stop>
                    <span class="mdi mdi-pencil-outline" aria-hidden="true"></span>
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedOrganizationRows.length === 0">
                <td colspan="6">
                  <EmptyState compact message="조회된 조직 정보가 없습니다." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationBar
          :page="organizationListPage"
          :total-pages="organizationListTotalPages"
          :total-count="filteredOrganizationRows.length"
          @change="changeOrganizationListPage"
        />
        </section>
      </div>
    </template>

    <template v-else-if="mode === 'branches'">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>지점 목록</h3>
            <p>FP 검색 필터에서 사용하는 지점 목록입니다.</p>
          </div>
        </div>

        <LoadingState v-if="isBranchesLoading" message="지점 목록을 불러오고 있습니다." />
        <ErrorState v-else-if="branchesError" :message="branchesError" />
        <EmptyState v-else-if="branches.length === 0" message="조회된 지점이 없습니다." />
        <div v-else class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>지점명</th>
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
      <section class="panel">
        <div class="filter-grid">
          <label class="field">
            <span>검색어</span>
            <input
              v-model.trim="fpFilters.keyword"
              type="search"
              placeholder="사번 또는 이름 검색"
              @keyup.enter="searchFps"
            />
          </label>
          <label class="field">
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
          <v-text-field
            v-model="fpFilters.closingMonth"
            type="month"
            label="기준월"
            variant="outlined"
            density="comfortable"
            hide-details
            :max="latestAvailableClosingMonth"
            class="organization-month-field"
          />
        </div>
      </section>

      <section class="panel">
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
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>사번</th>
                  <th>이름</th>
                  <th>소속 지점</th>
                  <th>기준월</th>
                  <th>고객 수</th>
                  <th>계약 수</th>
                  <th>유지율</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fp in fpPage.content"
                  :key="fp.id"
                  class="clickable-row"
                  @click="goToFpDetail(fp.id)"
                >
                  <td>{{ formatRank(getFpListRank(fp)) }}</td>
                  <td>{{ fp.empCode }}</td>
                  <td><strong>{{ fp.userName }}</strong></td>
                  <td>{{ fp.organizationName }}</td>
                  <td>{{ fp.closingMonth || '-' }}</td>
                  <td>{{ formatCount(fp.customerCount) }}</td>
                  <td>{{ formatCount(fp.contractCount) }}</td>
                  <td>{{ formatPercent(fp.retentionRate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <PaginationBar
            :page="fpPage.page"
            :total-pages="fpPage.totalPages"
            :total-count="fpPage.totalElements"
            @change="changeFpPage"
          />
        </template>
      </section>
    </template>

    <template v-else>
      <section class="panel">
        <div class="detail-toolbar">
          <button class="button button--secondary" type="button" @click="goToFpList">
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
            @update:model-value="reloadFpDetail"
          />
        </div>

        <LoadingState v-if="isFpDetailLoading" message="FP 상세 정보를 불러오고 있습니다." />
        <ErrorState v-else-if="fpDetailError" :message="fpDetailError" />
        <EmptyState v-else-if="!fpDetail" message="FP 상세 정보가 없습니다." />
        <template v-else>
          <div class="fp-profile">
            <div class="fp-profile__avatar">{{ fpDetail.fpName?.slice(0, 1) || '-' }}</div>
            <div>
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

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>FP 계약 목록</h3>
            <p>해당 FP가 담당하는 계약 목록입니다.</p>
          </div>
        </div>

        <LoadingState v-if="isContractsLoading" message="계약 목록을 불러오고 있습니다." />
        <ErrorState v-else-if="contractsError" :message="contractsError" />
        <EmptyState v-else-if="contractPage.content.length === 0" message="조회된 계약이 없습니다." />
        <template v-else>
          <div class="table-scroll">
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
          <PaginationBar
            :page="contractPage.page"
            :total-pages="contractPage.totalPages"
            :total-count="contractPage.totalElements"
            @change="changeContractPage"
          />
        </template>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getOrganizationFpContracts,
  getOrganizationFpDetail,
  getOrganizationFps,
  getOrganizations,
  getOrganizationsBranches,
} from '../../api/organizations'

const props = defineProps({
  mode: {
    type: String,
    default: 'chart',
    validator(value) {
      return ['chart', 'branches', 'fps', 'fp-detail'].includes(value)
    },
  },
})

const route = useRoute()
const router = useRouter()

const organizations = ref([])
const branches = ref([])
const fpPage = ref(createEmptyPage(10))
const fpDetail = ref(null)
const contractPage = ref(createEmptyPage(10))

const isOrganizationLoading = ref(false)
const isBranchesLoading = ref(false)
const isFpsLoading = ref(false)
const isFpDetailLoading = ref(false)
const isContractsLoading = ref(false)

const organizationError = ref('')
const branchesError = ref('')
const fpsError = ref('')
const fpDetailError = ref('')
const contractsError = ref('')

const organizationStatus = ref('')
const organizationListPage = ref(1)
const organizationListSize = 5
const selectedOrganizationId = ref('')
const expandedOrganizationIds = ref([])
const detailClosingMonth = ref(getLatestAvailableClosingMonth())

const fpFilters = reactive({
  page: 1,
  size: 10,
  keyword: '',
  organizationId: '',
  closingMonth: getLatestAvailableClosingMonth(),
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

const latestAvailableClosingMonth = computed(() => getLatestAvailableClosingMonth())

const pageTitle = computed(() => {
  if (props.mode === 'chart') return '조직도 조회'
  if (props.mode === 'branches') return '지점 목록 조회'
  if (props.mode === 'fps' && selectedFpBranchName.value) return `${selectedFpBranchName.value} 설계사 목록`
  if (props.mode === 'fps') return 'FP 목록'
  return 'FP 상세'
})

const pageDescription = computed(() => {
  if (props.mode === 'chart') return 'Relia 전체 조직도를 조회합니다.'
  if (props.mode === 'branches') return '지점 선택에 사용하는 조직 목록입니다.'
  if (props.mode === 'fps' && selectedFpBranchName.value) {
    return `${selectedFpBranchName.value}에 소속된 설계사 목록을 조회합니다.`
  }
  if (props.mode === 'fps') return '검색 조건으로 FP 실적 목록을 조회합니다.'
  return 'FP 기본 정보, 성과 요약, 계약 목록을 조회합니다.'
})

const organizationRoots = computed(() => (
  organizations.value.map((organization) => ({
    ...organization,
    children: filterOrganizationsByStatus(Array.isArray(organization.children) ? organization.children : []),
  }))
))
const organizationRows = computed(() => flattenOrganizations(organizations.value))

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

onMounted(() => {
  initializePage()
})

async function initializePage() {
  if (props.mode === 'chart') {
    await loadOrganizations()
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

  await reloadFpDetail()
}

async function loadOrganizations() {
  organizationError.value = ''
  isOrganizationLoading.value = true

  try {
    organizations.value = await getOrganizations()
    organizationListPage.value = 1
    expandedOrganizationIds.value = collectExpandableOrganizationIds(organizations.value)
    if (!selectedOrganizationId.value) {
      selectedOrganizationId.value = findDefaultRootOrganizationId(organizations.value)
    }
  } catch {
    organizations.value = []
    selectedOrganizationId.value = ''
    expandedOrganizationIds.value = []
    organizationError.value = '조직 정보를 불러오지 못했습니다.'
  } finally {
    isOrganizationLoading.value = false
  }
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
    fpPage.value = await getOrganizationFps(buildFpParams())
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

function buildFpParams() {
  return {
    page: fpFilters.page,
    size: fpFilters.size,
    ...(fpFilters.keyword ? { keyword: fpFilters.keyword } : {}),
    ...(fpFilters.organizationId ? { organizationId: fpFilters.organizationId } : {}),
    ...(fpFilters.closingMonth ? { closingMonth: fpFilters.closingMonth } : {}),
  }
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

function selectOrganization(organizationId) {
  selectedOrganizationId.value = organizationId
  organizationListPage.value = 1
}

function toggleOrganization(organizationId) {
  selectedOrganizationId.value = organizationId
  organizationListPage.value = 1

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
  fpFilters.closingMonth = latestAvailableClosingMonth.value
  loadFps()
}

function changeFpPage(page) {
  fpFilters.page = page
  loadFps()
}

function changeContractPage(page) {
  contractFilters.page = page
  loadFpContracts(String(route.params.fpId))
}

function goToFpDetail(fpId) {
  router.push({
    name: 'organization-fp-detail',
    params: { fpId },
    query: { from: route.name },
  })
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

function getFpListRank(fp) {
  return fp.rank
    ?? fp.ranking
    ?? fp.totalRank
    ?? fp.performanceRank
    ?? fp.branchRank
    ?? null
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

function formatRank(value) {
  if (value === null || value === undefined || value === '') return '-'
  return `${formatCount(value)}위`
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

const PaginationBar = defineComponent({
  props: {
    page: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    totalCount: {
      type: Number,
      required: true,
    },
  },
  emits: ['change'],
  setup(componentProps, { emit }) {
    return () => {
      const totalPages = Math.max(componentProps.totalPages || 1, 1)
      const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

      return h('div', { class: 'pagination-bar' }, [
        h('span', `총 ${Number(componentProps.totalCount ?? 0).toLocaleString('ko-KR')}건`),
        h('div', { class: 'pagination-bar__buttons' }, [
          h('button', {
            type: 'button',
            disabled: componentProps.page <= 1,
            onClick: () => emit('change', componentProps.page - 1),
            'aria-label': '이전 페이지',
          }, '<'),
          ...pages.map((page) => h('button', {
            type: 'button',
            class: { active: page === componentProps.page },
            onClick: () => emit('change', page),
          }, String(page))),
          h('button', {
            type: 'button',
            disabled: componentProps.page >= totalPages,
            onClick: () => emit('change', componentProps.page + 1),
            'aria-label': '다음 페이지',
          }, '>'),
        ]),
      ])
    }
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
.pagination-bar {
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

.page-header p,
.panel__header p {
  margin: 6px 0 0;
  color: #3f2a22;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.panel {
  position: relative;
  padding: 22px;
  border: 1px solid #e8b9a8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
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

.organization-workspace {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.organization-tree-panel {
  min-height: 640px;
  overflow: hidden;
  padding: 0;
  background: #ffffff;
}

.organization-tree-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border-bottom: 1px solid #e8b9a8;
}

.tree-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3f2a22;
  font-size: 13px;
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
  padding: 18px 12px 24px;
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
  padding: 0;
}

.organization-list__header {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 30px;
  border-bottom: 1px solid #e8b9a8;
  background: #eaf4ff;
}

.organization-list__header h3 {
  margin: 0;
  font-size: 26px;
}

.organization-list__tools {
  display: flex;
  align-items: center;
  gap: 18px;
}

.organization-list__tools span {
  color: #3f2a22;
}

.organization-list__tools strong,
.text-accent {
  color: #b33a00;
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

tbody tr:last-child td {
  border-bottom: 0;
}

.table-action-cell {
  width: 82px;
  text-align: center;
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

.pagination-bar {
  min-height: 86px;
  margin-top: 0;
  padding: 18px 30px;
  background: #eaf4ff;
}

.pagination-bar span {
  color: #64748b;
  font-size: 13px;
}

.pagination-bar__buttons {
  display: flex;
  gap: 10px;
}

.pagination-bar button {
  min-width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-weight: 800;
}

.pagination-bar button.active {
  background: #b33a00;
  color: #ffffff;
}

.pagination-bar button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fp-profile {
  display: flex;
  gap: 18px;
  align-items: center;
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

  .organization-workspace {
    grid-template-columns: 1fr;
  }

  .organization-tree-panel {
    min-height: auto;
  }

  .page-header,
  .panel__header,
  .detail-toolbar,
  .pagination-bar,
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

  .fp-profile dl {
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
