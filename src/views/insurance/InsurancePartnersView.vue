<template>
  <section class="insurance-page">
    <div v-if="canRegister" class="insurance-page__header">
      <div class="insurance-page__header-actions">
        <v-btn
          class="insurance-page__create-button"
          @click="handleRegisterClick"
        >
          + 보험사 등록
        </v-btn>
      </div>
    </div>

    <v-alert v-if="noticeMessage" type="info" variant="tonal" density="comfortable">
      {{ noticeMessage }}
    </v-alert>

    <div class="insurance-page__summary">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-card__icon" :style="{ backgroundColor: card.tone, color: card.accent }">
          <v-icon :icon="card.icon" size="18" />
        </div>
        <div class="summary-card__content">
          <span class="summary-card__label">{{ card.label }}</span>
          <div class="summary-card__value">
            <strong>{{ card.value }}</strong>
            <span>개</span>
          </div>
          <p>{{ card.caption }}</p>
        </div>
      </article>
    </div>

    <div class="insurance-page__toolbar">
      <div class="insurance-page__filter-row">
        <div class="insurance-page__search-group">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            label="상태"
            variant="outlined"
            density="comfortable"
            hide-details
            class="insurance-page__status-filter"
            @update:model-value="handleStatusChange"
          />

          <v-text-field
            v-model="filters.keyword"
            label="보험사명"
            placeholder="보험사명을 입력하세요"
            variant="outlined"
            density="comfortable"
            hide-details
            class="insurance-page__name-filter"
            @keyup.enter="searchCompanies"
          />

          <v-btn class="insurance-page__search-button" @click="searchCompanies">
            검색
          </v-btn>
          <v-btn
            variant="outlined"
            class="insurance-page__reset-button"
            @click="resetFilters"
          >
            초기화
          </v-btn>
        </div>
      </div>
    </div>

    <section class="insurance-panel">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <div v-if="isLoading" class="insurance-panel__state">
        <v-progress-circular indeterminate color="#f97316" />
        <p>제휴 보험사 목록을 불러오는 중입니다.</p>
      </div>

      <template v-else-if="companyPage.content.length > 0">
        <div class="insurance-table">
          <table>
            <thead>
              <tr>
                <th>보험사명</th>
                <th>대표 연락처</th>
                <th>상태</th>
                <th>제휴 시작일</th>
                <th>제휴 해지일</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in companyPage.content" :key="company.insuranceCompanyId">
                <td v-if="canRegister">
                  <button
                    type="button"
                    class="insurance-table__name insurance-table__name-button"
                    @click="goToCompanyDetail(company)"
                  >
                    {{ company.insuranceCompanyName }}
                  </button>
                </td>
                <td v-else class="insurance-table__text">
                  {{ company.insuranceCompanyName }}
                </td>
                <td>{{ company.insuranceCompanyPhone || '-' }}</td>
                <td>
                  <span class="insurance-status" :class="getStatusClass(company.insuranceCompanyStatus)">
                    {{ getStatusLabel(company.insuranceCompanyStatus) }}
                  </span>
                </td>
                <td>{{ formatDate(company.partnerStartedAt) }}</td>
                <td>{{ formatDate(company.partnerTerminatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="insurance-page__pagination">
          <span>총 {{ companyPage.totalElements.toLocaleString('ko-KR') }}건</span>
          <v-pagination
            :model-value="filters.page"
            :length="Math.max(companyPage.totalPages, 1)"
            total-visible="7"
            rounded="circle"
            @update:model-value="changePage"
          />
        </div>
      </template>

      <div v-else class="insurance-panel__state">
        <p>조회된 보험사가 없습니다.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getInsuranceManagementCompanies } from '../../api/insurance'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

defineProps({
  title: {
    type: String,
    default: '제휴 보험사 목록',
  },
  description: {
    type: String,
    default: '한화금융서비스와 제휴된 보험사 정보를 조회할 수 있습니다.',
  },
})

const authStore = useAuthStore()
const router = useRouter()

const statusOptions = [
  { label: '전체 상태', value: '' },
  { label: '활성', value: 'ACTIVE' },
  { label: '비활성', value: 'INACTIVE' },
]

const filters = reactive({
  keyword: '',
  status: '',
  page: 1,
  size: 10,
})

const companyPage = ref(createEmptyPage())
const isLoading = ref(false)
const errorMessage = ref('')
const noticeMessage = ref('')

const canRegister = computed(() => authStore.userRole === USER_ROLES.SYSTEM_ADMIN)

const activeCompanyCount = computed(() =>
  companyPage.value.content.filter((company) => company.insuranceCompanyStatus === 'ACTIVE').length,
)

const inactiveCompanyCount = computed(() =>
  companyPage.value.content.filter((company) => company.insuranceCompanyStatus === 'INACTIVE').length,
)

const summaryCards = computed(() => [
  {
    label: '전체 제휴 보험사',
    value: formatCount(companyPage.value.totalElements),
    caption: '등록된 전체 제휴 보험사 수',
    accent: '#ea580c',
    tone: '#fff7ed',
    icon: 'mdi-office-building-outline',
  },
  {
    label: '활성 보험사',
    value: formatCount(activeCompanyCount.value),
    caption: '현재 활성 상태 보험사 수',
    accent: '#16a34a',
    tone: '#ecfdf3',
    icon: 'mdi-check-decagram-outline',
  },
  {
    label: '비활성 보험사',
    value: formatCount(inactiveCompanyCount.value),
    caption: '현재 비활성 상태 보험사 수',
    accent: '#64748b',
    tone: '#f1f5f9',
    icon: 'mdi-minus-circle-outline',
  },
])

onMounted(() => {
  loadCompanies()
})

async function loadCompanies() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getInsuranceManagementCompanies({
      insuranceCompanyName: filters.keyword || undefined,
      insuranceCompanyStatus: filters.status || undefined,
      page: filters.page,
      size: filters.size,
    })

    companyPage.value = normalizeCompanyPage(response?.result, filters.size)
  } catch (error) {
    companyPage.value = createEmptyPage(filters.size)
    errorMessage.value = getApiErrorMessage(error, '보험사 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function searchCompanies() {
  filters.page = 1
  loadCompanies()
}

function handleStatusChange() {
  filters.page = 1
  loadCompanies()
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.page = 1
  noticeMessage.value = ''
  loadCompanies()
}

function changePage(page) {
  filters.page = page
  loadCompanies()
}

function handleRegisterClick() {
  router.push({ name: 'insurance-partner-create' })
}

function goToCompanyDetail(company) {
  router.push({
    name: 'insurance-partner-detail',
    params: {
      insuranceCompanyId: company.insuranceCompanyId,
    },
  })
}

function normalizeCompanyPage(payload, defaultSize = 10) {
  const content = Array.isArray(payload?.content)
    ? payload.content.map((item, index) => ({
      insuranceCompanyId: item.insuranceCompanyId ?? `insurance-company-${index}`,
      insuranceCompanyName: item.insuranceCompanyName ?? '-',
      insuranceCompanyPhone: item.insuranceCompanyPhone ?? '',
      insuranceCompanyStatus: normalizeStatus(item.insuranceCompanyStatus),
      partnerStartedAt: item.partnerStartedAt ?? null,
      partnerTerminatedAt: item.partnerTerminatedAt ?? null,
    }))
    : []

  return {
    content,
    page: Number(payload?.page ?? 1),
    size: Number(payload?.size ?? defaultSize),
    totalElements: Number(payload?.totalElements ?? content.length),
    totalPages: Number(payload?.totalPages ?? 1),
  }
}

function normalizeStatus(status) {
  if (!status) return ''
  if (status === 'ACTIVE' || status === 'INACTIVE') return status
  return String(status).toUpperCase()
}

function createEmptyPage(size = 10) {
  return {
    content: [],
    page: 1,
    size,
    totalElements: 0,
    totalPages: 1,
  }
}

function getStatusLabel(status) {
  if (status === 'ACTIVE') return '활성'
  if (status === 'INACTIVE') return '비활성'
  return '-'
}

function getStatusClass(status) {
  if (status === 'ACTIVE') return 'insurance-status--active'
  if (status === 'INACTIVE') return 'insurance-status--inactive'
  return 'insurance-status--neutral'
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).replaceAll('-', '.')
}

function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage
}
</script>

<style scoped>
.insurance-page {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.insurance-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 16px;
}

.insurance-page__create-button {
  min-width: 116px;
  height: 40px;
  background: #f97316;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  border-radius: 10px;
}

.insurance-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 96px;
  padding: 16px 18px;
  border: 1px solid #e9edf5;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
}

.summary-card__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  flex: 0 0 auto;
}

.summary-card__content {
  display: grid;
  gap: 2px;
}

.summary-card__label {
  color: #64748b;
  font-size: 13px;
}

.summary-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.summary-card__value strong {
  font-size: 28px;
  line-height: 1.08;
  color: #111827;
}

.summary-card__value span {
  color: #475569;
  font-size: 13px;
}

.summary-card__content p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.insurance-panel {
  padding: 0;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #edf1f7;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
  min-width: 0;
  overflow: hidden;
}

.insurance-page__toolbar {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.insurance-page__filter-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  flex-wrap: wrap;
}

.insurance-page__search-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}

.insurance-page__name-filter {
  width: 160px;
  max-width: 100%;
  flex: 0 0 160px;
}

.insurance-page__status-filter {
  width: 160px;
  max-width: 100%;
  flex: 0 0 auto;
}

.insurance-page__search-button {
  width: 55px;
  min-width: 55px;
  height: 34px;
  border: 1px solid rgba(249, 115, 22, 0.28);
  border-radius: 10px;
  background: #fff7ed;
  color: #f97316;
  padding: 0 18px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.insurance-page__search-button:hover {
  transform: translateY(-1px);
  border-color: rgba(249, 115, 22, 0.55);
  background: #ffedd5;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);
}

.insurance-page__search-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.08);
}

.insurance-page__reset-button {
  width: 55px;
  min-width: 55px;
  height: 34px;
  border-radius: 10px;
  border-color: #d1d5db;
  color: #475569;
  padding: 0 16px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  box-shadow: none;
}

.insurance-panel__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 260px;
  color: #64748b;
  padding: 20px;
}

.insurance-table {
  overflow-x: auto;
  border: 1px solid #f0f3f8;
  border-radius: 16px;
  min-width: 0;
  margin: 12px;
}

.insurance-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.insurance-table th,
.insurance-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: center;
  color: #475569;
}

.insurance-table th {
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.insurance-table__name {
  color: #f97316;
  font-weight: 700;
}

.insurance-table__text {
  color: #111827;
  font-weight: 700;
}

.insurance-table__name-button {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: #f97316;
  font: inherit;
  font-weight: 700;
  text-align: center;
}

.insurance-table tr:last-child td {
  border-bottom: 0;
}

.insurance-table__name-button:hover {
  color: #ea580c;
  text-decoration: underline;
}

.insurance-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.insurance-status--active {
  background: #dcfce7;
  color: #16a34a;
}

.insurance-status--inactive {
  background: #f1f5f9;
  color: #64748b;
}

.insurance-status--neutral {
  background: #f8fafc;
  color: #94a3b8;
}

.insurance-page__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 16px;
  color: #64748b;
  font-size: 12px;
}

.insurance-page__status-filter :deep(.v-field),
.insurance-page__name-filter :deep(.v-field) {
  min-height: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: none;
}

.insurance-page__status-filter :deep(.v-field__input),
.insurance-page__name-filter :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 14px;
}

.insurance-page__pagination :deep(.v-pagination__item--is-active .v-btn) {
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 1024px) {
  .insurance-page__header,
  .insurance-page__filter-row,
  .insurance-page__pagination {
    display: grid;
    grid-template-columns: 1fr;
  }

  .insurance-page__header-actions {
    justify-content: flex-start;
  }

  .insurance-page__search-group {
    margin-left: 0;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .insurance-page__search-group {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }

  .insurance-page__filter-row {
    align-items: stretch;
  }

  .insurance-page__status-filter,
  .insurance-page__name-filter {
    width: 100%;
    flex: 1 1 auto;
  }

  .insurance-page__reset-button {
    align-self: flex-start;
  }
}
</style>
