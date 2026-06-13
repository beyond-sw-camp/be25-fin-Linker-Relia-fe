const CONTRACTS = [
  {
    contractNumber: 'HW-2022-0345',
    customerName: '이수진',
    branch: '강남지점',
    insurer: '한화생명',
    productName: '종신보험',
    contractDate: '2022.05.20',
    monthlyPremium: 120000,
    paymentStatus: 'PAID',
    maturityDate: '2042.05.20',
  },
  {
    contractNumber: 'HW-2023-0892',
    customerName: '박정호',
    branch: '서초지점',
    insurer: '한화생명',
    productName: '실손의료보험',
    contractDate: '2023.03.15',
    monthlyPremium: 85000,
    paymentStatus: 'PAID',
    maturityDate: '2038.03.15',
  },
  {
    contractNumber: 'HD-2024-0156',
    customerName: '최미영',
    branch: '강남지점',
    insurer: '현대해상',
    productName: '자동차보험',
    contractDate: '2024.01.10',
    monthlyPremium: 75000,
    paymentStatus: 'UNPAID',
    maturityDate: '2025.01.10',
    isNearMaturity: true,
  },
  {
    contractNumber: 'HW-2023-1234',
    customerName: '김태현',
    branch: '잠실지점',
    insurer: '한화생명',
    productName: '암보험',
    contractDate: '2023.08.20',
    monthlyPremium: 95000,
    paymentStatus: 'PAID',
    maturityDate: '2033.08.20',
  },
  {
    contractNumber: 'HD-2022-0678',
    customerName: '정은혜',
    branch: '서초지점',
    insurer: '현대해상',
    productName: '여행자보험',
    contractDate: '2022.11.05',
    monthlyPremium: 45000,
    paymentStatus: 'UNPAID',
    maturityDate: '2027.11.05',
  },
  {
    contractNumber: 'HW-2021-0934',
    customerName: '오재민',
    branch: '부산지점',
    insurer: '한화생명',
    productName: '연금보험',
    contractDate: '2021.06.15',
    monthlyPremium: 150000,
    paymentStatus: 'PAID',
    maturityDate: '2041.06.15',
  },
  {
    contractNumber: 'HD-2024-0445',
    customerName: '양미라',
    branch: '대구지점',
    insurer: '현대해상',
    productName: '화재보험',
    contractDate: '2024.02.28',
    monthlyPremium: 68000,
    paymentStatus: 'PAID',
    maturityDate: '2029.02.28',
  },
  {
    contractNumber: 'HW-2023-0567',
    customerName: '홍길동',
    branch: '강남지점',
    insurer: '한화생명',
    productName: '어린이보험',
    contractDate: '2023.09.10',
    monthlyPremium: 55000,
    paymentStatus: 'PAID',
    maturityDate: '2043.09.10',
  },
  {
    contractNumber: 'DB-2024-0177',
    customerName: '문하늘',
    branch: '인천지점',
    insurer: 'DB손해보험',
    productName: '운전자보험',
    contractDate: '2024.03.22',
    monthlyPremium: 62000,
    paymentStatus: 'UNPAID',
    maturityDate: '2025.03.22',
    isNearMaturity: true,
  },
  {
    contractNumber: 'KB-2022-1120',
    customerName: '배서윤',
    branch: '부산지점',
    insurer: 'KB손해보험',
    productName: '치아보험',
    contractDate: '2022.12.01',
    monthlyPremium: 39000,
    paymentStatus: 'PAID',
    maturityDate: '2032.12.01',
  },
  {
    contractNumber: 'SS-2023-0788',
    customerName: '장민준',
    branch: '대전지점',
    insurer: '삼성화재',
    productName: '상해보험',
    contractDate: '2023.07.18',
    monthlyPremium: 71000,
    paymentStatus: 'PAID',
    maturityDate: '2025.07.18',
    isRenewalSoon: true,
  },
  {
    contractNumber: 'MR-2021-0254',
    customerName: '서지우',
    branch: '대구지점',
    insurer: '메리츠화재',
    productName: '간병보험',
    contractDate: '2021.04.04',
    monthlyPremium: 110000,
    paymentStatus: 'UNPAID',
    maturityDate: '2036.04.04',
  },
  {
    contractNumber: 'SS-2024-0098',
    customerName: '권도윤',
    branch: '잠실지점',
    insurer: '삼성화재',
    productName: '저축보험',
    contractDate: '2024.04.12',
    monthlyPremium: 200000,
    paymentStatus: 'PAID',
    maturityDate: '2026.04.12',
    isRenewalSoon: true,
  },
  {
    contractNumber: 'DB-2023-0641',
    customerName: '신유나',
    branch: '인천지점',
    insurer: 'DB손해보험',
    productName: '건강보험',
    contractDate: '2023.06.30',
    monthlyPremium: 98000,
    paymentStatus: 'PAID',
    maturityDate: '2043.06.30',
  },
  {
    contractNumber: 'KB-2020-0491',
    customerName: '임준서',
    branch: '대전지점',
    insurer: 'KB손해보험',
    productName: '변액보험',
    contractDate: '2020.10.08',
    monthlyPremium: 175000,
    paymentStatus: 'UNPAID',
    maturityDate: '2030.10.08',
  },
  {
    contractNumber: 'MR-2024-0311',
    customerName: '한소희',
    branch: '서초지점',
    insurer: '메리츠화재',
    productName: '질병보험',
    contractDate: '2024.05.02',
    monthlyPremium: 88000,
    paymentStatus: 'PAID',
    maturityDate: '2025.05.02',
    isNearMaturity: true,
  },
]

export const CONTRACT_BRANCH_OPTIONS = [
  { title: '전체 지점', value: 'ALL' },
  { title: '강남지점', value: 'BR001' },
  { title: '서초지점', value: 'BR002' },
  { title: '송파지점', value: 'BR003' },
  { title: '마포지점', value: 'BR004' },
  { title: '영등포지점', value: 'BR005' },
  { title: '용산지점', value: 'BR006' },
  { title: '은평지점', value: 'BR007' },
  { title: '노원지점', value: 'BR008' },
  { title: '구로지점', value: 'BR009' },
  { title: '강서지점', value: 'BR010' },
]

export const CONTRACT_INSURER_OPTIONS = [
  { title: '전체 보험사', value: 'ALL' },
  { title: '삼성생명', value: '50000000-0000-0000-0000-000000000001' },
  { title: '한화생명', value: '50000000-0000-0000-0000-000000000002' },
  { title: '교보생명', value: '50000000-0000-0000-0000-000000000003' },
  { title: '신한라이프', value: '50000000-0000-0000-0000-000000000004' },
  { title: 'NH농협생명', value: '50000000-0000-0000-0000-000000000005' },
]

export const CONTRACT_MONTH_OPTIONS = [
  { title: '조회 월 2026.05', value: '2026-05' },
  { title: '조회 월 2026.06', value: '2026-06' },
  { title: '조회 월 2025.04', value: '2025-04' },
  { title: '조회 월 2025.03', value: '2025-03' },
]

export const CONTRACT_TREND = [
  { month: '2024.12', contracts: 92000, premium: 33 },
  { month: '2025.01', contracts: 116000, premium: 41 },
  { month: '2025.02', contracts: 78000, premium: 36 },
  { month: '2025.03', contracts: 72000, premium: 34 },
  { month: '2025.04', contracts: 105000, premium: 55 },
  { month: '2025.05', contracts: 110000, premium: 70 },
]

export const INSURER_CONTRACT_STATUS = [
  { insurer: 'A보험', totalContracts: '32,456', monthlyPremium: '14.2억', retentionRate: '93.2%' },
  { insurer: 'B보험', totalContracts: '28,754', monthlyPremium: '12.6억', retentionRate: '92.1%' },
  { insurer: 'C보험', totalContracts: '24,875', monthlyPremium: '11.3억', retentionRate: '91.7%' },
  { insurer: 'D보험', totalContracts: '18,965', monthlyPremium: '8.9억', retentionRate: '94.0%' },
  { insurer: 'E보험', totalContracts: '12,341', monthlyPremium: '6.1억', retentionRate: '90.4%' },
]

export function fetchContractListMock({ branch, insurer, status, page, size }) {
  const filteredContracts = CONTRACTS.filter((contract) => {
    const branchMatched = branch === 'ALL' || contract.branch === branch
    const insurerMatched = insurer === 'ALL' || contract.insurer === insurer
    const statusMatched =
      status === 'ALL' ||
      (status === 'PAID' && contract.paymentStatus === 'PAID') ||
      (status === 'UNPAID' && contract.paymentStatus === 'UNPAID') ||
      (status === 'NEAR_MATURITY' && contract.isNearMaturity) ||
      (status === 'RENEWAL_SOON' && contract.isRenewalSoon)

    return branchMatched && insurerMatched && statusMatched
  })

  const totalElements = filteredContracts.length
  const totalPages = Math.ceil(totalElements / size)
  const start = (page - 1) * size

  return {
    content: filteredContracts.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
  }
}
