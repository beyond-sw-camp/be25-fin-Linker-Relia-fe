import { computed, reactive, ref, watch } from 'vue'

import { getCustomers } from '../api/customers'
import { useBranchFilter } from './useBranchFilter'

const DEFAULT_PAGE_SIZE = 10

export function useCustomerList(authStore) {
  const filters = reactive({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    customerName: '',
    organizationCode: '',
    customerStatus: '',
  })
  const isResettingFilters = ref(false)

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
    () => [filters.organizationCode, filters.customerStatus],
    () => {
      if (isResettingFilters.value) {
        return
      }

      filters.page = 1
      loadCustomers()
    },
  )

  async function initialize() {
    await initializeBranchFilter()
    await loadCustomers()
  }

  async function loadCustomers() {
    errorMessage.value = ''
    isLoading.value = true

    try {
      const response = await getCustomers(buildCustomerParams(filters, showBranchFilter.value))
      const result = response?.result ?? {}
      const customersResult = result.customers ?? result

      customerPage.value = normalizePage(customersResult)
      summary.value = normalizeSummary(result.summary ?? result.customerSummary ?? result.summaryInfo)
    } catch (error) {
      customerPage.value = createEmptyPage()
      summary.value = createEmptySummary()
      errorMessage.value =
        error.response?.data?.message ||
        error.message ||
        '고객 목록을 불러오지 못했습니다.'
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
    filters.customerName = ''
    filters.organizationCode = ''
    filters.customerStatus = ''

    isResettingFilters.value = false
    await loadCustomers()
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

function buildCustomerParams(filters, includeOrganizationCode) {
  const params = {
    page: Math.max(filters.page, 1),
    size: filters.size,
  }

  if (filters.customerName) {
    params.customerName = filters.customerName.trim()
  }

  if (filters.customerStatus) {
    params.customerStatus = filters.customerStatus
  }

  if (includeOrganizationCode && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  return params
}

function normalizePage(result) {
  return {
    content: Array.isArray(result?.content) ? result.content.map(normalizeCustomerRow) : [],
    page: Number(result?.page ?? result?.number ?? 1),
    size: Number(result?.size ?? DEFAULT_PAGE_SIZE),
    totalElements: Number(result?.totalElements ?? 0),
    totalPages: Number(result?.totalPages ?? 0),
    numberOfElements: Number(result?.numberOfElements ?? 0),
    hasNext: Boolean(result?.hasNext),
    hasPrevious: Boolean(result?.hasPrevious),
    first: Boolean(result?.first),
    last: Boolean(result?.last),
    empty: Boolean(result?.empty),
  }
}

function normalizeSummary(summary) {
  return {
    totalCustomerCount: Number(summary?.totalCustomerCount ?? 0),
    prospectCustomerCount: Number(summary?.prospectCustomerCount ?? 0),
    contractedCustomerCount: Number(summary?.contractedCustomerCount ?? 0),
    closedCustomerCount: Number(summary?.closedCustomerCount ?? 0),
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
    totalCustomerCount: 0,
    prospectCustomerCount: 0,
    contractedCustomerCount: 0,
    closedCustomerCount: 0,
  }
}

function normalizeCustomerRow(customer) {
  return { ...customer }
}
