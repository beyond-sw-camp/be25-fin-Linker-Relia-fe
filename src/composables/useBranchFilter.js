import { computed, ref } from 'vue'

import { getBranchOrganizations } from '../api/organizations'
import { USER_ROLES } from '../constants/auth'

const DEFAULT_BRANCH_OPTION = Object.freeze({
  title: '전사(전체 지점)',
  value: '',
})

export function useBranchFilter(authStore) {
  const branches = ref([DEFAULT_BRANCH_OPTION])
  const isLoadingBranches = ref(false)
  const branchErrorMessage = ref('')

  const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
  const showBranchFilter = computed(() => isHqManager.value)

  async function initializeBranchFilter() {
    if (!showBranchFilter.value) {
      return
    }

    await loadBranches()
  }

  async function loadBranches() {
    branchErrorMessage.value = ''
    isLoadingBranches.value = true

    try {
      const response = await getBranchOrganizations()
      const items = Array.isArray(response?.result) ? response.result : []

      branches.value = [
        DEFAULT_BRANCH_OPTION,
        ...items.map((branch) => ({
          title: `${branch.organizationCode} · ${branch.organizationName}`,
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

  return {
    branches,
    showBranchFilter,
    isLoadingBranches,
    branchErrorMessage,
    initializeBranchFilter,
    loadBranches,
  }
}
