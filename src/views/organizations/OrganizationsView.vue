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
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>조직도</h3>
            <p>본사와 지점의 계층 구조를 조회합니다.</p>
          </div>
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

        <LoadingState v-if="isOrganizationLoading" message="조직 정보를 불러오고 있습니다." />
        <ErrorState v-else-if="organizationError" :message="organizationError" />
        <EmptyState v-else-if="organizations.length === 0" message="조회된 조직 정보가 없습니다." />
        <div v-else class="organization-tree">
          <OrganizationNode
            v-for="organization in organizations"
            :key="organization.id"
            :node="organization"
            :expanded-node-ids="expandedNodeIds"
            @toggle="toggleNode"
          />
        </div>
      </section>
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
                <th>조직명</th>
                <th>조직 코드</th>
                <th>조직 ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branches" :key="branch.organizationId">
                <td>{{ branch.organizationName }}</td>
                <td>{{ branch.organizationCode }}</td>
                <td>{{ branch.organizationId }}</td>
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
          <label class="field">
            <span>기준월</span>
            <input v-model="fpFilters.closingMonth" type="month" />
          </label>
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
          <label class="field field--month">
            <span>기준월</span>
            <input v-model="detailClosingMonth" type="month" @change="reloadFpDetail" />
          </label>
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
            <SummaryCard label="기준월" :value="fpDetail.performanceSummary.closingMonth" />
            <SummaryCard label="완료 계약 수" :value="`${formatCount(fpDetail.performanceSummary.completedContractCount)}건`" />
            <SummaryCard label="신규 계약 수" :value="`${formatCount(fpDetail.performanceSummary.newContractCount)}건`" />
            <SummaryCard label="유지율" :value="formatPercent(fpDetail.performanceSummary.retentionRate)" />
            <SummaryCard label="전체 순위" :value="`${formatCount(fpDetail.performanceSummary.totalRank)}위`" />
            <SummaryCard label="지점 순위" :value="`${formatCount(fpDetail.performanceSummary.branchRank)}위`" />
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
                <tr v-for="contract in contractPage.content" :key="`${contract.customerName}-${contract.contractDate}`">
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
const expandedNodeIds = ref([])

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
const detailClosingMonth = ref('')

const fpFilters = reactive({
  page: 1,
  size: 10,
  keyword: '',
  organizationId: '',
  closingMonth: '',
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

const pageTitle = computed(() => {
  if (props.mode === 'chart') return '조직도'
  if (props.mode === 'branches') return '지점 목록'
  if (props.mode === 'fps') return 'FP 목록'
  return 'FP 상세'
})

const pageDescription = computed(() => {
  if (props.mode === 'chart') return '조직 트리와 조직 상태를 조회합니다.'
  if (props.mode === 'branches') return '지점 선택에 사용하는 조직 목록입니다.'
  if (props.mode === 'fps') return '검색 조건으로 FP 실적 목록을 조회합니다.'
  return 'FP 기본 정보, 성과 요약, 계약 목록을 조회합니다.'
})

watch(
  () => props.mode,
  () => initializePage(),
)

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
    await Promise.all([loadBranches(), loadFps()])
    return
  }

  await reloadFpDetail()
}

async function loadOrganizations() {
  organizationError.value = ''
  isOrganizationLoading.value = true

  try {
    organizations.value = await getOrganizations(buildOrganizationParams())
    expandedNodeIds.value = collectDefaultExpandedIds(organizations.value)
  } catch {
    organizations.value = []
    organizationError.value = '조직 정보를 불러오지 못했습니다.'
  } finally {
    isOrganizationLoading.value = false
  }
}

async function loadBranches() {
  branchesError.value = ''
  isBranchesLoading.value = true

  try {
    branches.value = await getOrganizationsBranches()
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

function buildOrganizationParams() {
  return organizationStatus.value ? { status: organizationStatus.value } : {}
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

function buildDetailParams() {
  return detailClosingMonth.value ? { closingMonth: detailClosingMonth.value } : {}
}

function changeOrganizationStatus(value) {
  organizationStatus.value = value
  loadOrganizations()
}

function searchFps() {
  fpFilters.page = 1
  loadFps()
}

function resetFpFilters() {
  fpFilters.page = 1
  fpFilters.keyword = ''
  fpFilters.organizationId = ''
  fpFilters.closingMonth = ''
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

function goToFpList() {
  router.push({ name: 'hq-advisors' })
}

function toggleNode(nodeId) {
  if (expandedNodeIds.value.includes(nodeId)) {
    expandedNodeIds.value = expandedNodeIds.value.filter((id) => id !== nodeId)
    return
  }

  expandedNodeIds.value = [...expandedNodeIds.value, nodeId]
}

function collectDefaultExpandedIds(nodes) {
  return nodes
    .filter((node) => Array.isArray(node.children) && node.children.length > 0)
    .map((node) => node.id)
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

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
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

const OrganizationNode = defineComponent({
  name: 'OrganizationNode',
  props: {
    node: {
      type: Object,
      required: true,
    },
    expandedNodeIds: {
      type: Array,
      required: true,
    },
  },
  emits: ['toggle'],
  setup(componentProps, { emit }) {
    return () => {
      const node = componentProps.node
      const children = Array.isArray(node.children) ? node.children : []
      const hasChildren = children.length > 0
      const isExpanded = componentProps.expandedNodeIds.includes(node.id)

      return h('article', { class: 'tree-node-wrap' }, [
        h('div', { class: ['tree-node', node.organizationType === 'HQ' ? 'tree-node--hq' : 'tree-node--branch'] }, [
          h('div', { class: 'tree-node__main' }, [
            h('button', {
              class: ['tree-toggle', { hidden: !hasChildren }],
              type: 'button',
              disabled: !hasChildren,
              onClick: () => emit('toggle', node.id),
            }, hasChildren ? (isExpanded ? '-' : '+') : ''),
            h('div', [
              h('strong', node.organizationName),
              h('p', `${node.organizationCode} · ${node.organizationType}`),
            ]),
          ]),
          h('dl', [
            h('div', [h('dt', '전화번호'), h('dd', node.organizationPhone || '-')]),
            h('div', [h('dt', '주소'), h('dd', node.organizationAddress || '-')]),
          ]),
          h(StatusBadge, { status: node.organizationStatus }),
        ]),
        hasChildren && isExpanded
          ? h('div', { class: 'tree-node__children' }, children.map((child) =>
              h(OrganizationNode, {
                key: child.id,
                node: child,
                expandedNodeIds: componentProps.expandedNodeIds,
                onToggle: (id) => emit('toggle', id),
              }),
            ))
          : null,
      ])
    }
  },
})

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
        ACTIVE: ['활성', 'success'],
        INACTIVE: ['비활성', 'muted'],
        NORMAL: ['정상', 'success'],
        LAPSED: ['실효', 'danger'],
      }
      const [label, tone] = statusMap[componentProps.status] ?? [componentProps.status || '-', 'muted']
      return h('span', { class: ['status-badge', `status-badge--${tone}`] }, label)
    }
  },
})

const SummaryCard = defineComponent({
  name: 'SummaryCard',
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  setup(componentProps) {
    return () => h('article', { class: 'summary-card' }, [
      h('span', componentProps.label),
      h('strong', componentProps.value),
    ])
  },
})

const LoadingState = defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  setup(componentProps) {
    return () => h('div', { class: 'state-box' }, [
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
}

.page-header p,
.panel__header p {
  margin: 6px 0 0;
  color: #64748b;
}

.page-header__actions {
  display: flex;
  gap: 10px;
}

.panel {
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
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.button--primary {
  background: #b33a00;
  color: #ffffff;
}

.button--secondary {
  border-color: #e2b8a8;
  background: #ffffff;
  color: #1f2937;
}

.status-tabs {
  display: flex;
  gap: 4px;
}

.status-tabs button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #e8b9a8;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
}

.status-tabs button.active {
  background: #fff7ed;
  color: #b33a00;
  font-weight: 800;
}

.organization-tree {
  display: grid;
  gap: 12px;
}

.tree-node-wrap {
  display: grid;
  gap: 10px;
}

.tree-node {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(260px, 2fr) auto;
  align-items: center;
  gap: 18px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-left-width: 5px;
  border-radius: 8px;
  background: #ffffff;
}

.tree-node--hq {
  border-left-color: #b33a00;
  background: #fff7ed;
}

.tree-node--branch {
  border-left-color: #2563eb;
}

.tree-node__main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tree-node__main strong {
  display: block;
  font-size: 16px;
}

.tree-node__main p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.tree-toggle {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  font-weight: 900;
}

.tree-toggle.hidden {
  visibility: hidden;
}

.tree-node dl,
.fp-profile dl {
  display: grid;
  gap: 6px;
  margin: 0;
}

.tree-node dt,
.fp-profile dt {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
}

.tree-node dd,
.fp-profile dd {
  margin: 2px 0 0;
  color: #334155;
}

.tree-node__children {
  display: grid;
  gap: 10px;
  margin-left: 32px;
  padding-left: 18px;
  border-left: 2px solid #e2e8f0;
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

.field--month {
  width: 200px;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #e8eef5;
  border-radius: 8px;
}

table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: #fff7ed;
}

.status-badge {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-badge--success {
  background: #dcfce7;
  color: #15803d;
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
  margin-top: 16px;
}

.pagination-bar span {
  color: #64748b;
  font-size: 13px;
}

.pagination-bar__buttons {
  display: flex;
  gap: 6px;
}

.pagination-bar button {
  min-width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.pagination-bar button.active {
  border-color: #b33a00;
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
  grid-template-columns: repeat(3, minmax(0, auto));
  gap: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.summary-card {
  padding: 16px;
  border: 1px solid #e8eef5;
  border-radius: 8px;
  background: #ffffff;
}

.summary-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
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
  margin-top: 18px;
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

@media (max-width: 1024px) {
  .filter-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .tree-node {
    grid-template-columns: 1fr;
  }

  .page-header,
  .panel__header,
  .detail-toolbar,
  .pagination-bar,
  .fp-profile {
    align-items: stretch;
    flex-direction: column;
  }

  .field--month {
    width: 100%;
  }

  .fp-profile dl {
    grid-template-columns: 1fr;
  }
}
</style>
