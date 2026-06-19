<template>
  <section class="manager-dashboard" aria-label="관리자 대시보드">
    <div class="dashboard-filter">
      <label v-if="isHqManager" class="dashboard-filter__field">
        <span>지점 선택</span>
        <select v-model="selectedBranch" :disabled="isLoadingBranches">
          <option v-for="branch in branchOptions" :key="branch.value" :value="branch.value">
            {{ branch.label }}
          </option>
        </select>
        <small v-if="branchErrorMessage" class="dashboard-filter__error">{{ branchErrorMessage }}</small>
      </label>

      <label class="dashboard-filter__field">
        <span>기간 선택</span>
        <select v-model="selectedMonth">
          <option v-for="month in monthOptions" :key="month" :value="month">
            {{ month }}
          </option>
        </select>
      </label>
    </div>

    <section class="report-panel">
      <div class="report-panel__heading">
        <h2>종합 실적 보고서</h2>
        <p>맞춤형 고객 관계 관리 솔루션을 만나보세요.</p>
      </div>

      <div class="metric-grid">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong :class="{ 'is-danger': metric.danger }">
            {{ metric.value }}<small>{{ metric.unit }}</small>
          </strong>
          <p :class="metric.trendClass">{{ metric.caption }}</p>
        </article>
      </div>

      <div class="top-performer-grid">
        <article v-for="performer in topPerformers" :key="performer.eyebrow" class="top-performer-card">
          <span>{{ performer.eyebrow }}</span>
          <p><strong>{{ performer.name }}</strong> {{ performer.meta }}</p>
        </article>
      </div>
    </section>

    <div class="chart-grid">
      <section v-for="chart in donutCharts" :key="chart.title" class="chart-panel">
        <h3>{{ chart.title }}</h3>
        <div class="donut-summary">
          <div class="donut-chart" :style="{ background: chart.gradient }">
            <strong>100</strong>
            <span>전체 건</span>
          </div>
          <ul>
            <li v-for="item in chart.items" :key="item.label">
              <i :style="{ backgroundColor: item.color }"></i>
              {{ item.label }}
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section class="ranking-panel">
      <div class="ranking-panel__heading">
        <div>
          <div class="ranking-panel__tabs">
            <button
              type="button"
              class="ranking-panel__tab"
              :class="{ active: !isBranchRankingView }"
              @click="rankingTab = 'advisor'"
            >
              설계사 순위
            </button>
            <button
              type="button"
              class="ranking-panel__tab"
              :class="{ active: isBranchRankingView }"
              @click="rankingTab = 'branch'"
            >
              지점 순위
            </button>
            <span class="ranking-panel__hint">{{ rankingHint }}</span>
          </div>
          <h2>{{ rankingTitle }}</h2>
        </div>

        <div v-if="!isBranchRankingView" class="ranking-panel__controls">
          <select v-model="advisorSortKey" class="ranking-panel__sort">
            <option value="contracts">최신 계약순</option>
            <option value="retention">계약 유지율순</option>
            <option value="customers">담당 고객수순</option>
          </select>
        </div>
      </div>

      <div class="ranking-table-wrap">
        <table v-if="isBranchRankingView" class="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>지점명</th>
              <th>매출액</th>
              <th>순위 변동</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="branch in rankingRows" :key="branch.rank">
              <td :class="{ 'is-first': branch.rank === 1 }">#{{ branch.rank }}</td>
              <td>
                <div class="branch-cell">
                  <span :style="{ color: branch.color, backgroundColor: branch.tone }">{{ branch.badge }}</span>
                  <div>
                    <strong>{{ branch.name }}</strong>
                    <small>{{ branch.location }}</small>
                  </div>
                </div>
              </td>
              <td><strong>{{ branch.revenue }}</strong></td>
              <td :class="branch.changeType">{{ branch.change }}</td>
            </tr>
          </tbody>
        </table>

        <table v-else class="ranking-table ranking-table--advisor">
          <thead>
            <tr>
              <th>순위</th>
              <th>설계사명</th>
              <th v-if="isAllBranchSelected" class="advisor-col--branch">소속 지점</th>
              <th class="advisor-col--metric">계약 건수</th>
              <th class="advisor-col--metric">계약 유지율</th>
              <th class="advisor-col--metric">담당 고객수</th>
              <th class="advisor-col--metric">미관리 고객수</th>
              <th class="advisor-col--metric">상태</th>
              <th class="advisor-col--metric">상세 정보</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="advisor in advisorRows" :key="advisor.rowKey">
              <td>
                <span class="advisor-rank" :class="advisor.rankClass">{{ advisor.rank }}</span>
              </td>
              <td>{{ advisor.name }}</td>
              <td v-if="isAllBranchSelected" class="advisor-col--branch">{{ advisor.branchName }}</td>
              <td class="advisor-col--metric">{{ advisor.contracts }}</td>
              <td class="advisor-col--metric">{{ advisor.retention }}</td>
              <td class="advisor-col--metric">{{ advisor.customers }}</td>
              <td class="advisor-col--metric">{{ advisor.unmanaged }}</td>
              <td class="advisor-col--metric">
                <span class="status-pill" :class="advisor.statusClass">{{ advisor.status }}</span>
              </td>
              <td class="advisor-col--metric">
                <button type="button" class="detail-button">보기</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ranking-panel__footer">
        <span>{{ footerText }}</span>
        <div class="pagination">
          <button type="button" aria-label="이전 페이지">
            <v-icon icon="mdi-chevron-left" size="16" />
          </button>
          <button v-for="page in 5" :key="page" type="button" :class="{ active: page === 1 }">
            {{ page }}
          </button>
          <button type="button" aria-label="다음 페이지">
            <v-icon icon="mdi-chevron-right" size="16" />
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

import { getBranchOrganizations } from '../../api/organizations'
import { USER_ROLES } from '../../constants/auth'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const selectedBranch = ref('전체 지점')
const selectedMonth = ref('2026년 5월')
const advisorSortKey = ref('contracts')
const rankingTab = ref('advisor')
const isLoadingBranches = ref(false)
const branchErrorMessage = ref('')

const fallbackBranchNames = [
  '강남본부 강남지점',
  '서초 중앙 지점',
  '해운대 마린 지점',
  '잠실 에비뉴 지점',
  '판교 테크노 지점',
]

const branchOptions = ref([
  { label: '전체 지점', value: '전체 지점' },
  ...fallbackBranchNames.map((branchName) => ({
    label: branchName,
    value: branchName,
  })),
])

const monthOptions = ['2026년 5월', '2026년 4월', '2026년 3월']

const isHqManager = computed(() => authStore.userRole === USER_ROLES.HQ_MANAGER)
const isAllBranchSelected = computed(() => isHqManager.value && selectedBranch.value === '전체 지점')
const currentBranchName = computed(() => {
  if (isHqManager.value) {
    return selectedBranch.value
  }

  return authStore.user.organizationName || '강남본부 강남지점'
})

const isBranchRankingView = computed(() => isHqManager.value && rankingTab.value === 'branch')

const rankingTitle = computed(() => {
  if (isBranchRankingView.value) {
    return '지점별 순위'
  }

  if (isAllBranchSelected.value) {
    return '전체 지점 설계사 실적 순위'
  }

  return `${currentBranchName.value} 설계사 실적 순위`
})

const rankingHint = computed(() => {
  if (isBranchRankingView.value) {
    return '지점별 매출 순위를 확인할 수 있습니다.'
  }

  if (isAllBranchSelected.value) {
    return '전체 지점의 설계사 실적을 통합해 보여줍니다.'
  }

  return '선택한 지점의 설계사 순위를 확인할 수 있습니다.'
})

const footerText = computed(() => {
  if (isBranchRankingView.value) {
    return '표시 항목: 1 - 5 / 총 152개 지점'
  }

  if (isAllBranchSelected.value) {
    return `총 ${allAdvisorRows.length}명 중 1 - ${Math.min(allAdvisorRows.length, 8)} 표시`
  }

  return '총 156개 중 1 - 8 표시'
})

const metrics = [
  {
    label: '설계사',
    value: '12,540',
    unit: '명',
    caption: '전월 대비 ▲ 148명',
    trendClass: 'is-up',
  },
  {
    label: '고객',
    value: '421,910',
    unit: '명',
    caption: '전월 대비 ▲ 10,284명',
    trendClass: 'is-up',
  },
  {
    label: '계약',
    value: '14,208',
    unit: '건',
    caption: '전월 대비 ▲ 113건',
    trendClass: 'is-up',
  },
  {
    label: '관심 고객',
    value: '28',
    unit: '명',
    caption: '전월 대비 ▲ 6명',
    trendClass: 'is-up',
    danger: true,
  },
  {
    label: '계약 성공률',
    value: '68.4',
    unit: '%',
    caption: '전월 대비 ▼ 1.8%',
    trendClass: 'is-down',
  },
  {
    label: '계약 유지율',
    value: '79.6',
    unit: '%',
    caption: '전월 대비 ▲ 1.4%',
    trendClass: 'is-goal',
  },
  {
    label: '해지 계약 수',
    value: '42',
    unit: '건',
    caption: '전월 대비 ▼ 2건',
    trendClass: 'is-down',
  },
  {
    label: '수입 수수료',
    value: '4억 2,500',
    unit: '만원',
    caption: '지급 수수료 4억 2,500만원',
    trendClass: 'is-muted',
  },
]

onMounted(() => {
  if (isHqManager.value) {
    loadBranchOptions()
  }
})

async function loadBranchOptions() {
  branchErrorMessage.value = ''
  isLoadingBranches.value = true

  try {
    const response = await getBranchOrganizations()
    const organizations = Array.isArray(response?.result) ? response.result : []

    if (organizations.length === 0) {
      branchOptions.value = [
        { label: '전체 지점', value: '전체 지점' },
        ...fallbackBranchNames.map((branchName) => ({
          label: branchName,
          value: branchName,
        })),
      ]
      return
    }

    branchOptions.value = [
      { label: '전체 지점', value: '전체 지점' },
      ...organizations.map((branch) => ({
        label: branch.organizationName ?? branch.organizationCode ?? '이름 없는 지점',
        value: branch.organizationName ?? branch.organizationCode ?? '이름 없는 지점',
      })),
    ]

    const hasSelectedBranch = branchOptions.value.some((branch) => branch.value === selectedBranch.value)
    if (!hasSelectedBranch) {
      selectedBranch.value = '전체 지점'
    }
  } catch (error) {
    branchErrorMessage.value =
      error.response?.data?.message ||
      error.message ||
      '지점 목록을 불러오지 못했습니다. 기본 목록을 표시합니다.'
  } finally {
    isLoadingBranches.value = false
  }
}

const donutCharts = [
  {
    title: '보험사별 계약 비율',
    gradient: 'conic-gradient(#f97316 0 28%, #f59e0b 28% 50%, #2563eb 50% 64%, #dfe3ea 64% 75%, transparent 75% 100%)',
    items: [
      { label: '삼성화재', color: '#f97316' },
      { label: '현대해상', color: '#f59e0b' },
      { label: '신보연금', color: '#2563eb' },
      { label: '다이렉트', color: '#dfe3ea' },
    ],
  },
  {
    title: '보종별 계약 비율',
    gradient: 'conic-gradient(#f97316 0 28%, #f59e0b 28% 50%, #2563eb 50% 64%, #dfe3ea 64% 75%, transparent 75% 100%)',
    items: [
      { label: '장기보험', color: '#f97316' },
      { label: '실손보험', color: '#f59e0b' },
      { label: '기업보험', color: '#2563eb' },
      { label: '자동차보험', color: '#dfe3ea' },
    ],
  },
]

const rankingRows = [
  {
    rank: 1,
    badge: '강남',
    name: '강남 프라임 지점',
    location: '서울시 강남구',
    revenue: '₩ 4,280M',
    change: '↑ 5',
    changeType: 'is-up',
    color: '#f97316',
    tone: '#ffedd5',
  },
  {
    rank: 2,
    badge: '서초',
    name: '서초 중앙 지점',
    location: '서울시 서초구',
    revenue: '₩ 3,910M',
    change: '↑ 12.5%',
    changeType: 'is-up',
    color: '#64748b',
    tone: '#e8edf8',
  },
  {
    rank: 3,
    badge: '부산',
    name: '해운대 마린 지점',
    location: '부산시 해운대구',
    revenue: '₩ 3,450M',
    change: '↑ 8.4%',
    changeType: 'is-up',
    color: '#2563eb',
    tone: '#eaf2ff',
  },
  {
    rank: 4,
    badge: '송파',
    name: '잠실 에비뉴 지점',
    location: '서울시 송파구',
    revenue: '₩ 3,120M',
    change: '↓ 2.1%',
    changeType: 'is-down',
    color: '#0f766e',
    tone: '#e8fbf7',
  },
  {
    rank: 5,
    badge: '판교',
    name: '판교 테크노 지점',
    location: '성남시 분당구',
    revenue: '₩ 2,980M',
    change: '↑ 5.7%',
    changeType: 'is-up',
    color: '#4f46e5',
    tone: '#eef2ff',
  },
]

const advisorRowsByBranch = {
  '강남본부 강남지점': [
    { rank: 1, name: '홍길동 설계사', contracts: '88건', retention: '91.1%', customers: '256명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이미자 설계사', contracts: '81건', retention: '84.3%', customers: '213명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-silver' },
    { rank: 3, name: '박철수 설계사', contracts: '76건', retention: '79.6%', customers: '178명', unmanaged: '8명', status: '실효', statusClass: 'is-danger', rankClass: 'is-bronze' },
    { rank: 4, name: '최영희 설계사', contracts: '72건', retention: '76.2%', customers: '154명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '이정우 설계사', contracts: '69건', retention: '71.8%', customers: '134명', unmanaged: '3명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '김민준 설계사', contracts: '68건', retention: '70.2%', customers: '130명', unmanaged: '9명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '박지수 설계사', contracts: '47건', retention: '67.9%', customers: '116명', unmanaged: '1명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '김태호 설계사', contracts: '40건', retention: '67.1%', customers: '111명', unmanaged: '1명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '서초 중앙 지점': [
    { rank: 1, name: '정유진 설계사', contracts: '84건', retention: '89.4%', customers: '241명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '김하늘 설계사', contracts: '77건', retention: '85.8%', customers: '224명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '오세훈 설계사', contracts: '75건', retention: '80.9%', customers: '185명', unmanaged: '7명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '박예림 설계사', contracts: '63건', retention: '78.1%', customers: '152명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '윤서준 설계사', contracts: '61건', retention: '74.6%', customers: '145명', unmanaged: '5명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '조민성 설계사', contracts: '58건', retention: '71.3%', customers: '129명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '강도윤 설계사', contracts: '46건', retention: '69.2%', customers: '114명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '심다은 설계사', contracts: '41건', retention: '66.8%', customers: '109명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '해운대 마린 지점': [
    { rank: 1, name: '서지훈 설계사', contracts: '79건', retention: '90.2%', customers: '232명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이다혜 설계사', contracts: '74건', retention: '83.8%', customers: '201명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '배성우 설계사', contracts: '71건', retention: '81.5%', customers: '179명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '송미나 설계사', contracts: '65건', retention: '77.0%', customers: '160명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '문서현 설계사', contracts: '59건', retention: '73.2%', customers: '142명', unmanaged: '4명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '정태윤 설계사', contracts: '54건', retention: '70.6%', customers: '131명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '한수아 설계사', contracts: '48건', retention: '68.5%', customers: '117명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '류정민 설계사', contracts: '39건', retention: '66.4%', customers: '108명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '잠실 에비뉴 지점': [
    { rank: 1, name: '김서영 설계사', contracts: '82건', retention: '88.7%', customers: '238명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '최민혁 설계사', contracts: '78건', retention: '84.1%', customers: '220명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '안지민 설계사', contracts: '70건', retention: '80.2%', customers: '182명', unmanaged: '8명', status: '주의', statusClass: 'is-warning', rankClass: 'is-bronze' },
    { rank: 4, name: '권도현 설계사', contracts: '66건', retention: '76.4%', customers: '158명', unmanaged: '6명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '나혜린 설계사', contracts: '60건', retention: '74.0%', customers: '144명', unmanaged: '5명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '황준호 설계사', contracts: '55건', retention: '71.1%', customers: '132명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '장유나 설계사', contracts: '49건', retention: '68.7%', customers: '120명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '서민규 설계사', contracts: '43건', retention: '65.9%', customers: '112명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
  '판교 테크노 지점': [
    { rank: 1, name: '윤재현 설계사', contracts: '86건', retention: '90.8%', customers: '248명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-gold' },
    { rank: 2, name: '이수빈 설계사', contracts: '80건', retention: '85.0%', customers: '218명', unmanaged: '7명', status: '정상', statusClass: 'is-normal', rankClass: 'is-silver' },
    { rank: 3, name: '백지훈 설계사', contracts: '73건', retention: '79.4%', customers: '176명', unmanaged: '8명', status: '실효', statusClass: 'is-danger', rankClass: 'is-bronze' },
    { rank: 4, name: '한예슬 설계사', contracts: '67건', retention: '77.2%', customers: '159명', unmanaged: '5명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 5, name: '문태양 설계사', contracts: '62건', retention: '73.8%', customers: '147명', unmanaged: '6명', status: '개선', statusClass: 'is-info', rankClass: 'is-default' },
    { rank: 6, name: '오하린 설계사', contracts: '56건', retention: '70.4%', customers: '133명', unmanaged: '4명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 7, name: '노지환 설계사', contracts: '50건', retention: '68.0%', customers: '121명', unmanaged: '3명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
    { rank: 8, name: '구서윤 설계사', contracts: '44건', retention: '66.1%', customers: '110명', unmanaged: '2명', status: '정상', statusClass: 'is-normal', rankClass: 'is-default' },
  ],
}

const fallbackAdvisorRows = advisorRowsByBranch['강남본부 강남지점']

const allAdvisorRows = Object.entries(advisorRowsByBranch).flatMap(([branchName, rows]) =>
  rows.map((advisor) => ({
    ...advisor,
    branchName,
  })),
)

const overallTopAdvisor = allAdvisorRows
  .slice()
  .sort((a, b) => Number.parseInt(b.contracts, 10) - Number.parseInt(a.contracts, 10))[0]

const advisorRows = computed(() => {
  const sourceRows = isAllBranchSelected.value
    ? allAdvisorRows
    : (advisorRowsByBranch[currentBranchName.value] ?? fallbackAdvisorRows)
  const rows = [...sourceRows]

  if (advisorSortKey.value === 'retention') {
    return rows
      .sort((a, b) => Number.parseFloat(b.retention) - Number.parseFloat(a.retention))
      .map((advisor, index) => ({
        ...advisor,
        rank: index + 1,
        rowKey: `${advisor.branchName ?? currentBranchName.value}-${advisor.name}`,
      }))
  }

  if (advisorSortKey.value === 'customers') {
    return rows
      .sort((a, b) => Number.parseInt(b.customers, 10) - Number.parseInt(a.customers, 10))
      .map((advisor, index) => ({
        ...advisor,
        rank: index + 1,
        rowKey: `${advisor.branchName ?? currentBranchName.value}-${advisor.name}`,
      }))
  }

  return rows
    .sort((a, b) => Number.parseInt(b.contracts, 10) - Number.parseInt(a.contracts, 10))
    .map((advisor, index) => ({
      ...advisor,
      rank: index + 1,
      rowKey: `${advisor.branchName ?? currentBranchName.value}-${advisor.name}`,
    }))
})

const topPerformers = computed(() => {
  if (isBranchRankingView.value) {
    return [
      {
        eyebrow: '전 지점 1위 설계사',
        name: overallTopAdvisor?.name ?? '홍길동 설계사',
        meta: overallTopAdvisor?.branchName ?? '강남본부 강남지점',
      },
      {
        eyebrow: '지점 1위',
        name: rankingRows[0]?.name ?? '강남 프라임 지점',
        meta: rankingRows[0]?.location ?? '서울시 강남구',
      },
    ]
  }

  if (!isAllBranchSelected.value) {
    return [
      {
        eyebrow: '해당 지점 1위 설계사',
        name: advisorRows.value[0]?.name ?? '홍길동 설계사',
        meta: '',
      },
    ]
  }

  return [
    {
      eyebrow: '전체 지점 1위 설계사',
      name: advisorRows.value[0]?.name ?? '홍길동 설계사',
      meta: '',
    },
    {
      eyebrow: '전체 지점 1위 소속 지점',
      name: advisorRows.value[0]?.branchName ?? '강남본부 강남지점',
      meta: '',
    },
  ]
})
</script>

<style scoped>
.manager-dashboard {
  display: grid;
  gap: 18px;
  color: #1f2937;
}

.dashboard-filter {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.dashboard-filter__field {
  display: grid;
  gap: 8px;
}

.dashboard-filter__field span {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.dashboard-filter__error {
  color: #dc2626;
  font-size: 12px;
}

.dashboard-filter__field select,
.ranking-panel__sort {
  min-width: 176px;
  height: 40px;
  padding: 0 34px 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background:
    linear-gradient(45deg, transparent 50%, #6b7280 50%) calc(100% - 18px) 50% / 7px 7px no-repeat,
    linear-gradient(135deg, #6b7280 50%, transparent 50%) calc(100% - 13px) 50% / 7px 7px no-repeat,
    #f8fafc;
  color: #111827;
  font-size: 14px;
  appearance: none;
}

.report-panel,
.chart-panel,
.ranking-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.report-panel {
  padding: 28px 16px 26px;
}

.report-panel__heading {
  margin: 0 10px 24px;
}

.report-panel__heading h2,
.ranking-panel__heading h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

.report-panel__heading p,
.ranking-panel__hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  min-height: 104px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.metric-card span {
  display: block;
  margin-bottom: 9px;
  color: #6b7280;
  font-size: 13px;
}

.metric-card strong {
  display: block;
  margin-bottom: 9px;
  color: #161c24;
  font-size: 27px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0;
}

.metric-card strong.is-danger {
  color: #dc2626;
}

.metric-card small {
  margin-left: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.metric-card p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.is-up {
  color: #dc2626;
}

.is-down {
  color: #2563eb;
}

.is-goal {
  color: #f97316;
}

.is-muted {
  color: #4b5563;
}

.top-performer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.top-performer-card {
  min-height: 96px;
  padding: 24px;
  border: 1px solid #f97316;
  border-radius: 8px;
  background: #fff7ed;
}

.top-performer-card span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}

.top-performer-card span strong {
  color: #64748b;
  font-size: 21px;
}

.top-performer-card p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 700;
}

.top-performer-card p strong {
  color: #f97316;
  font-size: 28px;
  font-weight: 900;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.chart-panel {
  min-height: 230px;
  padding: 30px 26px 24px;
}

.chart-panel h3 {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 800;
}

.donut-summary {
  display: grid;
  grid-template-columns: minmax(132px, 190px) 1fr;
  align-items: center;
  gap: 22px;
}

.donut-chart {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-content: center;
  justify-self: center;
  border-radius: 999px;
  text-align: center;
}

.donut-chart::before {
  content: '';
  position: absolute;
  inset: 30px;
  border-radius: inherit;
  background: #ffffff;
}

.donut-chart strong,
.donut-chart span {
  position: relative;
  z-index: 1;
  display: block;
}

.donut-chart strong {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.donut-chart span {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.donut-summary ul {
  display: grid;
  gap: 13px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #6b7280;
  font-size: 13px;
}

.donut-summary li {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.donut-summary i {
  width: 11px;
  height: 11px;
  border-radius: 999px;
}

.ranking-panel {
  overflow: hidden;
}

.ranking-panel__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 28px 20px;
}

.ranking-panel__tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.ranking-panel__tab {
  min-width: 94px;
  height: 34px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.ranking-panel__tab.active {
  border-color: #fb923c;
  background: #fff7ed;
  color: #ea580c;
}

.ranking-panel__controls {
  display: flex;
  align-items: center;
}

.ranking-panel__sort {
  min-width: 140px;
}

.ranking-table-wrap {
  overflow-x: auto;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  font-size: 13px;
}

.ranking-table th {
  height: 42px;
  padding: 0 28px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.ranking-table th:nth-child(3),
.ranking-table th:nth-child(4),
.ranking-table td:nth-child(3),
.ranking-table td:nth-child(4) {
  text-align: right;
}

.ranking-table td {
  height: 62px;
  padding: 0 28px;
  border-top: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 800;
  white-space: nowrap;
}

.ranking-table td.is-first {
  color: #f97316;
}

.ranking-table--advisor {
  min-width: 980px;
}

.ranking-table--advisor .advisor-col--branch {
  text-align: left;
}

.ranking-table--advisor .advisor-col--metric {
  text-align: center;
}

.branch-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-cell span {
  min-width: 34px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
}

.branch-cell strong,
.branch-cell small {
  display: block;
}

.branch-cell strong {
  color: #1f2937;
  font-size: 14px;
}

.branch-cell small {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.advisor-rank {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  font-weight: 900;
}

.advisor-rank.is-gold {
  background: #fef3c7;
  color: #d97706;
}

.advisor-rank.is-silver {
  background: #e5e7eb;
  color: #6b7280;
}

.advisor-rank.is-bronze {
  background: #fed7aa;
  color: #c2410c;
}

.status-pill {
  min-width: 52px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.is-normal {
  background: #ecfdf5;
  color: #16a34a;
}

.status-pill.is-warning {
  background: #fff7ed;
  color: #ea580c;
}

.status-pill.is-danger {
  background: #fef2f2;
  color: #dc2626;
}

.status-pill.is-info {
  background: #eff6ff;
  color: #2563eb;
}

.detail-button {
  min-width: 58px;
  height: 30px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.ranking-panel__footer {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid #e5e7eb;
  background: #f1f5f9;
  color: #6b7280;
  font-size: 12px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination button {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-weight: 700;
  cursor: pointer;
}

.pagination button.active {
  border-color: #f97316;
  background: #f97316;
  color: #ffffff;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    gap: 24px;
  }
}

@media (max-width: 960px) {
  .ranking-panel__heading {
    flex-direction: column;
  }
}

@media (max-width: 880px) {
  .dashboard-filter {
    display: grid;
  }

  .top-performer-grid,
  .chart-grid,
  .donut-summary {
    grid-template-columns: 1fr;
  }

  .dashboard-filter__field select,
  .ranking-panel__sort {
    width: 100%;
  }

  .ranking-panel__tabs {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .report-panel,
  .chart-panel {
    padding: 24px 16px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .top-performer-grid {
    margin-top: 18px;
    gap: 14px;
  }

  .top-performer-card {
    padding: 22px;
  }

  .ranking-panel__heading,
  .ranking-table th,
  .ranking-table td {
    padding-left: 18px;
    padding-right: 18px;
  }

  .ranking-panel__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
