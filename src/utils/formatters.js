function pad(value) {
  return String(value).padStart(2, '0')
}

function toDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = toDate(value)

  if (!date) {
    return '-'
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

export function formatDateTime(value) {
  const date = toDate(value)

  if (!date) {
    return '-'
  }

  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${Number(value).toLocaleString('ko-KR')}원`
}

export function formatPhone(value) {
  return value || '-'
}

export function formatNullableText(value) {
  return value || '-'
}
