export const CUSTOMER_FILTERS = Object.freeze({
  ALL: 'ALL',
  CONTRACTED: 'CONTRACTED',
  PROSPECT: 'PROSPECT',
  INTEREST: 'INTEREST',
})

export const CUSTOMER_FILTER_OPTIONS = [
  { label: '전체 고객', value: CUSTOMER_FILTERS.ALL },
  { label: '계약 고객', value: CUSTOMER_FILTERS.CONTRACTED },
  { label: '잠재 고객', value: CUSTOMER_FILTERS.PROSPECT },
  { label: '관심 고객', value: CUSTOMER_FILTERS.INTEREST },
]

export const INTEREST_REASON_LABELS = Object.freeze({
  UNPAID: '미납',
  RENEWAL_DUE: '갱신 도래',
  MATURITY_DUE: '만기 도래',
})

export const CUSTOMER_STATUS_LABELS = Object.freeze({
  CONTRACTED: '계약 고객',
  PROSPECT: '잠재 고객',
})

export const CUSTOMER_GRADE_LABELS = Object.freeze({
  VIP: 'VIP',
  GOLD: 'Gold',
  NORMAL: 'Normal',
})

export const CONSULTATION_TYPE_LABELS = Object.freeze({
  NEW_CONTRACT: '신계약',
  CLAIM: '보상',
  TERMINATION: '해지',
  RENEWAL: '갱신',
})

export const CONSULTATION_CHANNEL_LABELS = Object.freeze({
  VISIT: '방문',
  PHONE: '전화',
  MESSAGE: '메시지',
})

export const CONTRACT_STATUS_LABELS = Object.freeze({
  ACTIVE: '계약 유지',
  MATURED: '계약 만기',
  LAPSED: '실효',
  TERMINATED: '해지',
})

export function getInterestReasonLabel(value) {
  return INTEREST_REASON_LABELS[value] ?? value ?? '-'
}

export function getCustomerStatusLabel(value) {
  return CUSTOMER_STATUS_LABELS[value] ?? value ?? '-'
}

export function getCustomerGradeLabel(value) {
  return CUSTOMER_GRADE_LABELS[value] ?? value ?? '-'
}

export function getConsultationTypeLabel(value) {
  return CONSULTATION_TYPE_LABELS[value] ?? value ?? '-'
}

export function getConsultationChannelLabel(value) {
  return CONSULTATION_CHANNEL_LABELS[value] ?? value ?? '-'
}

export function getContractStatusLabel(value) {
  return CONTRACT_STATUS_LABELS[value] ?? value ?? '-'
}
