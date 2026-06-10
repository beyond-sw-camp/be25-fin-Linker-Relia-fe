export const CUSTOMER_STATUS_OPTIONS = [
  { label: '계약 유지', value: 'CONTRACTED' },
  { label: '잠재 고객', value: 'PROSPECT' },
  { label: '만기', value: 'COMPLETED' },
  { label: '해지', value: 'TERMINATED' },
]

export const CUSTOMER_STATUS_LABELS = Object.freeze({
  PROSPECT: '잠재 고객',
  CONTRACTED: '계약 유지',
  COMPLETED: '만기',
  TERMINATED: '해지',
})

export const CUSTOMER_GRADE_LABELS = Object.freeze({
  VIP: 'VIP',
  GOLD: 'Gold',
  NORMAL: 'Normal',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
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
  CONTRACTED: '계약 유지',
  MATURED: '만기',
  COMPLETED: '만기',
  LAPSED: '실효',
  TERMINATED: '해지',
})

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
