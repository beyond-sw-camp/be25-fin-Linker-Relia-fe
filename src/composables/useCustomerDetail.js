import { reactive, ref, watch } from 'vue'

import {
  createCustomerAiBriefing,
  getCustomerAiBriefing,
  getCustomerConsultations,
  getCustomerContracts,
  getCustomerDetail,
  getCustomerFpHistories,
} from '../api/customers'

const DEFAULT_PAGE_SIZE = 10

export function useCustomerDetail(customerId) {
  const customer = ref(null)
  const isLoadingCustomer = ref(false)
  const customerErrorMessage = ref('')

  const contracts = reactive({
    items: [],
    isLoading: false,
    errorMessage: '',
    loaded: false,
  })

  const consultations = reactive({
    items: [],
    page: createEmptyPage(),
    params: { page: 1, size: DEFAULT_PAGE_SIZE },
    isLoading: false,
    errorMessage: '',
    loaded: false,
  })

  const briefing = reactive({
    item: null,
    isLoading: false,
    isGenerating: false,
    errorMessage: '',
    loaded: false,
  })

  const fpHistories = reactive({
    items: [],
    page: createEmptyPage(),
    params: { page: 1, size: DEFAULT_PAGE_SIZE },
    isLoading: false,
    errorMessage: '',
    loaded: false,
  })

  watch(
    () => customerId.value,
    () => {
      resetAll()
    },
  )

  async function loadCustomer() {
    customerErrorMessage.value = ''
    isLoadingCustomer.value = true

    try {
      const response = await getCustomerDetail(customerId.value)
      customer.value = response?.result ?? null
    } catch (error) {
      customer.value = null
      customerErrorMessage.value =
        error.response?.data?.message ||
        error.message ||
        '고객 기본 정보를 불러오지 못했습니다.'
    } finally {
      isLoadingCustomer.value = false
    }
  }

  async function loadContracts(force = false) {
    if (contracts.loaded && !force) {
      return
    }

    contracts.errorMessage = ''
    contracts.isLoading = true

    try {
      const response = await getCustomerContracts(customerId.value)
      contracts.items = Array.isArray(response?.result) ? response.result : []
      contracts.loaded = true
    } catch (error) {
      contracts.items = []
      contracts.errorMessage =
        error.response?.data?.message ||
        error.message ||
        '보유 계약 정보를 불러오지 못했습니다.'
    } finally {
      contracts.isLoading = false
    }
  }

  async function loadConsultations(force = false) {
    if (consultations.loaded && !force) {
      return
    }

    consultations.errorMessage = ''
    consultations.isLoading = true

    try {
      const response = await getCustomerConsultations(customerId.value, {
        page: Math.max(consultations.params.page, 1),
        size: consultations.params.size,
      })
      const result = response?.result ?? {}
      consultations.items = Array.isArray(result.content) ? result.content : []
      consultations.page = normalizePage(result)
      consultations.loaded = true
    } catch (error) {
      consultations.items = []
      consultations.page = createEmptyPage()
      consultations.errorMessage =
        error.response?.data?.message ||
        error.message ||
        '상담 이력을 불러오지 못했습니다.'
    } finally {
      consultations.isLoading = false
    }
  }

  async function loadBriefing(force = false) {
    if (briefing.loaded && !force) {
      return
    }

    briefing.errorMessage = ''
    briefing.isLoading = true

    try {
      const response = await getCustomerAiBriefing(customerId.value)
      briefing.item = response?.result ?? null
      briefing.loaded = true
    } catch (error) {
      briefing.item = null
      briefing.errorMessage =
        error.response?.data?.message ||
        error.message ||
        'AI 브리핑을 불러오지 못했습니다.'
    } finally {
      briefing.isLoading = false
    }
  }

  async function createBriefing() {
    if (briefing.isGenerating || !briefing.item?.canGenerate) {
      return
    }

    briefing.errorMessage = ''
    briefing.isGenerating = true

    try {
      const response = await createCustomerAiBriefing(customerId.value)
      briefing.item = response?.result ?? null
      briefing.loaded = true
    } catch (error) {
      briefing.errorMessage =
        error.response?.data?.message ||
        error.message ||
        'AI 상담 브리핑을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.'
    } finally {
      briefing.isGenerating = false
    }
  }

  async function loadFpHistories(force = false) {
    if (fpHistories.loaded && !force) {
      return
    }

    fpHistories.errorMessage = ''
    fpHistories.isLoading = true

    try {
      const response = await getCustomerFpHistories(customerId.value, {
        page: Math.max(fpHistories.params.page, 1),
        size: fpHistories.params.size,
      })
      const result = response?.result ?? {}
      fpHistories.items = Array.isArray(result.content) ? result.content : []
      fpHistories.page = normalizePage(result)
      fpHistories.loaded = true
    } catch (error) {
      fpHistories.items = []
      fpHistories.page = createEmptyPage()
      fpHistories.errorMessage =
        error.response?.data?.message ||
        error.message ||
        '설계사 변경 이력을 불러오지 못했습니다.'
    } finally {
      fpHistories.isLoading = false
    }
  }

  async function changeConsultationPage(page) {
    consultations.params.page = page
    consultations.loaded = false
    await loadConsultations(true)
  }

  async function changeFpHistoryPage(page) {
    fpHistories.params.page = page
    fpHistories.loaded = false
    await loadFpHistories(true)
  }

  function resetAll() {
    customer.value = null
    customerErrorMessage.value = ''
    contracts.items = []
    contracts.loaded = false
    contracts.errorMessage = ''
    consultations.items = []
    consultations.page = createEmptyPage()
    consultations.params.page = 1
    consultations.loaded = false
    consultations.errorMessage = ''
    briefing.item = null
    briefing.isLoading = false
    briefing.isGenerating = false
    briefing.loaded = false
    briefing.errorMessage = ''
    fpHistories.items = []
    fpHistories.page = createEmptyPage()
    fpHistories.params.page = 1
    fpHistories.loaded = false
    fpHistories.errorMessage = ''
  }

  return {
    customer,
    isLoadingCustomer,
    customerErrorMessage,
    contracts,
    consultations,
    briefing,
    fpHistories,
    loadCustomer,
    loadContracts,
    loadConsultations,
    loadBriefing,
    createBriefing,
    loadFpHistories,
    changeConsultationPage,
    changeFpHistoryPage,
  }
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
