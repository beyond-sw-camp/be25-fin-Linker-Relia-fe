import { computed, reactive, ref, watch } from 'vue'

import { getInterestCustomers } from '../api/customers'
import { useBranchFilter } from './useBranchFilter'

const DEFAULT_PAGE_SIZE = 10

export function useInterestCustomerList(authStore, route, router) {
  const filters = reactive({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    customerName: '',
    organizationCode: '',
    interestReason: '',
    sortOrder: 'lastConsultedAt,desc',
  })

  const isResettingFilters = ref(false)
  const isApplyingRouteQuery = ref(false)

  const customerPage = ref(createEmptyPage())
  const summary = ref(createEmptySummary())
  const customers = computed(() => customerPage.value.content ?? [])

  const isLoading = ref(false)
  const errorMessage = ref('')

  const {
    branches,
    showBranchFilter,
    isLoadingBranches,
    branchErrorMessage,
    initializeBranchFilter,
  } = useBranchFilter(authStore)

  watch(
    () => [filters.organizationCode, filters.interestReason, filters.sortOrder],
    () => {
      if (isResettingFilters.value || isApplyingRouteQuery.value) {
        return
      }

      filters.page = 1
      loadCustomers()
    },
  )

  async function initialize() {
    applyQueryToFilters()
    await initializeBranchFilter()
    await loadCustomers()
  }

  async function loadCustomers() {
    errorMessage.value = ''
    isLoading.value = true
    await syncQuery()

    try {
      const response = await getInterestCustomers(buildInterestCustomerParams(filters, showBranchFilter.value))
      const result = response?.result ?? {}
      const customersResult = result.customers ?? {}

      customerPage.value = normalizePage(customersResult)
      summary.value = normalizeSummary(result.summary)
    } catch (error) {
      customerPage.value = createEmptyPage()
      summary.value = createEmptySummary()
      errorMessage.value =
        error.response?.data?.message ||
        error.message ||
        '관심 고객 목록을 불러오지 못했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  async function searchCustomers() {
    filters.page = 1
    await loadCustomers()
  }

  async function changePage(page) {
    filters.page = page
    await loadCustomers()
  }

  async function resetFilters() {
    isResettingFilters.value = true

    filters.page = 1
    filters.size = DEFAULT_PAGE_SIZE
    filters.customerName = ''
    filters.organizationCode = ''
    filters.interestReason = ''
    filters.sortOrder = 'lastConsultedAt,desc'

    isResettingFilters.value = false
    await loadCustomers()
  }

  async function syncQuery() {
    const nextQuery = buildQueryFromFilters(filters, showBranchFilter.value)
    const currentQuery = normalizeQuery(route.query)

    if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) {
      return
    }

    await router.replace({
      query: nextQuery,
    })
  }

  function applyQueryToFilters() {
    const page = toPositiveInteger(route.query.page, 1)
    const size = toPositiveInteger(route.query.size, DEFAULT_PAGE_SIZE)

    isApplyingRouteQuery.value = true

    filters.page = page
    filters.size = size
    filters.customerName = toStringOrEmpty(route.query.customerName)
    filters.organizationCode = showBranchFilter.value ? toStringOrEmpty(route.query.organizationCode) : ''
    filters.interestReason = toStringOrEmpty(route.query.interestReason)
    filters.sortOrder = toStringOrEmpty(route.query.sortOrder) || 'lastConsultedAt,desc'

    isApplyingRouteQuery.value = false
  }

  return {
    filters,
    customers,
    customerPage,
    summary,
    branches,
    isLoading,
    errorMessage,
    showBranchFilter,
    isLoadingBranches,
    branchErrorMessage,
    initialize,
    searchCustomers,
    resetFilters,
    changePage,
  }
}

function buildInterestCustomerParams(filters, includeOrganizationCode) {
  const params = {
    page: Math.max(filters.page, 1),
    size: Math.max(filters.size, 1),
    sort: filters.sortOrder,
  }

  if (filters.customerName) {
    params.customerName = filters.customerName.trim()
  }

  if (includeOrganizationCode && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  if (filters.interestReason) {
    params.interestReason = filters.interestReason
  }

  return params
}

function buildQueryFromFilters(filters, includeOrganizationCode) {
  const query = {
    page: String(Math.max(filters.page, 1)),
    size: String(Math.max(filters.size, 1)),
  }

  if (filters.customerName) {
    query.customerName = filters.customerName.trim()
  }

  if (includeOrganizationCode && filters.organizationCode) {
    query.organizationCode = filters.organizationCode
  }

  if (filters.interestReason) {
    query.interestReason = filters.interestReason
  }

  query.sortOrder = filters.sortOrder

  return query
}

function normalizePage(result) {
  return {
    content: Array.isArray(result.content) ? result.content : [],
    page: Number(result.page ?? 1),
    size: Number(result.size ?? DEFAULT_PAGE_SIZE),
    totalElements: Number(result.totalElements ?? 0),
    totalPages: Number(result.totalPages ?? 0),
    numberOfElements: Number(result.numberOfElements ?? 0),
    hasNext: Boolean(result.hasNext),
    hasPrevious: Boolean(result.hasPrevious),
    first: Boolean(result.first),
    last: Boolean(result.last),
    empty: Boolean(result.empty),
  }
}

function normalizeSummary(summary) {
  return {
    totalInterestCustomerCount: Number(summary?.totalInterestCustomerCount ?? 0),
    unpaidInterestCustomerCount: Number(summary?.unpaidInterestCustomerCount ?? 0),
    renewalDueInterestCustomerCount: Number(summary?.renewalDueInterestCustomerCount ?? 0),
    maturityDueInterestCustomerCount: Number(summary?.maturityDueInterestCustomerCount ?? 0),
  }
}

function createEmptyPage() {
  return {
    content: [],
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true,
    empty: true,
  }
}

function createEmptySummary() {
  return {
    totalInterestCustomerCount: 0,
    unpaidInterestCustomerCount: 0,
    renewalDueInterestCustomerCount: 0,
    maturityDueInterestCustomerCount: 0,
  }
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function toStringOrEmpty(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeQuery(query) {
  const normalized = {}

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      normalized[key] = value
    }
  })

  return normalized
}
