import { computed, reactive, ref, watch } from 'vue'

import { getCustomers } from '../api/customers'
import { getBranchOrganizations } from '../api/organizations'
import { USER_ROLES } from '../constants/auth'
import { CUSTOMER_FILTERS } from '../constants/customer'

const DEFAULT_PAGE_SIZE = 10

export function useCustomerList(authStore) {
  const filters = reactive({
    customerType: CUSTOMER_FILTERS.ALL,
    customerName: '',
    keyword: '',
    organizationCode: '',
    page: 1,
    size: DEFAULT_PAGE_SIZE,
  })

  const customerPage = ref(createEmptyPage())
  const summary = ref(createEmptySummary())
  const customers = computed(() => customerPage.value.content ?? [])

  const isLoading = ref(false)
  const errorMessage = ref('')

  const branches = ref([{ title: '전사(전체 지점)', value: '' }])
  const isLoadingBranches = ref(false)
  const branchErrorMessage = ref('')

  const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
  const showBranchFilter = computed(() => isHqManager.value)

  watch(
    () => [filters.customerType, filters.organizationCode],
    () => {
      filters.page = 1
      loadCustomers()
    },
  )

  async function initialize() {
    if (showBranchFilter.value) {
      await loadBranches()
    }

    await loadCustomers()
  }

  async function loadBranches() {
    branchErrorMessage.value = ''
    isLoadingBranches.value = true

    try {
      const response = await getBranchOrganizations()
      const items = Array.isArray(response?.result) ? response.result : []

      branches.value = [
        { title: '전사(전체 지점)', value: '' },
        ...items.map((branch) => ({
          title: branch.organizationName,
          value: branch.organizationCode,
        })),
      ]
    } catch (error) {
      branchErrorMessage.value =
        error.response?.data?.message ||
        error.message ||
        '지점 목록을 불러오지 못했습니다.'
    } finally {
      isLoadingBranches.value = false
    }
  }

  async function loadCustomers() {
    errorMessage.value = ''
    isLoading.value = true

    try {
      const response = await getCustomers(buildCustomerParams(filters, showBranchFilter.value))
      const result = response?.result ?? {}
      const customerPageResult = result.customers ?? {}

      customerPage.value = normalizePage(customerPageResult)
      summary.value = normalizeSummary(result.summary)
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
    filters.customerName = filters.keyword.trim()
    await loadCustomers()
  }

  async function changePage(page) {
    filters.page = page
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
    isHqManager,
    showBranchFilter,
    isLoadingBranches,
    branchErrorMessage,
    initialize,
    searchCustomers,
    changePage,
  }
}

function buildCustomerParams(filters, includeOrganizationCode) {
  const params = {
    page: Math.max(filters.page, 1),
    size: filters.size,
  }

  if (filters.customerType === CUSTOMER_FILTERS.INTEREST) {
    params.interestYn = true
  } else if (filters.customerType !== CUSTOMER_FILTERS.ALL) {
    params.customerStatus = filters.customerType
  }

  if (filters.customerName) {
    params.customerName = filters.customerName
  }

  if (includeOrganizationCode && filters.organizationCode) {
    params.organizationCode = filters.organizationCode
  }

  return params
}

function normalizePage(result) {
  return {
    content: Array.isArray(result.content) ? result.content : [],
    page: Number(result.page ?? 0),
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
    totalCustomerCount: Number(summary?.totalCustomerCount ?? 0),
    contractedCustomerCount: Number(summary?.contractedCustomerCount ?? 0),
    prospectCustomerCount: Number(summary?.prospectCustomerCount ?? 0),
    interestCustomerCount: Number(summary?.interestCustomerCount ?? 0),
  }
}

function createEmptyPage() {
  return {
    content: [],
    page: 0,
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
    contractedCustomerCount: 0,
    prospectCustomerCount: 0,
    interestCustomerCount: 0,
  }
}
