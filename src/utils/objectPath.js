export function deepClone(value) {
  if (value === null || value === undefined) {
    return value
  }

  return JSON.parse(JSON.stringify(value))
}

function parseSegment(segment) {
  if (/^\d+$/.test(segment)) {
    return Number(segment)
  }

  return segment
}

export function toPathSegments(path) {
  return String(path || '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(parseSegment)
}

export function getValueByPath(target, path, fallback = undefined) {
  if (!target || !path) {
    return fallback
  }

  const segments = toPathSegments(path)
  let cursor = target

  for (const segment of segments) {
    if (cursor === null || cursor === undefined) {
      return fallback
    }

    cursor = cursor[segment]
  }

  return cursor === undefined ? fallback : cursor
}

export function setValueByPath(target, path, value) {
  if (!target || !path) {
    return target
  }

  const segments = toPathSegments(path)
  if (!segments.length) {
    return target
  }

  let cursor = target

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    const nextSegment = segments[index + 1]
    const shouldCreateArray = typeof nextSegment === 'number'

    if (cursor[segment] === null || cursor[segment] === undefined || typeof cursor[segment] !== 'object') {
      cursor[segment] = shouldCreateArray ? [] : {}
    }

    cursor = cursor[segment]
  }

  cursor[segments[segments.length - 1]] = value
  return target
}

export function humanizePathSegment(segment) {
  return String(segment || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
